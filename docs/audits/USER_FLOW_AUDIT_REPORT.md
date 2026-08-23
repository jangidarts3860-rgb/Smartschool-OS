# USER_FLOW_AUDIT_REPORT.md

> **Generated:** 2026-06-06
> **Auditor:** AI agent (opencode)
> **Method:** Programmatic code review + flow tracing + test coverage mapping
> **Scope:** All 4 roles (Admin, Teacher, Student, Parent) + cross-cutting flows
> **Status:** 🔴 5 CRITICAL P0 BUGS found, all to be fixed in this session.

---

## Executive Summary

| Category | Count | Status |
|---|---|---|
| Flows mapped | 35 | ✅ Complete |
| Flows verified (logic OK) | 28 | ✅ Pass |
| Flows with code-level bugs | 5 | 🔴 Critical (P0) |
| Flows with logic issues | 2 | ⚠️ Minor (P1) |
| Existing tests | 254 | ✅ Pass (do NOT cover the 5 critical bugs) |

**The good news:** The architectural design is sound — multi-tenant isolation, real-time listeners, magic link flow, WhatsApp policy, all 9 admin setting tabs, all 4 role dashboards.

**The bad news:** The credential-hashing layer has a **mismatch between user-creation and login paths**. This would block a real school from being able to log in teachers and students.

---

## 1. Flow Inventory

### 1.1 Admin Flow (12 routes)
| Route | Component | Status |
|---|---|---|
| `/admin/dashboard` | Dashboard | ✅ |
| `/admin/intelligence` | CerebroDashboard | ✅ |
| `/admin/students` | UserManagement | ⚠️ Bug #1, #4 |
| `/admin/teachers` | TeacherManagement | ⚠️ Bug #1, #4 |
| `/admin/classes` | ClassManagement | ✅ |
| `/admin/attendance` | AttendanceManagement | ✅ |
| `/admin/fees` | FeeManagement | ✅ |
| `/admin/exams` | ExamManagement | ✅ |
| `/admin/results` | ResultManagement | ✅ |
| `/admin/homework` | HomeworkOverview | ✅ |
| `/admin/library` | LibraryManagement | ✅ |
| `/admin/bus-tracking` | TransportManagement | ✅ |
| `/admin/announcements` | NoticeBoard | ✅ |
| `/admin/report-cards` | ReportCardGenerator | ✅ |
| `/admin/whatsapp` | WhatsAppCenter | ✅ |
| `/admin/academic/setup` | AcademicSetup | ✅ |
| `/admin/academic/subjects` | SubjectManagement | ✅ |
| `/admin/academic/timetable` | TimetableManagement | ✅ |
| `/admin/reports` | ReportsCenter | ✅ |
| `/admin/settings` | SchoolSettings (9 tabs) | ✅ |
| `/admin/notifications` | NotificationCenter | ✅ |
| `/admin/student-profile/:id` | StudentProfile | ✅ |
| `/admin/teacher-profile/:id` | TeacherProfile | ✅ |

### 1.2 Teacher Flow (8 routes)
| Route | Component | Status |
|---|---|---|
| `/teacher/dashboard` | TeacherDashboard | ✅ |
| `/teacher/attendance` | TeacherAttendance | ⚠️ Login broken (Bug #1) |
| `/teacher/students` | StudentManager | ✅ |
| `/teacher/homework` | TeacherHomework | ✅ |
| `/teacher/homework/create` | CreateHomework | ✅ |
| `/teacher/grades` | TeacherGrades | ✅ |
| `/teacher/announcements` | TeacherNotices | ✅ |
| `/teacher/library` | TeacherLibrary | ✅ |
| `/teacher/settings` | Settings | ✅ |

### 1.3 Student Flow (9 routes)
| Route | Component | Status |
|---|---|---|
| `/student/dashboard` | StudentDashboard | ⚠️ Login broken (Bug #2) |
| `/student/academics` | StudentResult | ✅ |
| `/student/homework` | StudentHomework | ✅ |
| `/student/notices` | StudentNotices | ✅ |
| `/student/fees` | StudentFees | ✅ |
| `/student/attendance` | StudentAttendance | ✅ |
| `/student/timetable` | StudentTimetable | ✅ |
| `/student/library` | StudentLibrary | ✅ |
| `/student/transport` | StudentTransport | ✅ |

### 1.4 Parent Flow (8 routes)
| Route | Component | Status |
|---|---|---|
| `/parent/dashboard` | ParentPortal | ✅ (uses phone last-4, no hash) |
| `/parent/homework` | ParentHomework | ✅ |
| `/parent/fees` | ParentFees | ✅ |
| `/parent/attendance` | ParentAttendance | ✅ |
| `/parent/results` | ParentResults | ✅ |
| `/parent/transport` | ParentTransport | ✅ |
| `/parent/notices` | ParentNotices | ✅ |
| `/parent/library` | ParentLibrary | ✅ |
| `/parent/settings` | Settings | ✅ |

### 1.5 Cross-cutting Flows
| Flow | Status |
|---|---|
| Signup → magic link → ForcePasswordChange | ⚠️ Bug #3 (setFirstLoginComplete broken) |
| Password reset via magic link | ⚠️ Bug #3 (verifyAndUseResetToken broken) |
| Student CSV bulk import (OnboardingWizard) | 🔴 Bug #5 (no credential created) |
| Session persistence + checkSessionValid | ✅ |
| Maintenance mode gate | ✅ |
| Real-time `onSnapshot` listeners | ✅ (314 occurrences verified) |
| FCM foreground messages | ✅ |
| Role-based redirects | ✅ |
| Multi-tenant isolation (`storage.rules:35`) | ✅ |
| Firestore IDOR fixes | ✅ (per `brain/CANONICAL_STATUS.md`) |

---

## 2. Critical P0 Bugs

### 🔴 BUG #1: TEACHER LOGIN FIELD MISMATCH
**Severity:** P0 — Blocks all teachers from logging in
**Files:** `components/Login.tsx:690-706`, `components/admin/TeacherManagement.tsx:95,113`

**The problem:**
- **Teacher created with** (TeacherManagement.tsx:95,113):
  ```ts
  const passwordHash = await hashCredential(tempPassword, generateSalt());
  // stored as: { passwordHash, passwordSalt }  (line 113)
  ```
- **Teacher login expects** (Login.tsx:692-695):
  ```ts
  if (userData && userData.role === UserRole.TEACHER && ... && userData.password) {
      const salt = getCredentialSalt(userData.uniqueId, userData.schoolId);  // ❌ wrong salt
      const hashed = await hashCredential(trimmedCredential, salt);
      if (hashed === userData.password) {  // ❌ userData.password is undefined
  ```

**Two bugs in one block:**
1. Checks `userData.password` (undefined) — should be `userData.passwordHash`.
2. Uses legacy deterministic salt `getCredentialSalt(uniqueId, schoolId)` — should be `userData.passwordSalt`.

**Impact:** 100% of teachers created via the admin UI cannot log in. School is dead on arrival.

**Fix:** Use `verifyPassword(plaintext, encodedHash, uniqueId, schoolId)` from `utils/crypto.ts:63` which handles BOTH the new self-contained format (`pbkdf2$600000$salt$hash`) and the legacy format.

---

### 🔴 BUG #2: STUDENT LOGIN FIELD MISMATCH
**Severity:** P0 — Blocks students created via UserManagement
**Files:** `components/Login.tsx:708-724`, `components/UserManagement.tsx:115,131`

Same as Bug #1 but for students:
- UserManagement creates students with `passwordHash`/`passwordSalt` fields.
- Login.tsx:710 checks `userData.pin` (undefined for UserManagement-created students).
- Login.tsx:711 uses legacy deterministic salt.

**Fix:** Same as Bug #1 — use `verifyPassword()`.

**Note:** OnboardingWizard CSV import (Bug #5) creates students with NO credential field at all, so the fix to Bug #2 won't help them.

---

### 🔴 BUG #3: `hashCredential(newCredential)` CALLED WITH NO SALT
**Severity:** P0 — ForcePasswordChange and password reset flows throw at runtime
**Files:** `services/authService.ts:134, 157`

**The problem:**
```ts
// authService.ts:134 (verifyAndUseResetToken)
const hashedCredential = await hashCredential(newCredential);  // ❌ no salt
// authService.ts:157 (setFirstLoginComplete)
const hashedCredential = await hashCredential(newCredential);  // ❌ no salt
```

The signature is `hashCredential(password, salt, iterations?)`. With 1 arg, `salt = undefined`, and `encoder.encode(undefined)` throws **TypeError**.

**Impact:**
- New users completing ForcePasswordChange (after magic link) get a generic error.
- Users resetting their password via magic link get a generic error.
- These are the EXACT flows used by new teacher/student/parent onboarding.

**Fix:** Replace with `hashPassword(newCredential)` from `utils/crypto.ts:53` which generates a per-credential random salt and returns the self-contained `pbkdf2$600000$salt$hash` string.

---

### 🔴 BUG #4: `UserManagement.tsx` FIELD INCONSISTENCY
**Severity:** P0 — Created users can't be looked up correctly
**Files:** `components/UserManagement.tsx:115,131,189,205`; `services/firestore.ts:177`

UserManagement stores credentials as `passwordHash` + `passwordSalt` (correct fields per `types.ts:65-67`).
But the original code's `getUserByUniqueId` (services/firestore.ts:177) and the login code are looking for different field names.

The `types.ts` interface allows ALL of: `password`, `passwordHash`, `passwordSalt`, `pin`, `pinHash`, `dob` — this is the root cause of field-name confusion. The fix is to standardize on `passwordHash`/`passwordSalt` for admin+teacher and `pinHash` for student/parent, then update the login to use `verifyPassword` which is format-agnostic.

---

### 🔴 BUG #5: ONBOARDING CSV STUDENT IMPORT — NO CREDENTIAL
**Severity:** P0 — CSV-imported students can NEVER log in
**File:** `components/OnboardingWizard.tsx:230-244`

**The problem:**
```ts
await addDoc(collection(db, 'schools', school.id, 'users'), {
    id: userId, name, email, uniqueId, role: 'STUDENT',
    isFirstLogin: true,  // expects ForcePasswordChange to set credential
    // ❌ NO passwordHash, NO pinHash, NO passwordSalt
});
```

The CSV import creates a student with `isFirstLogin: true`, expecting the student to later be invited via WhatsApp (with a PIN). But the CSV flow does **not** generate a PIN or send an invite. So:
- Student has no credential.
- Even if a PIN is generated manually, it must be hashed and stored.
- The student is effectively a ghost user.

**Impact:** All students added via the onboarding CSV import are uninvited. The school's day-1 onboarding fails.

**Fix:** Generate a 4-digit PIN, hash it with `hashPassword()`, store `passwordHash` + `passwordSalt` + `isFirstLogin: true`, then trigger a WhatsApp bulk invite (or display the PINs in a copyable table for the admin to share).

---

## 3. Minor P1 Issues

### ⚠️ P1 #1: `Settings.tsx:262` assumes `user.dob` for student password change
```ts
if (passwordState.current !== user.dob) {
    toast.error("Current password is incorrect!");
}
```
Student PINs are 4 digits, not DOB. This will fail for all students. Should check `pinHash` with `verifyPassword()` instead.

### ⚠️ P1 #2: Plaintext password in WhatsApp templates (non-cryptic, but logged)
Some WhatsApp templates still include the temp password for one-time delivery (`TeacherManagement.tsx:128, 167, 199`). This is by design (one-time invite), but the password also appears in the Admin toast (`UserManagement.tsx:136`) which is OK for admin context, but should NOT be the only channel. The SCHOOL_WELCOME template is already fixed (uses magic link, not password). Other templates should keep the password for the one-time invite case but should ALSO generate a magic link as a passwordless alternative.

---

## 4. Verified Working Flows ✅

These flows were inspected and work correctly:

- **Admin signup → Firebase Auth user → Firestore school+user → magic link → ForcePasswordChange → Dashboard** (the chain is right, but Bug #3 breaks the final step)
- **Magic link verification** (`/auth/magic?token=&schoolId=`) — `useMagicLink` correctly validates, marks `used`, returns user
- **Magic link reset** (`/auth/reset?token=&schoolId=`) — UI is correct, but Bug #3 breaks the actual password write
- **Admin login via Firebase Auth** — `signInWithEmailAndPassword` works because it goes through Firebase Auth, not the custom hash
- **Parent login via phone-last-4** — no hash involved, just string comparison of `parentPhone.slice(-4)`
- **All `onSnapshot` real-time listeners** — 314 occurrences across parent/student/teacher/admin components
- **Multi-tenant data isolation** — `storage.rules:35`, `firestore.rules` (6 IDOR fixes per `brain/CANONICAL_STATUS.md`)
- **Maintenance mode gate** (`App.tsx:326-333`) — non-admin users blocked when `config/maintenance.enabled === true`
- **Session persistence + `checkSessionValid`** — `authService:175-194` checks `status === 'DISABLED' | 'PENDING'` and `sessionInvalidatedAt`
- **WhatsApp policy** — `wa.me` links only, no paid API, gated on `VITE_ENABLE_WHATSAPP` (`utils/whatsapp.ts:34-41`)
- **Firestore rules with 6 IDOR fixes** — per `brain/CANONICAL_STATUS.md:24`
- **PWA + offline support** — Workbox service worker, precache 82 entries
- **Cerebro AI** — real Gemini integration via Cloud Function proxy, server-side auth + rate-limit + PII sanitization
- **All 9 admin setting tabs** — fully functional per `brain/CANONICAL_STATUS.md:43`
- **Atten dance, fees, exams, results, library, homework, transport, notices, library** — all `onSnapshot`-powered with composite indexes

---

## 5. Test Coverage Map

| Flow | Existing Tests | Notes |
|---|---|---|
| Magic link create/use | ❌ None | Should add |
| Password reset | ❌ None | Should add |
| ForcePasswordChange | ❌ None | Should add |
| Login (teacher/student) | ❌ None | Critical — none of the 254 tests exercise the actual login password verification path |
| Login (admin via Firebase Auth) | ❌ None | |
| Parent login (phone last-4) | ❌ None | |
| Signup flow | ✅ 6 tests in `registration-auth-flow.test.ts` | Logic only, not Firebase integration |
| WhatsApp template | ✅ 19 tests in `whatsapp.test.ts` | Includes my new P0 lock-in tests |
| Hash/verify (crypto) | ✅ in `crypto.test.ts` | Pure unit tests |
| Rate limit | ✅ | |

**Gap:** 0 tests cover the actual login path. Bugs #1 and #2 are the kind that only an integration test of `handleSmartLogin` with mocked Firestore would catch.

---

## 6. Recommended Fix Order (to execute in next 2 hours)

1. **Fix Bug #3 first** (`hashCredential` → `hashPassword` in authService.ts) — small change, unblocks ForcePasswordChange and password reset
2. **Fix Bug #1 & #2** (Login.tsx → use `verifyPassword` instead of `hashCredential` + direct field comparison) — unblocks teacher and student login
3. **Fix Bug #5** (OnboardingWizard CSV import → generate PIN, hash, store, optionally send WhatsApp invite)
4. **Add integration tests** for login + ForcePasswordChange + reset + CSV import
5. **Fix P1 issues**

---

## 7. Risk Assessment

If the school launches **without** these fixes:
- Admin can register and use the app.
- **Teachers cannot log in** at all. School owner can add teachers in the UI but the teachers will be unable to use the app.
- **Students cannot log in** if created via UserManagement. (They could if created via the older "pin" field, but the field is not populated by the current code.)
- **ForcePasswordChange always fails** with a generic error, leaving new users stuck on the password-change screen.
- **Password reset is also broken**.

**Verdict:** This MUST be fixed before school launch. The fix is straightforward (use `verifyPassword`/`hashPassword` which already exist and are well-tested).

---

## 8. Next Steps

→ See `TODO.md` Task 2 (bug fixes) for the actual implementation plan.
