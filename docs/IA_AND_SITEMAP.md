# MASTER INFORMATION ARCHITECTURE & SITEMAP — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Master Routing & Navigation Map  

---

## 1. Master System Sitemap & Routing Topology

SmartSchool OS utilizes a multi-tenant role-scoped routing architecture. All authenticated paths resolve under role-specific base routes (`/admin`, `/teacher`, `/student`, `/parent`), while Firestore security rules restrict data access to the user's mapped `schoolId`.

```
SmartSchool OS Global Route Hierarchy
├── 🌐 Public & Auth Routes
│   ├── /                          ──> Login / Signup Portal
│   ├── /auth/magic                ──> Magic Token Verification
│   ├── /auth/reset                ──> Credential Reset Handler
│   └── /maintenance               ──> Maintenance Mode Fallback Page
│
├── 🏛️ Admin Subtree (/admin/*)    ──> 7 Grouped Sections (21 Routes + 9 Settings Tabs)
├── 👩‍🏫 Teacher Subtree (/teacher/*)──> 8 Desktop Routes (5 Mobile Dock Items)
├── 🎓 Student Subtree (/student/*)──> 9 Desktop Routes (5 Mobile Dock Items)
└── 👨‍👩‍👧 Parent Subtree (/parent/*) ──> 9 Desktop Routes (Multi-Child Switcher Context)
```

---

## 2. School Admin Information Architecture (7 Nav Groups, 21 Routes)

The Admin navigation hierarchy (`adminNavGroups` in `config/navItems.ts`) is organized into 7 functional domains:

```
ADMIN PORTAL (7 GROUPED DOMAINS)
│
├── 1. MAIN
│   ├── Dashboard (/admin/dashboard)           ──> Institutional Operational Center
│   └── Cerebro AI (/admin/intelligence)       ──> AI Predictive Analytics & BYOA Monitor
│
├── 2. PEOPLE
│   ├── Students (/admin/students)             ──> Student Roster, CSV Import, ID Cards
│   └── Teachers (/admin/teachers)             ──> Faculty Directory & Hiring Records
│
├── 3. ACADEMICS
│   ├── Classes (/admin/classes)               ──> Class/Section Capacity Management
│   ├── Attendance (/admin/attendance)         ──> Daily Matrix, Defaulters & Biometric Status
│   ├── Exams (/admin/exams)                   ──> Exam Scheduling & Passing Boundaries
│   ├── Marks Entry (/admin/results)           ──> Draft vs. Published State Management
│   ├── Homework (/admin/homework)             ──> School-wide Assignment Monitoring
│   ├── Report Cards (/admin/report-cards)     ──> Term PDF Report Card Generator
│   └── Academic Setup (/admin/academic/setup) ──> Session & Subject Assignment Studio
│       ├── Setup (/admin/academic/setup)
│       ├── Subjects (/admin/academic/subjects)
│       └── Time Table (/admin/academic/timetable)
│
├── 4. FINANCE
│   ├── Fees (/admin/fees)                     ──> Fee Ledger, Atomic Payment & Defaulter Tiers
│   └── Reports (/admin/reports)               ──> Recharts Financial & Attendance Analytics
│
├── 5. COMMUNICATION
│   ├── Notices (/admin/announcements)         ──> Announcement Publisher with Role Filters
│   ├── Alert Center (/admin/notifications)    ──> In-App Broadcast & Delivery Audit
│   └── WhatsApp (/admin/whatsapp)             ──> One-Time Magic Link Onboarding Center
│
├── 6. RESOURCES
│   ├── Library (/admin/library)               ──> 7-Tab Digital Library & Fine Engine
│   └── Bus Tracking (/admin/bus-tracking)     ──> Fleet Command Center & Live GPS Map
│
└── 7. CONFIG
    └── School Settings (/admin/settings)      ──> 9-Tab Admin Configuration Center
        ├── INFO                               ──> School Identity & Logo Upload
        ├── WHITE_LABEL                        ──> Custom Domain DNS & Accent Colors
        ├── ERP                                ──> Attendance Cutoffs & Passing %
        ├── FINANCE                            ──> GST & Payment Gateway API Keys
        ├── HARDWARE                           ──> ZKTeco/Mantra Device IP & NFC Readers
        ├── COMMS                              ──> WhatsApp Invite Master Toggle
        ├── CALENDAR                           ──> School Holiday CRUD & Attendance Locking
        ├── SYSTEM                             ──> BYOA Gemini Key Pool Manager
        └── MAINTENANCE                        ──> Maintenance Mode & Firestore Backup
```

### Admin Mobile Navigation Dock (`adminMobileNavItems`)
For quick navigation on smartphones, admins access a 5-icon bottom bar:
1. `Home` (`/admin/dashboard`)
2. `Students` (`/admin/students`)
3. `Attendance` (`/admin/attendance`)
4. `Fees` (`/admin/fees`)
5. `More` (`/admin/settings`)

---

## 3. Teacher Information Architecture (8 Routes)

Tailored for classroom speed and rapid attendance entry:

```
TEACHER PORTAL
├── Dashboard (/teacher/dashboard)     ──> Daily Schedule Timeline & Quick Attendance
├── My Students (/teacher/students)    ──> Roster View & Quick Parent Call
├── Attendance (/teacher/attendance)   ──> Double-tap FaceGrid Gesture Component
├── Homework (/teacher/homework)       ──> Assignment Creator & Submission Evaluator
├── Library (/teacher/library)         ──> Faculty Catalog Search & Book Reservation
├── Grades (/teacher/grades)           ──> Subject Marks Entry & Admin Submission
├── Notices (/teacher/announcements)   ──> Staff Circulars & Class Announcement Publisher
└── Settings (/teacher/settings)       ──> Password Change & Profile Management
```

### Teacher Mobile Navigation Dock (`teacherMobileNavItems`)
1. `Home` (`/teacher/dashboard`)
2. `Students` (`/teacher/students`)
3. `Attendance` (`/teacher/attendance`)
4. `Homework` (`/teacher/homework`)
5. `More` (`/teacher/settings`)

---

## 4. Student Experience Information Architecture (9 Routes)

Personal academic hub for self-management:

```
STUDENT PORTAL
├── Dashboard (/student/dashboard)     ──> Next Period Card, Pending Assignments & Attendance %
├── Academics (/student/academics)     ──> Subject Syllabi & Class Teacher Info
├── Homework (/student/homework)       ──> Submission Portal & Teacher Feedback Inbox
├── Notices (/student/notices)         ──> Filtered Circulars Feed
├── Fees (/student/fees)               ──> Outstanding Balance Ledger & PDF Tax Receipts
├── Attendance (/student/attendance)   ──> Monthly Color-coded Attendance Calendar
├── Timetable (/student/timetable)     ──> Weekly 6-Day Schedule Grid
├── Library (/student/library)         ──> Borrowed Books Status, Fines & Search
└── Transport (/student/transport)     ──> Real-Time OpenStreetMap Bus Tracker & Haversine ETA
```

### Student Mobile Navigation Dock (`studentMobileNavItems`)
1. `Home` (`/student/dashboard`)
2. `Academics` (`/student/academics`)
3. `Homework` (`/student/homework`)
4. `Fees` (`/student/fees`)
5. `More` (`/student/attendance`)

---

## 5. Parent Multi-Child Information Architecture (9 Routes)

Supports single-login switching between multiple enrolled children via a persistent top dropdown:

```
PARENT PORTAL (MULTI-CHILD CONTEXT)
├── Dashboard (/parent/dashboard)      ──> Top Bar Child Switcher, Selected Child Stats & Alerts
├── Homework (/parent/homework)        ──> Child Homework Completion Monitoring
├── Fees (/parent/fees)                ──> Multi-Child Consolidated Fee Ledger & Online UPI
├── Attendance (/parent/attendance)    ──> Real-Time Daily Check-in Alerts & Monthly View
├── Results (/parent/results)          ──> Published Report Cards & Progress Comparison
├── Library (/parent/library)          ──> Borrowed Books Status & Overdue Fines
├── Transport (/parent/transport)      ──> Real-Time Bus Map, Pickup Stop ETA & Delay Banners
├── Notices (/parent/notices)          ──> Official School Announcements & Holiday Calendar
└── Settings (/parent/settings)        ──> Linked Phone Number & Account Password Management
```

### Parent Mobile Navigation Dock (`parentMobileNavItems`)
1. `Home` (`/parent/dashboard`)
2. `Homework` (`/parent/homework`)
3. `Fees` (`/parent/fees`)
4. `Attendance` (`/parent/attendance`)
5. `More` (`/parent/results`)

---

## 6. Authentication & System Fallback Routes

| Route Path | Associated Component | Access Restriction | Purpose |
|---|---|---|---|
| `/` | `Login.tsx` | Public | Role-selection login & signup portal |
| `/login` | `Login.tsx` | Public | Alias redirect to root login |
| `/auth/magic` | `MagicLinkHandler.tsx` | Signed Token | One-time Welcome/Invite magic link verification |
| `/auth/reset` | `MagicLinkHandler.tsx` | Signed Token | Credential reset route |
| `/maintenance` | `MaintenancePage.tsx` | Public | Rendered when maintenance mode is toggled ON |
| `*` | `NotFoundPage.tsx` | Public | 404 Fallback page for unknown paths |

---

## 7. Navigation State Machine & Active Route Resolution

Inside `Layout.tsx`, active navigation states are computed dynamically to ensure proper highlight styling across nested role routes:

```typescript
// Role-aware active route resolution contract
const isActive = (path: string) => {
  if (path === '/admin/academic/setup') {
    return location.pathname.startsWith('/admin/academic');
  }
  return location.pathname === path;
};
```
