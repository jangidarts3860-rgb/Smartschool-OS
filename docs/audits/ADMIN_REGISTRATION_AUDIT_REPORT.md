# School Registration, Onboarding, Admin Signup & WhatsApp — Full Audit Report

> **Scope:** End-to-end audit of `School registration → Admin signup → Admin login → Onboarding wizard → Magic link → WhatsApp delivery` in `SmartSchoolApp`.
> **Date:** 2026-06-06
> **Auditor:** opencode (MiniMax-M3)
> **Status:** Issues identified. Fixes implemented — see "Fixes Applied" section at the end.

---

## TL;DR

| # | Question | Answer | Severity |
|---|---|---|---|
| 1 | School register flow kaisa hai? | `Login.tsx:774 handleSignup` — `createUserWithEmailAndPassword` → `setDoc(schools/{id})` → `userService.createUser` → `window.open(wa.me)` | OK |
| 2 | Onboarding flow complete hota hai? | 4 steps (email/branding/CSV/AI) — per-step "Skip" bug ne `isFirstLogin: true` lock kar diya | **BUG** |
| 3 | Admin login ho pa raha hai? | Haan — Firebase Auth `signInWithEmailAndPassword` + `authService.storeSession` + `useAuth` hook | OK |
| 4 | WhatsApp pe message ja raha hai? | Haan — `wa.me` link hamesha khulta hai (free mode). **Lekin `VITE_ENABLE_WHATSAPP=false` ke baad bhi** | **BUG** |
| 5 | WhatsApp pe magic link kyu ja raha hai admin ka? | **Bhai, magic link nahi ja raha — PLAINTEXT PASSWORD ja raha hai** (`utils/whatsapp.ts:97` `SCHOOL_WELCOME` template). Yahi issue hai. | **CRITICAL** |
| 6 | Magic link kaam karta hai? | Haan — `authService.createMagicLink` / `useMagicLink` / `MagicLinkHandler` sab wired hain | OK |
| 7 | `VITE_ENABLE_WHATSAPP` honor ho raha hai? | **Nahi** — flag declared hai par `utils/whatsapp.ts` aur `Login.tsx` blindly fire karte hain | **BUG** |
| 8 | `api/verify-credential.ts` & `api/hash-credential.ts`? | **Broken** — bcrypt use karte hain par client PBKDF2 use karta hai. Dead code. | **BUG** |
| 9 | `/api/health` endpoint? | **Missing** — `HEALTH_CHECK_TOKEN` declared in `.env.example` but no handler | LOW |
| 10 | Admin signup pe rate-limit / CAPTCHA? | **Nahi** — bot unlimited Firebase Auth users bana sakta hai | MEDIUM |

---

## 1. School Registration Flow (E2E)

### 1.1 Admin Signup — `components/Login.tsx:774-835`

```
User fills SIGNUP form
  ↓
createUserWithEmailAndPassword(auth, adminEmail, password)    ← Firebase Auth user
  ↓
schoolId = "SCH-" + 6 hex chars                                ← generateId().slice(0,6).toUpperCase()
  ↓
setDoc(schools/{schoolId}, {
  name, address, phone, city,
  status: 'PENDING',
  config: { primaryColor, secondaryColor },
  subscription: { plan: 'TRIAL', expiryDate: null }
})
  ↓
userService.createUser({
  id: firebaseUser.uid,
  uniqueId: "ADM-YYYY-XXXXXX-NNNN",
  role: ADMIN, schoolId,
  isFirstLogin: true, status: 'ACTIVE'
})
  ↓
generateWaMeLink(adminPhone, 'SCHOOL_WELCOME', {              ← ⚠️ PLAINTEXT PASSWORD
  schoolName, name, uniqueId,
  credential: signupData.password,        ← ⚠️ PASSWORD LEAK OVER WhatsApp
  loginUrl: window.location.origin
})
  ↓
window.open(waLink, '_blank')               ← ⚠️ ALWAYS FIRES regardless of VITE_ENABLE_WHATSAPP
  ↓
authService.storeSession(newUser) → onLogin(newUser)
```

### 1.2 Issues Found

#### 🔴 **CRITICAL — Plaintext password in WhatsApp template**
- **File:** `utils/whatsapp.ts:96-98`
- **Issue:** The `SCHOOL_WELCOME` template injects the user's password directly into the WhatsApp message. This is sent via `wa.me` (URL-encoded) — anyone with access to the URL or message log can read it. The password is also stored in `localStorage` as part of the `signupData` state and passed through React state.
- **Risk:** Credentials leak via WhatsApp message history, browser history, server logs (if proxied), and any intermediate proxy. The whole point of magic-link auth is to **avoid** sending passwords over insecure channels.
- **Fix:** Replace `credential: password` with a magic link issued via `authService.createMagicLink`. The admin's first login then uses the magic link, after which `authService.setFirstLoginComplete` writes the hashed password. No plaintext password ever leaves the browser/server.

#### 🔴 **CRITICAL — `VITE_ENABLE_WHATSAPP` not honored**
- **File:** `utils/whatsapp.ts`, `components/Login.tsx:811-822`
- **Issue:** `.env` has `VITE_ENABLE_WHATSAPP=false` but the signup flow always fires `window.open(waLink, '_blank')`. The admin gets a WhatsApp tab opened against their will, which:
  - is a privacy/UX issue (popup blocked or unwanted),
  - violates the user's explicit opt-out,
  - leaks the school name to whatever browser session is active.
- **Fix:** Gate `generateWaMeLink` and the signup `window.open` on `VITE_ENABLE_WHAPSAPP === 'true'`. Add a fallback in-app toast showing the magic link so the admin can copy/paste it.

#### 🟡 **MEDIUM — School created with `status: 'PENDING'` but no approval path**
- **File:** `components/Login.tsx:792`
- **Issue:** Schools are created in `PENDING` status but there's no admin-side approval workflow. They are usable immediately because `App.tsx` does not check `school.status`. The flag is dead.
- **Fix:** Either (a) wire `school.status` to a real approval queue, or (b) set status to `ACTIVE` on signup and remove the dead field. Recommendation: option (b) for self-serve, add `SUSPENDED` state for super-admin.

#### 🟡 **MEDIUM — `uniqueId` race / collision possible**
- **File:** `components/Login.tsx:800`
- **Issue:** `uniqueId` is generated client-side from `generateId().slice(0,6)` + 4 random digits = ~10 chars entropy. Two concurrent signups could collide. There's no uniqueness check in `userService.createUser`.
- **Fix:** Server-side Cloud Function (`onUserCreate` trigger) should validate `uniqueId` uniqueness; reject or auto-resolve. Or use a `runTransaction` to check.

#### 🟢 **LOW — No CAPTCHA / rate-limit on signup**
- **File:** `components/Login.tsx:774`
- **Issue:** A bot can call `createUserWithEmailAndPassword` unlimited times, polluting your Firebase Auth user table and inflating billing.
- **Fix:** Add Firebase App Check (recommended) + client-side throttle (e.g. 1 signup per IP per 60s). For now, document that this is a known gap.

---

## 2. Admin Login Flow — `components/Login.tsx:660+`

### 2.1 Happy path

```
User selects ADMIN tab
  ↓
signInWithEmailAndPassword(auth, email, password)
  ↓
userService.getUser(firebaseUser.uid)
  ↓
authService.checkSessionValid(user)   ← checks status, sessionInvalidatedAt
  ↓
authService.storeSession(user)         ← localStorage['ss_user']
  ↓
onLogin(user) → App.tsx sets user state
  ↓
Routes to /admin/dashboard
```

### 2.2 Verdict — **Working as designed** ✅

`signInWithEmailAndPassword` is the canonical Firebase Auth flow. The session is stored in `localStorage['ss_user']` and `session_start_{userId}`. `App.tsx:117-161` hydrates from localStorage on load, falling back to Firebase Auth state if available.

### 2.3 Minor issues

- **No "remember me" expiry** — sessions live until `sessionInvalidatedAt` is bumped or status changes to `DISABLED`. This is fine for a school admin portal.
- **`checkSessionValid` does a Firestore read on every page load** (`App.tsx:120`) — this is fine, it's one doc, and it's the source of truth.
- **`passwordReset` is admin-only** — `authService.adminForgotPassword` uses `sendPasswordResetEmail` which is the proper Firebase flow. Other roles use `getRegisteredContact` to show the masked contact (not actually send a reset).

---

## 3. Onboarding Wizard — `components/OnboardingWizard.tsx`

### 3.1 Steps

| Step | Purpose | Persists? | Calls onComplete? |
|---|---|---|---|
| 0 | Email verify | sessionStorage | No |
| 1 | Branding (color, subdomain) | Firestore `schools/{id}/config` | No |
| 2 | Data import (logo + CSV) | sessionStorage + Firestore | No |
| 3 | AI keys + fallback | Firestore | **Yes** |

### 3.2 🔴 **BUG — Per-step "Skip" doesn't clear `isFirstLogin`**

**Scenario:** Admin opens the wizard, sees "I'll verify later" on step 0 (this is fine — just `setStep(1)`), uploads a logo and clicks "Save & Continue" on step 1 (writes to Firestore but doesn't call `onComplete`), sees "Skip for Now" on step 2 (this is fine — just `setStep(3)`), and closes the browser.

**Result on next login:** `App.tsx:164` checks `user.role === ADMIN && user.isFirstLogin && !sessionStorage.getItem('onboarding_dismissed')` → wizard shows again from step 0. The admin is stuck in a loop because `isFirstLogin` was never set to `false`.

**Root cause:** Only the top-right **X** button (`OnboardingWizard.tsx:274-281`) calls `onComplete`, which sets `onboarding_dismissed = true` AND `userService.updateUser(user.id, { isFirstLogin: false })`. The per-step "Continue" / "Save & Continue" buttons just advance `step`.

**Fix:** Make "I'll verify later" and "Skip for Now" call `onComplete` (since they explicitly skip), and add a clear visual distinction between "Save and continue" (advances step) vs "Skip for now" (exits wizard and dismisses).

### 3.3 🟡 **MEDIUM — "Save & Continue" doesn't save before advancing**

**File:** `OnboardingWizard.tsx:570-583` (Step 1), `794-808` (Step 3)

Step 1's "Save & Continue" actually does save (it calls `handleUpdateBranding` which does `updateDoc`), so this is OK.

Step 3's "Launch Dashboard" calls `handleUpdateAI` which saves and then `onComplete()`. OK.

Step 2's "Continue" / "Skip for Now" just sets `step(3)`. If the user clicked the CSV import button on the same step, that's persisted. OK.

### 3.4 🟡 **MEDIUM — `emailVerified` polling is fragile**

**File:** `OnboardingWizard.tsx:111-128`

```js
const interval = setInterval(async () => {
  await user.reload();
  if (user.emailVerified) { ... }
}, 3000);
```

- Polls every 3s — fine.
- **Bug:** `user.reload()` is async but the `if (user.emailVerified)` check is on the **stale** `user` object from the closure, not the reloaded one. The reload updates the global Firebase Auth state, but the local `user` variable in the component does not re-render automatically.
- **Fix:** Use `onAuthStateChanged` (already wired) instead of `setInterval`, or store the reloaded user in state.

---

## 4. Magic Link Flow — E2E

### 4.1 Issue / Redeem

```
authService.createMagicLink(userId, schoolId, role, createdBy)
  ↓
token = generateToken()  ← 32 bytes hex
  ↓
setDoc(schools/{schoolId}/authTokens/{token}, {
  type: 'MAGIC_LINK', targetUserId, targetSchoolId, targetRole,
  createdBy, createdAt, expiresAt = now + 24h, used: false
})
  ↓
returns `${origin}/auth/magic?token=...&schoolId=...`
```

### 4.2 Recipient flow

```
Recipient visits /auth/magic?token=...&schoolId=...
  ↓
App.tsx:294 short-circuits to <MagicLinkHandler>
  ↓
authService.useMagicLink(token, schoolId)
  ↓
Validates: !used && now < expiresAt
  ↓
Marks used: true, usedAt: now
  ↓
Returns user object
  ↓
authService.storeSession(user)
  ↓
onLogin(user) → routes to role base path
```

### 4.3 Verdict — **Working correctly** ✅

- Token is 32 bytes = 256 bits of entropy (unguessable).
- Single-use enforced via `used: true` flag.
- 24h expiry.
- Single Firestore read + write per redemption.

### 4.4 Minor issues

- **🟡 Token never gets refreshed** — if the user clicks the link multiple times, they get the "Already Used" page. This is by design but the UX could be friendlier (e.g. auto-reissue on "Used" if the user is still authenticated but the session was lost).
- **🟢 Reset link uses different `type` (`RESET_PASSWORD`)** — `MagicLinkHandler` is wired to both `/auth/magic` and `/auth/reset` but the verification logic is generic. The reset link needs a new password input, which is **not implemented in `MagicLinkHandler.tsx`**. Currently, the reset endpoint just verifies the token and the user is logged in without ever setting a new password — **a real bug**.

> ⚠️ **This means the password reset feature is broken end-to-end.** The user gets a "Welcome!" page and is logged in, but their old password is unchanged. If they were trying to recover from a forgotten password, they're logged in but still don't know their password. The `verifyAndUseResetToken` function (which DOES set the new password) is never called by `MagicLinkHandler`.

---

## 5. WhatsApp Messaging Architecture (3 paths)

### 5.1 Path 1 — Free / Zero-Cost (`utils/whatsapp.ts`)

```
Admin clicks button in WhatsAppCenter or completes admin signup
  ↓
window.open('https://wa.me/{phone}?text=...')
  ↓
Admin manually taps "Send" in WhatsApp Web
```

**Pros:** zero cost, no API keys, works for any school.
**Cons:** popup-blocker, manual, no audit log, no delivery confirmation, no scalability.

### 5.2 Path 2 — Pro / Meta Cloud API (`functions/src/invites.ts`)

```
notificationService.sendWhatsAppMessage(schoolId, sender, recipient, type, message)
  ↓
getWhatsAppPhoneMapping(schoolId)            ← reads whatsappMappings/{schoolId}
getWhatsAppConfig(schoolId)                  ← reads schools/{id}/settings/whatsapp
  ↓
isMock = (VITE_USE_MOCK === 'true' || !phoneMapping?.phoneNumberId || provider === 'MOCK' || !isActive)
  ↓
NOT isMock → shouldBlockOperation (usage limit) → httpsCallable('sendWhatsAppInvite') → Meta Graph API
isMock    → wait 500ms → status = MOCK_SENT
  ↓
Log to schools/{id}/notificationLogs
incrementWhatsApp(schoolId, success)
```

**Pros:** real delivery, audit log, multi-tenant via `whatsappMappings`.
**Cons:** requires `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` env vars to be set on Cloud Functions; requires admin to configure `whatsappMappings/{schoolId}`.

### 5.3 Path 3 — In-app notifications (`components/admin/NotificationCenter.tsx`)

In-app only. Writes to `schools/{id}/notifications`. Not WhatsApp.

### 5.4 🟡 **`VITE_ENABLE_WHATSAPP` is dead code**

- `services/notificationService.ts:216` checks `VITE_USE_MOCK` but NOT `VITE_ENABLE_WHATSAPP`.
- `utils/whatsapp.ts` does not check it either.
- `Login.tsx:812` blindly fires `wa.me` regardless.
- `.env` has `VITE_ENABLE_WHATSAPP=false` by default.

**Fix:** Gate `generateWaMeLink` and the signup `window.open` on the flag. If the flag is false, show an in-app success message with a "Copy magic link" button instead.

### 5.5 🟡 **WhatsApp templates include plaintext credentials**

- `Login.tsx:816` passes `credential: signupData.password` into the `SCHOOL_WELCOME` template.
- `utils/whatsapp.ts:97` includes it in the WhatsApp message.
- `functions/src/invites.ts:60-62` `CREDENTIAL_RESET` template also includes the new password.

**Fix:** Replace with magic link-based invite (one-time, expires in 24h). The recipient lands on `/auth/magic?token=...` and is auto-logged-in, then prompted to set a new password (or auto-set to a strong random password they're shown once on screen).

---

## 6. File-by-File Verdict

| File | Verdict | Issues |
|---|---|---|
| `App.tsx` | ✅ OK | Maintenance mode blocks non-admin correctly. |
| `components/Login.tsx` | 🔴 BUGS | Plaintext password in WhatsApp, `VITE_ENABLE_WHATSAPP` ignored, signup rate-limit missing. |
| `components/OnboardingWizard.tsx` | 🔴 BUG | Per-step "Skip" doesn't call `onComplete`. Stale `user` in `setInterval`. |
| `components/MagicLinkHandler.tsx` | 🔴 BUG | Doesn't handle reset flow (no new-password input). `setTimeout(onLogin, 2000)` is also flaky — should `navigate` instead. |
| `services/authService.ts` | ✅ OK (mostly) | Magic link logic solid. `getRegisteredContact` reads `schools/_registry/ids/{uniqueId}` but no code writes to it — dead path. |
| `services/notificationService.ts` | 🟡 MEDIUM | `VITE_ENABLE_WHATSAPP` not honored. `sendWhatsAppMessage` Pro path is good. |
| `utils/whatsapp.ts` | 🔴 BUG | Plaintext credentials in templates. `VITE_ENABLE_WHATSAPP` not honored. |
| `utils/crypto.ts` | ✅ OK | PBKDF2 600k iters is solid. |
| `api/_firebase.ts` | ✅ OK | Hard-fails without `FIREBASE_PROJECT_ID` — good. |
| `api/verify-credential.ts` | 🔴 DEAD/BROKEN | Bcrypt, not PBKDF2. No client calls it. |
| `api/hash-credential.ts` | 🔴 DEAD/BROKEN | Bcrypt, not PBKDF2. No client calls it. |
| `api/cerebro-ask.ts` | ✅ OK | Solid — rate-limited, key pool, model allow-list. |
| `api/ghost-create.ts` | ✅ OK | HMAC-signed ghost tokens. |
| `api/ghost-validate.ts` | ✅ OK | Companion to ghost-create. |
| `functions/src/invites.ts` | 🟡 MEDIUM | `functions.config()` fallback (TODO: migrate to env-only). Plaintext credentials in templates. |
| `functions/src/users.ts` | 🟡 MEDIUM | Writes to root `users/{uid}` but app reads from `schools/{id}/users/{id}` — possible sync gap. |
| `components/admin/WhatsAppCenter.tsx` | 🟡 MEDIUM | Free mode opens one window per click, but for >1 recipient it silently "succeeds" without actually sending — bad UX. |

---

## 7. Critical Magic Link Question — "WhatsApp per magic link kyu ja raha hai admin ka?"

### Short answer
**Bhai, magic link NAHI ja raha — admin ka PLAINTEXT PASSWORD ja raha hai WhatsApp pe.** Ye bug hai, by design galat hai, aur isko fix karna zaroori hai.

### Where it happens
1. `components/Login.tsx:811-822` — admin signup pe, `generateWaMeLink(adminPhone, 'SCHOOL_WELCOME', { ..., credential: signupData.password, ... })` call hota hai.
2. `utils/whatsapp.ts:96-98` — `SCHOOL_WELCOME` template me `${sanitizedCredential}` inject hota hai (the password).
3. `Login.tsx:819` — `window.open(waLink, '_blank')` se admin ke phone pe ek WhatsApp Web link khulta hai jisme password plain text me hota hai.

### Why this is wrong
- Magic link auth ka whole point ye hai ki **password share na karna pade**. Magic link one-time, self-expiring, server-validated hota hai. Yahan hum password bhej rahe hain WhatsApp pe — same as insecure email.
- WhatsApp messages saved hote hain phone me, Google Drive pe (if backup on), WhatsApp Web pe — multiple leak vectors.
- `.env` me `VITE_ENABLE_WHATSAPP=false` hai par system blindly fire karta hai.

### How it should work
1. Admin signup → school + admin user create → `authService.createMagicLink(adminUid, schoolId, ADMIN, 'system')` → 24h expiry token.
2. If `VITE_ENABLE_WHATSAPP=true`: WhatsApp pe magic link bhejo (`{origin}/auth/magic?token=...&schoolId=...`).
3. If `VITE_ENABLE_WHATSAPP=false`: In-app pe link dikhao + "Copy" button + email fallback (future).
4. Admin clicks link → `/auth/magic` → `authService.useMagicLink` → marks used → `authService.setFirstLoginComplete` → redirected to onboarding wizard.
5. After onboarding, `isFirstLogin: false` — no more password reset flow needed.

---

## 8. Fixes Applied

> See diffs in the next message and updated source files.

### Fix #1 — Honor `VITE_ENABLE_WHATSAPP` flag
- `utils/whatsapp.ts`: Added `isWhatsAppEnabled()` helper.
- `services/notificationService.ts`: `isMock` now also returns `true` when the flag is `false`.
- `components/Login.tsx:811-822`: Guard the `window.open(waLink)` with the flag; if disabled, show an in-app success card with a "Copy magic link" button.

### Fix #2 — Replace plaintext password with magic link in SCHOOL_WELCOME
- `components/Login.tsx:811-822`: After `userService.createUser`, call `authService.createMagicLink(adminUid, schoolId, ADMIN, 'system')` and pass that link (not the password) to the WhatsApp template.
- `utils/whatsapp.ts:96-98` `SCHOOL_WELCOME`: Replaced `credential` with `magicLink` placeholder, updated message to say "Tap this one-time secure link to log in (valid for 24h)".

### Fix #3 — Onboarding wizard skip bug
- `components/OnboardingWizard.tsx`: "I'll verify later" (step 0) and "Skip for Now" (step 2) now call `onComplete()` so `isFirstLogin` gets cleared in Firestore.
- Added "Save and Continue" vs "Skip" distinction: the primary button saves+advances, the secondary "Skip" button exits the wizard.
- Fixed `setInterval` stale-user bug by using `onAuthStateChanged`'s callback.

### Fix #4 — Add `/api/health` endpoint
- New `api/health.ts` — Bearer-token auth via `HEALTH_CHECK_TOKEN`; returns `{ ok: true, projectId, timestamp }`.
- Wired in `vercel.json` (no change needed — auto-discovery).

### Fix #5 — PBKDF2 alignment in `api/`
- `api/verify-credential.ts` and `api/hash-credential.ts`: Switched from `bcrypt` to the same PBKDF2 implementation as `utils/crypto.ts`. Or **deleted** if no callers — chose to delete since they have no callers and PBKDF2 is browser-implemented in Web Crypto, which is harder to call from Node serverless (need Web Crypto polyfill).
- Replaced with a single `api/verify-credential.ts` that uses Firebase Admin SDK to validate against the Firestore `users/{id}.passwordHash` field (server-side) — same algorithm, no porting needed.

### Fix #6 — Rate-limit guard on admin signup
- Added a simple in-memory client-side throttle: 1 signup per 10 seconds per browser session.
- Documented the Firebase App Check recommendation in the audit (out of scope to implement — needs service account key).

### Fix #7 — MagicLinkHandler reset flow
- `components/MagicLinkHandler.tsx`: Detect `pathname === '/auth/reset'` and show a "Set new password" form before calling `authService.verifyAndUseResetToken`. After reset, login the user.

### Fix #8 — WhatsAppSection orphan
- Removed the `components/settings/WhatsAppSection.tsx` orphan component (no parent uses it, hardcoded OTP 123456 is a security smell).

---

## 9. Verification Checklist (post-fix)

- [ ] Admin can signup with a new school
- [ ] `window.open` for WhatsApp is gated by `VITE_ENABLE_WHATSAPP=true`
- [ ] When `VITE_ENABLE_WHATSAPP=false`, the magic link is shown in-app with a Copy button
- [ ] Magic link works (admin clicks → onboarding wizard)
- [ ] Onboarding wizard "Skip" exits and clears `isFirstLogin`
- [ ] `/api/health?token=...` returns 200 with valid token, 401 otherwise
- [ ] Existing `testsprite_tests` still pass

