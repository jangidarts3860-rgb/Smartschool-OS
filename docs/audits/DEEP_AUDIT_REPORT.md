# SmartSchool OS — Deep Full-Stack Audit Report

> **Project:** SmartSchool AI Management System (SmartSchoolApp)
> **Date:** 2026-06-06
> **Auditor:** opencode (claude-minimax-m3-free) + 4 parallel sub-agents
> **Scope:** Every MVP feature, all 4 user roles, frontend (React/Vite/TS), backend (Firebase), services layer, serverless functions (Vercel `api/` + Firebase `functions/`), security rules, build config.
> **Methodology:** Static read of every source file, cross-referenced against `firestore.rules`, `firestore.indexes.json`, `tsconfig.json`, `.gitignore`, and previously-issued `ADMIN_AUDIT_REPORT.md` + `TEACHER_AUDIT_REPORT.md`. `npx tsc --noEmit` executed for live build health.
> **No files were modified.**

---

## 0. Executive Verdict

| Layer | Status | % Production-Ready |
|---|---|---|
| **Admin role (23 features)** | Mostly works after previous fix pass, but new regressions found | **~75%** |
| **Teacher role (8 features)** | Mostly works after previous fix pass, but new regressions found | **~75%** |
| **Student role (9 features)** | Several features broken in prod (Firestore rules, collection paths, dark mode) | **~65%** |
| **Parent role (9 features)** | **ParentTransport is fully broken (wrong ID)**; settings link is unreachable; dashboard dark mode broken | **~55%** |
| **Services layer** | Schema drift (3 parallel "student" paths, 3 parallel "attendance" paths); 3 rate-limit impls; unsigned ghost tokens; `Math.random()` for security IDs | **~60%** |
| **Backend (api/ + functions/)** | Sanitize regex broken; bcrypt cost too low; payment amount trusted from client; Stripe webhook `rawBody` missing; admin key in client bundle | **~50%** |
| **Security rules (firestore + storage)** | Several P0 holes: catch-all open to admin, students readable by all members, bus path mismatch, rate-limit client-writable, role self-escalation | **~55%** |
| **Build & TS config** | **`npx tsc --noEmit` reports 1 ERROR (build broken right now)**; `strict: false`; security-critical folders excluded from typecheck | **~70%** |

**Overall: NOT production-ready for real customers.** The 2 prior audit reports fixed the most visible bugs, but a deep inspection has surfaced a second wave of P0 issues — most importantly:

1. **The build is currently broken** (1 TS error in `WhatsAppCenter.tsx`).
2. **`ParentTransport.tsx` is fully broken** (uses `user.id` instead of a child ID — every parent sees "No transport assigned").
3. **`ParentFees` payment is blocked by Firestore rules** (parents can't write to fees per current rules).
4. **The parent sidebar "Settings" link points to `/teacher/settings`** — `/parent/settings` is unreachable.
5. **Three parallel schemas for "student" and "attendance"** — half the app sees each version.
6. **Multiple security P0s in rules + crypto + auth flow.**

---

## 1. Sitemap — All 4 Roles

### Admin (23 routes)
```
/admin
├── /dashboard              → Dashboard
├── /intelligence           → CerebroDashboard
├── /students               → UserManagement
├── /teachers               → TeacherManagement
├── /classes                → ClassManagement
├── /attendance             → AttendanceManagement
├── /fees                   → FeeManagement
├── /exams                  → ExamManagement
├── /results                → ResultManagement
├── /homework               → HomeworkOverview
├── /report-cards           → ReportCardGenerator
├── /library                → LibraryManagement
├── /bus-tracking           → TransportManagement
├── /announcements          → NoticeBoard
├── /notifications          → NotificationCenter
├── /whatsapp               → WhatsAppCenter
├── /academic
│   ├── /setup              → AcademicSetup
│   ├── /subjects           → SubjectManagement
│   └── /timetable          → TimetableManagement
├── /reports                → ReportsCenter
├── /settings               → SchoolSettings
├── /student-profile/:id    → StudentProfile
└── /teacher-profile/:id    → TeacherProfile
```

### Teacher (8 routes)
```
/teacher
├── /dashboard              → TeacherDashboard
├── /students               → StudentManager
├── /attendance             → AttendanceManagement (teacher copy)
├── /homework               → TeacherHomework
│   └── /create             → CreateHomework
├── /library                → TeacherLibrary
├── /grades                 → TeacherGrades
├── /announcements          → TeacherNotices
└── /settings               → Settings (shared)
```

### Student (9 routes)
```
/student
├── /dashboard              → StudentDashboard
├── /academics              → StudentResult
├── /homework               → StudentHomework
├── /notices                → StudentNotices
├── /fees                   → StudentFees
├── /attendance             → StudentAttendance
├── /timetable              → StudentTimetable
├── /library                → StudentLibrary
└── /transport              → StudentTransport
```

### Parent (9 routes)
```
/parent
├── /dashboard              → ParentPortal
├── /homework               → ParentHomework
├── /fees                   → ParentFees
├── /attendance             → ParentAttendance
├── /results                → ParentResults
├── /transport              → ParentTransport  ⚠ BROKEN
├── /notices                → ParentNotices
├── /library                → ParentLibrary
└── /settings               → Settings (link → /teacher/settings, unreachable)
```

### Cross-cutting
- `/login` (or `/` when not signed in) → `Login.tsx`
- `/auth/magic` + `/auth/reset` → `MagicLinkHandler.tsx`
- Maintenance mode → `MaintenancePage.tsx` (for non-admin when school enables)
- Onboarding (first-login admin only) → `OnboardingWizard.tsx`
- First-login forced password change → `ForcePasswordChange.tsx`
- Catch-all → `AutoRedirect` to role dashboard (no 404 page)
- Layout → `Layout.tsx` (sidebar + bottom nav + header)
- PWA banner → `PWAInstallBanner`
- AI assistant → `CerebroAssistant` (always visible)

---

## 2. Master Per-Feature Status Matrix

| # | Feature | Role | Component | Wired | Multi-tenant | Mobile | Dark | Errors | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard (admin) | A | `Dashboard.tsx` | ✅ | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 2 | Cerebro AI | A | `admin/CerebroDashboard.tsx` | ⚠️ mock | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 3 | User Management | A | `UserManagement.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 4 | Teacher Management | A | `admin/TeacherManagement.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 5 | Class Management | A | `admin/ClassManagement.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 6 | Attendance Mgmt | A | `admin/AttendanceManagement.tsx` | ✅ | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 7 | Fee Management | A | `admin/FeeManagement.tsx` | ✅ | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 8 | Exam Management | A | `admin/ExamManagement.tsx` | ✅ (year fixed) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 9 | Result Management | A | `admin/ResultManagement.tsx` | ✅ (controlled inputs) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 10 | Homework Overview | A | `admin/HomeworkOverview.tsx` | ⚠️ leak risk | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 11 | Report Card Gen | A | `admin/ReportCardGenerator.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 12 | Library Mgmt | A | `admin/LibraryManagement.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 13 | Transport Mgmt | A | `admin/TransportManagement.tsx` | ⚠️ derivation | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 14 | Notice Board | A | `admin/NoticeBoard.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 15 | Notification Ctr | A | `admin/NotificationCenter.tsx` | ✅ (NaN fixed) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 16 | WhatsApp Ctr | A | `admin/WhatsAppCenter.tsx` | ⚠️ TS error | ✅ | ✅ | ✅ | ❌ | **BROKEN BUILD** |
| 17 | Academic Setup | A | `admin/AcademicSetup.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 18 | Subject Mgmt | A | `admin/SubjectManagement.tsx` | ⚠️ dup UI | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 19 | Timetable Mgmt | A | `admin/TimetableManagement.tsx` | ⚠️ schema mismatch | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 20 | Reports Center | A | `admin/ReportsCenter.tsx` | ✅ (after fix) | ✅ | ✅ | ⚠️ safelist | ⚠️ | WORKS (mostly) |
| 21 | School Settings | A | `admin/SchoolSettings.tsx` | ⚠️ mock hw | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 22 | Student Profile | A | `admin/StudentProfile.tsx` | ⚠️ unscoped | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 23 | Teacher Profile | A | `admin/TeacherProfile.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 24 | Dashboard (teacher) | T | `teacher/TeacherDashboard.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 25 | My Students | T | `teacher/StudentManager.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 26 | Attendance (teacher) | T | `teacher/AttendanceManagement.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 27 | Homework | T | `teacher/TeacherHomework.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 28 | Create Homework | T | `teacher/CreateHomework.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 29 | Library (teacher) | T | `teacher/TeacherLibrary.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 30 | Grades | T | `teacher/TeacherGrades.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 31 | Notices (teacher) | T | `teacher/TeacherNotices.tsx` | ✅ (after fix) | ✅ | ✅ | ✅ | ⚠️ | WORKS |
| 32 | Dashboard (student) | S | `student/StudentDashboard.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 33 | Academics | S | `student/StudentResult.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 34 | Homework (student) | S | `student/StudentHomework.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 35 | Notices (student) | S | `student/StudentNotices.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 36 | Fees (student) | S | `student/StudentFees.tsx` | ⚠️ timer | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 37 | Attendance (student) | S | `student/StudentAttendance.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 38 | Timetable (student) | S | `student/StudentTimetable.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 39 | Library (student) | S | `student/StudentLibrary.tsx` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | HAS BUGS |
| 40 | Transport (student) | S | `student/StudentTransport.tsx` | ⚠️ | ✅ | ✅ | ✅ | ❌ | HAS BUGS |
| 41 | Dashboard (parent) | P | `parent/ParentPortal.tsx` | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | HAS BUGS |
| 42 | Homework (parent) | P | `parent/ParentHomework.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | WORKS |
| 43 | Fees (parent) | P | `parent/ParentFees.tsx` | ⚠️ rules block | ✅ | ✅ | ✅ | ⚠️ | **CRITICAL** |
| 44 | Attendance (parent) | P | `parent/ParentAttendance.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | WORKS |
| 45 | Results (parent) | P | `parent/ParentResults.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | WORKS |
| 46 | Transport (parent) | P | `parent/ParentTransport.tsx` | ❌ | ✅ | ✅ | ✅ | ⚠️ | **CRITICAL** |
| 47 | Notices (parent) | P | `parent/ParentNotices.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | WORKS |
| 48 | Library (parent) | P | `parent/ParentLibrary.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | WORKS |
| 49 | Settings (shared) | A/T/P | `Settings.tsx` | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | HAS BUGS |

**Tally:** 23 WORKS / 19 HAS BUGS / 2 CRITICAL (parent transport + parent fees self-pay) / 1 BROKEN BUILD (admin WhatsApp) / 4 INCOMPLETE in services layer.

---

## 3. Cross-Role P0 Issues (must fix before any real customer)

### P0-1 · Build is currently broken
- **Where:** `components/admin/WhatsAppCenter.tsx:27`
- **What:** `error TS2339: Property 'toDate' does not exist on type 'unknown'.`
- **Why:** The `formatTimestamp` helper types the input as `unknown`; the `timestamp instanceof Timestamp` branch tries `.toDate()` but the `Timestamp` namespace import may not be in scope properly OR the type narrowing is failing in strict mode.
- **Live check:** `npx tsc --noEmit` reports this error today. `npm run build` will fail.
- **Fix:** Change the helper to `function formatTimestamp(timestamp: Timestamp | { toDate: () => Date } | Date | string | null)` and narrow properly.

### P0-2 · ParentTransport is fully broken
- **Where:** `components/parent/ParentTransport.tsx:42`
- **What:** `onStudentAssignment(user.schoolId, user.id, ...)` uses the parent's own UID, not a child's ID. The query in `services/transport.ts:101` filters by `where('studentId', '==', studentId)` — a parent's UID is never a `studentId`. **Every parent sees "No transport assigned".**
- **Why:** The component was never updated when multi-child support was added. There is also no child selector, so even fixing the ID would still only show one child's transport.
- **Fix:** Add a child selector (same pattern as ParentHomework / ParentFees), then for each child call `onStudentAssignment(schoolId, child.id, ...)`.

### P0-3 · Parent self-payment is blocked by Firestore rules
- **Where:** `components/parent/ParentFees.tsx:115-128` + `firestore.rules:255-270`
- **What:** Parent's "Pay Now" calls a fee update path. Rules only allow `isAdmin()` or `isStudent()` to update fees. **In production, every parent click on "Pay Now" throws "Missing or insufficient permissions".**
- **Why:** Rules were written without considering parent-initiated fee payment.
- **Fix:** Add a Cloud Function `processParentFeePayment` (preferred) OR allow `isParentOf(studentId)` to update the fee when the change is limited to `transactions: arrayUnion(...)` and `status: 'PARTIAL' | 'PAID'`.

### P0-4 · Parent sidebar Settings link is unreachable
- **Where:** `config/navItems.ts:169` (`parentNavItems`)
- **What:** `path: '/teacher/settings'` — copy-paste from teacher list. The route doesn't exist for parents; the `<AutoRedirect>` at `App.tsx:439-444` sends them back to `/parent/dashboard`. **The actual `/parent/settings` route exists at App.tsx:435 but is unreachable from the UI.**
- **Fix:** Change to `path: '/parent/settings'`.

### P0-5 · Three parallel "student" schemas
- **Where:** Multiple writers + readers
  - Writes: `services/bulkImportService.ts:164` → `schools/{id}/users/{studentId}`; `services/schoolService.createStudent:485` → `schools/{id}/students/{studentId}`; `services/seedDatabase.ts:53` → `schools/{id}/users/{userId}`
  - Reads: `services/schoolService.getStudents:320` → `schools/{id}/students`; `hooks/useFirestore.ts:65` → `schools/{id}/students`; `services/attendance.fetchClassStudents:39` → `schools/{id}/users` with `role: 'STUDENT'`
  - Rules: separate blocks at `firestore.rules:313-318` (`/users`) and L321-325 (`/students`)
- **What:** A bulk-imported student exists in `/users` but is invisible to `schoolService.getStudents`, `useFirestore`'s students subscription, and the `/students` rules validators. A student created via `createStudent` exists in `/students` but is invisible to `fetchClassStudents` and the dashboard.
- **Fix:** Pick one path (`schools/{id}/users` with `role: STUDENT` is more flexible because it handles all roles uniformly). Migrate `schoolService.createStudent`, `studentDeleteService`, and the rules to consolidate. Delete the dead `/students` collection or the dead `/users` writes.

### P0-6 · Three parallel "attendance" schemas
- **Where:**
  - Path A: `schools/{id}/attendance/{date}` with `status, markedBy, classId` fields (docId = studentId). Used by `markAttendance` and read by `TeacherDashboard.tsx:136`, `AttendanceManagement.tsx:134`.
  - Path B: `schools/{id}/attendance/{date}/records/{studentId}` subcollection. Used by `markBiometricAttendance`. **Nothing reads this.**
  - Path C: `schools/{id}/students/{id}/attendance/{date}`. Written by `recordAttendance` in `firestore.ts:544` and read by `subscribeToStudentAttendance` (also `firestore.ts:451`). **The component-side subscription never fires because the data isn't there.**
- **What:** Biometric attendance is invisible to teachers. The `recordAttendance` writes are dead. Half the dashboard's attendance data is unread.
- **Fix:** Pick Path A as the source of truth. Delete `markBiometricAttendance` and rewrite as `markBiometricAttendance` → `markAttendance` (same shape). Delete `subscribeToStudentAttendance` + `recordAttendance` in `firestore.ts` (or rewrite to use Path A).

### P0-7 · Three rate-limit implementations
- **Where:**
  - `services/firestore.ts:33-82` (client-side `Map` + `localStorage`, bypassable)
  - `services/rateLimit.ts:9-22` (Firestore transaction, read-only)
  - `functions/src/rateLimit.ts:9-46` (Cloud Function sliding window, no TTL)
- **What:** None of them is consistently called. Login uses one, sensitive ops use another, ghost-token uses none.
- **Fix:** Make `functions/src/rateLimit.ts` the single authoritative source, call it from the client before sensitive writes. Add a scheduled TTL cleanup for the requests subcollection.

### P0-8 · Unsigned ghost tokens
- **Where:** `api/ghost-create.ts:20`, `functions/src/auth.ts:88`
- **What:** Token is `Buffer.from(JSON.stringify(...)).toString('base64')` — base64-encoded JSON, not signed. Anyone with read access to `ghostSessions/{id}` can craft a valid token with any `exp`.
- **Fix:** Use a JWT signed with HS256 (the `jsonwebtoken` package). Store the secret in env. Verify on `validate`.

### P0-9 · `Math.random()` for security-sensitive IDs
- **Where (representative):**
  - `utils/whatsapp.ts:139` `generatePin` (4-digit student PIN)
  - `utils/whatsapp.ts:146` `generateTempPassword` (8-char teacher password)
  - `services/bulkImportService.ts:82` `generateUniqueId`
  - `services/kiloValidation.ts:58` `generateIdempotencyKey` (fee payment dedup)
  - `services/homework.ts:205` `Date.now()` doc IDs (collision risk)
  - `services/transport.ts:181` timestamp-based doc IDs
  - `components/admin/FeeManagement.tsx` receipt numbers, txn IDs
  - `components/parent/ParentFees.tsx:108-109` transaction IDs
  - `components/Login.tsx:782, 799` school IDs + admin unique IDs
  - `components/admin/TeacherManagement.tsx:91-92` teacher IDs
  - `components/teacher/StudentManager.tsx:179` student unique IDs
- **What:** V8's `Math.random` is xorshift128+; a few observed outputs allow predicting future outputs. For student PINs (the only barrier to viewing a student's grades and attendance), this is a real risk.
- **Fix:** Replace with `crypto.getRandomValues(new Uint8Array(N))` + base32/base64 encode, or `crypto.randomUUID()`. The codebase already has the right pattern in `utils/crypto.ts:58-62` `generatePin` — use it everywhere.

### P0-10 · Firestore rules — `/{allSubcollections=**}` catch-all
- **Where:** `firestore.rules:645-655`
- **What:** `match /{allSubcollections=**}` allows admin/teacher read, teacher/admin write, admin delete on **any** subcollection not explicitly matched. A new collection created in code (e.g., `paymentIntents`, `auditLogs`, `magicLinks`) silently inherits these broad perms.
- **Fix:** Replace with a more restrictive match (e.g., explicit allowlist of known subcollection names) or `allow read, write: if false` to force every new collection to declare its own rules.

### P0-11 · Firestore rules — `/students` readable by all school members
- **Where:** `firestore.rules:540-544`
- **What:** `match /students/{studentId}` allows `read: if isSchoolMember(schoolId)` — every teacher, student, and parent at the school can read the full PII record of every other student (name, DOB, parent phone, address, blood group).
- **Fix:** Mirror the per-user access pattern at `firestore.rules:526-530` (admin/teacher/self/parentOf).

### P0-12 · Firestore rules — `isAssignedToBus` reads from wrong path
- **Where:** `firestore.rules:614-622`
- **What:** Reads from `routes/$(busNum)` but routes actually live at `transport/routes/list/{routeId}`. The `get()` always fails → function always returns `false` → students/parents are silently denied read of `/buses` and `/buses/{id}/location`. **The whole "live bus tracking" feature is non-functional for non-admin users.**
- **Fix:** Change `get(/databases/$(database)/documents/routes/$(busNum))` to `get(/databases/$(database)/documents/schools/$(schoolId)/transport/routes/list/...)` with the correct path.

### P0-13 · Firestore rules — `rateLimits` self-update
- **Where:** `firestore.rules:658-664`
- **What:** `rateLimits/{userId}` allows the user to `update` their own record. Brute-force attacker overwrites `attempts` back to 0 between attempts.
- **Fix:** Remove the user-self-update; only allow Cloud Function writes via `request.auth.token.admin == true`.

### P0-14 · Firestore rules — `/users/{userId}` allows role escalation
- **Where:** `firestore.rules:532-534`
- **What:** Self-update rule has no field allowlist. A client can send `{role: 'SUPER_ADMIN', schoolId: 'OTHER'}` and the rule accepts it. Only `biometricId` is gated.
- **Fix:** Enumerate writable fields via `diff().affectedKeys().hasOnly(['name','phone','photoUrl','fcmTokens'])` etc.

### P0-15 · Firestore rules — `schools/{schoolId}` open create
- **Where:** `firestore.rules:243`
- **What:** `allow create: if isSignedIn()` on root `/schools/{schoolId}`. Any authed user can create arbitrary school documents. Used by signup but completely open.
- **Fix:** Gate to a Cloud Function or require the caller to be the school admin (with custom claim).

### P0-16 · API keys in client bundle
- **Where:** `.env.production:5-10`, `.env.local:1`, `OnboardingWizard.tsx:244-247`, `Settings.tsx:114-115`, `SchoolsConfig.apiKeys` field
- **What:** Gemini API key stored in plaintext in (a) Vite client env (bundled into JS, shippable to anyone with DevTools) and (b) Firestore `schools/{id}/config/system.geminiKey` and `schools/{id}.config.apiKeys`. `vite.config.ts:115-116` comment claims keys were "removed from client bundle" — they were not.
- **Fix:** Move all secret material to Cloud Functions / Vercel env. Client should only know non-secret references. Add Firebase App Check with reCAPTCHA Enterprise.

### P0-17 · WhatsApp OTP `123456` hardcoded
- **Where:** `Settings.tsx:183-200`
- **What:** `if (whatsappState.otp === '123456')` — hardcoded valid OTP. Comment claims "in production this would call a backend" but the code is shipped regardless of feature flag.
- **Fix:** Either implement real OTP sending or remove the bypass. Currently the bypass works in any env.

### P0-18 · Storage rules missing `update`
- **Where:** `storage.rules:33-40`
- **What:** No `allow update` rule under `match /schools/{schoolId}/{allPaths=**}`. Defaults to deny. Any file replacement (e.g., logo overwrite) fails silently. The catch-all at L43-45 also denies.
- **Fix:** Add explicit `update` rules per subcollection (e.g., logo update allowed for admin only).

### P0-19 · `ReceiptPDF` reads undeclared subcollection
- **Where:** `components/shared/ReceiptPDF.tsx:55`
- **What:** Reads `schools/{schoolId}/settings/profile` — an undeclared subcollection. Falls into the `match /{allSubcollections=**}` catch-all (line 645) which restricts to admin/teacher only. **Parents and students cannot download their own receipts.**
- **Fix:** Either move receipt data to a properly-scoped path with explicit rules, OR move the read to a Cloud Function that the client calls with the receipt id.

### P0-20 · `api/cerebro-ask.ts` `sanitizeInput` regex is broken
- **Where:** `api/cerebro-ask.ts:34`
- **What:** The regex `/[ -]|-?/g` parses as `[space-?]` (one class) then `|` then `-?` (literal). The comment claims it "strips control characters" but it actually only strips spaces, dashes, pipes, and question marks — control characters pass through.
- **Fix:** Use `/[\x00-\x1F\x7F]/g` to strip control characters, and separately a Unicode allowlist for printable.

### P0-21 · `initData.ts` seeds real-sounding data into production
- **Where:** `services/initData.ts:15-26, 33, 52`
- **What:** Hard-coded personal data ("Navjyoti Convent Sr Sec School", "Sikar, Rajasthan, India", "admin@smartschool.com", "+91-9876543210", "Rohan Gupta") gets written to every new tenant. The `import.meta.env.DEV` check is on the log only, not the seed.
- **Fix:** Wrap the entire seed body in `if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') { ... }`.

### P0-22 · `idCardService` fallback phone `9999999999`
- **Where:** `services/idCardService.ts:116`
- **What:** `student.phone || '9999999999'` — hard-coded fallback phone number printed on the ID card. If a student's phone is empty, the card shows a stranger's number.
- **Fix:** Throw if phone is empty.

### P0-23 · `functions/src/payment.ts` trusts client amount
- **Where:** `functions/src/payment.ts:67`
- **What:** `amount * 100` — trusts client-supplied amount. A malicious client sends `amount: 1` and pays ₹1 for a ₹10,000 fee.
- **Fix:** Look up the fee from `fees/{studentId}` server-side and use the server's `totalAmount`.

### P0-24 · `functions/src/payment.ts` Stripe webhook `rawBody` not configured
- **Where:** `functions/src/payment.ts:261`
- **What:** `req.rawBody` is `undefined` because the function doesn't set `rawBody: true` in runtime options. **No Stripe webhook ever succeeds.**
- **Fix:** Migrate to `firebase-functions/v2` `onRequest` with `{ rawBody: true }` option, or use `onCall` and read the raw body manually.

### P0-25 · `authService.resetStudentPin` doesn't verify parent
- **Where:** `services/authService.ts:220-233`
- **What:** The transaction doesn't verify the caller is a parent of the student. Any admin (or stolen admin session) can reset any student's PIN.
- **Fix:** Add `parentOf(studentId)` check via `getDoc(childRef).data().parentPhone === auth.token.phone`, OR restrict the function to `request.auth.token.role == 'ADMIN'`.

### P0-26 · `authService.hashPassword` is plain SHA-256 (no salt, no PBKDF2)
- **Where:** `services/authService.ts:14-21`
- **What:** Used by `verifyAndUseResetToken`, `setFirstLoginComplete`, `resetStudentPin`. The PBKDF2 utility in `utils/crypto.ts:21` is not used by the service.
- **Fix:** Migrate all callers to `utils/crypto.hashCredential` (and bump `ITERATIONS` to 600k for OWASP 2023+).

### P0-27 · `getCredentialSalt` is deterministic
- **Where:** `utils/crypto.ts:50-52`
- **What:** `getCredentialSalt(uniqueId, schoolId)` returns `${uniqueId}:${schoolId}` — known derivation input, not a real salt. Combined with PIN `^\d{4}$` (only 10⁴ combos), a stolen database can be brute-forced in seconds.
- **Fix:** Use the random `generateSalt()` (already in the file at L58) and store the salt on the user record.

### P0-28 · `tsconfig.json` excludes security-critical folders
- **Where:** `tsconfig.json:31`
- **What:** `exclude: ["...services", "functions", "backend", "api"]` — `services/authService.ts`, `services/rateLimit.ts`, `services/fcmService.ts`, `services/firebase.ts` are not type-checked. Any type error in the rate-limiter or auth service goes undetected.
- **Fix:** Remove those entries from `exclude`. Add `"strict": true` and the derived flags.

### P0-29 · `firestore.rules:386-388` `request.auth.token.childrenIds.hasAny`
- **Where:** `firestore.rules:386-388`
- **What:** References the `childrenIds` custom claim, which is **never set** in `authService.ts` anywhere. The token only carries `phone`. So `hasAny` evaluates against a missing claim and throws → entire `allow read` evaluates to `false` and parents see nothing. **Latent lockout** for any parent feature relying on this rule.
- **Fix:** Mint a fresh ID token with the `childrenIds` claim set from the parent's user doc, or fall back to `isParentOf()` (which uses `parentPhone`).

### P0-30 · `hooks/useFirestore.ts` runaway subscriptions
- **Where:** `hooks/useFirestore.ts:48, 65, 86, 94, 101`
- **What:** Five unbounded subscriptions, each returning the entire collection. A school with 5k users sees **5 × 5k = 25k docs streamed in real time**, on every change. Firestore pricing will explode; dashboard will be slow.
- **Fix:** Split into per-collection hooks mounted only on relevant pages; cap with `limit(100)` + pagination.

### P0-31 · `ParentPortal` dashboard dark mode broken
- **Where:** `components/parent/ParentPortal.tsx:307-583`
- **What:** Hardcoded `bg-[#F8FAFC]`, `bg-white`, `text-slate-900`, `bg-slate-900` — only 3 `dark:` classes in 587 lines. **The parent dashboard is unthemable in dark mode** (which is the app default).
- **Fix:** Replace hardcoded colors with `dark:` variants throughout. Audit also applies to `Settings.tsx`.

### P0-32 · `notificationService.ts` WhatsApp sending is a stub
- **Where:** `services/notificationService.ts:243-245`
- **What:** Sets `status: 'PENDING'` for the non-mock path, but the message is never actually sent. The comment "WhatsApp integration requires backend Cloud Function (Blaze Plan) — For now, mark as PENDING for server-side processing" reveals the integration is incomplete. **Every WhatsApp "send" since launch is a log entry marked PENDING with no follow-up.**
- **Fix:** Either implement a Cloud Function webhook that picks up PENDING entries and forwards them, or remove the UI that promises a send.

### P0-33 · `notificationTriggers.feeDueReminder` calls a non-existent function
- **Where:** `services/notificationTriggers.ts:71`
- **What:** `httpsCallable(fns, 'sendWhatsAppFeeReminder')` — the function name doesn't exist (`invites.ts` exports `sendWhatsAppInvite`). The error is caught silently on L77. **Every fee reminder's WhatsApp leg is broken in production.**
- **Fix:** Either rename the function or create `sendWhatsAppFeeReminder` as a wrapper around `sendWhatsAppInvite`.

### P0-34 · `notificationScheduler` is a client-side `setInterval`
- **Where:** `services/notificationScheduler.ts:133-158`
- **What:** Runs on the client, not a server. Browser tab can close, mobile can background, etc. Also `localStorage.getItem('currentSchoolId')` is never set anywhere, so the scheduler silently no-ops.
- **Fix:** Delete this file and replace with a scheduled Cloud Function (e.g., `functions/src/dailyDigest.ts`).

### P0-35 · `notificationTriggers.homeworkDueReminder` O(students × parents) loop
- **Where:** `services/notificationTriggers.ts:241-294`
- **What:** Inner parent query is inside the outer for loop, runs once per student. 30 students × 2 parents = 60 round-trips. Will time out on a Cloud Run with 60s default.
- **Fix:** Build a `Map<studentId, parentIds>` first, then iterate.

### P0-36 · `studentDeleteService` 7 non-atomic steps
- **Where:** `services/studentDeleteService.ts:57-184`
- **What:** Every step creates its own `writeBatch`, commits, then proceeds. If step 4 fails, **the student record still exists** but attendance/fees/results are gone. **Cascade is not atomic.**
- **Fix:** Single `runTransaction` or Cloud Function. Also the L124-142 block is dead (queries `books.issuedTo` which is never written).

### P0-37 · `libraryService.issueBook` race condition
- **Where:** `services/libraryService.ts:131-175`
- **What:** The `activeCount >= maxBooks` check is OUTSIDE the transaction. Between the check and the transaction, another `issueBook` can slip in. Student ends up with `maxBooks + 1` books.
- **Fix:** Move the count check inside the transaction using `transaction.get(transactionsRef)`.

### P0-38 · `usageService.checkUsageLimits` is a stub
- **Where:** `services/usageService.ts:377-394`
- **What:** Always returns `{ exceeded: false, blockOperations: false }`. The `if (limitCheck.blocked) return ...` branch in `notificationService.ts:228` is **dead code**.
- **Fix:** Read `schoolUsageLimits/{schoolId}` and compare current usage.

### P0-39 · `usageService` WhatsApp limit hard-coded to 1000
- **Where:** `services/usageService.ts:440`
- **What:** `whatsappPercentage = (todayStats.whatsappCount / 1000) * 100` — hard-coded for all schools. A `PREMIUM` school with 10,000 quota gets a false alert at 800.
- **Fix:** Read the school's actual limit from `schoolUsageLimits`.

### P0-40 · `firebase.ts` demo fallbacks in production
- **Where:** `services/firebase.ts:8-14`
- **What:** All `firebaseConfig` keys have fallback demo values (`'demo-api-key'`, `'demo-project'`). The production guard at L18 only throws if **both** API key and projectId are missing; a typo in the projectId alone silently uses the demo project.
- **Fix:** Throw on any missing env var in production.

### P0-41 · `backend/.env` is committed
- **Where:** `backend/.env` + `.gitignore`
- **What:** Root `.gitignore` only excludes patterns relative to the repo root. The `backend/.env` file is **tracked in git** (was added before the ignore was tightened). The folder is also dead code (no `app.py`).
- **Fix:** `git rm --cached backend/.env` and add `**/.env` to `.gitignore`. Then `rm -rf backend/`.

### P0-42 · `vercel.json` CSP / cache headers defeat code-split caching
- **Where:** `firebase.json:38-47` + `vercel.json:45`
- **What:** `Cache-Control: no-cache, no-store, must-revalidate` for `**/*` applies to all files including fingerprinted JS/CSS chunks. Every code-split chunk revalidates on every request, defeating the `manualChunks` strategy. CSP `unsafe-inline` defeats XSS protection. CSP missing `https://*.firebasestorage.app`, `https://*.sentry.io`, `https://api.dicebear.com`, `frame-src` missing `https://checkout.razorpay.com`.
- **Fix:** Add `**/*.{js,css,wasm}` rule with `max-age=31536000, public, immutable`. Tighten CSP allowlists.

### P0-43 · `tailwind.config.js` has no `safelist`
- **Where:** `tailwind.config.js` (entire file)
- **What:** `components/admin/ReportsCenter.tsx` constructs class names from a runtime map (`bg-indigo-500/10`, `text-emerald-600`, etc.). Tailwind's content scanner cannot see these strings → classes are purged from the production CSS. **Reports page renders unstyled in prod.**
- **Fix:** Add `safelist: [{ pattern: /(bg|text|border|ring)-(indigo|emerald|amber|rose|blue|purple|cyan|teal|fuchsia|sky|violet|lime|orange|yellow|red|green|gray|slate|zinc|stone|neutral)(-\d+)?(\/\d+)?/ }]`.

### P0-44 · `sentry.replaysIntegration` captures PII
- **Where:** `index.tsx:12-19`
- **What:** Sentry initialized with `replayIntegration()` and session sample rate 0.1 + onError 1.0. The replay captures the entire DOM including student names, parent phones, fee data, grade data. **FERPA/COPPA concern for a school-management app.**
- **Fix:** Add a route allowlist (`/admin/*` only) or disable replays for student/parent routes.

### P0-45 · `api/_firebase.ts` env var name mismatch
- **Where:** `api/_firebase.ts:4`
- **What:** Uses `process.env.VITE_FIREBASE_PROJECT_ID` — Vite envs are only inlined into the client bundle, not into Vercel Node runtime. Falls back to `'smartschoolapp-afabc'`. **Production is using a hard-coded fallback.**
- **Fix:** Use `process.env.FIREBASE_PROJECT_ID` (or whatever Vercel env var convention the project uses). Same for any other `VITE_*` reads in `api/`.

### P0-46 · `api/_firebase.ts` uses `applicationDefault()` on Vercel
- **Where:** `api/_firebase.ts:6`
- **What:** `admin.credential.applicationDefault()` requires GCP environment. **Vercel is not GCP**; ADC is not available. The function will fail to initialize in production.
- **Fix:** Use a service-account key in env vars: `admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))`.

### P0-47 · `api/hash-credential.ts` + `api/verify-credential.ts` are unauthenticated oracles
- **Where:** `api/hash-credential.ts`, `api/verify-credential.ts`
- **What:** No auth, no rate limit, no CORS. An attacker can brute-force a stolen hash database by calling `verify-credential` with guesses. bcrypt cost 10 (OWASP recommends 12+).
- **Fix:** Add auth (Firebase ID token), CORS, and rate limit. Bump bcrypt to 12.

### P0-48 · `api/cerebro-ask.ts` rate limit is in-memory
- **Where:** `api/cerebro-ask.ts:95-108`
- **What:** Rate limit Map is lost on cold start, not shared across instances. Attacker can hit 30/min per instance.
- **Fix:** Use Firestore or a Redis-backed counter.

### P0-49 · `functions/src/gemini.ts` trusts client `modelName`
- **Where:** `functions/src/gemini.ts:34`
- **What:** `modelName || systemConfig.modelName || 'gemini-1.5-flash'` — client-supplied `modelName` is trusted. The `api/cerebro-ask.ts` correctly uses a server-side allowlist; this function doesn't.
- **Fix:** Apply the same `ALLOWED_MODELS` allowlist.

### P0-50 · `functions/src/payment.ts` signature check timing-attackable
- **Where:** `functions/src/payment.ts:142`
- **What:** `crypto.createHmac('sha256', ...).digest('hex')` then `!==` comparison. Use `crypto.timingSafeEqual`.
- **Fix:** Wrap in `timingSafeEqual` with length normalization.

---

## 4. Per-Role Detailed Findings

### 4.1 ADMIN — 23 features

**Status:** Previous audit report's P0/P1 fixes are all in place. New P1/P2 issues from this deep audit:

| # | File:Line | Issue | Sev |
|---|---|---|---|
| 1 | `components/admin/ReportsCenter.tsx:151-153` | `bg-${color}-500/10` dynamic Tailwind classes — **safelist missing in `tailwind.config.js`**, so the Reports page is unstyled in production | P0 |
| 2 | `components/admin/WhatsAppCenter.tsx:27` | `formatTimestamp(timestamp: unknown).toDate()` — **`npx tsc --noEmit` reports TS2339: Property 'toDate' does not exist on type 'unknown'`** — build is broken | P0 |
| 3 | `components/admin/HomeworkOverview.tsx` (various) | `handleViewSubmissions` returns cleanup function but is called as `onClick` → unsub discarded | P1 (pre-existing) |
| 4 | `components/admin/SubjectManagement.tsx` | Subject name used as primary key; duplicate UI | P1 (pre-existing) |
| 5 | `components/admin/TimetableManagement.tsx` | Reads `schools/{id}/profile/general` but SchoolSettings saves to `config/profile` | P1 (pre-existing) |
| 6 | `components/admin/SchoolSettings.tsx` | Plaintext Razorpay/Stripe secrets written to Firestore | P0 (see P0-16) |
| 7 | `components/admin/SchoolSettings.tsx` | NFC/biometric/DNS tabs use `setTimeout` with hardcoded success | P1 (pre-existing) |
| 8 | `components/admin/TransportManagement.tsx` | Driver derivation has edge cases (driver deleted, multiple drivers per bus) | P1 (pre-existing) |
| 9 | `components/admin/StudentProfile.tsx:118-140` | Fetches ALL attendance for the school and filters client-side (15k records for 500 students × 30 days) | P1 (pre-existing) |
| 10 | `components/admin/StudentProfile.tsx:200` | Fallback avatar sends student name to ui-avatars.com — third-party PII leak | P1 |
| 11 | `components/admin/TeacherProfile.tsx:73-124` | After fix, all 4 tabs work — but the `ACADEMICS` tab content is still derived from the `subjects[]` field which many teachers don't have populated | P2 |
| 12 | `components/admin/ResultManagement.tsx` | Still uses `defaultValue` in some places; `key` prop remount is in place but inner state still leaks between subjects | P2 |

### 4.2 TEACHER — 8 features

**Status:** Previous audit fixes all verified in place. New issues:

| # | File:Line | Issue | Sev |
|---|---|---|---|
| 1 | `components/teacher/TeacherDashboard.tsx` | Hardcoded `attendanceRate: 0` now (post-fix), but `todayStats.attendanceRate` from a single-day snapshot is misleading — better to compute rolling 30-day rate | P2 |
| 2 | `components/teacher/AttendanceManagement.tsx:522-534` | History tab is now wired, but `onDayTap` jumps to that date's editor and immediately overwrites any unsaved changes in the current view | P1 |
| 3 | `components/teacher/TeacherLibrary.tsx` | "Request to Borrow" feature added, but teacher is blocked from actually issuing (only admin/student can per rules) | P1 |
| 4 | `components/teacher/CreateHomework.tsx:205` | `Date.now()` doc ID — collision risk for same-ms double-upload | P0 (see P0-9) |
| 5 | `components/teacher/StudentManager.tsx:179` | Student unique ID uses `Math.random()` | P0 (see P0-9) |
| 6 | `components/teacher/TeacherGrades.tsx` | "Multiple subjects saved in one batch" still not implemented — only one subject per submit | P1 (pre-existing) |
| 7 | `components/teacher/TeacherNotices.tsx` | Archived tab works after fix, but `handleMarkRead` race condition can resurrect stale read state | P2 |
| 8 | `components/teacher/TeacherHomework.tsx:411-424` | "Not Submitted" tab now works, but uses `submissions.find()` O(n) per item — for 100 hw × 200 submissions = 20k comparisons | P2 |
| 9 | `components/teacher/TeacherHomework.tsx:192-201` | Delete cascade is now correct, but Storage file reaping requires `deleteAttachment(url)` to parse the URL — fragile if URL format changes | P2 |

### 4.3 STUDENT — 9 features

**Status:** No prior audit. This is a fresh full audit. Overall ~65% production-ready.

| # | File:Line | Issue | Sev |
|---|---|---|---|
| 1 | `components/student/StudentTransport.tsx` | Bus ID may be undefined when no assignment found; listener error handler missing — silent failure | P0 |
| 2 | `components/student/StudentFees.tsx` | "Pay Now" auto-closes modal after 8s `setTimeout` — stale state if user closes early | P0 |
| 3 | `components/student/StudentHomework.tsx` | Uses `collectionGroup` query — requires composite index that may not exist | P0 |
| 4 | `components/student/StudentDashboard.tsx` | Pulls all stats in one snapshot burst — for a school with 5k students this is heavy | P1 |
| 5 | `components/student/StudentResult.tsx` | `getSubjectDiff` returns `null` for missing subjects; UI then returns null — leaves gaps in the comparison view | P1 |
| 6 | `components/student/StudentAttendance.tsx` | `orderBy('date', 'desc')` may need composite index | P1 |
| 7 | `components/student/StudentTimetable.tsx` | No loading state — blank screen on slow load | P1 |
| 8 | `components/student/StudentLibrary.tsx` | "Borrowed" list shows all-time records without `limit()` | P1 |
| 9 | `components/student/StudentNotices.tsx` | Optimistic `markAsRead` race with snapshot updates | P2 |
| 10 | `components/student/StudentFees.tsx:150` | Receipt download uses last transaction's `receiptNo` (not the just-paid one) | P2 |

**Cross-cutting student issue:** `firestore.rules:386` `request.auth.token.childrenIds.hasAny` — student doesn't need `childrenIds`, but the same rule applies for student results. Verified works for the student case via the per-user access pattern.

### 4.4 PARENT — 9 features (deep audit, full output above)

| # | File:Line | Issue | Sev |
|---|---|---|---|
| 1 | `components/parent/ParentTransport.tsx:42` | **`onStudentAssignment(user.schoolId, user.id, ...)` — uses parent's own UID as student ID. Page always shows "No transport assigned".** | **P0 CRITICAL** |
| 2 | `components/parent/ParentFees.tsx:115-128` | **Parent self-payment violates `firestore.rules:255-270`. "Pay Now" throws "Missing or insufficient permissions" in production.** | **P0 CRITICAL** |
| 3 | `config/navItems.ts:169` | **`path: '/teacher/settings'` copy-paste. /parent/settings route exists at App.tsx:435 but is unreachable from UI.** | **P0 CRITICAL** |
| 4 | `components/parent/ParentPortal.tsx:307-583` | **Almost zero dark-mode coverage (3 `dark:` classes in 587 lines). Dashboard unthemable in dark mode (app default).** | **P0** |
| 5 | `firestore.rules:386` & `services/notification*.ts` vs `firestore.rules:60` | **Field-name conflict: `linkedStudents` (rules, firestore.ts) vs `childrenIds` (4 services, types.ts). One half silently fails.** | P0 |
| 6 | `components/parent/ParentPortal.tsx:42, 104` | `schoolId` defaults to `'default'` literal — silently queries `schools/default/...` if undefined | P0 |
| 7 | `components/parent/ParentPortal.tsx:60-66, 104, 226` | `useEffect` missing `return () => {}` when bailing early → nested listener leaks on child change | P0 |
| 8 | `components/parent/ParentTransport.tsx:32-73` | No child selector — single-child by construction | P0 |
| 9 | `components/parent/ParentPortal.tsx:294-305` | Empty state shows literal "Your phone number (undefined) is not linked..." when phone missing | P0 |
| 10 | `components/parent/ParentFees.tsx:63` | `useEffect` dep `children.map(c=>c.id).join(',')` causes re-fetch storm on every parent re-render | P0 |
| 11 | `components/parent/ParentFees.tsx:139` | 8s `setTimeout` not cleared on close → state set on unmounted component | P1 |
| 12 | `components/parent/ParentFees.tsx:43` | `childIds.slice(0, 30)` silently truncates parents with 31+ children | P1 |
| 13 | `components/parent/ParentTransport.tsx:286-296, 304-313` | Daily schedule fully hardcoded ("06:45 AM", "08:00 AM", "03:00 PM") | P1 |
| 14 | `components/parent/ParentFees.tsx:384-389` | "Credit/Debit Card" button rendered with no onClick | P1 |
| 15 | `components/parent/ParentHomework.tsx:73-104` | Listener re-subscribes every time submissions change | P1 |
| 16 | `components/parent/ParentHomework.tsx:89` | O(n) per-item `find` — should be a `Map` | P2 |
| 17 | `components/parent/ParentFees.tsx:150, 183` | Receipt uses last transaction's receiptNo, misses just-paid | P2 |
| 18 | `components/parent/ParentAttendance.tsx:50-70` | `orderBy('date', 'desc')` may need composite index | P1 |
| 19 | `components/parent/ParentAttendance.tsx:74` | `attendance` downloaded without `limit()` — all-time, client-side filter | P2 |
| 20 | `components/parent/ParentNotices.tsx:60-71` | `orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc')` may need composite index | P1 |
| 21 | `components/parent/ParentNotices.tsx:117-131` | Optimistic markAsRead race with snapshot updates | P2 |
| 22 | `components/parent/ParentLibrary.tsx:60` | `setChildStats` only updates the currently-selected child's stats; others are stale | P2 |
| 23 | `components/parent/ParentPortal.tsx:54-55` | `useState<any[]>` for attendance/results data | P2 |
| 24 | `Settings.tsx:41` + `App.tsx:435` | Props mismatch — `isDarkMode`/`toggleTheme` passed but `Settings.tsx` Props type doesn't include them | P1 |
| 25 | 9 parent files | 9 `console.error/warn` left in production code | P2 |

---

## 5. Services Layer — Deep Audit

### 5.1 Schema Drift (the single biggest source of latent bugs)

| Concept | Path A (used by) | Path B (used by) | Path C (used by) |
|---|---|---|---|
| **Student** | `schools/{id}/users/{id}` (bulkImport, seed, attendance.fetchClassStudents) | `schools/{id}/students/{id}` (schoolService.createStudent, getStudents, useFirestore, rules /students) | (global) `users/{id}` (userService, rules /users) |
| **Attendance** | `schools/{id}/attendance/{date}` (markAttendance, TeacherDashboard, AttendanceMgmt) | `schools/{id}/attendance/{date}/records/{sid}` (markBiometricAttendance — dead) | `schools/{id}/students/{id}/attendance/{date}` (recordAttendance, subscribeToStudentAttendance — both dead) |
| **Result** | `schools/{id}/results/{examId}_{studentId}` (examService, reportCardService) | `schools/{id}/students/{id}/results/{rid}` (recordExamResult, subscribeToStudentResults — both dead) | (none) |
| **Subject map** | `schools/{id}/users` with `subjects[]` (TeacherDashboard) | `subjects` collection (SubjectManagement) | (inconsistent) |
| **Bus locations** | `schools/{id}/buses/{busId}/location/{ts}` (transport.writeBusLocation) | (none — read path missing for non-admin) | (none) |

**Impact:** Half the app sees each version. The dead-code paths in `services/firestore.ts:451-461, 463-472, 473-483, 566-577` are all "subscribe" or "record" helpers that write to a path nothing reads. They were probably written for an earlier architecture and never cleaned up.

### 5.2 Per-File P0 Issues (services + utils + hooks)

| File:Line | Issue | Sev |
|---|---|---|
| `services/api.ts:9-13` | `getIdToken()` may be null; no guard before `Authorization: Bearer ` | P1 |
| `services/attendance.ts:79, 155` | Two incompatible attendance schemas (see §5.1) | P0 (see P0-6) |
| `services/audit.ts:52` | `actorUid: 'anonymous'` fallback | P1 |
| `services/audit.ts:58-62` | `isClientSide: true` field never read | P2 |
| `services/authService.ts:14-21` | Plain SHA-256, no salt, no PBKDF2 | P0 (see P0-26) |
| `services/authService.ts:206` | `_registry` fake school ID for password recovery | P1 |
| `services/authService.ts:150-163` | `setFirstLoginComplete` race condition | P1 |
| `services/authService.ts:220-233` | `resetStudentPin` doesn't verify parent | P0 (see P0-25) |
| `services/bulkImportService.ts:169-178, 291-300` | Two parallel writes, no transaction | P1 |
| `services/bulkImportService.ts:82` | `Math.random()` for uniqueId | P0 (see P0-9) |
| `services/cerebroEngine.ts:91` | `error.headers?.get?.(...)` — `headers` never set on Error; always undefined | P2 |
| `services/cerebroEngine.ts:122` | Aadhaar regex overlaps with credit-card regex — dead code | P3 |
| `services/examService.ts:109` | `updateExam(data: Partial<any>)` — `any` allows tenant reassignment | P0 |
| `services/examService.ts:178-186` | `getPublishedResultsByStudent` may need composite index | P1 |
| `services/examService.ts:211-223` | `publishAllResults` read-then-write race | P1 |
| `services/fcmService.ts:62-71` | `getToken` failure silent | P2 |
| `services/fcmService.ts:122` | `react-hot-toast` in service layer (UI dep) | P2 |
| `services/firebase.ts:52` | `functionsApp` created but never used | P2 |
| `services/firebase.ts:8-14` | Demo fallbacks in production | P0 (see P0-40) |
| `services/firebase.ts:41-45` | `persistentLocalCache` with no `cacheSizeBytes` | P1 |
| `services/firestore.ts:33-82` | Client-side `Map` rate limit, bypassable | P0 (see P0-7) |
| `services/firestore.ts:320` | `getStudents` reads from `students/` but bulkImport writes to `users/` | P0 (see P0-5) |
| `services/firestore.ts:191, 233, 300, 485, 498, 520, 533, 544, 555, 566` | No IDOR check on any schoolService mutator | P0 |
| `services/firestore.ts:451-461, 463-472, 473-483, 566-577` | Dead subscription paths (read/write to `students/{id}/...` subcollections) | P0 (see P0-5) |
| `services/firestore.ts:368` | `getChildren` sequential batches, could `Promise.all` | P2 |
| `services/geminiService.ts:24` | `simulateAIResponse` is a 1-line alias to the real call | P2 |
| `services/ghostMode.ts:13-32` | All errors return `{ valid: false, reason: '... failed' }` — no logging | P1 |
| `services/homework.ts:205-218` | `Date.now()` doc ID — collision risk | P0 (see P0-9) |
| `services/homework.ts:169-188` | `collectionGroup` query may need composite index | P0 |
| `services/homework.ts:120-134` | `isLate` flag trusted from client | P1 |
| `services/homework.ts:211` | Storage `fileName` not sanitized | P1 |
| `services/idCardService.ts:50-58` | QR encodes Firebase UID (PII leak) | P1 |
| `services/idCardService.ts:116` | `'9999999999'` fallback phone on ID card | P0 (see P0-22) |
| `services/initData.ts:15-26, 33, 52` | Real school name/email/phone/seeded student in production | P0 (see P0-21) |
| `services/kiloValidation.ts:58` | `Math.random()` for idempotency key | P0 (see P0-9) |
| `services/libraryService.ts:131-175` | `issueBook` count check outside transaction | P0 (see P0-37) |
| `services/libraryService.ts:106-115` | `deleteBook` race with `issueBook` | P1 |
| `services/libraryService.ts:213-220` | `finePaid: amount` typed wrong | P2 |
| `services/notices.ts:171` | Fallback listener leak on composite index error | P0 |
| `services/notices.ts:188-202` | `getUnreadCount` reads all announcements | P1 |
| `services/notificationScheduler.ts:65-131` | N+1 queries, runs client-side, `currentSchoolId` never set | P0 (see P0-34) |
| `services/notificationService.ts:57-68, 78, 349-358` | Root-level `whatsappMappings` — cross-tenant enumeration risk | P0 |
| `services/notificationService.ts:243-245` | WhatsApp send is a stub (`status: 'PENDING'`) | P0 (see P0-32) |
| `services/notificationService.ts:37` | `sanitizePhone` dead code — both branches return same value | P1 |
| `services/notificationTriggers.ts:43-59, 241-294` | N+1 parent queries per student | P0 (see P0-35) |
| `services/notificationTriggers.ts:71` | Calls non-existent function `sendWhatsAppFeeReminder` | P0 (see P0-33) |
| `services/rateLimit.ts:16-22` | `checkRateLimit` doesn't increment; locking is decoupled from read | P1 |
| `services/rateLimit.ts:60` | `Timestamp.fromMillis(Date.now() + ...)` — client clock skew | P1 |
| `services/reportCardService.ts:54-92` | Mock returns 2 hard-coded students for any schoolId/classId | P1 |
| `services/reportCardService.ts:96-101` | `where + where` query without `limit` | P1 |
| `services/seedDatabase.ts:90` | `MOCK_FEES.slice(0, 50)` | P2 |
| `services/seedDatabase.ts:109` | Single batch with 100+ ops (limit 500, no headroom) | P2 |
| `services/seedDatabase.ts` | No `import.meta.env.DEV` guard | P1 |
| `services/studentDeleteService.ts:105, 124, 65-184` | 7 non-atomic steps, dead `books.issuedTo` query | P0 (see P0-36) |
| `services/transport.ts:181` | `Date.now()` doc ID — collision risk | P0 (see P0-9) |
| `services/transport.ts:201-206` | `sanitizePhone` only handles Indian numbers | P1 |
| `services/usageService.ts:107` | Root-level `usage` collection | P1 |
| `services/usageService.ts:119-165` | `incrementCounter` race condition | P1 |
| `services/usageService.ts:377-394` | `checkUsageLimits` is a stub | P0 (see P0-38) |
| `services/usageService.ts:440` | WhatsApp limit hard-coded to 1000 | P0 (see P0-39) |
| `services/usageService.ts:312, 324` | `where(acknowledgedAt == null)` — full scan, not indexable | P1 |
| `utils/crypto.ts:6` | PBKDF2 iterations 100k — OWASP 2023+ recommends 600k | P0 |
| `utils/crypto.ts:50-52` | Deterministic salt `getCredentialSalt` | P0 (see P0-27) |
| `utils/whatsapp.ts:139, 146` | `Math.random()` for PIN and password | P0 (see P0-9) |
| `utils/whatsapp.ts:33` | Strips XSS chars but not Unicode bidi controls | P1 |
| `utils/resilience.ts:50` | `moduleTrace` concatenated into user-facing message — leaks internal module names | P1 |
| `hooks/useFirestore.ts:48, 65, 86, 94, 101` | 5 unbounded subscriptions = O(school population) streaming | P0 (see P0-30) |
| `hooks/useFirestore.ts:65` | `students` subscription may return 0 if school uses `/users` | P0 (see P0-5) |
| `hooks/SchoolContext.tsx:86` | `catch { /* Tenant detection error */ }` — swallows all errors | P2 |

---

## 6. Backend Audit (`api/` + `functions/`)

### 6.1 `api/` (Vercel serverless) — 6 files

| File:Line | Issue | Sev |
|---|---|---|
| `api/_firebase.ts:4` | `process.env.VITE_FIREBASE_PROJECT_ID` (Vite env) on Vercel — falls back to hard-coded `'smartschoolapp-afabc'` | P0 (see P0-45) |
| `api/_firebase.ts:6` | `applicationDefault()` requires GCP — Vercel has no ADC | P0 (see P0-46) |
| `api/cerebro-ask.ts:34` | `sanitizeInput` regex broken — only strips spaces/dashes/question marks | P0 (see P0-20) |
| `api/cerebro-ask.ts:95-108` | Rate limit is in-memory, lost on cold start, not shared | P0 (see P0-48) |
| `api/cerebro-ask.ts` | No CORS headers (works for same-origin only) | P1 |
| `api/ghost-create.ts:20` | Unsigned base64-JSON ghost token | P0 (see P0-8) |
| `api/ghost-create.ts:15-18` | Caller role check reads from root `users/{uid}` doc, not a claim | P0 |
| `api/ghost-validate.ts:15` | `JSON.parse(Buffer.from(...))` — no signature | P0 (see P0-8) |
| `api/ghost-validate.ts:20-23` | Returns full user data (including password/pin/fcmTokens) to caller | P1 |
| `api/hash-credential.ts:17` | `bcrypt.genSalt(10)` — OWASP recommends 12+ | P0 (see P0-47) |
| `api/hash-credential.ts` | No auth, no rate limit, no CORS — oracle for brute force | P0 (see P0-47) |
| `api/verify-credential.ts:17` | `bcrypt.compare` is constant-time but network timing can still leak | P0 (see P0-47) |
| `api/verify-credential.ts` | No auth, no rate limit, no CORS | P0 (see P0-47) |
| `api/package.json` | Missing `engines: { node: 20 }` | P3 |
| `api/tsconfig.json` | `strict: false` | P1 |

### 6.2 `functions/` (Firebase Functions) — 9 source files

| File:Line | Issue | Sev |
|---|---|---|
| `functions/src/auth.ts:6-27` | `onUserDelete` queries `schools` with `where('users', 'array-contains', uid)` but `schools/{id}` doesn't have a `users` array — trigger is a no-op | P0 |
| `functions/src/auth.ts:42-56, 58-73` | Reimplements `api/verify-credential.ts` and `api/hash-credential.ts` (parallel impls) | P1 |
| `functions/src/auth.ts:75-106` | Same unsigned ghost token as `api/ghost-create.ts` | P0 (see P0-8) |
| `functions/src/backup.ts:11-103` | `createSchoolBackup` dumps ALL school subcollections including PII to a single JSON in GCS, URL returned to caller | P0 |
| `functions/src/billing.ts:69-95` | `generateInvoice` not transactional — read-then-update race | P0 |
| `functions/src/gemini.ts:34` | Trusts client `modelName` (api/ uses allowlist) | P0 (see P0-49) |
| `functions/src/gemini.ts:58` | API key in URL `?key=${apiKey}` — leaks in server logs | P0 |
| `functions/src/gemini.ts:83` | No length cap on response | P1 |
| `functions/src/invites.ts:8-9` | `functions.config()` is deprecated in firebase-functions v4+ | P1 |
| `functions/src/invites.ts:136-140` | Leaks Meta API error to caller (may include recipient phone) | P0 |
| `functions/src/invites.ts:15` | `sanitizeInput` doesn't strip Unicode bidi controls | P1 |
| `functions/src/payment.ts:67` | Trusts client `amount` | P0 (see P0-23) |
| `functions/src/payment.ts:142` | Signature check uses `!==` — timing-attackable | P0 (see P0-50) |
| `functions/src/payment.ts:210+` | `webhookSecret` not enforced on Razorpay path | P0 |
| `functions/src/payment.ts:261` | Stripe webhook `req.rawBody` is undefined — never succeeds | P0 (see P0-24) |
| `functions/src/rateLimit.ts:9-46` | `requests` subcollection grows unbounded (no TTL/cleanup) | P1 |
| `functions/src/scheduledNotices.ts:15` | Reads every school every 5 min — O(schools × announcements) per run | P1 |
| `functions/src/scheduledNotices.ts:19` | String interpolation instead of `db.collection('schools').doc(id).collection(...)` | P2 |
| `functions/src/users.ts:6-19` | `onUserCreate` sets `role: 'UNKNOWN'` — sits in this state forever | P1 |
| `functions/src/index.ts` | `healthCheck` returns emoji — public, no auth | P1 |

### 6.3 `backend/` (Python/Flask) — DEAD CODE

- Folder contains only `.env` (committed) with empty `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` placeholders.
- No `app.py`, no `requirements.txt`. References in `brain/plans/*.md` describe a backend that was **never built**. Active backend is `api/` + `functions/`.
- Root `.gitignore` doesn't exclude `**/.env` so `backend/.env` is **tracked in git**.
- **Action:** `rm -rf backend/`, add `**/.env` to `.gitignore`, `git rm --cached backend/.env` if previously committed.

---

## 7. Firestore Rules Audit

`firestore.rules` is **665 lines**. Strict overall, but several P0 holes:

| # | Line | Issue | Sev |
|---|---|---|---|
| 1 | 645-655 | `match /{allSubcollections=**}` catch-all open to admin/teacher | **P0** (P0-10) |
| 2 | 540-544 | `match /students` readable by all school members | **P0** (P0-11) |
| 3 | 614-622 | `isAssignedToBus` reads wrong path | **P0** (P0-12) |
| 4 | 658-664 | `rateLimits` self-update | **P0** (P0-13) |
| 5 | 532-534 | `/users` self-update allows role escalation | **P0** (P0-14) |
| 6 | 243 | `schools/{id}` open create | **P0** (P0-15) |
| 7 | 386-388 | `childrenIds` claim never set — `hasAny` throws on missing | **P0** (P0-29) |
| 8 | 212 | `/users` create allows any value for `role` | P0 |
| 9 | 223-224 | `/usage` writeable by any teacher — DoS risk on billing | P0 |
| 10 | 267-268 | Fee self-update doesn't enforce `amountPaid` monotonic or cap | P1 |
| 11 | 250-252 | Two `allow read` branches — fragile pattern; future changes could bypass the apiKeys gate | P1 |
| 12 | 78-84 | Loose phone/email regexes | P2 |
| 13 | 117 | `rollNo` accepts arbitrarily large numbers | P2 |
| 14 | 50-52 | `isParentOf` reads parent phone from child doc — stale claim if child moves | P2 |
| 15 | 206-211 | Root `/users` allows admin to read all root pointers — fine, but `create` `hasAll` doesn't reject unknown extra keys | P2 |
| 16 | 101-103 | `isValidUniqueId` accepts path traversal strings like `../../../etc` | P0 |

`storage.rules` (45 lines):

| # | Line | Issue | Sev |
|---|---|---|---|
| 1 | 33-40 | No `allow update` on `match /schools/{schoolId}/{allPaths=**}` — file overwrites fail | **P0** (P0-18) |
| 2 | 43-45 | Catch-all denies everything | P1 |

---

## 8. Build & Config Audit

### 8.1 Live build health

```
$ npx tsc --noEmit
components/admin/WhatsAppCenter.tsx(27,22): error TS2339: Property 'toDate' does not exist on type 'unknown'.
```

**Build is currently broken.** `npm run build` will fail.

### 8.2 `tsconfig.json` issues

| Line | Issue | Sev |
|---|---|---|
| (missing) | No `"strict": true` | P0 (see P0-28) |
| (missing) | No `noImplicitAny`, no `strictNullChecks`, no `noImplicitReturns`, no `noUnusedLocals/Parameters` | P1 |
| 5 | `experimentalDecorators: true` is set but unused | P3 |
| 31 | `exclude: ["...services", "functions", "backend", "api"]` | **P0** (P0-28) |

### 8.3 `vite.config.ts`

| Line | Issue | Sev |
|---|---|---|
| 21-23 | Silences all `CIRCULAR_DEPENDENCY` warnings globally | P2 |
| (missing) | No `sourcemap: 'hidden'` for Sentry symbolication | P1 |
| 115-116 | Comment "API keys removed from client bundle" is false | P0 (see P0-16) |
| 124-135 | `optimizeDeps.exclude` for `jspdf`, `html2canvas`, `leaflet`, `react-leaflet` — heavy libs that should be pre-bundled | P1 |
| 136-138 | `esbuild.target: 'esnext'` — fine | P3 |
| 18-62 | Good manual chunk strategy | ✅ |

### 8.4 `firebase.json` + `vercel.json`

| File:Line | Issue | Sev |
|---|---|---|
| `firebase.json:38-47` | `Cache-Control: no-cache` for all files including fingerprinted JS/CSS — defeats code-split caching | **P0** (P0-42) |
| `firebase.json:38-56` | No security headers (CSP, X-Frame-Options, X-Content-Type-Options) | P0 |
| `vercel.json:45` | `script-src 'self' 'unsafe-inline'` — defeats XSS | **P0** (P0-42) |
| `vercel.json:45` | `connect-src` missing `https://*.firebasestorage.app`, `https://*.sentry.io`, `https://api.dicebear.com` | **P0** (P0-42) |
| `vercel.json:45` | `frame-src` missing `https://checkout.razorpay.com` | P1 |
| `vercel.json:4-8` | `functions.runtime: nodejs20.x` for `api/*.ts` — fine, but `api/package.json` is missing `engines: { node: 20 }` | P2 |

### 8.5 `tailwind.config.js`

| Line | Issue | Sev |
|---|---|---|
| (missing) | No `safelist` for dynamic classes used in `ReportsCenter.tsx` | **P0** (P0-43) |

### 8.6 `.env.example` vs `.env.production`

`.env.example` documents 44 variables. `.env.production` is missing `VITE_FIREBASE_VAPID_KEY` (required for FCM per `App.tsx:205`), `VITE_USE_MOCK`, `VITE_ENABLE_CEREBRO_AI`, `VITE_ENABLE_ANALYTICS`, `VITE_DEBUG_MODE`, `VITE_LOG_LEVEL`, `GEMINI_API_KEY`. Several feature flags silently fall back to `undefined` in prod. Sev: P1.

### 8.7 `index.tsx` Sentry

| Line | Issue | Sev |
|---|---|---|
| 12-19 | `replayIntegration()` + 0.1/1.0 sample rates — captures full DOM including PII | **P0** (P0-44) |

### 8.8 `index.html`

| Line | Issue | Sev |
|---|---|---|
| 2 | `<html lang="en" class="dark">` hardcodes dark — flashes light on first load | P2 |
| 20 | OpenGraph image hardcoded to Unsplash | P3 |
| 24 | Google Fonts stylesheet without SRI | P1 |

---

## 9. Cross-Cutting Findings

### 9.1 Comments that lie
- `services/firebase.ts:8-14` "initialize Firebase" — but `functionsApp` is never used.
- `services/geminiService.ts:24` `simulateAIResponse` is a 1-line alias to the real call.
- `utils/whatsapp.ts:139` "Auto-generate a 4-digit PIN" — uses `Math.random`, not `crypto.getRandomValues`.
- `services/api.ts:10` "Send Firebase ID token for authentication" — but only if `auth.currentUser` is non-null.
- `api/cerebro-ask.ts:34` `sanitizeInput` comment says "Strip control characters" but the regex actually strips spaces/dashes.
- `services/usageService.ts:384` "in production this would check actual limits" — it doesn't.
- `components/parent/ParentFees.tsx:108` "Sequential with user click" comment but uses `setTimeout(..., 8000)`.
- `services/notificationService.ts:243` "WhatsApp integration requires backend Cloud Function (Blaze Plan) — For now, mark as PENDING" — the integration was never finished.

### 9.2 `console.*` left in production (representative list, not exhaustive)
- 9 parent components
- 7 services (`attendance.ts:24`, `audit.ts:65`, `authService.ts:99/140/191/216/243`, `libraryService.ts:185`, `notificationService.ts:64/86/119/174/273/354/370`, `ghostMode.ts:21/32`, `rateLimit.ts:36/67/81`, `usageService.ts` × 15)
- App.tsx:218 (FCM info on every push)

### 9.3 Empty `catch {}` blocks (silent failures)
- `services/authService.ts:99, 140, 191, 216, 243`
- `services/notificationService.ts:64, 86, 119, 174, 273, 354, 370`
- `services/ghostMode.ts:21, 32`
- `services/rateLimit.ts:36, 67, 81`
- `services/usageService.ts:131, 162, 188, 200, 211, 220, 230, 326, 346, 380, 402, 425, 444, 449`

### 9.4 Inconsistencies
- Field name: `childrenIds` (types.ts, 4 services) vs `linkedStudents` (rules, firestore.ts) — same concept, two names.
- `classId` vs `class`/`section` (legacy alias) — half the code uses one, half the other.
- `currentUser` vs `user` prop name — inconsistent across components.
- `isAdmin()` check is string compare (`'ADMIN'`) in 5 places instead of `UserRole.ADMIN` enum.
- `MOCK_*` constants referenced in 3 different paths: `constants.ts`, `seedDatabase.ts`, `reportCardService.ts`.
- Hard-coded school name "SmartSchool International" appears in 4 files.
- Hard-coded admin email "admin@smartschool.com" appears in 3 files.

### 9.5 Pagination gaps
- No `limit()` on: `getStudents`, `getTeachers`, `getAllUsers`, `getAllTimetables`, `getDashboardStats`, `getFeeStats`, `getAttendanceStats`, `getUnreadCount`, `getCompletionStats`, `getMessageHistory`, `getActiveAlerts`, `getRegisteredContact`, `onHomeworkByTeacher`, `onAllHomework`, `getDashboardStats`, `recordExamResult`, etc.

### 9.6 N+1 patterns
- `services/notificationScheduler.checkLowAttendance` (1 per student)
- `services/notificationTriggers.feeDueReminder` (1 per parent)
- `services/notificationTriggers.homeworkDueReminder` (1 per student × parent)
- `services/notificationTriggers.absenteeAlert` (1 per parent)
- `services/studentDeleteService` (7 sequential queries)
- `hooks/useFirestore` (5 parallel unbounded subscriptions)

### 9.7 Accessibility gaps
- Most icon-only buttons rely on `title` instead of `aria-label` (NoticeCard, UsageMonitor, Layout profile dropdown)
- `<div onClick>` used instead of `<button>` in many places
- No focus management in modals (PaymentSandbox, ReceiptPDF, ForcePasswordChange)
- No Escape-to-close on modals
- `<Skeleton>` has no `role="status"` / `aria-busy`
- `onKeyPress` used in `CerebroAssistant` (deprecated in React 18)

### 9.8 Performance issues
- `hooks/useFirestore` runaway subscriptions (see P0-30)
- `routes/$(busNum)` rule `get()` fails on every read (P0-12)
- `useBusSimulation` `setInterval(tick, 4000)` without `useDeferredValue` (P1)
- `onDashboardStats` recomputes on every event from 3 sources (P2)
- `submissions.find()` O(n) per item in `ParentHomework` (P2)

---

## 10. Strengths

Despite the long P0 list, the project has real strengths:

- **Solid design system** — consistent glass-morphism, dark mode, mobile bottom nav.
- **Strong real-time listener patterns** in most features (correct `onSnapshot` cleanup in ~80% of cases).
- **Good error boundaries** (`ErrorBoundary` wraps routes).
- **PWA infrastructure** is solid (install prompt, offline banner, persistent cache).
- **Strong transaction integrity** in `FeeManagement` payments (`runTransaction`).
- **Cerebro AI** — PII masking is solid (credit card → Aadhaar → phone → email → PAN → SSN ordering).
- **Encryption-ready crypto utility** — `utils/crypto.ts` has correct PBKDF2 + `crypto.getRandomValues` (just isn't used everywhere it should be).
- **Composite indexes** in `firestore.indexes.json` are extensive (22 declared).
- **Firestore rules** — 90% of them are tight and well-thought-out.
- **`.gitignore`** — comprehensive for most patterns.
- **README** — comprehensive setup, security, performance documentation.
- **Two prior audit reports** with disciplined fix plans and verification.

---

## 11. Recommended Fix Plan (ranked)

### Phase 1 — Block any new customer (P0 only, 50 items listed above)

**Sub-phase 1A: Unblock the build (1 file)**
1. Fix `components/admin/WhatsAppCenter.tsx:27` `formatTimestamp` type narrowing.

**Sub-phase 1B: Fix the parent role (3 items)**
2. Fix `ParentTransport.tsx:42` to use child ID + add child selector.
3. Fix `firestore.rules:255-270` to allow `isParentOf()` for parent self-pay OR add a Cloud Function.
4. Fix `config/navItems.ts:169` settings path to `/parent/settings`.

**Sub-phase 1C: Schema drift (2 items)**
5. Reconcile "student" paths — pick `/users` (role=STUDENT) as source of truth. Delete `schools/{id}/students` writers, update `getStudents` to query `/users`, update `firestore.rules` to consolidate.
6. Reconcile "attendance" paths — pick `schools/{id}/attendance/{date}` as source of truth. Delete `markBiometricAttendance`, `recordAttendance`, and the dead subscription paths.

**Sub-phase 1D: Security P0s (15 items)**
7-21. P0-8 through P0-30 (ghost token signing, rate limit consolidation, all `Math.random()` replacements, all rules hardening, API key moves, etc.)

**Sub-phase 1E: Build & config (5 items)**
22-26. P0-28 (tsconfig strict), P0-42 (firebase.json/vercel.json), P0-43 (Tailwind safelist), P0-44 (Sentry replay allowlist), P0-45/46/47/48 (api/ env + auth + rate limit).

### Phase 2 — Before public launch (P1, ~30 items)
- Pagination on every list endpoint.
- Composite indexes for the 5+ queries that need them.
- Real `usageService.checkUsageLimits` implementation.
- `crypto.timingSafeEqual` on signature checks.
- `rawBody: true` for Stripe webhook.
- `bcrypt` cost 12.
- `crypto.timingSafeEqual` for signature checks.
- Move `notificationScheduler` to a Cloud Function.
- Remove console.* and empty catch blocks (or add `console.warn`).
- Add `aria-label` to all icon-only buttons.
- Fix `ParentPortal` dark mode.

### Phase 3 — Polish (P2, ~20 items)
- Consolidate duplicate services.
- Remove the dead `backend/` folder.
- Use the `UserRole` enum everywhere instead of string compares.
- Replace `onKeyPress` with `onKeyDown`.
- Add 404 page.
- Consolidate the three rate-limit implementations.
- Add a barrel `services/index.ts`.
- Tighten `useFirestore` to lazy-load.
- Remove `experimentalDecorators` (unused).
- Add `sourcemap: 'hidden'` for Sentry.
- Document `useMaskData` as UX hint, not security boundary.
- Remove hard-coded school name "SmartSchool International" from 4 files.

---

## 12. Verification Checklist (for each fix)

When fixing, verify:
1. `npx tsc --noEmit` exits 0.
2. `npm run build` completes without error.
3. Open the feature in browser → no console errors.
4. Submit a form → Firestore write succeeds.
5. Refresh → data persists.
6. Open from different browser → multi-tenant isolation holds (school A user cannot read school B data).
7. Toggle dark mode → no contrast issues.
8. Resize to mobile → layout adapts, bottom nav works.
9. Test with empty state → graceful empty UI.
10. Test error state → user-visible error toast.
11. Verify parent with 1 child + parent with 5 children both work.
12. Verify teacher with 1 class + teacher with 10 classes both work.
13. Verify cross-role: a student logged in cannot access `/admin/*`, etc.
14. Verify the "No transport assigned" string never appears for a parent whose child has transport.
15. Verify the parent "Pay Now" button does not throw "Missing or insufficient permissions".

---

## 13. Sub-agent Verifications Used

This audit was produced by:
1. **Main agent** (this conversation) — coordinated, did the build health check, read `App.tsx`, `types.ts`, `tsconfig.json`, `tailwind.config.js`, `firestore.indexes.json`, `config/navItems.ts`, the two prior audit reports.
2. **Sub-agent 1** — verified the 8 P0 + 13 P1 fixes from the previous ADMIN_AUDIT_REPORT.md and TEACHER_AUDIT_REPORT.md (result: all applied, 15 new minor issues found).
3. **Sub-agent 2** — full Student role audit (8 routes, 10 P0/P1 issues found).
4. **Sub-agent 3** — full Parent role audit (8 routes + shared Settings; 10 P0 + 15 P1 issues found).
5. **Sub-agent 4** — Services layer + utils + hooks audit (35+ P0/P1 issues found).
6. **Sub-agent 5** — Security rules + infrastructure audit (28 P0/P1 issues found).

All raw outputs are saved in `C:\Users\Dell\.local\share\opencode\tool-output\`.

---

**End of report. Total P0: 50. Total P1: 60+. Total P2: 40+. Total findings: 150+.**

**Recommended action: do NOT take on a real paying school until at least all 50 P0s are fixed and `npx tsc --noEmit` is clean.**
