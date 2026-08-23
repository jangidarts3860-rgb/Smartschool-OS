# 🏫 PRODUCT REQUIREMENTS DOCUMENT (PRD) — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved for 1-School Pilot & Enterprise SaaS Architecture  

---

## 1. Executive Summary & Product Vision

### 1.1 Objective & Target Market
**SmartSchool OS** is an enterprise-grade B2B2C Multi-Tenant Institutional Operating System (ERP) designed specifically for Indian K-12 private schools. The platform unifies administrative operations, financial ledger management, academic tracking, biometric attendance, AI-driven learning insights, and parent engagement into a single, high-performance Progressive Web Application (PWA).

- **Target Market:** Indian K-12 Private Schools (Tier-1 to Tier-3 cities).
- **Primary Stakeholders (B2B):** School Owners, Principals, Administrators, Financial Officers, Class Teachers.
- **Secondary End-Users (B2C):** Students and Parents.
- **Value Proposition:** Reduces administrative overhead by 70%, guarantees zero data leakage across schools, eliminates parent login friction, and operates on zero-cost infrastructure during initial launch.

### 1.2 The Core Moat: Zero-Friction Architecture
Traditional school ERPs fail in Indian private schools due to heavy app downloads (100MB+), complex password reset cycles for non-tech-savvy parents, and fragmented messaging tools. SmartSchool OS solves this with a Zero-Friction Funnel:

```
[Legacy School ERP Drop-off Funnel]
App Store Search ──> 100MB+ Download ──> OTP / Password Fatigue ──> Login Failure ──> Low Adoption

[SmartSchool OS Zero-Friction Funnel]
Portal Link / QR ──> Instant PWA Shortcut ──> Zero-Password Magic Link / Credential ──> High Daily Engagement
```

### 1.3 Strict Communication Policy (WhatsApp Invite Only)
To control operational expenditures and prevent spam, SmartSchool OS enforces a strict **Notification-Bell-First** policy:

- ❌ **NO Daily WhatsApp / SMS Alerts:** Attendance check-in/out, daily notices, homework alerts, and exam results do **NOT** send SMS or WhatsApp messages.
- 📬 **In-App Notification Bell:** All daily communication and real-time alerts are delivered strictly inside the PWA via real-time Firestore listeners and the top-bar Notification Bell.
- 🔑 **One-Time WhatsApp Invite:** WhatsApp / Email is **ONLY** used ONCE to send the initial Welcome/Invite Magic Link to Teachers, Students, and Parents upon onboarding. This message contains their structured semantic ID, initial credentials, and tenant access link.

---

## 2. Master System Architecture & Infrastructure

SmartSchool OS is built on a serverless, event-driven architecture using client-side compute for maximum rendering speed and Firebase serverless services for secure multi-tenant backends.

```
                                  ┌─────────────────────────────────────────┐
                                  │      Root Router: /users Collection     │
                                  │   (Identity Routing & Tenant Mapper)    │
                                  └────────────────────┬────────────────────┘
                                                       │
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │   Multi-Tenant Subtree: /schools/{id}   │
                                  │ (Strict IDOR Rules & Tenant Isolation)  │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌──────────────────────────────┬──────────────┴───────────────┬──────────────────────────────┐
         ▼                              ▼                             ▼                              ▼
┌──────────────────┐           ┌──────────────────┐          ┌──────────────────┐           ┌──────────────────┐
│ Admin Dashboard  │           │ Teacher Dashboard│          │ Student Dashboard│           │  Parent Portal   │
│ (21 Modules +    │           │ (8 Modules +     │          │ (9 Modules +     │           │ (8 Modules +     │
│ 9-Tab Settings)  │           │ FaceGrid)        │          │ PWA View)        │           │ Multi-Child)     │
└──────────────────┘           └──────────────────┘          └──────────────────┘           └──────────────────┘
```

### 2.1 Technology Stack Matrix

| Architectural Layer | Component Technology | Technical Justification |
|---|---|---|
| **Frontend Core** | React 18 + TypeScript (Strict) | High-performance single page application with 100% compile-time type safety. |
| **Build & Tooling** | Vite + ESBuild | Ultra-fast HMR and optimized production bundling (~1m 14s build time). |
| **Styling System** | Vanilla CSS + Tailwind CSS + Glassmorphism | Custom design tokens, dark/light themes, and responsive micro-interactions. |
| **Database Core** | Firebase Firestore | Real-time bi-directional synchronization (`onSnapshot`) & multi-tenant security rules. |
| **Authentication** | PBKDF2-SHA256 Client-Side + Firebase Auth | OWASP 2023 baseline hashing (600,000 iterations + per-user random salts). |
| **AI Neural Engine** | Google Gemini API (BYOA Key Pool) | Serverless proxy (`api/cerebro-ask.ts`) with key rotation & cost controls. |
| **File Storage & PDF** | Firebase Storage + jsPDF / html2canvas | Secure tenant asset storage and client-side CR80 ID Card & PDF receipt generation. |
| **PWA & Offline Engine**| Workbox Service Worker | Instant offline attendance marking, caching 80+ static assets for instant load. |
| **Transport & Maps** | Leaflet + OpenStreetMap | Real-time bus GPS polyline rendering without paid Google Maps API keys. |

---

## 3. Identity & Access Management (IAM)

### 3.1 Structured Semantic ID Matrix
End-users are never exposed to raw database UUIDs. All accounts utilize structured, human-readable semantic identifiers:

| Role | Semantic ID Format | Example | Generation Rule |
|---|---|---|---|
| **Student** | `STU-{YY}-{SEQ}` | `STU-24-001` | Year of enrollment + 3-digit sequential number per school tenant. |
| **Teacher** | `TCH-{YY}-{SEQ}` | `TCH-24-05` | Year of hiring + 2-digit sequential number per school tenant. |
| **School Tenant** | `SCH-{5_RANDOM}` | `SCH-A7X9P` | Unique 5-character alphanumeric tenant identifier. |
| **Parent** | Linked via Phone Number | `+919876543210` | Mapped dynamically to one or more `STU-*` student records. |

### 3.2 Dual Authentication Flow Matrix

SmartSchool OS supports role-tailored login interfaces while storing all credentials under canonical database fields (`passwordHash` and `passwordSalt` in the standard format `pbkdf2$600000$salt$hash`):

| User Role | Primary Login Credential | Secondary Login Credential | Hashing & Verification Contract |
|---|---|---|---|
| **School Admin** | Registered Email Address | Secret Password | PBKDF2-SHA256 (600k iterations, random salt) |
| **Teacher** | Registered Email Address | Secret Password | PBKDF2-SHA256 (600k iterations, random salt) |
| **Student** | Student UID (`STU-*`) | 4-Digit PIN | PBKDF2-SHA256 (PIN hashed via 600k iterations) |
| **Parent** | Linked Student ID (`STU-*`) | Parent Phone (Last 4 Digits) / Magic Link | PBKDF2-SHA256 (Phone suffix hashed via 600k iterations) |

### 3.3 Zero-Password Magic Link Onboarding & Ghost Mode
- **Invite Onboarding:** When an Admin creates a new user, the system generates a signed, time-limited magic token (`/auth/magic?token=...`). The user clicks the link, confirms their identity, and sets their credential without manual data entry.
- **Ghost Mode (Impersonation):** Admins can temporarily inspect the portal as a Teacher, Student, or Parent via `ghostMode.ts`. Every impersonation event generates an immutable audit record in `/schools/{schoolId}/auditLogs`.

---

## 4. Master Module Specifications Across All 4 Roles

### 4.1 School Admin Operations Center (21 Modules & 9-Tab Settings Hub)

The Admin Portal serves as the institutional control tower:

#### Core Administrative Modules:
1. **Dashboard Overview (`Dashboard.tsx`):** Real-time financial counters, attendance rates, fee collection aggregates, active student/teacher counts.
2. **User Management (`UserManagement.tsx`):** Full CRUD for Students, Teachers, and Parents; CSV bulk import with automatic PIN generation; Ghost Mode bridge trigger.
3. **Academic Setup (`AcademicSetup.tsx`):** Academic sessions, classes (Nursery to 12th), section creation, subject allocations.
4. **Attendance Management (`AttendanceManagement.tsx`):** School-wide attendance matrix, daily defaulters, manual attendance correction, biometric device sync status.
5. **Fee Management Ledger (`FeeManagement.tsx`):** Category setup (Tuition, Transport, Admission), GST toggles, atomic partial payment collection, PDF receipt generation, defaulter risk scoring (LOW/MEDIUM/HIGH).
6. **Exam Management (`ExamManagement.tsx`):** Exam creation (Unit Test, Mid-Term, Final), marking schemes, pass thresholds.
7. **Result Management (`ResultManagement.tsx`):** Marks entry review, Draft vs. Published state management, rank generation, class average calculations.
8. **Report Card Generator (`ReportCardGenerator.tsx`):** Dynamic template builder for generating printable term report cards (PDF).
9. **Reports Center (`ReportsCenter.tsx`):** Recharts-powered analytics for fee collection trends, attendance heatmaps, and academic performance cohorts.
10. **Library Management (`LibraryManagement.tsx`):** 7-tab cataloging, ISBN uniqueness check, book allocation, return tracking, overnight fine calculation.
11. **Notice Board (`NoticeBoard.tsx`):** Circular publication with role-based audience filters (`ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`).
12. **Notification Center (`NotificationCenter.tsx`):** In-app notification broadcast, push history, delivery verification.
13. **Class Management (`ClassManagement.tsx`):** Class teacher assignments, room allocation, student capacity limits.
14. **Subject Management (`SubjectManagement.tsx`):** Theory vs. Practical subject tagging, credit hour assignments.
15. **Teacher Management (`TeacherManagement.tsx`):** Faculty directory, qualification records, payroll metadata (purged UI, active info).
16. **Teacher Profile (`TeacherProfile.tsx`):** Individual teacher dossier, assigned subjects, timetable load.
17. **Timetable Studio (`TimetableManagement.tsx`):** 6-day (Mon-Sat) x 8-period interactive drag-and-drop schedule builder with teacher conflict detection.
18. **Transport Management (`TransportManagement.tsx`):** Fleet vehicle roster, route creation, driver phone binding, live map monitoring.
19. **WhatsApp Invite Center (`WhatsAppCenter.tsx`):** Invite link generator, status tracking, manual invite resend.
20. **Cerebro AI Dashboard (`CerebroDashboard.tsx`):** School-wide predictive AI analytics, fail-risk predictions, attendance-performance correlation.
21. **Student ID Card Studio (`StudentIDCard.tsx`):** CR80 standard printable ID cards with encrypted QR codes and NFC card scanner simulation overlay.

#### Admin Settings Hub (`SchoolSettings.tsx` - 9 Tabs):
- `INFO`: Institutional identity (Name, Affiliation Code, Principal Name, Logo Upload, Address, Contact Email/Phone).
- `WHITE_LABEL`: Custom domain DNS validator (CNAME + TXT records), dynamic CSS accent color picker (`--primary`), app name, favicon, and login background uploader.
- `ERP`: Attendance cutoff times, late entry grace periods, passing thresholds, auto-absence notification toggles.
- `FINANCE`: GST percentage, payment gateway switches (Razorpay / Stripe / Dual), API key management, currency formatting (`en-IN` ₹).
- `HARDWARE`: ZKTeco/Mantra biometric device IP and port binding, connection test pinging, NFC card reader setup.
- `COMMS`: WhatsApp invite master toggle, auto-send on user registration, invitation template editor.
- `CALENDAR`: School holiday CRUD with date pickers, holiday type tags (National, School, Festival), and attendance locking toggles.
- `SYSTEM`: BYOA Gemini API Key Pool manager with model selection (`gemini-2.0-flash`, `gemini-1.5-pro`), max tokens, and temperature sliders.
- `MAINTENANCE`: Master maintenance mode toggle with custom warning message, 2FA enforcement, auto-logout session timeout slider (5–120 mins), and Firestore manual snapshot backup trigger.

---

### 4.2 Teacher Operations Portal (8 Modules)

Engineered for ultra-fast, zero-friction operation on mobile devices during class hours:

1. **Teacher Dashboard (`TeacherDashboard.tsx`):** Daily period schedule, quick attendance shortcut, pending homework count.
2. **FaceGrid Attendance (`AttendanceManagement.tsx`):** High-speed visual photo grid of students. Tap once = PRESENT (Green), Tap twice = ABSENT (Red). Full offline support with automatic background sync when internet restores.
3. **Homework Creator (`CreateHomework.tsx`):** Assignment creation with attachments, class/section targeting, submission due dates.
4. **Homework Manager (`TeacherHomework.tsx`):** Student submission inbox, digital feedback, marks assignment.
5. **Student Manager (`StudentManager.tsx`):** Class student roster, parent contact quick-dial, individual student academic overview.
6. **Grade Book (`TeacherGrades.tsx`):** Marks entry for assigned subjects, auto-grade calculation, draft submission to Admin.
7. **Teacher Library (`TeacherLibrary.tsx`):** Digital catalog search, book reservation.
8. **Teacher Notices (`TeacherNotices.tsx`):** Staff announcements view and class notice publishing.

---

### 4.3 Student Dashboard & Experience (9 Modules)

Personalized academic portal for student self-management:

1. **Student Dashboard (`StudentDashboard.tsx`):** Current period indicator, pending homework alerts, attendance badge.
2. **Attendance Tracker (`StudentAttendance.tsx`):** Interactive monthly attendance calendar showing daily status and total percentage.
3. **Homework Portal (`StudentHomework.tsx`):** Assignment list, file submission uploader, teacher remarks view.
4. **Fee Ledger (`StudentFees.tsx`):** Fee breakdown, due dates, paid transactions, downloadable PDF payment receipts.
5. **Timetable View (`StudentTimetable.tsx`):** Weekly 6-day timetable grid with period times and subject teachers.
6. **Results & Marks (`StudentResult.tsx`):** Published exam report cards, subject-wise marks, progress graphs.
7. **Digital Library (`StudentLibrary.tsx`):** Currently borrowed books, return due dates, accumulated fines, catalog search.
8. **Notice Feed (`StudentNotices.tsx`):** Filtered circulars and event announcements.
9. **Live Bus Tracker (`StudentTransport.tsx`):** Real-time map displaying assigned bus route, current bus location, and stop arrival ETA.

---

### 4.4 Parent Multi-Child Portal (8 Modules)

Consolidated family portal supporting single-login multi-child switching:

1. **Multi-Child Dashboard (`ParentPortal.tsx`):** Top bar child switcher dropdown, consolidated stats for selected child, urgent school alerts.
2. **Consolidated Fee Ledger (`ParentFees.tsx`):** Unified fee view for all enrolled children, online payment gateway trigger (Razorpay/UPI), downloadable tax receipts.
3. **Attendance Monitor (`ParentAttendance.tsx`):** Real-time daily check-in notifications and monthly attendance breakdown per child.
4. **Homework Monitor (`ParentHomework.tsx`):** Daily homework overview and completion status.
5. **Exam Results & Reports (`ParentResults.tsx`):** Published report cards, term progress comparisons. (Sensitive handling: bottom 10% class ranks hidden to prevent parental pressure).
6. **Live Bus GPS Tracker (`ParentTransport.tsx`):** Real-time Leaflet map tracking the school bus, Haversine formula ETA countdown to child's stop, delay notifications.
7. **Library Record (`ParentLibrary.tsx`):** Borrowed books monitoring and fine alerts.
8. **School Notices (`ParentNotices.tsx`):** Official announcements, holiday notifications, and exam schedules.

---

## 5. Core Business Engines & Technical Workflows

### 5.1 Financial Ledger & Defaulter Engine
- **Atomic Concurrency:** Fee collection utilizes Firestore `runTransaction` to execute balance deduction, receipt generation, and ledger updates atomically.
- **Idempotency Keys:** Every transaction generates an idempotency key (`fee_{feeId}_{timestamp}_{random}`) to prevent duplicate payments.
- **Defaulter Risk Engine:** Scans student ledgers where `dueDate < Today` and `status != 'PAID'`, categorizing students into Risk Tiers:
  - **LOW RISK:** Overdue by 1–15 days.
  - **MEDIUM RISK:** Overdue by 16–30 days.
  - **HIGH RISK:** Overdue by > 30 days (Triggers Admin review flag).

### 5.2 Deep Attendance Engine
- **FaceGrid Gesture Component:** Single tap toggles Present, double tap toggles Absent. Eliminates select dropdown lag.
- **Biometric Device Proxy:** External hardware (ZKTeco/Mantra) POSTs scan records to Cloud Function `functions/src/attendance.ts`.
- **In-App Absentee Notification:** Firestore `onWrite` listener triggers an automatic internal notification to the parent account when a student status transitions to `ABSENT`.

### 5.3 Cerebro AI Neural Engine
- **Bring Your Own API (BYOA):** Admins supply one or more Gemini API keys stored in `/schools/{schoolId}/config/system`.
- **Serverless AI Proxy (`api/cerebro-ask.ts`):** Validates Firebase ID tokens, strips PII regex (names, phone numbers) before sending context to Gemini, enforces rate limits (5 requests/min per user), and iterates key pools upon HTTP 429 errors.

### 5.4 Live Transport Fleet Engine
- **Haversine Formula:** Computes real-time distance and estimated time of arrival (ETA) between current bus coordinates and student pickup stop.
- **Zero API Cost:** Map rendering uses Leaflet with OpenStreetMap tiles, avoiding Google Maps API billing.

---

## 6. Data Schemas & Firestore Database Architecture

All tenant data is strictly partitioned inside `/schools/{schoolId}/`:

```
/users/{userId}                           [Global Identity Router]
/schools/{schoolId}/
  ├── config/{tabId}                      [9-Tab Admin Settings Configs]
  ├── students/{studentId}                [Student Roster & Hashed Credentials]
  ├── teachers/{teacherId}                [Teacher Directory & Credentials]
  ├── classes/{classId}                   [Class & Section Configurations]
  ├── attendance/{date_classId}           [Daily Attendance Logs]
  ├── fees/{feeId}                        [Fee Ledgers & Invoices]
  │     └── receipts/{receiptId}          [Atomic Payment Receipts]
  ├── exams/{examId}                      [Exam Schedules & Boundaries]
  │     └── results/{studentId}           [Student Marks Records]
  ├── homework/{homeworkId}               [Homework Assignments]
  │     └── submissions/{studentId}       [Student Submissions & Marks]
  ├── notices/{noticeId}                  [School Announcements]
  ├── library/{bookId}                    [Book Inventory & Issue Logs]
  └── buses/{busId}                       [Fleet Tracking & Live GPS]
```

### 6.1 Security Rules & IDOR Protection (`firestore.rules`)
- **Tenant Isolation:** Enforces `request.auth.token.schoolId == schoolId` on all document accesses.
- **RBAC Write Controls:** Restricts write operations to authenticated `ADMIN` or `TEACHER` roles.
- **Student Privacy:** Students read only documents matching `studentId == request.auth.uid`.
- **Parent Isolation:** Parents read only documents matching `studentId in request.auth.token.children`.

---

## 7. Non-Functional Requirements & Performance Benchmarks

- **Type Safety:** 0 TypeScript compilation errors across 46 audited components (`npx tsc --noEmit`).
- **Unit Testing:** 265/265 unit tests passing (`npx vitest run`).
- **Production Build:** Vite production bundle compiles cleanly in ~1m 14s with 83 PWA precache entries.
- **Page Load SLA:** Initial load < 1.2s on 4G networks; sub-100ms transitions on cached routes.
- **Cost Strategy:** 100% operational within the Firebase Spark (Free) tier for up to 10 schools.

---

## 8. Product Roadmap & Feature Scope Matrix

| Module | Phase 1 (1-School Pilot Launch) | Phase 2 (Growth & Scale Scope) | Phase 3 (Enterprise SaaS) |
|---|---|---|---|
| **Auth & Onboarding** | ✅ Dual Email/PIN/Magic Link Auth | SMS OTP Gateway Fallback | Enterprise SAML / Azure AD SSO |
| **Fee Ledger** | ✅ Atomic Payments + GST + PDF Receipts | Razorpay Webhook Auto-Sync | Tally / Zoho Books Sync |
| **Attendance** | ✅ FaceGrid + CSV + Biometric Proxy | Native Mobile NFC Card Tap | AI CCTV Facial Recognition |
| **Cerebro AI** | ✅ BYOA Gemini Key Pool + Aggregates | AI Student Learning Pathways | Principal Voice AI Assistant |
| **Transport** | ✅ Simulated GPS + Haversine ETA | Hardware OBD GPS Tracker | Dynamic Route Optimization |
| **Communication** | ✅ One-Time WhatsApp Invite + In-App Bell | Push Notifications (FCM) | Automated IVR Phone Calls |
