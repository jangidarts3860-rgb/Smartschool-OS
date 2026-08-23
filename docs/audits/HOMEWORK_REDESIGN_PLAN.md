# HOMEWORK FEATURE — REDESIGN PLAN (Simplified Indian Version)

> **Status:** PLANNING (awaiting user audit)
> **Author:** Antigravity (AI)
> **Date:** 2026-06-06
> **Goal:** Rebuild the homework feature from scratch for Indian primary/middle schools

---

## 1. PRINCIPLES (Non-Negotiable)

1. **Less is more** — 3 clicks max for any action
2. **No file uploads** — students write in notebook, teacher checks in class
3. **No rich text** — plain text descriptions only
4. **No numeric grades on homework** — only Done/Pending/Late status
5. **No AI grading** — AI assists teacher, never replaces
6. **Subject-wise** — every homework has exactly one subject
7. **Class-wise** — every homework is for one class (multi-class = create N homeworks)
8. **Mobile-first** — 80% of parents use phones with weak internet

---

## 2. PROBLEM WITH CURRENT DESIGN

| Current | Issue | Real School |
|---|---|---|
| File upload (10MB) | Server limit 5MB, silent fail | Notebook only |
| Rich grade 0-100 | Overkill, no real metric | Just check |
| Text answer + file | Students don't type essays | "Maine kar liya" |
| Late penalty | No rule, no weight | Just "Late" flag |
| Edit before deadline | Race conditions | One shot |
| Rubric grading | P2 missing anyway | Don't need |
| AI grading | P0 missing anyway | Teacher checks |

---

## 3. NEW DATA MODEL (Minimal)

### 3.1 Homework document

**Path:** `schools/{schoolId}/homework/{homeworkId}`

```typescript
interface Homework {
  id: string;               // auto-generated
  schoolId: string;         // for rules
  classId: string;          // required
  className: string;        // denormalized for display
  subjectId: string;        // FK to subjects collection
  subjectName: string;      // denormalized
  topic: string;            // e.g., "Chapter 5: Fractions" — REQUIRED
  description?: string;     // 1-2 lines, optional
  referenceLink?: string;    // YouTube/notes URL, optional
  dueDate: string;          // YYYY-MM-DD (no time, no timezone)
  teacherId: string;        // creator
  teacherName: string;      // denormalized
  createdAt: Timestamp;     // server-side
  updatedAt: Timestamp;     // server-side
  status: 'ACTIVE' | 'ARCHIVED';  // soft delete via ARCHIVED
  isDraft: boolean;         // false = visible to students
}
```

**REMOVED fields** (vs current):
- ~~`title`~~ → use `topic` instead
- ~~`assignedDate`~~ → use `createdAt`
- ~~`academicYear`~~ → derive from school config
- ~~`maxGrade`~~ → no grade
- ~~`allowLateSubmission`~~ → always allow late, but mark as LATE
- ~~`attachments`~~ → no uploads (use `referenceLink` for YouTube)
- ~~`status: DRAFT|ACTIVE|COMPLETED|ARCHIVED`~~ → simplified to ACTIVE|ARCHIVED + isDraft

### 3.2 Submission document

**Path:** `schools/{schoolId}/homework/{homeworkId}/submissions/{studentId}`

**KEY CHANGE**: Document ID = studentId, NOT auto-generated. This guarantees ONE submission per student per homework at the rules level.

```typescript
interface HomeworkSubmission {
  id: string;               // = studentId
  homeworkId: string;       // required
  studentId: string;        // required, = document ID
  studentName: string;      // denormalized
  status: 'PENDING' | 'DONE' | 'LATE';  // initial: PENDING
  markedDoneAt?: Timestamp; // when student clicked "Mark Done"
  markedBy: 'STUDENT' | 'TEACHER';  // who marked it (teacher can override)
  teacherChecked: boolean;  // teacher verified in class
  teacherNote?: string;     // teacher's optional 1-line note ("Good", "Incomplete")
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**REMOVED fields** (vs current):
- ~~`fileUrl`~~ → no uploads
- ~~`fileName`~~ → no uploads
- ~~`fileSize`~~ → no uploads
- ~~`textContent`~~ → no essays
- ~~`isLate`~~ → derived from `markedDoneAt > dueDate`
- ~~`grade`~~ → no marks
- ~~`maxGrade`~~ → no marks
- ~~`feedback`~~ → replaced with `teacherNote` (1 line)
- ~~`gradedBy`~~ → replaced with `markedBy`
- ~~`gradedAt`~~ → replaced with `markedDoneAt`

### 3.3 Notification document (in-app)

**Path:** `schools/{schoolId}/users/{userId}/notifications/{notificationId}`

Same as current. New types:
- `HOMEWORK_ASSIGNED` (to student + parent)
- `HOMEWORK_DUE_TOMORROW` (to student, 8 PM daily)
- `HOMEWORK_LATE` (to parent, when student marks done after due date)
- `HOMEWORK_OVERDUE` (to parent, when due date passed and not marked)
- `WEEKLY_DIGEST` (to teacher, Sunday 8 PM)

---

## 4. USER FLOWS

### 4.1 TEACHER — Create Homework (3 clicks)

```
Screen: Teacher Dashboard → Homework tab → "+ New Homework" button
↓
Step 1: SELECT CLASS (dropdown, single select)
         Auto-fills: className, schoolId
         Pre-selects: if teacher has only 1 class
↓
Step 2: SELECT SUBJECT (dropdown from /subjects where classId matches)
         Shows: "Math, English, Hindi, Science" (from subjects collection)
         Pre-selects: if teacher has only 1 subject
↓
Step 3: FILL DETAILS
         Topic: [text input, 2-100 chars, required]
         Description: [textarea, optional, 0-300 chars]
         Reference Link: [URL input, optional, must be valid URL]
         Due Date: [date picker, default = tomorrow, must be future]
         ☐ Save as Draft (checkbox)
↓
Step 4: "Assign" button (or "Save Draft")
         → Creates homework doc
         → For each student in class: creates PENDING submission doc (in batch)
         → Sends HOMEWORK_ASSIGNED notification to all students + parents
         → Shows success toast: "Homework assigned to 28 students"
         → Redirects to homework list
```

**Time to complete: 30-60 seconds**

### 4.2 TEACHER — View Homework List

```
Screen: Teacher Dashboard → Homework tab
↓
Layout: Card list, newest first

Each card shows:
  - Subject icon + Subject name (color-coded)
  - Topic (bold, 1 line)
  - Class name + "X/Y students done" (live count)
  - Due date (color-coded: green if future, red if overdue)
  - "View Submissions" button
  - 3-dot menu: Edit, Archive, Delete

Filters (top of page):
  - Subject: [All] [Math] [English] [Hindi] [Science]
  - Status: [All] [Active] [Overdue] [Drafts] [Archived]
  - Sort: [Newest] [Due date] [Class]
```

**Click "View Submissions":**
```
Modal opens:
  - Homework topic + due date at top
  - Tabs: [Pending (X)] [Done (Y)] [Late (Z)]
  - List of students with: name, status badge, "Mark Done" button (if Pending/Late)
  - Bulk action: "Mark all as Done" (with confirm)
  - Per-student "Add note" button (opens small inline editor)
```

### 4.3 TEACHER — Edit / Archive / Delete

```
Edit: Same form as create, pre-filled. Cancellable.
  - On save: updates homework doc, does NOT re-create submissions
  - If due date changes: notifications re-sent? (NO — would spam)
  - If class changes: complex (move submissions to new class) — DISALLOWED

Archive: Soft delete. Homework hidden from student/parent views.
  - "Archive" button → confirm → status='ARCHIVED'
  - All submissions retained for records
  - Reversible: teacher can un-archive

Delete: Hard delete. Only allowed if NO submissions exist OR all are PENDING.
  - "Delete" button → confirm "Delete this homework for 28 students? This cannot be undone."
  - On confirm: deletes homework + all submission docs (atomic batch)
  - If ANY submission is DONE: button disabled with tooltip "Cannot delete — students have submitted"
```

### 4.4 STUDENT — View Homework

```
Screen: Student Dashboard → Homework tab

Top: 4 stat cards (color-coded)
  - "📚 Today's: 3"
  - "⏰ Pending: 5"
  - "✅ Done this week: 8"
  - "❌ Late: 1"

List of homework cards (sorted by due date, soonest first):
  - Subject color bar (left edge)
  - Subject name + Topic
  - Teacher name
  - "Due: Tomorrow" (relative date)
  - Status badge: [Pending] [Done ✅] [Late]
  - "Mark Done" button (only if Pending and not past due+1 day)
  - "View Details" link

Filter tabs: [All] [Pending] [Done] [Late] [This Week]
```

**Click "Mark Done":**
```
Confirm modal: "Did you complete this homework?"
  - "Yes, mark as done" button
  - "Not yet" button
↓
On Yes:
  - Updates submission: status='DONE', markedDoneAt=now, markedBy='STUDENT'
  - If markedDoneAt > dueDate: status='LATE' instead
  - Sends notification to teacher ("Rahul marked Math homework as done")
  - Updates parent notification (if late)
  - Success toast with checkmark animation
```

**Click "View Details":**
```
Modal: Homework details
  - Subject, Topic, Description
  - Reference link (if any, clickable)
  - Teacher name + "Contact" button
  - Due date
  - Status of submission
  - Teacher's note (if any)
```

### 4.5 PARENT — View Child's Homework

```
Screen: Parent Dashboard → Child's Homework tab

If multiple children: dropdown to select child

Top: 3 stat cards
  - "📚 This week: 12"
  - "✅ Done: 10 (83%)"
  - "❌ Late: 2"

List of homework cards (last 30 days, newest first):
  - Subject color + name
  - Topic (1 line)
  - "Due: 2 days ago" (relative)
  - Status icon: ✓ Done / ⏳ Pending / ❌ Late
  - Click → expand: teacher note (if any)

No "Mark Done" button — student does that
No download — read-only
No edit — read-only
```

### 4.6 ADMIN — View All Homework (Read-only)

```
Screen: Admin Dashboard → Homework Overview

Filters:
  - Class: [All] [Class 1] [Class 2] ...
  - Teacher: [All] [Mrs. X] [Mr. Y] ...
  - Subject: [All] [Math] [English] ...
  - Date range: [This week] [This month] [Custom]
  - Status: [All] [Active] [Overdue] [Archived]

Stats row:
  - Total homework: 47
  - Completion rate: 78%
  - Late rate: 12%
  - Most active teacher: Mrs. X (15 assignments)

Table:
  - Date | Class | Subject | Topic | Teacher | Done/Total | Completion % | Status
  - Click row → opens detail modal
  - Export to CSV button (top right)
```

---

## 5. AI FEATURES (Lite)

### 5.1 Daily 8 PM Reminder (push to students)
```
Trigger: Cloud Function, every day at 8 PM IST
Logic:
  - For each school, find ACTIVE homework where dueDate = tomorrow
  - For each PENDING submission, find the student
  - Send in-app notification: "📚 Reminder: Math homework (Fractions) due tomorrow!"
  - Skip if student has already marked DONE
```

### 5.2 Weekly Digest (Sunday 8 PM, push to teachers)
```
Trigger: Cloud Function, every Sunday 8 PM IST
Logic:
  - For each teacher, find homework created in last 7 days
  - For each homework, count: PENDING / DONE / LATE submissions
  - Generate digest: "This week you assigned 7 homework. 89% on-time completion. Top performers: [list]. Late submissions: [list with count]."
  - Send in-app notification to teacher
```

### 5.3 Late Pattern Alert (real-time, to teacher)
```
Trigger: After student marks homework LATE
Logic:
  - Check if student has marked LATE 3+ times in last 14 days
  - If yes, send notification to teacher: "Ramesh has been late on 3 of last 5 homework. Consider reaching out."
```

### 5.4 Topic Suggestions (to teacher, on create page)
```
Trigger: Teacher opens "Add Homework" form
Logic:
  - For selected class + subject, fetch:
    - Recent homework topics (last 30 days)
    - Subject syllabus from /subjects collection
  - Show suggestions: "Suggested topics: Chapter 6 Decimals, Chapter 7 Algebra"
  - Auto-fill topic field if teacher clicks suggestion
  - AI NOT used — just lookup from existing data
```

### 5.5 What AI does NOT do
- ❌ Grade essays or assignments
- ❌ Suggest grade scores
- ❌ Detect plagiarism
- ❌ OCR handwritten work
- ❌ Replace teacher judgment

---

## 6. FIRESTORE RULES (Minimal)

### 6.1 Homework collection
```
match /schools/{schoolId}/homework/{homeworkId} {
  allow read: if isSchoolMember(schoolId) && (
    isAdmin(schoolId) ||
    (isTeacher(schoolId) && resource.data.teacherId == request.auth.uid) ||
    isStudent(schoolId) ||  // student can see their class's homework
    isParentOfStudentInClass(schoolId, resource.data.classId)  // parent of student in this class
  );
  allow create: if isTeacher(schoolId) && request.resource.data.teacherId == request.auth.uid;
  allow update: if isTeacher(schoolId) && resource.data.teacherId == request.auth.uid && ...field constraints;
  allow delete: if isAdmin(schoolId) || (isTeacher(schoolId) && resource.data.teacherId == request.auth.uid);
}
```

### 6.2 Submission subcollection
```
match /schools/{schoolId}/homework/{homeworkId}/submissions/{studentId} {
  allow read: if isSchoolMember(schoolId) && (
    isAdmin(schoolId) ||
    (isTeacher(schoolId) && getHomework(homeworkId).teacherId == request.auth.uid) ||
    request.auth.uid == studentId ||
    isParentOf(studentId)
  );
  allow create: if request.auth.uid == studentId &&
    request.resource.data.id == studentId &&  // doc ID = studentId
    request.resource.data.status == 'PENDING';
  allow update: if (request.auth.uid == studentId && field is markDone) ||
                 (isTeacher(schoolId) && getHomework(homeworkId).teacherId == request.auth.uid);
  allow delete: if isAdmin(schoolId) || (isTeacher(schoolId) && getHomework(homeworkId).teacherId == request.auth.uid);
}
```

### 6.3 Key security property
**Document ID = studentId** prevents duplicate submissions at the rules level. No race condition possible.

### 6.4 isParentOfStudentInClass helper
```
function isParentOfStudentInClass(schoolId, classId) {
  let parentData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
  let childrenIds = parentData.childrenIds;  // array of student UIDs
  return exists(/databases/$(database)/documents/schools/$(schoolId)/users/$(childrenIds[0]))
    && get(/databases/$(database)/documents/schools/$(schoolId)/users/$(childrenIds[0])).data.classId == classId;
}
```

**NOTE**: The current bug reads `linkedStudents` (wrong field). The new design uses `childrenIds` (correct field, matches user data).

---

## 7. NOTIFICATION TRIGGERS

| Event | Trigger | Recipients | Template |
|---|---|---|---|
| New homework assigned | Teacher clicks "Assign" | All students in class + their parents | "📚 New {subject} homework: {topic}. Due {date}." |
| Student marks done | Student clicks "Mark Done" | Teacher | "✅ {student} marked {subject} homework as done." |
| Student marks late | Student clicks "Mark Done" after due date | Teacher + Parent | "❌ {student} marked {subject} late (due {date})." |
| Homework overdue | Daily check (8 PM) | Parent (if student hasn't marked done) | "❗ {student} has not completed {subject} homework (due {date})." |
| Due tomorrow | Daily 8 PM check | Student (if PENDING) | "📚 Reminder: {subject} homework due tomorrow." |
| Weekly digest | Sunday 8 PM | Teacher | "📊 Your weekly homework digest: 7 assigned, 89% on-time..." |

---

## 8. UI MOCKUP (Text)

### Student Dashboard — Homework Tab
```
┌─────────────────────────────────────────────────────┐
│  📚 Today's Homework                                │
│                                                     │
│  ┌────────┬────────┬────────┬────────┐              │
│  │ 📚 3   │ ⏰ 5   │ ✅ 8   │ ❌ 1   │              │
│  │ Today  │Pending │ This   │ Late   │              │
│  │        │        │ Week   │        │              │
│  └────────┴────────┴────────┴────────┘              │
│                                                     │
│  [All] [Pending] [Done] [Late] [This Week]          │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ 🟦 MATH    Fractions Practice                  ││
│  │ Mrs. Sharma • Due: Tomorrow                    ││
│  │ Status: ⏳ PENDING              [Mark Done ✅]  ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 🟩 ENGLISH  Chapter 5 Reading                  ││
│  │ Mr. Verma • Due: 2 days ago                    ││
│  │ Status: ❌ LATE                [Mark Done ✅]   ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Teacher Dashboard — Add Homework
```
┌─────────────────────────────────────────────────────┐
│  ← Add Homework                              [×]   │
│                                                     │
│  Class:    [Class 5-A            ▼]                 │
│  Subject:  [Mathematics          ▼]                 │
│                                                     │
│  Topic: *                                             │
│  ┌─────────────────────────────────────────────────┐│
│  │ Chapter 5: Fractions Practice                  ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  Description (optional):                             │
│  ┌─────────────────────────────────────────────────┐│
│  │ Solve problems 1-10 from page 45                ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  Reference Link (optional):                          │
│  ┌─────────────────────────────────────────────────┐│
│  │ https://youtube.com/watch?v=...                 ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  Due Date: * [📅 2026-06-08]                        │
│                                                     │
│  ☐ Save as draft (not visible to students)          │
│                                                     │
│              [Cancel]  [Assign (28 students)]       │
└─────────────────────────────────────────────────────┘
```

---

## 9. EDGE CASES

| Case | Handling |
|---|---|
| Teacher has no classes | Empty state: "You are not assigned to any class. Contact admin." |
| Teacher has 1 class | Pre-select, skip dropdown |
| Teacher has 1 subject | Pre-select, skip dropdown |
| Class has no students | Block assign: "Class has no students. Add students first." |
| Class has 100+ students | Batch create in chunks of 500 (Firestore limit) |
| Student has 5+ subjects | Show all in tabs, color-coded |
| Student has no homework | Empty state: "🎉 All caught up! No homework for today." |
| Parent has 0 children | Empty state: "No children linked to your account." |
| Parent has 3+ children | Dropdown to switch child |
| Student marks done 5 times (bug) | Block at rules level (doc ID = studentId) |
| Two devices same student | Last write wins (acceptable for v1) |
| Network offline (student) | "Mark Done" button shows error: "No internet. Try again." |
| Teacher deletes homework with done submissions | Disabled button: "Cannot delete — students have completed it" |
| Edit homework after students marked done | Allowed, but doesn't reset submissions |
| Time zone | All dates in school's local time (stored as YYYY-MM-DD) |
| Date confusion (e.g., due 2026-06-08 in IST vs UTC) | Store as string "YYYY-MM-DD", no time component |

---

## 10. TEST PLAN

### Manual E2E (4 personas, 1 hour)

1. **Setup**: 1 teacher, 1 class, 5 students, 5 parents (linked), 1 admin
2. **Teacher creates homework**: Math, Fractions, due tomorrow
3. **Verify**: 5 PENDING submissions created, 10 notifications (5 student + 5 parent)
4. **Student A marks done**: Verify status DONE, teacher notification
5. **Student B marks done after due date**: Verify status LATE, parent notification
6. **Parent opens app**: Verify sees 1 done, 1 late, 3 pending
7. **Teacher views submissions**: Verify counts match
8. **Teacher adds note to Student C**: Verify note appears
9. **Teacher edits homework topic**: Verify students see updated topic
10. **Teacher tries to delete homework with done submissions**: Verify blocked
11. **Teacher archives homework**: Verify hidden from student/parent
12. **Daily reminder trigger**: Manually invoke CF, verify 8 PM reminder sent
13. **Weekly digest trigger**: Manually invoke CF, verify teacher digest

### Unit Tests (5 critical paths)
- isLate computation (due date + current date)
- Notification recipient list (per class + per parent)
- Document ID = studentId enforcement
- Permission checks (parent can read, cannot write)
- Stats calculation (pending/done/late counts)

### Security Tests (3 IDOR scenarios)
- Student A tries to mark Student B done → blocked
- Parent A tries to read Parent B's child → blocked
- Teacher A tries to edit Teacher B's homework → blocked

---

## 11. ACCEPTANCE CRITERIA (Definition of Done)

A homework feature is "100% done" when:

- [ ] Teacher can create homework in 3 clicks
- [ ] Student can mark homework done in 1 click
- [ ] Parent can see child's homework progress
- [ ] No file uploads anywhere
- [ ] No numeric grades anywhere
- [ ] No AI grading anywhere
- [ ] No duplicate submissions possible
- [ ] All 4 P0 bugs fixed (parent rule, notifications, stats)
- [ ] All 11 P1 bugs fixed (file size, race, cascade)
- [ ] All security rules pass
- [ ] All test cases pass
- [ ] Mobile-responsive (works on 360px width)
- [ ] Works offline gracefully (clear error, no crash)
- [ ] Average user flow < 30 seconds
- [ ] Documentation updated

---

## 12. BUILD PHASES (8-10 hours)

### Phase 1: Cleanup (1 hour)
- Delete all old homework components
- Delete old service methods
- Delete old types
- Update nav items

### Phase 2: New types + service (2 hours)
- `types/homework.ts` with new minimal types
- `services/homework.ts` rewrite with new methods:
  - `createHomework(schoolId, data, students)` — batch create
  - `markDone(homeworkId, studentId, teacherOverride?)`
  - `subscribeHomeworkForClass(schoolId, classId)` — real-time
  - `subscribeSubmissionsForParent(schoolId, studentId)` — for parent
  - `getCompletionStats(schoolId, classId, startDate, endDate)` — for admin

### Phase 3: Teacher UI (2 hours)
- `components/teacher/CreateHomework.tsx` — 3-step form
- `components/teacher/TeacherHomework.tsx` — list + filter
- `components/teacher/ViewSubmissions.tsx` — modal

### Phase 4: Student UI (1.5 hours)
- `components/student/StudentHomework.tsx` — list + mark done

### Phase 5: Parent UI (1 hour)
- `components/parent/ParentHomework.tsx` — read-only

### Phase 6: Admin UI (30 min)
- `components/admin/HomeworkOverview.tsx` — read-only table

### Phase 7: Firestore rules (1 hour)
- New rules for homework + submissions
- Fix parent rule (use childrenIds)
- Document ID = studentId enforcement

### Phase 8: Notifications (1 hour)
- `services/notificationTriggers.ts` add 4 new triggers
- Test with manual CF invocation

### Phase 9: Tests + verify (1 hour)
- Unit tests for isLate, stats
- Manual E2E with 4 personas
- Build + tsc verify

### Phase 10: Docs (30 min)
- Update HOMEWORK_AUDIT_REPORT.md → SUPERSEDED
- Update CANONICAL_STATUS.md
- Add user guide

---

## 13. OPEN QUESTIONS (For User Audit)

1. **Class name format**: "Class 5-A" or "5-A" or "5A"? → Suggest "5-A" (Indian standard)
2. **Subject list**: Hardcoded (Math, English, Hindi, Science) or from /subjects collection? → Suggest from /subjects (per-school)
3. **Reminder time**: 8 PM IST (suggested) or configurable per school? → 8 PM hardcoded for v1, configurable later
4. **Late grace period**: If student marks done 1 day after due date, LATE or DONE? → Suggest: same day = DONE, after = LATE
5. **Reference link validation**: Allow any URL or whitelist (YouTube, school site)? → Any URL for v1, add warning if not YouTube
6. **Archive vs Delete**: Both available, or only archive (no hard delete)? → Suggest: archive for most, hard delete only if no submissions
7. **Multi-language**: Hindi + English UI? → English for v1, Hindi in v2
8. **Subject color coding**: Auto-assign or teacher pick? → Auto-assign from subject's `color` field

---

**END OF PLAN. Awaiting user audit.**
