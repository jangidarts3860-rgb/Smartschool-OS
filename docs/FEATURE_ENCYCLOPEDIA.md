# MASTER FEATURE ENCYLOPEDIA — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Exhaustive Feature Encyclopedia  

---

## 1. Executive Summary

This document is the exhaustive feature encyclopedia for **SmartSchool OS**. It details every single operational module, interface component, background engine, settings tab, and edge-case handling across all 4 system roles (Admin, Teacher, Student, Parent).

```
SmartSchool OS Core Feature Ecosystem
│
├── 🏛️ School Admin Center (21 Operational Modules + 9-Tab Settings Hub)
├── 👩‍🏫 Teacher Operations Portal (8 Classroom & Grading Modules)
├── 🎓 Student Experience Portal (9 Academic & Self-Management Modules)
├── 👨‍👩‍👧 Parent Multi-Child Portal (8 Family & Live Tracking Modules)
└── ⚙️ Shared Core Engines (18 Reusable Component Widgets & Utilities)
```

---

## 2. School Admin Center (21 Modules & 9-Tab Settings Hub)

### 2.1 Admin Operational Modules

#### 1. Dashboard Overview (`Dashboard.tsx`)
- **Real-Time KPIs:** Live total revenue, today's attendance %, active student count, active teacher count, pending alerts.
- **Financial Stream Widget:** Recent transactions ticker powered by Firestore `onSnapshot`.
- **System Health Card:** Firebase connection status, active session count, quick navigation triggers.

#### 2. User Management (`UserManagement.tsx`)
- **Roster Controls:** View, filter, search, and edit Student, Teacher, and Parent accounts.
- **CSV Bulk Import:** Upload bulk CSV file. Automatically parses columns, generates 4-digit PINs for students, computes cryptographic password hashes (`passwordHash` + `passwordSalt`), and writes atomic batches.
- **Ghost Mode Trigger:** Allows Admins to impersonate any user's view for 15 minutes with audit logging.
- **Credential Reset:** Instantly reset passwords or PINs and issue one-time WhatsApp invite links.

#### 3. Academic Setup (`AcademicSetup.tsx`)
- **Session Management:** Configure active academic year (e.g., `2026-2027`).
- **Class & Section Mapping:** Define classes (Nursery to 12th) and assign sections (`A`, `B`, `C`).
- **Subject Allocation:** Assign core and elective subjects to classes with pass marks and credit hours.

#### 4. Attendance Command Center (`AttendanceManagement.tsx`)
- **School-Wide Matrix:** Daily check-in stats across all classes and sections.
- **Defaulter Reporting:** Filter students with attendance below threshold (e.g., < 75%).
- **CSV Data Export:** Export daily or monthly attendance records to CSV.
- **Biometric Sync Status:** Monitor connected hardware devices (ZKTeco/Mantra) and view raw scan logs.

#### 5. Financial Ledger Engine (`FeeManagement.tsx`)
- **Fee Configuration:** Setup tuition, transport, admission, examination, and computer fee structures.
- **Atomic Partial Collection:** Collect fee payments with `runTransaction` atomic safety. Support partial payments with real-time balance computation.
- **GST Compliance:** Toggle GST calculations, configure GSTIN, and generate tax invoices.
- **Downloadable PDF Receipts:** One-click client-side PDF receipt generation (`ReceiptPDF.tsx`) with QR validation code.
- **Defaulter Risk Engine:** Categorizes late fee payers into `LOW RISK` (1-15 days), `MEDIUM RISK` (16-30 days), and `HIGH RISK` (> 30 days).
- **Bulk Invoicing:** Generate monthly invoices for entire classes in a single click.

#### 6. Exam Management (`ExamManagement.tsx`)
- **Exam Scheduling:** Define exam names (Unit Test 1, Mid-Term, Final), date ranges, and class targets.
- **Marking Scheme:** Set maximum marks, passing cutoffs, and weightage percentages.

#### 7. Result Management (`ResultManagement.tsx`)
- **Marks Entry Review:** Review marks entered by class teachers.
- **Draft vs. Published State:** Keep results in `DRAFT` state until verified; publishing makes scores instantly visible to Students and Parents.
- **Rank Generation:** Calculate class ranks, percentiles, and subject toppers automatically.

#### 8. Report Card Generator (`ReportCardGenerator.tsx`)
- **Template Layout Builder:** Customize report card headers, grading scales, and principal signature lines.
- **Bulk PDF Export:** Render and download printable term report cards for an entire section.

#### 9. Reports & Analytics Center (`ReportsCenter.tsx`)
- **Recharts Financial Graphs:** Revenue collection curves, fee defaulter distribution, monthly cashflow.
- **Attendance Heatmaps:** Day-of-week attendance trends, holiday impact analysis.
- **Cohort Defaulters:** Filter defaulters by risk category and class.

#### 10. Library Management Center (`LibraryManagement.tsx`)
- **7-Tab Workspace:** Catalog, Issue Book, Return Book, Active Borrows, Fine Ledger, ISBN Search, Rack Locations.
- **ISBN Uniqueness:** Validates ISBN-13 format and enforces unique book entries.
- **Overnight Fine Engine:** Automatically calculates daily overdue fines and appends them to the student's main Fee Ledger.
- **Cascade Delete Protection:** Prevents book deletion if active borrow records exist.

#### 11. Notice Board (`NoticeBoard.tsx`)
- **Announcement Publisher:** Create circulars with title, content, priority flag, and attachment links.
- **Audience Filter:** Target specific audiences via `visibleTo` array (`ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`).
- **Archive & Pin Controls:** Pin urgent notices to the top; archive expired circulars.

#### 12. Notification Center (`NotificationCenter.tsx`)
- **In-App Broadcast:** Send instant push alerts to targeted user groups.
- **Delivery Audit Log:** View dispatch timestamps and read receipt counts.

#### 13. Class Management (`ClassManagement.tsx`)
- **Class Teacher Assignment:** Bind primary class teachers to specific sections.
- **Room Allocation:** Assign physical classroom numbers and student capacity limits.

#### 14. Subject Management (`SubjectManagement.tsx`)
- **Theory vs. Practical Tagging:** Differentiate subject types and practical exam rules.
- **Credit Hour Weightage:** Assign academic credit values per subject.

#### 15. Teacher Management (`TeacherManagement.tsx`)
- **Faculty Directory:** Searchable listing of all employed teachers, contact numbers, and subject assignments.
- **Hiring Records:** Store joining date, qualification degrees, and employment status.

#### 16. Teacher Profile (`TeacherProfile.tsx`)
- **Comprehensive Dossier:** Detailed view of individual teacher timetable load, class teacher responsibilities, and account credentials.

#### 17. Timetable Studio (`TimetableManagement.tsx`)
- **6-Day x 8-Period Grid:** Interactive timetable builder for Monday through Saturday.
- **Conflict Detection Engine:** Flags double-booking of teachers or rooms in real time.

#### 18. Transport Management (`TransportManagement.tsx`)
- **Fleet Roster:** Vehicle management (Bus numbers, license numbers, driver phone bindings).
- **Route Creator:** Define route stops, pickup timings, and monthly bus fee rates.
- **Live GPS Monitor:** View real-time vehicle movement on OpenStreetMap canvas.
- **Emergency Delay Banner:** Broadcast emergency delay alerts to parents on affected routes.

#### 19. WhatsApp Invite Center (`WhatsAppCenter.tsx`)
- **Magic Link Dispatcher:** Send one-time WhatsApp welcome messages with personalized magic access links.
- **Invite Counter:** Track sent vs. pending initial onboarding invitations.

#### 20. Cerebro AI Dashboard (`CerebroDashboard.tsx`)
- **Predictive Insights:** Aggregates class attendance and score trends to calculate fail-risk scores.
- **BYOA API Monitor:** Monitor key pool health, token usage, and response latencies.

#### 21. Student ID Card Studio (`StudentIDCard.tsx`)
- **CR80 Standard Print:** Generate printable digital ID cards with encrypted QR codes.
- **NFC Tap Simulator:** Interactive holographic modal simulating NFC card scanning and student identification.

---

### 2.2 Admin Settings Hub (`SchoolSettings.tsx` - 9 Tabs)

1. **`INFO` (School Profile):** School name, principal name, affiliation code, address, email, phone, logo upload.
2. **`WHITE_LABEL` (Branding):** Custom domain DNS validator (CNAME + TXT records), dynamic accent color picker (`--brand-primary`), custom app name, favicon, and login background uploader.
3. **`ERP` (Cutoffs & Passing):** Attendance cutoff time, late entry grace period, passing threshold %, auto-absence notification toggle.
4. **`FINANCE` (Payment Gateways):** GST toggle, GSTIN, gateway selection (Razorpay / Stripe / Dual), API keys, currency formatting (`en-IN` ₹).
5. **`HARDWARE` (Biometrics & NFC):** Device IP and port configuration (ZKTeco/Mantra), connection ping radar, NFC reader overlay setup.
6. **`COMMS` (Invitations):** WhatsApp invite master toggle, auto-invite on creation, invitation template selection.
7. **`CALENDAR` (Holidays):** School holiday CRUD, holiday type tags (National, School, Festival), attendance locking toggles.
8. **`SYSTEM` (AI Key Pools):** Password-masked Gemini API Key pool manager with model selector (`gemini-2.0-flash`, `gemini-1.5-pro`), max tokens, and temperature sliders.
9. **`MAINTENANCE` (Security & Backups):** Master maintenance mode toggle with custom message, 2FA enforcement, auto-logout session timeout slider (5–120 mins), and Firestore manual snapshot backup trigger.

---

## 3. Teacher Operations Portal (8 Modules)

1. **Teacher Dashboard (`TeacherDashboard.tsx`):** Today's period schedule, quick attendance trigger, pending homework reviews.
2. **FaceGrid Attendance (`AttendanceManagement.tsx`):** Visual photo grid. Single tap = PRESENT (Emerald), Double tap = ABSENT (Rose). Full offline support with automatic queue sync on reconnect.
3. **Homework Creator (`CreateHomework.tsx`):** Assignment publication with title, description, due date, and attachment files.
4. **Homework Evaluator (`TeacherHomework.tsx`):** Student submission inbox, digital feedback, marks entry.
5. **Student Manager (`StudentManager.tsx`):** Class student roster, parent contact quick-dial, individual student academic overview.
6. **Grade Book (`TeacherGrades.tsx`):** Exam marks entry for assigned subjects, auto-grade calculation, draft submission to Admin.
7. **Teacher Library (`TeacherLibrary.tsx`):** Digital catalog search, book reservation.
8. **Teacher Notices (`TeacherNotices.tsx`):** Staff announcements view and class notice publishing.

---

## 4. Student Experience Portal (9 Modules)

1. **Student Dashboard (`StudentDashboard.tsx`):** Next class period, pending homework count, attendance percentage badge.
2. **Attendance Tracker (`StudentAttendance.tsx`):** Interactive monthly attendance calendar showing daily status and overall percentage.
3. **Homework Portal (`StudentHomework.tsx`):** Active assignments list, file submission uploader, teacher feedback portal.
4. **Fee Ledger (`StudentFees.tsx`):** Fee breakdown, due dates, paid transactions, downloadable PDF receipts.
5. **Timetable View (`StudentTimetable.tsx`):** Weekly 6-day timetable grid with period times and subject teachers.
6. **Results & Marks (`StudentResult.tsx`):** Published exam report cards, subject breakdown, progress graphs.
7. **Digital Library (`StudentLibrary.tsx`):** Currently borrowed books, return due dates, accumulated fines, catalog search.
8. **Notice Feed (`StudentNotices.tsx`):** Filtered circulars and event announcements.
9. **Live Bus Tracker (`StudentTransport.tsx`):** Real-time map displaying assigned bus route, current bus location, and stop arrival ETA.

---

## 5. Parent Multi-Child Portal (8 Modules)

1. **Multi-Child Dashboard (`ParentPortal.tsx`):** Top bar child switcher dropdown, consolidated stats for selected child, urgent school alerts.
2. **Consolidated Fee Ledger (`ParentFees.tsx`):** Unified fee view for all enrolled children, online payment gateway trigger (Razorpay/UPI), downloadable tax receipts.
3. **Attendance Monitor (`ParentAttendance.tsx`):** Real-time daily check-in notifications and monthly attendance breakdown per child.
4. **Homework Monitor (`ParentHomework.tsx`):** Daily homework overview and completion status.
5. **Exam Results & Reports (`ParentResults.tsx`):** Published report cards, term progress comparisons. (Sensitive handling: bottom 10% class ranks hidden to prevent parental pressure).
6. **Live Bus GPS Tracker (`ParentTransport.tsx`):** Real-time Leaflet map tracking the school bus, Haversine formula ETA countdown to child's stop, delay notifications.
7. **Library Record (`ParentLibrary.tsx`):** Borrowed books monitoring and fine alerts.
8. **School Notices (`ParentNotices.tsx`):** Official announcements, holiday notifications, and exam schedules.

---

## 6. Shared Core Engines & Utility Widgets (18 Components)

1. `CerebroAssistant.tsx`: Floating AI Assistant Widget for quick natural language queries.
2. `CreateNoticeModal.tsx`: Modal for creating announcements with role-based audience filters.
3. `ErrorBoundary.tsx`: Production error boundary with user-facing message and module trace sanitization.
4. `FaceGrid.tsx`: Interactive student photo grid with double-tap gesture logic.
5. `GoldTrustBadge.tsx`: Security and trust verification badge.
6. `LiveMap.tsx`: Leaflet OpenStreetMap vehicle tracking canvas.
7. `MonthlyCalendarGrid.tsx`: Reusable attendance monthly calendar view.
8. `NoticeCard.tsx`: Announcement card widget with archive & pin options.
9. `NoticeStates.tsx`: Empty/Loading/Error/Partial notice state handlers.
10. `NotificationBell.tsx`: Top bar notification drawer & real-time badge.
11. `PWAInstallBanner.tsx`: Custom PWA installation prompt banner.
12. `PaymentSandbox.tsx`: UPI & Card payment simulation sandbox.
13. `PlaceholderPage.tsx`: Fallback view for under-construction routes.
14. `ReadStatsModal.tsx`: Notice read receipt modal showing who viewed circulars.
15. `ReceiptPDF.tsx`: Printable PDF receipt document renderer.
16. `Skeleton.tsx`: Reusable skeleton loading placeholders.
17. `StudentProfile.tsx`: Comprehensive 360-degree student profile modal.
18. `UsageMonitor.tsx`: Real-time Firestore document read/write quota monitor.
