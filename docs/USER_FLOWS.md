# MASTER APP USER FLOWS & ROLE LIFECYCLES — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Master User Flow Documentation  

---

## 1. Master User Flow Architecture & State Machine

SmartSchool OS supports 35 distinct user flows across 4 roles (Admin, Teacher, Student, Parent) and 4 cross-cutting system workflows. All user journeys enforce strict multi-tenant data boundaries, zero-password friction reduction, and atomic data persistence.

```
                  ┌────────────────────────────────────────────────────────┐
                  │               AUTHENTICATION STATE MACHINE             │
                  └───────────────────────────┬────────────────────────────┘
                                              │
         ┌──────────────────────────────┬─────┴────────────────┬──────────────────────────────┐
         ▼                              ▼                      ▼                              ▼
┌──────────────────┐           ┌──────────────────┐   ┌──────────────────┐           ┌──────────────────┐
│ Admin Auth Flow  │           │Teacher Auth Flow │   │Student Auth Flow │           │ Parent Auth Flow │
│ (Email+Password) │           │(Email+Password)  │   │(STU-ID + 4-PIN)  │           │(STU-ID + Phone)  │
└────────┬─────────┘           └────────┬─────────┘   └────────┬─────────┘           └────────┬─────────┘
         │                              │                      │                              │
         ▼                              ▼                      ▼                              ▼
┌──────────────────┐           ┌──────────────────┐   ┌──────────────────┐           ┌──────────────────┐
│ Admin Dashboard  │           │Teacher Dashboard │   │Student Dashboard │           │ Multi-Child      │
│ (21 Modules)     │           │(8 Modules)       │   │(9 Modules)       │           │ Parent Dashboard │
└──────────────────┘           └──────────────────┘   └──────────────────┘           └──────────────────┘
```

---

## 2. School Admin Lifecycle Workflows (12 Key Flows)

### Flow A1: School Initial Setup & White-Label Branding
1. **Trigger:** Admin logs into `/admin/dashboard` for the first time.
2. **Step 1:** Navigates to `/admin/settings` -> `INFO` tab to enter school name, affiliation number, address, contact email, and upload school logo.
3. **Step 2:** Switches to `WHITE_LABEL` tab to configure custom domain CNAME and TXT records. Clicks **Verify DNS Records** (triggers 1.5s simulated validation).
4. **Step 3:** Selects primary accent color using interactive color picker. JavaScript immediately executes `document.documentElement.style.setProperty('--brand-primary', color)` for instant dynamic UI preview.
5. **Step 4:** Clicks **Save Branding**. Configurations persist to `/schools/{schoolId}/config/white_label`.

### Flow A2: Student CSV Bulk Import & PIN Generation
1. **Trigger:** Admin needs to onboard an entire school roster.
2. **Step 1:** Navigates to `/admin/students` -> Clicks **Bulk Import CSV**.
3. **Step 2:** Selects local `.csv` file. CSV parser parses `name`, `class`, `section`, `fatherName`, `phone`.
4. **Step 3:** System automatically generates a 4-digit PIN for each student, executes PBKDF2-SHA256 (600,000 iterations) to compute `passwordHash` + `passwordSalt`, and assigns semantic UID `STU-24-{SEQ}`.
5. **Step 4:** Writes records in batches of 450 to `/schools/{schoolId}/students`.
6. **Step 5:** Renders completion modal with download button for credentials summary CSV.

### Flow A3: Faculty Onboarding & WhatsApp Magic Link Dispatch
1. **Trigger:** Admin hires a new teacher.
2. **Step 1:** Navigates to `/admin/teachers` -> Clicks **Add Teacher**.
3. **Step 2:** Fills teacher name, email address, assigned subject, and phone number.
4. **Step 3:** Clicks **Save & Send WhatsApp Invite**.
5. **Step 4:** System generates signed 15-minute magic token (`/auth/magic?token=...`) and calls `sendWhatsAppInvite` Cloud Function.
6. **Step 5:** Teacher receives one-time WhatsApp message containing their `TCH-24-{SEQ}` ID, temporary link, and school portal URL.

### Flow A4: Academic Session & Subject Allocation
1. **Trigger:** Start of a new academic session.
2. **Step 1:** Navigates to `/admin/academic/setup` -> Defines active session (`2026-2027`).
3. **Step 2:** Creates classes (`Class 1` to `Class 12`) and sections (`A`, `B`).
4. **Step 3:** Navigates to `/admin/academic/subjects` -> Tags subjects as `THEORY` or `PRACTICAL` with credit hours and passing thresholds.

### Flow A5: Interactive Timetable Scheduling
1. **Trigger:** Admin configures weekly class schedule.
2. **Step 1:** Navigates to `/admin/academic/timetable` -> Selects Target Class & Section.
3. **Step 2:** Interactive 6-Day (Mon-Sat) x 8-Period grid loads.
4. **Step 3:** Admin drags subject and teacher cards into target period slots.
5. **Step 4:** System evaluates conflict detection engine; if teacher is double-booked, slot flashes Red with alert.
6. **Step 5:** Clicks **Publish Timetable** -> Updates `/schools/{schoolId}/classes/{classId}/timetable`.

### Flow A6: Attendance Command & Biometric Monitoring
1. **Trigger:** Morning school hours.
2. **Step 1:** Admin opens `/admin/attendance` -> Views live school-wide attendance percentage widget.
3. **Step 2:** Hardware biometric devices (ZKTeco/Mantra) POST scan logs to `processBiometricAttendance` Cloud Function.
4. **Step 3:** Real-time listener updates daily attendance matrix.
5. **Step 4:** Admin clicks **Defaulter List** to view students absent for 3 consecutive days and clicks **Export CSV**.

### Flow A7: Fee Collection & PDF Receipt Generation
1. **Trigger:** Parent or student visits fee counter.
2. **Step 1:** Admin navigates to `/admin/fees` -> Searches student UID (`STU-24-001`).
3. **Step 2:** Student fee ledger loads displaying total due, paid amount, and remaining balance.
4. **Step 3:** Admin enters payment amount (supports partial payments) and selects payment mode (Cash/UPI/Cheque).
5. **Step 4:** Clicks **Collect Fee** -> System triggers atomic Firestore `runTransaction`, generates idempotency key (`fee_{feeId}_{timestamp}_{rand}`), updates balance, and appends receipt log.
6. **Step 5:** Clicks **Print Receipt** -> `ReceiptPDF.tsx` renders printable tax receipt with QR code.

### Flow A8: Defaulter Risk Assessment
1. **Trigger:** Monthly fee audit.
2. **Step 1:** Admin opens `/admin/fees` -> Switches to **Defaulter Analysis** tab.
3. **Step 2:** Engine evaluates `dueDate < Today` and computes Risk Tiers:
   - `LOW RISK`: Overdue 1-15 days.
   - `MEDIUM RISK`: Overdue 16-30 days.
   - `HIGH RISK`: Overdue > 30 days.
4. **Step 3:** Admin clicks **Broadcast Reminders** -> Sends internal notification bell alerts to all parents in High Risk cohort.

### Flow A9: Exam Creation & Result Publishing
1. **Trigger:** End-of-term exams.
2. **Step 1:** Admin opens `/admin/exams` -> Schedules `Final Exam 2026` with date boundaries.
3. **Step 2:** Teachers enter subject marks in `/teacher/grades`. Scores save in `DRAFT` state.
4. **Step 3:** Admin opens `/admin/results` -> Reviews class average, pass/fail ratios, and toppers.
5. **Step 4:** Admin clicks **Publish Results** -> Toggles `isPublished: true` in Firestore, making report cards instantly visible in Student and Parent portals.

### Flow A10: Digital Library Cataloging & Overnight Fine Engine
1. **Trigger:** Student returns an overdue book.
2. **Step 1:** Admin opens `/admin/library` -> Selects **Return Book** tab.
3. **Step 2:** Scans book ISBN-13 barcode or enters book ID.
4. **Step 3:** System evaluates issue date vs. return date. If overdue by 4 days at ₹5/day, calculates ₹20 fine.
5. **Step 4:** Fine automatically appends to student's main Fee Ledger under category `LIBRARY_FINE`.
6. **Step 5:** Book status transitions back to `AVAILABLE` and increments stock count.

### Flow A11: Transport Fleet Command & Live GPS
1. **Trigger:** School bus departure time.
2. **Step 1:** Admin opens `/admin/bus-tracking` -> Selects Bus Route (`Route 4 - North City`).
3. **Step 2:** Driver app streams coordinates to `/schools/{schoolId}/buses/{busId}`.
4. **Step 3:** OpenStreetMap Leaflet canvas updates bus marker location in real time.
5. **Step 4:** If bus breaks down, Admin clicks **Emergency Alert** -> Enters delay reason (e.g., "Tire puncture - 20 min delay") -> Broadcasts warning banner to parents on Route 4.

### Flow A12: Ghost Mode Impersonation
1. **Trigger:** Admin needs to debug a parent's reported issue.
2. **Step 1:** Admin opens `/admin/students` -> Clicks **Ghost Mode** icon next to target student.
3. **Step 2:** Client calls `/api/ghost-create` -> Issues 15-minute HMAC token and writes audit log to `/schools/{schoolId}/auditLogs`.
4. **Step 3:** Browser switches portal layout to Parent View, allowing Admin to inspect exactly what the parent sees.
5. **Step 4:** Red banner at top warns "GHOST MODE ACTIVE". Clicking **Exit Ghost Mode** restores Admin session.

---

## 3. Teacher Lifecycle Workflows (6 Key Flows)

### Flow T1: Login & Dashboard Launch
1. Teacher opens portal -> Enters email and password.
2. Client executes PBKDF2-SHA256 hash check and authenticates via Firebase Auth.
3. Teacher Dashboard (`TeacherDashboard.tsx`) opens displaying current period timeline and pending homework evaluations.

### Flow T2: High-Speed FaceGrid Classroom Attendance
1. Teacher enters classroom -> Opens `/teacher/attendance`.
2. `FaceGrid.tsx` renders student photo grid for assigned class.
3. Teacher single-taps student photo -> Turns Emerald Green (`PRESENT`).
4. Teacher double-taps absent student -> Turns Rose Red (`ABSENT`).
5. Clicks **Save Attendance** -> Updates Firestore. (If offline, saves to `localStorage` queue and auto-syncs when online).

### Flow T3: Class Homework Creation
1. Teacher opens `/teacher/homework` -> Clicks **Create Homework**.
2. Selects Class, Subject, Title, Instructions, Due Date, and attaches PDF worksheet.
3. Clicks **Publish Homework** -> Creates document in `/schools/{schoolId}/homework` and pushes in-app Notification Bell alert to class students.

### Flow T4: Submission Evaluation & Marking
1. Teacher opens `/teacher/homework` -> Clicks target assignment.
2. Submission inbox opens showing list of submitted student PDFs.
3. Teacher opens student PDF, reviews work, enters numerical score (e.g., `18/20`) and feedback text ("Great presentation!").
4. Clicks **Submit Feedback** -> Updates student submission record in Firestore.

### Flow T5: Subject Exam Marks Entry
1. Teacher opens `/teacher/grades` -> Selects Exam (`Mid-Term 2026`) and Subject (`Mathematics`).
2. Roster table loads. Teacher inputs marks for each student.
3. System automatically calculates grade (`A1`, `B2`) based on pass boundary rules.
4. Teacher clicks **Save Draft** -> Marks persist in `DRAFT` state for Admin review.

### Flow T6: Class Notice Publication
1. Teacher opens `/teacher/announcements` -> Clicks **New Class Notice**.
2. Enters announcement title ("Bring Geometry Box tomorrow") and targets specific section.
3. Clicks **Post Notice** -> Notice displays immediately on class Student and Parent feeds.

---

## 4. Student Lifecycle Workflows (7 Key Flows)

### Flow S1: Student PIN Login
1. Student opens portal -> Enters Student UID (`STU-24-001`) and 4-Digit PIN.
2. System hashes PIN via PBKDF2-SHA256 (600k iterations) and verifies match against `passwordHash`.
3. Student Dashboard (`StudentDashboard.tsx`) opens.

### Flow S2: Daily Timetable Inspection
1. Student opens `/student/timetable`.
2. Interactive 6-day grid displays period times, subject names, room numbers, and teacher names. Current ongoing period is highlighted with animated glow border.

### Flow S3: Homework Submission Upload
1. Student opens `/student/homework` -> Selects pending assignment.
2. Reads instructions and clicks **Upload Submission**.
3. Selects image or PDF from device -> File uploads to Firebase Storage (`/schools/{schoolId}/homework_submissions/`).
4. Submission status updates to `SUBMITTED` with upload timestamp.

### Flow S4: Fee Ledger & Receipt Download
1. Student opens `/student/fees`.
2. Inspects total tuition fee, paid amount, and remaining balance.
3. Clicks **Download Receipt** next to a completed payment -> Client generates printable PDF receipt with QR code.

### Flow S5: Report Card Review
1. Student opens `/student/academics`.
2. Selects published exam term (`Final Term 2026`).
3. Scores, grades, class average, and progress trend charts display.

### Flow S6: Digital Library Search & Reservation
1. Student opens `/student/library`.
2. Searches book title ("Physics Concepts Volume 1").
3. Views availability status, rack location (`Rack B-4`), and clicks **Reserve Book**.

### Flow S7: Real-Time Bus GPS Tracking
1. Student opens `/student/transport`.
2. Leaflet map renders bus route polyline and live bus position marker.
3. Top badge computes distance (km) and Haversine ETA ("Arriving at your stop in 8 mins").

---

## 5. Parent Lifecycle Workflows (6 Key Flows)

### Flow P1: Parent Authentication & Child Linkage
1. Parent opens portal -> Enters Child's Student ID (`STU-24-001`) and registered Phone Number.
2. System verifies parent phone binding in `/schools/{schoolId}/students/STU-24-001`.
3. Parent Portal (`ParentPortal.tsx`) opens.

### Flow P2: Single-Login Multi-Child Switcher
1. Parent has 2 children enrolled in the school.
2. Parent clicks top bar **Child Switcher Dropdown** -> Selects Child 2 (`Riya Sharma - Class 4B`).
3. Application context updates instantly, loading Child 2's fees, attendance, and grades without logging out or page refresh.

### Flow P3: Multi-Child Fee Payment & UPI Checkout
1. Parent opens `/parent/fees` -> Reviews outstanding balance for selected child.
2. Clicks **Pay Online via UPI** -> Launches payment sandbox modal (`PaymentSandbox.tsx`).
3. Completes UPI payment -> Payment gateway triggers server-side signature verification -> Fee ledger updates atomically and displays tax receipt.

### Flow P4: Real-Time Attendance Check-in Alerts
1. Teacher marks child `ABSENT` in class.
2. Firestore `onWrite` trigger creates notification document in parent's subcollection.
3. Parent's top-bar **Notification Bell** flashes red badge and displays alert: *"Absence Alert: Rahul Sharma was marked ABSENT today."*

### Flow P5: Exam Report Card & Sensitive Grade Review
1. Parent opens `/parent/results` -> Selects published report card.
2. Inspects subject marks, grades, and teacher remarks.
3. **Sensitive Rank Policy:** If child's rank is in bottom 10% of class, exact numeric rank is hidden to prevent stress, displaying class average comparison instead.

### Flow P6: Live Bus GPS & Delay Banners
1. Parent opens `/parent/transport` in afternoon.
2. Leaflet map displays live school bus location moving towards pickup stop with Haversine ETA countdown.
3. If bus is delayed, red notification banner displays: *"Route 4 Delayed by 15 mins due to heavy traffic."*

---

## 6. Cross-Cutting Workflows (4 Key Flows)

### Flow X1: One-Time Magic Link Onboarding (`ForcePasswordChange.tsx`)
1. User clicks WhatsApp magic invite link (`/auth/magic?token=...`).
2. Client validates token signature and expires status.
3. `ForcePasswordChange.tsx` modal opens requiring user to enter a new secure password/PIN.
4. Client executes PBKDF2-SHA256 (600k iterations), updates `passwordHash` and `passwordSalt`, and logs user into portal.

### Flow X2: Self-Service Password Reset (`/auth/reset`)
1. User clicks **Forgot Password** on login screen -> Enters registered ID.
2. System dispatches reset token link via WhatsApp / Email.
3. User opens link -> Sets new credential -> Firestore updates canonical hash fields.

### Flow X3: Offline Attendance Recovery
1. Teacher marks attendance while offline.
2. `useFirestore.ts` stores records in `localStorage`.
3. Service worker listens for `online` event -> Automatically executes `writeBatch` to sync queued attendance to Firestore.

### Flow X4: Maintenance Mode Lockdown
1. Admin toggles **Maintenance Mode ON** in SYSTEM settings.
2. Firestore updates `/schools/{schoolId}/config/maintenance` -> `enabled: true`.
3. All active Non-Admin users are redirected to `/maintenance` with custom banner message.
