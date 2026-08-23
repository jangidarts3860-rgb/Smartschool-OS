# TECHNICAL REQUIREMENTS DOCUMENT (TRD) — SmartSchool OS Engine
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Technical Architecture  

---

## 1. System Topology & Infrastructure Layer

SmartSchool OS is built on an event-driven, hybrid serverless topology. The application combines client-side single page application (SPA) rendering with Firebase real-time database subscriptions and Vercel serverless micro-APIs.

```
       [Client Browser / PWA Application]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
 ┌───────────────┐           ┌───────────────┐
 │ Firestore DB  │           │ Vercel API /  │
 │ (onSnapshot   │           │ Firebase Cloud│
 │ Real-time)    │           │ Functions     │
 └───────┬───────┘           └───────┬───────┘
         │                           │
         ▼                           ▼
 ┌───────────────┐           ┌───────────────┐
 │ Security &    │           │ Gemini AI /   │
 │ IDOR Rules    │           │ Hardware Proxy│
 └───────────────┘           └───────────────┘
```

### 1.1 Infrastructure Stack Specifications

- **Client Runtime:** React 18, Vite 5, TypeScript 5 (Strict Mode).
- **Hosting & CDN:** Vercel Global Edge Network for static assets & `/api` serverless routes.
- **Backend-as-a-Service (BaaS):** Firebase (Auth, Firestore, Cloud Storage, Cloud Functions Node.js 18 runtime).
- **Caching Layer:** Workbox Service Worker precaching 83+ static build assets; client-side `localStorage` for offline attendance queuing.

---

## 2. Core Authentication & Security Engineering

### 2.1 PBKDF2-SHA256 Client-Side Hashing Standard
All password and PIN credentials undergo client-side cryptographic hashing prior to storage or verification, ensuring raw credentials never touch network logs:

- **Algorithm:** PBKDF2 with SHA-256 digest.
- **OWASP Baseline:** 600,000 iterations (exceeds OWASP 2023 baseline).
- **Salt Generation:** 16-byte random cryptographic salt per credential (`crypto.getRandomValues`).
- **Canonical Storage Format:** `pbkdf2$600000$randomSaltBase64$hashHex` stored under `passwordHash` and `passwordSalt` fields.
- **Backward Compatibility:** `verifyPassword()` in `utils/crypto.ts` supports legacy 100,000 iteration deterministic-salt hashes with constant-time XOR accumulator comparison to prevent timing attacks.

### 2.2 IDOR Security Protection Layer
Multi-tenant security is enforced at the database level via `firestore.rules` and `storage.rules`:

```cel
// firestore.rules tenant & role protection matrix snippet
function isTenantUser(schoolId) {
  return request.auth != null && request.auth.token.schoolId == schoolId;
}

function isAdmin(schoolId) {
  return isTenantUser(schoolId) && request.auth.token.role in ['ADMIN', 'SUPER_ADMIN'];
}

match /schools/{schoolId}/fees/{feeId} {
  allow read: if isTenantUser(schoolId);
  allow write: if isAdmin(schoolId);
}
```

### 2.3 Ghost Mode Token Architecture (`ghost-create.ts` & `ghost-validate.ts`)
Admins can impersonate role views (Teacher/Student/Parent) safely via HMAC-signed session tokens:
- **Secret:** `GHOST_TOKEN_SECRET` (32+ byte hex key set in environment).
- **Expiration:** Tokens expire strictly after 15 minutes.
- **Audit Logging:** Every token generation writes an immutable audit record to `/schools/{schoolId}/auditLogs`.

---

## 3. Serverless API Routes & Cloud Functions Specification

### 3.1 Vercel Serverless Endpoints (`/api/*`)

| Endpoint Path | File Location | Auth Contract | Responsibility |
|---|---|---|---|
| `/api/cerebro-ask` | `api/cerebro-ask.ts` | Firebase ID Token | Sanitizes PII, injects tenant context, proxies request to Gemini key pool with rate-limiting. |
| `/api/ghost-create` | `api/ghost-create.ts` | Admin ID Token | Issues 15-minute HMAC ghost impersonation token. |
| `/api/ghost-validate` | `api/ghost-validate.ts` | HMAC Ghost Token | Validates ghost token signature and returns target impersonation context. |
| `/api/credential-hash-guidance` | `api/credential-hash-guidance.ts` | Public / Informational | Exposes PBKDF2 hash parameter standards for migration scripts. |
| `/api/health` | `api/health.ts` | Bearer `HEALTH_CHECK_TOKEN` | System diagnostic check verifying Firestore and Auth latency. |

### 3.2 Firebase Cloud Functions (`functions/src/*`)

| Function Name | Source File | Trigger Type | Primary Duty |
|---|---|---|---|
| `sendWhatsAppInvite` | `functions/src/invites.ts` | Callable HTTP | Generates magic link and sends initial welcome WhatsApp invite. |
| `verifyWhatsAppOTP` | `functions/src/invites.ts` | Callable HTTP | Validates 6-digit OTP for parent phone number linking. |
| `createPaymentOrder` | `functions/src/payment.ts` | Callable HTTP | Creates Razorpay order ID with server-side amount validation. |
| `verifyRazorpayPayment` | `functions/src/payment.ts` | Callable HTTP | Verifies Razorpay HMAC signature (`razorpay_signature`) and updates fee ledger atomically. |
| `createSchoolBackup` | `functions/src/backup.ts` | Callable HTTP | Triggers full Firestore collection export to Cloud Storage bucket. |
| `processBiometricAttendance` | `functions/src/auth.ts` | HTTPS POST | Endpoint receiving raw ZKTeco/Mantra hardware biometric logs. |
| `onNoticeScheduled` | `functions/src/scheduledNotices.ts` | Pub/Sub Cron | Overnight cron processing scheduled announcements and auto-archiving expired notices. |

---

## 4. Data Persistence & Transaction Engine

### 4.1 Atomic Concurrency Engine
To guarantee zero financial or inventory race conditions, fee payments and library book issuance use Firestore transactions (`runTransaction`):

```typescript
// Atomic transaction contract example for fee payments
await runTransaction(db, async (transaction) => {
  const feeRef = doc(db, `schools/${schoolId}/fees/${feeId}`);
  const feeDoc = await transaction.get(feeRef);
  
  if (!feeDoc.exists()) throw new Error("FEE_NOT_FOUND");
  const data = feeDoc.data();
  
  const newAmountPaid = data.amountPaid + paymentAmount;
  const newStatus = newAmountPaid >= data.totalAmount ? 'PAID' : 'PARTIAL';
  
  transaction.update(feeRef, {
    amountPaid: newAmountPaid,
    status: newStatus,
    updatedAt: Date.now()
  });
});
```

### 4.2 Firestore Bulk Write Chunking Engine (`studentDeleteService.ts`)
Firestore limits batch writes to 500 operations per batch. Cascade deletions (e.g., student removal) chunk operations into batches of 450 items to guarantee total atomic safety without exceeding limits.

### 4.3 Offline Attendance Queue Engine (`hooks/useFirestore.ts`)
When internet drops during classroom attendance marking:
1. Attendance status changes are written immediately to `localStorage` key `smartschool_pending_attendance`.
2. UI displays an offline warning badge.
3. Service worker monitors `online` event; upon reconnect, queued items are flushed to Firestore via `writeBatch`.

---

## 5. External Hardware & Third-Party Integrations

### 5.1 Hardware Biometric Sync Specification (ZKTeco / Mantra)
Hardware biometric devices send raw HTTP POST payloads to `processBiometricAttendance`:

```json
{
  "schoolId": "SCH-A7X9P",
  "deviceId": "ZK-LOBBY-01",
  "userUid": "STU-24-001",
  "timestamp": 1789123456000,
  "verificationType": "FINGERPRINT"
}
```
The Cloud Function checks for duplicate scans within 5 minutes, verifies user registration, and updates `/schools/{schoolId}/attendance/{date_classId}`.

### 5.2 Live Transport Engine (Leaflet + Haversine Formula)
Bus location coordinate updates write to `/schools/{schoolId}/buses/{busId}`:
- **Haversine Distance Equation:**
  \[
  d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
  \]
- **ETA Math:** \(\text{ETA (mins)} = \frac{d \text{ (km)}}{25 \text{ km/h (average bus speed)}} \times 60\).

---

## 6. Error Handling, SRE & Resilience Architecture

### 6.1 Standard Error Structure (`utils/resilience.ts`)
All service errors instantiate the structured `AppError` class:

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public userFacingMessage: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 6.2 Retry Engine with Exponential Backoff
Flaky network calls use `withRetry`:

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((res) => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}
```

---

## 7. Performance Benchmarks & Build Pipeline

- **Typecheck Command:** `npx tsc --noEmit` (0 errors across 46 audited components).
- **Unit Test Command:** `npx vitest run` (265/265 unit tests passing).
- **Production Build:** `npx vite build` (Clean build in ~1m 14s).
- **PWA Precache:** Workbox generates `sw.js` precaching 83 static assets.

---

## 8. Deployment & Environment Configuration

### Required Environment Variables

```env
# Vercel & Client (.env)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=smartschoolapp-afabc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smartschoolapp-afabc
VITE_FIREBASE_STORAGE_BUCKET=smartschoolapp-afabc.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc
VITE_ENABLE_WHATSAPP=true

# Serverless Secrets (Vercel & Cloud Functions)
GHOST_TOKEN_SECRET=32_byte_random_hex_string
HEALTH_CHECK_TOKEN=secure_bearer_token_string
```
