# MASTER BACKEND DATABASE SCHEMA & SECURITY SPECIFICATION — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Database Architecture & Security Rules Spec  

---

## 1. Global Database Topology & Tenant Isolation

SmartSchool OS implements a strict multi-tenant tree hierarchy in Firebase Firestore. The database uses a global router collection (`/users`) for initial login identity lookup, while all operational school data is strictly partitioned inside `/schools/{schoolId}/` subtrees.

```
/users/{userId}                           [Global Identity Router - Discovery]
/security_logs/{logId}                    [Write-Only Client Audit Logs]
/usage/{schoolId}                         [Tenant Billing & Read/Write Quota Counters]
/schools/{schoolId}/
  ├── config/{tabId}                      [9-Tab Settings Configs]
  ├── users/{userId}                      [School-specific Hashed Credentials]
  ├── students/{studentId}                [Student Roster & PII]
  ├── classes/{classId}                   [Class & Section Structures]
  ├── attendance/{date_classId}           [Daily Attendance Matrix]
  ├── fees/{invoiceId}                    [Fee Ledgers & Invoices]
  │     └── receipts/{receiptId}          [Atomic Payment Receipts]
  ├── exams/{examId}                      [Exam Master Boundaries]
  ├── examSchedules/{scheduleId}          [Exam Timetables]
  ├── results/{examId_studentId}          [Unified Score & Report Card Records]
  ├── homework/{homeworkId}               [Homework Assignments]
  │     └── submissions/{submissionId}    [Student Submissions & Marks]
  ├── announcements/{announcementId}      [School Circulars]
  ├── books/{bookId}                      [Digital Library Inventory]
  ├── libraryTransactions/{txnId}         [Book Issue & Fine Ledgers]
  ├── libraryRequests/{reqId}             [Book Reservation Queue]
  ├── transport/
  │     ├── routes/list/{routeId}         [Fleet Bus Routes]
  │     └── assignments/list/{assignId}   [Student Transport Allocations]
  └── buses/{busId}                       [Real-Time Fleet GPS Locations]
        └── location/{locationId}         [GPS History Trail]
```

---

## 2. Master Collection Schema Specifications

### 2.1 Global Identity Router (`/users/{userId}`)
Acts as a discovery router mapping a user's Firebase Auth `uid` and custom semantic ID to their assigned `schoolId`:

```typescript
interface GlobalUserRouter {
  uid: string;           // Firebase Auth UID
  schoolId: string;      // e.g., "SCH-A7X9P"
  role: UserRole;        // "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "SUPER_ADMIN"
  uniqueId: string;      // e.g., "STU-24-001" or "TCH-24-05"
  createdAt: number;     // Timestamp ms
}
```

### 2.2 School Tenant Configuration (`/schools/{schoolId}/config/{tabId}`)
Stores the 9 admin settings tabs (`info`, `white_label`, `erp`, `finance`, `hardware`, `comms`, `calendar`, `system`, `maintenance`):

```typescript
interface SchoolConfigInfo {
  schoolName: string;
  principalName: string;
  affiliationNo: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}

interface SchoolConfigWhiteLabel {
  customDomain: string;
  dnsStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  brandPrimary: string;      // e.g., "#4f46e5"
  brandPrimaryLight: string; // e.g., "#818cf8"
  appName: string;
  faviconUrl: string;
  loginBgUrl: string;
}

interface SchoolConfigSystem {
  geminiKeys: Array<{
    key: string;             // Password-masked API Key
    model: string;           // "gemini-2.0-flash" | "gemini-1.5-pro"
    maxTokens: number;
    temperature: number;
  }>;
  fallbackEnabled: boolean;
}
```

### 2.3 School User Credentials (`/schools/{schoolId}/users/{userId}`)
Stores hashed user credentials and role metadata:

```typescript
interface UserProfile {
  id: string;
  schoolId: string;
  role: UserRole;
  uniqueId: string;          // "STU-24-001" or "TCH-24-05"
  name: string;
  email?: string;
  phone?: string;
  parentPhone?: string;      // Used for Parent -> Student linkage
  linkedStudents?: string[]; // Array of student IDs for multi-child parents
  passwordHash: string;      // "pbkdf2$600000$salt$hash"
  passwordSalt: string;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING' | 'INVITED';
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Attendance Matrix (`/schools/{schoolId}/attendance/{attendanceId}`)

```typescript
interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  date: string;              // Format: "YYYY-MM-DD"
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  markedBy: string;          // Teacher UID
  timestamp: string;         // ISO String
}
```

### 2.5 Fee Ledgers & Receipts (`/schools/{schoolId}/fees/{invoiceId}`)

```typescript
interface FeeInvoice {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  classId: string;
  invoiceNo: string;        // e.g., "INV-2026-001"
  feeType: string;         // "TUITION" | "TRANSPORT" | "ADMISSION" | "EXAM"
  totalAmount: number;
  amountPaid: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  dueDate: string;         // "YYYY-MM-DD"
  gstApplied: boolean;
  gstAmount?: number;
  transactions: Array<{
    transactionId: string; // Idempotency key: "fee_{feeId}_{timestamp}_{rand}"
    amount: number;
    paymentMode: 'CASH' | 'UPI' | 'CHEQUE' | 'ONLINE';
    paidAt: string;
    receiptNo: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### 2.6 Exam Results (`/schools/{schoolId}/results/{examId_studentId}`)

```typescript
interface ExamResultRecord {
  id: string;
  schoolId: string;
  classId: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
  }>;
  totalMarks: number;
  percentage: number;
  overallGrade: string;
  rank?: number;             // Class rank
  isPublished: boolean;      // DRAFT (false) vs PUBLISHED (true)
  updatedAt: string;
}
```

### 2.7 Homework Assignments (`/schools/{schoolId}/homework/{homeworkId}`)

```typescript
interface HomeworkAssignment {
  id: string;
  schoolId: string;
  classId: string;
  subject: string;
  title: string;
  description: string;
  assignedDate: string;      // "YYYY-MM-DD"
  dueDate: string;           // "YYYY-MM-DD"
  teacherId: string;
  attachmentUrl?: string;
  status: 'DONE' | 'PENDING';
}
```

### 2.8 Transport Fleet & Live GPS (`/schools/{schoolId}/buses/{busId}`)

```typescript
interface BusTrackerRecord {
  id: string;
  schoolId: string;
  number: string;            // e.g., "BUS-04"
  driverName: string;
  driverPhone: string;
  status: 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY';
  location: {
    latitude: number;
    longitude: number;
    speed: number;
    lastUpdated: number;     // Timestamp ms
  };
}
```

---

## 3. Field Validation Functions in Security Rules

`firestore.rules` evaluates 14 strict field validators before accepting any document writes:

```cel
function isValidEmail(email) {
  return email == null || email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
}

function isValidPhone(phone) {
  return phone == null || phone.matches('^\\+?[\\d\\s-]{10,}$');
}

function isValidRole(role) {
  return role in ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'];
}

function isValidUniqueId(id) {
  return id != null && id.size() >= 3 && id.size() <= 50 && id.matches('^[A-Za-z0-9_-]+$');
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Collection Path | School Admin | Teacher | Student | Parent |
|---|---|---|---|---|
| `/users/{userId}` | Read / Create | Denied | Read Own | Read Own |
| `/schools/{schoolId}/config/*` | Full Read / Write | Read (No Keys) | Read (No Keys) | Read (No Keys) |
| `/schools/{schoolId}/students/*` | Full Read / Write | Read / Create / Update | Read Own | Read Own Child |
| `/schools/{schoolId}/attendance/*` | Full Read / Write | Create / Update | Read Own | Read Own Child |
| `/schools/{schoolId}/fees/*` | Full Read / Write | Read | Read Own | Read Own Child + Self-Pay |
| `/schools/{schoolId}/results/*` | Full Read / Write | Create / Update (Draft) | Read Own (Published Only) | Read Child (Published Only) |
| `/schools/{schoolId}/homework/*` | Full Read / Write | Create / Update Own | Read Class | Read Child Class |
| `/schools/{schoolId}/announcements/*`| Full Read / Write | Create / Update | Read (if `visibleTo` matches) | Read (if `visibleTo` matches) |
| `/schools/{schoolId}/buses/*` | Full Read / Write | Read | Read Assigned Route | Read Assigned Route |

---

## 5. Composite Index Specifications (`firestore.indexes.json`)

To prevent unindexed query errors, `firestore.indexes.json` defines required composite indexes:

```json
{
  "indexes": [
    {
      "collectionGroup": "fees",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "results",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 6. Real-Time Quota Monitoring (`/usage/{schoolId}`)

The `/usage/{schoolId}/daily/{date}` document tracks read/write activity to prevent quota surges:
- `firestoreReads`, `firestoreWrites`, `firestoreDeletes`
- `storageUploads`, `storageDownloads`, `storageBytesUploaded`
- `aiQueries`, `aiTokensUsed`, `whatsappCount`
- Only authorized Cloud Functions or School Admins can reset daily usage objects.
