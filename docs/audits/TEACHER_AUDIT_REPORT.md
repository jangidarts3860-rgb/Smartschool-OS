# SmartSchoolApp — Teacher Role Audit Report

> Date: 02 Jun 2026
> Auditor: OpenCode agent
> Scope: Teacher role (8 nav items / 8 components / 6,xxx lines)

---

## 1. Sitemap (Teacher)

| Sidebar | Path | Component | Lines |
|---------|------|-----------|-------|
| Dashboard | `/teacher/dashboard` | `components/teacher/TeacherDashboard.tsx` | 387 |
| My Students | `/teacher/students` | `components/teacher/StudentManager.tsx` | 476 |
| Attendance | `/teacher/attendance` | `components/teacher/AttendanceManagement.tsx` | 539 |
| Homework | `/teacher/homework` | `components/teacher/TeacherHomework.tsx` | 743 |
| Create Homework (nested) | `/teacher/homework/create` | `components/teacher/CreateHomework.tsx` | 599 |
| Library | `/teacher/library` | `components/teacher/TeacherLibrary.tsx` | 271 |
| Grades | `/teacher/grades` | `components/teacher/TeacherGrades.tsx` | 466 |
| Notices | `/teacher/announcements` | `components/teacher/TeacherNotices.tsx` | 234 |

Settings is reused from `components/Settings.tsx` (shared with admin).

---

## 2. Status Matrix

| Feature | Wire-up | Data | Multi-tenant | Mobile | Dark | A11y | Verdict |
|---------|---------|------|--------------|--------|------|------|---------|
| TeacherDashboard | ⚠️ | ❌ fake rate | ✅ | ✅ | ✅ | ⚠️ | P0 (4.1, 4.2) |
| StudentManager | ✅ | ❌ no dup check | ✅ | ✅ | ✅ | ⚠️ | P0 (3.1, 3.2, 3.3) |
| AttendanceManagement | ⚠️ wrong path | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | P0 (1.1, 1.2) |
| TeacherHomework | ✅ | ⚠️ orphan | ✅ | ✅ | ✅ | ⚠️ | P1 (many) |
| CreateHomework | ✅ | ❌ orphan | ✅ | ✅ | ✅ | ✅ | P0 (2.1) |
| TeacherLibrary | ❌ no borrow | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | P0 (7.1) |
| TeacherGrades | ❌ fake class | ❌ wrong fields | ✅ | ✅ | ✅ | ⚠️ | P0 (5.1, 5.3) |
| TeacherNotices | ✅ | ⚠️ archive fake | ✅ | ✅ | ✅ | ⚠️ | P1 (8.4) |

---

## 3. Top 10 P0 Issues

| # | File | Issue | Lines |
|---|------|-------|-------|
| 1 | `AttendanceManagement.tsx` | Read query at wrong collection level — existing attendance doesn't load, re-submit destroys per-student status | 124-144 |
| 2 | `AttendanceManagement.tsx` | "History" tab no-op stub with empty grid | 522-534 |
| 3 | `TeacherDashboard.tsx` | Hardcoded `attendanceRate: 98` — fake data | 45 |
| 4 | `TeacherDashboard.tsx` | Nested `onSnapshot` leaks listeners on every class change | 73-124 |
| 5 | `CreateHomework.tsx` | Attachments uploaded to `homework/{local-pseudo-id}/` while Firestore doc gets a different auto-ID — orphaned Storage files | 177-184, 210 |
| 6 | `StudentManager.tsx` | "Edit Profile" button has no onClick | 265-267 |
| 7 | `StudentManager.tsx` | `addDoc` no uniqueness check; `uniqueId` collision possible | 155 |
| 8 | `StudentManager.tsx` | `classId: user.classId \|\| 'N/A'` — sentinel written to DB | 141 |
| 9 | `TeacherGrades.tsx` | `classId: user.classId \|\| '10A'` fallback — writes to fake class | 59, 175, 207, 288 |
| 10 | `TeacherLibrary.tsx` | "Browse" mode has no real borrow flow | 254-263 |

---

## 4. Top 15 P1 Issues

| # | File | Issue | Lines |
|---|------|-------|-------|
| 1 | `TeacherHomework.tsx` | "Not Submitted" tab filter is always empty | 411-424 |
| 2 | `TeacherHomework.tsx` | Per-class N+1 `onSnapshot` listeners | 102-119 |
| 3 | `TeacherHomework.tsx` | Delete orphans submissions subcollection | 192-201 |
| 4 | `TeacherHomework.tsx` | "Publish" toggle doesn't trigger notifications | 203-212 |
| 5 | `TeacherGrades.tsx` | Marks hardcoded 0-20/0-80 (doesn't fit 30+70, 40+60 patterns) | 125, 140 |
| 6 | `TeacherGrades.tsx` | Only one subject saved per submit | 165 |
| 7 | `TeacherGrades.tsx` | Existing results don't pre-populate form inputs | 304-365 |
| 8 | `TeacherGrades.tsx` | `percentage` stored as raw total, not a true percentage | 182 |
| 9 | `TeacherGrades.tsx` | `subjects.length` on Record (object) → always 0 | 99-104, 450 |
| 10 | `TeacherGrades.tsx` | `academicYear: '2024-25'` hardcoded | 188 |
| 11 | `AttendanceManagement.tsx` | CSV export drops un-marked students | 266-286 |
| 12 | `AttendanceManagement.tsx` | `checkPendingSync` stale closure | 78-100 |
| 13 | `AttendanceManagement.tsx` | Hardcoded `['10A', '9A', '8A']` fallback on class query failure | 70-72 |
| 14 | `TeacherDashboard.tsx` | `entry.teacherName.toLowerCase().includes(...)` — name-based cross-tenant bleed | 88-90 |
| 15 | `TeacherNotices.tsx` | "Archived" filter tab is a lie — `onAnnouncementsByRole` filters by `isArchived == false` | services/notices.ts:128 |

---

## 5. Fix Plan

### Phase 1 — Critical (P0) [DOING]
- [ ] Fix AttendanceManagement read query to use date subcollection
- [ ] Wire AttendanceManagement history tab to real data
- [ ] Remove hardcoded `attendanceRate: 98` from TeacherDashboard
- [ ] Fix nested onSnapshot leak in TeacherDashboard
- [ ] Fix CreateHomework attachment path orphaning
- [ ] Wire StudentManager "Edit Profile" button
- [ ] Add uniqueness check in StudentManager addDoc
- [ ] Remove `'N/A'` sentinel in StudentManager
- [ ] Remove `'10A'` fallback in TeacherGrades
- [ ] Wire TeacherLibrary borrow flow

### Phase 2 — High (P1) [pending]
- [ ] Wire "Not Submitted" tab to real data
- [ ] Reduce N+1 listeners in TeacherHomework
- [ ] Cascade-delete submissions on homework delete
- [ ] Fire notifications on homework publish
- [ ] Make grade marks limits configurable
- [ ] Save multiple subjects in one batch
- [ ] Pre-populate existing result marks in form
- [ ] Fix `percentage` field semantics
- [ ] Fix `subjects.length` on Record
- [ ] Replace hardcoded `2024-25` academic year
- [ ] CSV export: include un-marked as ABSENT
- [ ] Fix `checkPendingSync` stale closure
- [ ] Remove fake `['10A', '9A', '8A']` fallback
- [ ] Replace name-based teacher match with strict ID match
- [ ] Wire teacher "Archived" notices tab

### Phase 3 — Polish (P2) [as time permits]
- [ ] Library: ESC to close modal
- [ ] Library: "Fine Paid" / "Fine Waived" badges
- [ ] Unused imports cleanup
- [ ] `tomorrow()` stale date issue
- [ ] No `aria-label` on action buttons

---

## 6. Cross-Cutting Patterns

- **Sentinel value fallbacks** (`'N/A'`, `'10A'`, `98`) instead of explicit error handling — appears 6+ times
- **Hardcoded academic year** (`'2024-25'`, `'2025-26'`) — appears 4 times
- **Wrong Firestore collection paths** — `schools/{id}/attendance` queried instead of `schools/{id}/attendance/{date}` subcollection
- **N+1 listeners** — Per-class `onSnapshot` loops fire 1 listener per class
- **Inconsistent cleanup** — Some effects use `unsubRef.current`, some rely on return, some leak
- **Mock/stub UI** — "Edit Profile" button, "History" tab, "Archived" tab — features wired in nav but not in component

---

**End of report (audit section).** Fixes section appended at end after implementation.

---

## 7. Fixes Applied (this session)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `components/teacher/AttendanceManagement.tsx` | Read query at wrong collection level (P0) | Changed `collection('attendance')` to `collection('attendance', attendanceDate)` (subcollection) |
| 2 | `components/teacher/AttendanceManagement.tsx` | History tab no-op stub (P0) | Wired real history fetch: iterates date subcollections, client-side rollup, `MonthlyCalendarGrid` now shows marked days, `onDayTap` jumps to that date's editor |
| 3 | `components/teacher/AttendanceManagement.tsx` | Hardcoded `['10A', '9A', '8A']` fallback (P1) | Replaced with `[]` + `toast.error` so user knows no classes loaded |
| 4 | `components/teacher/AttendanceManagement.tsx` | CSV export drops un-marked students (P1) | Now exports all students; un-marked default to ABSENT; shows confirm dialog if any are un-marked |
| 5 | `components/teacher/TeacherDashboard.tsx` | Hardcoded `attendanceRate: 98` (P0) | Default now 0, computed from real data |
| 6 | `components/teacher/TeacherDashboard.tsx` | Nested `onSnapshot` leak (P0) | Restructured: each subscription tracked in `unsubs[]` array, all unsubscribed on cleanup |
| 7 | `components/teacher/TeacherDashboard.tsx` | Attendance query at wrong level (P0) | Changed to `collection('attendance', today)` subcollection |
| 8 | `components/teacher/TeacherDashboard.tsx` | Name-based teacher match (P1) | Replaced `entry.teacherName.toLowerCase().includes(...)` with strict `entry.teacherId === user.id` |
| 9 | `components/teacher/CreateHomework.tsx` | Attachments uploaded to wrong path (P0) | Reordered: create doc FIRST (get real ID), THEN upload attachments, then `updateHomework` with final attachment list |
| 10 | `components/teacher/CreateHomework.tsx` | `removeExistingAttachment` orphan in Storage (P1) | Now calls `deleteAttachment(url)` to remove from Storage; also reaps on homework delete |
| 11 | `components/teacher/CreateHomework.tsx` | Hardcoded `academicYear: '2025-26'` (P1) | Now computed from `new Date().getFullYear()` |
| 12 | `components/teacher/StudentManager.tsx` | "Edit Profile" button no onClick (P0) | Added `openEditModal(student)`, full edit modal UI, `saveEdit()` updates Firestore via `updateDoc` |
| 13 | `components/teacher/StudentManager.tsx` | `addDoc` no uniqueness check (P0) | Added rollNo duplicate check (rejects) + name duplicate warning (confirms); uniqueId now includes 2-char random suffix |
| 14 | `components/teacher/StudentManager.tsx` | `classId: 'N/A'` sentinel (P0) | Now uses `user.classId` directly with guard: `if (!user.classId) return toast.error('You are not assigned to a class.')` |
| 15 | `components/teacher/TeacherGrades.tsx` | `classId: '10A'` fallback (P0) | Removed; explicit `if (!user.classId) return toast.error('You are not assigned to a class.')` |
| 16 | `components/teacher/TeacherGrades.tsx` | `academicYear: '2024-25'` hardcoded (P1) | Now computed from `new Date().getFullYear()` |
| 17 | `components/teacher/TeacherLibrary.tsx` | "Browse" mode has no borrow (P0) | Changed "Contact librarian" text to a real "Request to Borrow" button calling `libraryService.requestBook` |
| 18 | `components/teacher/TeacherNotices.tsx` | Archived tab empty (P1) | Now subscribes to BOTH `onAnnouncementsByRole` AND `onArchivedAnnouncements`, merging results client-side |
| 19 | `components/teacher/TeacherNotices.tsx` | Dynamic `import()` in `handlePin` (P1) | Changed to static import; `pinAnnouncement` now in the import list |
| 20 | `components/teacher/TeacherNotices.tsx` | `handleMarkRead` silent failure (P1) | Now logs and toasts on error |
| 21 | `components/teacher/TeacherHomework.tsx` | N+1 listeners (P1) | Now filters `classes` to only teacher's `assignedClasses` (or `classId`) before subscribing |
| 22 | `components/teacher/TeacherHomework.tsx` | "Not Submitted" tab always empty (P1) | Now loads class students in `openGradeModal()`, merges with submissions to show missing students with "Has Not Submitted" badge |
| 23 | `components/teacher/TeacherHomework.tsx` | Delete orphans submissions (P1) | `handleDelete` now cascade-deletes submission docs and attachment files in Storage |

### Verification
- `npx tsc --noEmit` — **0 errors**
- `npx vite build` — **built in 55.16s**, all teacher chunks emitted, PWA precache 80 entries (3702.86 KiB)
