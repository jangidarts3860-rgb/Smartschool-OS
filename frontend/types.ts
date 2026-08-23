export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface SchoolConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  fontFamily?: string;
  customDomain?: string;
  subdomain: string;
  // API keys — stored in Firestore admin-only subcollection, protected by Firestore rules
  // Non-admin users cannot read documents containing apiKeys field
  apiKeys?: {
    gemini?: string[];
    grok?: string;
    claude?: string;
  };
  aiFallback: boolean;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  config: SchoolConfig;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING' | 'EXPIRED';
  referralCode?: string;
  partnerId?: string;
  createdAt?: Date | null;
  lastBillingDate?: Date | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  photoUrl?: string; // Standardized for ID Cards
  classId?: string; // Unified Class ID
  class?: string; // Legacy alias
  section?: string; // Legacy alias
  rollNo?: string | number; // Student roll number
  childrenIds?: string[];
  phone?: string;
  subjects?: string[];
  assignedClasses?: string[];
  uniqueId: string;
  schoolId: string;
  schoolConfig?: SchoolConfig; // Added for AI Assistant context
  isLinked?: boolean;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING' | 'INVITED';
  inviteExpiryDate?: string;
  biometricId?: string;
  isFirstLogin?: boolean;
  forcePasswordChange?: boolean;
  sessionInvalidatedAt?: any;
  disabledReason?: string;
  dob?: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  pin?: string;
  parentPhone?: string;
  parentName?: string;
  schoolName?: string;
  srNumber?: string;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  lastActive?: string;
  biometricRegistered?: boolean;
  createdAt?: Date | null;
  gender?: string;
  fcmTokens?: string[]; // Array of FCM tokens for this user's devices
  qualification?: string;
  experience?: string;
  address?: string;
  fatherName?: string;
  bloodGroup?: string;
}

export interface ClassData {
  id: string;
  name: string;
  section?: string;
  classTeacherId?: string;
  subjects?: string[];
  studentCount?: number;
}

export interface SubjectData {
  id: string;
  name: string;
  code?: string;
  classId?: string;
  teacherId?: string;
}

export interface AttendanceData {
  id: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  date: string;
  method?: string;
  time?: string;
}

export interface Bus {
  id: string;
  number: string;
  routeId: string;
  driverId: string;
  status: 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY';
  location: { lat: number; lng: number };
  speed: number;
  heading: number;
  lastUpdate: string;
  occupancy: number;
  capacity: number;
  health: number;
  fuel: number;
  schoolId: string;
  driverName?: string;
  driverPhone?: string;
  schedule?: {
    morningDeparture?: string;
    schoolArrival?: string;
    schoolDeparture?: string;
  };
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
  estimatedTime: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: BusStop[];
  busNumber: string;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  monthlyFee: number;
  status: 'active' | 'inactive' | 'suspended';
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportAssignment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  routeId: string;
  routeName: string;
  stopName: string;
  stopId: string;
  pickupTime: string;
  dropTime: string;
  monthlyFee: number;
  assignedAt: string;
  schoolId: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  busNumber: string;
  routeId: string;
  status: 'active' | 'off-duty' | 'on-leave';
  schoolId: string;
  photoUrl?: string;
}

export interface BusLocation {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: 'ON_ROUTE' | 'PARKED' | 'DELAYED' | 'EMERGENCY';
}

export interface Student {
  id: string;
  name: string;
  rollNo: number;
  classId: string;
  photoURL?: string; // GAP 6: Added student photo
  parentLinked: boolean;
  amountDue: number;
  performanceInsight: string;
  lastResult: string;
  biometricId?: string;
}

// GAP 2, GAP 3, GAP 8: New robust attendance record
export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string; // Added for multi-school isolation
  date: string; // YYYY-MM-DD
  academicYear: string; // e.g., '2024-25'
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  markedBy: string; // teacher or 'SYSTEM' (biometric)
  deviceId?: string; // GAP: Which biometric machine scanned the user
  timestamp: string;
  // Audit trail for edits
  edited?: boolean;
  editedBy?: string;
  editReason?: string;
  // Offline sync tracking
  syncStatus?: 'SYNCED' | 'PENDING';
}

export interface SchoolSettings {
  schoolName: string;
  address: string;
  contactEmail: string;
  logoUrl: string;
  accentColor: string;
  appTitle?: string;
  isMaintenanceMode?: boolean;
  biometricEnabled?: boolean;
  aiAutomation?: boolean;
  upiEnabled?: boolean;
  apiKeys?: string[];
}

export type AnnouncementPriority = 'general' | 'urgent' | 'critical';
export type AnnouncementTargetRole = 'admin' | 'teacher' | 'student' | 'parent';
export type AnnouncementStatus = 'ACTIVE' | 'ARCHIVED';

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  visibleTo: AnnouncementTargetRole[];
  targetClasses: string[]; // empty = all classes
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  isPinned: boolean;
  isArchived: boolean;
  expiresAt?: string | null;
  scheduledAt?: string | null;
  readBy: string[]; // array of userIds who read it
  createdAt: string;
  updatedAt: string;
  attachments?: { name: string; url: string; type: string }[];
}


export type HomeworkStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type SubmissionStatus = 'NOT_STARTED' | 'SUBMITTED' | 'GRADED' | 'LATE_SUBMITTED';
export type AttachmentType = 'PDF' | 'IMAGE' | 'DOC' | 'VIDEO' | 'LINK';

export interface HomeworkAttachment {
  name: string;
  url: string;
  type: AttachmentType;
  size?: number;
  uploadedAt?: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  textContent?: string;
  submittedAt: string;
  status: SubmissionStatus;
  isLate: boolean;
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  classId: string;
  className?: string;
  schoolId: string;
  academicYear: string;
  status: HomeworkStatus;
  teacherId: string;
  teacherName?: string;
  attachments?: HomeworkAttachment[];
  maxGrade?: number;
  allowLateSubmission?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeTransaction {
  txnId: string;
  amount: number;
  mode: 'UPI' | 'CASH' | 'CARD' | 'CHEQUE' | 'REFUND';
  verified: boolean;
  timestamp: string;
  note?: string;
  receiptNo?: string;
  collectedBy?: string;
  lateFine?: number;
  discount?: number;
  idempotencyKey?: string;
}

export interface FeeRecord {
  id: string;
  invoiceNo: string;
  studentId: string; // Better than studentName
  studentName: string;
  academicYear: string; // GAP 8
  totalAmount: number;
  amountPaid: number;
  amount?: number; // Alias for totalAmount (for backward compatibility)
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL'; // GAP 4: Partial logic support
  month: string;
  classId: string;
  schoolId: string; // Added for multi-school isolation
  srNumber?: string; // GAP: Permanent record identifier
  invoiceNumber?: string; // Added for consistency
  title?: string; // Added for display
  transactions?: FeeTransaction[];
  receiptNo?: string;
  paidAt?: string | { toDate: () => Date };
  breakdown?: Array<{ name: string; amount: number }>;
  paymentHistory?: any[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachment?: { url: string, type: string, name: string };
  createdAt?: Date | null; // For sorting and Firestore timestamp
}

export interface TimeTablePeriod {
  period?: number;
  subject: string;
  time: string;
  teacher?: string;
}

export interface ClassRoom {
  id: string; // e.g., '7A' - GAP 7: Standardized, no more 'section' field
  name: string; // e.g., 'Class 7'
  schoolId: string; // Added for multi-school isolation
  capacity: number;
  studentCount: number;
  classTeacherId: string;
  classTeacherName: string;
  timeTable: { [key: string]: TimeTablePeriod[] };
}

export interface FeeHead {
  name: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  classId: string[];
  totalAmount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  dueDateDay: number;
  lateFeeConfig: {
    gracePeriodDays: number;
    fineAmount: number;
    fineType: 'FIXED_PER_DAY' | 'PERCENTAGE'
  };
  heads: FeeHead[];
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  type: 'ACADEMIC' | 'BREAK';
}

export interface StudentPerformance {
  studentId: string;
  healthScore: number;
  aiInsight: string;
  recentResults: {
    id: string;
    subject: string;
    examType: string;
    marksObtained: number;
    totalMarks: number;
    date: string;
  }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'HOLIDAY' | 'EXAM' | 'EVENT';
  description?: string;
}

export interface Exam {
  id: string;
  schoolId: string;
  name: string; // e.g., 'Half Yearly', 'Annual'
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED';
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  maxMarks: number;
  passingMarks: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ResultRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  classId: string;
  section?: string;
  examId: string;
  examName: string;
  subjects: Record<string, {
    marks: number | 'AB' | 'ML';
    maxMarks: number;
    grade: string;
    remarks?: string;
    isGraceApplied?: boolean;
  }>;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  rank?: number;
  overallGrade: string;
  remarks?: string;
  teacherRemarks?: string;
  teacherName?: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  createdBy: string;
  updatedAt?: Date | null;
  academicYear?: string;
  createdAt?: Date | null;
  showGraceFlag?: boolean;
  schoolId: string;
}

// --- LIBRARY MANAGEMENT (MULTI-TENANT) ---
export interface Book {
  id: string;
  schoolId: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  rackLocation: string;
  coverImage?: string;
  addedAt: string;
  publisher?: string;
  edition?: string;
  year?: number;
  pages?: number;
  language?: string;
  description?: string;
  condition?: 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface LibraryTransaction {
  id: string;
  schoolId: string;
  bookId: string;
  bookTitle?: string;
  userId: string;
  userName?: string;
  userRole?: 'STUDENT' | 'TEACHER';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  finePaid?: number;
  fineWaived?: boolean;
  fineWaiveReason?: string;
  overdueDays?: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST' | 'DAMAGED';
  isGraceApplied?: boolean;
  note?: string;
}

export interface LibraryRules {
  schoolId: string;
  finePerDay: number;
  maxBooksStudent: number;
  maxBooksTeacher: number;
  issueDurationDays: number;
  holidayExclusion: boolean;
  gracePeriodDays?: number;
  lowStockThreshold?: number;
}

export interface LibraryRequest {
  id: string;
  schoolId: string;
  userId: string;
  bookId: string;
  status: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'REJECTED';
  requestedAt: string;
}

// --- PAYROLL MANAGEMENT (TEACHER) ---
export interface TeacherSalaryConfig {
  teacherId: string;
  baseSalary: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface PayrollRecord {
  id: string; // e.g., '2024-05'
  teacherId: string;
  schoolId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  deductions: {
    absent: number;
    late: number;
    other: number;
    description?: string;
  };
  bonuses: {
    overtime: number;
    extraClasses: number;
    performance: number;
    description?: string;
  };
  netPay: number;
  status: 'PAID' | 'PENDING';
  paymentMode?: 'CASH' | 'BANK' | 'UPI';
  paidAt?: Date | null;
  createdAt: Date | null;
  generatedBy: string;
}

// --- WHATSAPP & NOTIFICATIONS (BYOA) ---
export interface WhatsAppConfig {
  provider: 'TWILIO' | 'WATI' | 'MOCK';
  apiKey: string;
  apiSecret?: string; // e.g., Twilio Auth Token
  endpoint?: string; // Needed for WATI
  senderId?: string; // Phone number (display only)
  whatsappPhoneNumberId?: string; // Meta Business API Phone Number ID (required for API)
  isActive: boolean;
  businessAccountId?: string; // Meta Business Account ID
  accessToken?: string; // Meta Graph API Access Token (encrypted)
}

export interface WhatsAppPhoneMapping {
  schoolId: string;
  phoneNumberId: string; // Meta-provided Phone Number ID
  phoneNumber: string; // Display number (e.g., +91-98765-43210)
  provider: 'TWILIO' | 'WATI' | 'MOCK';
  isActive: boolean;
  verifiedAt?: Date | null;
  createdAt: Date | null;
}

export interface NotificationLog {
  id: string;
  schoolId: string;
  type: 'FEE_REMINDER' | 'ABSENT_ALERT' | 'NOTICE_BROADCAST' | 'CUSTOM';
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'MOCK_SENT' | 'PENDING';
  provider: string;
  phoneNumberId?: string;
  sentAt: Date | null;
  sentBy: string;
  errorDetail?: string;
}

// --- USAGE MONITORING (BILLING & ABUSE PREVENTION) ---
export interface UsageStats {
  schoolId: string;
  period: 'daily' | 'monthly' | 'yearly';
  messageCount: number;
  apiCalls: number;
  storageUsed: number; // bytes
  lastUpdated: Date | null;
}

export interface SchoolUsageLimit {
  schoolId: string;
  monthlyMessageLimit: number; // e.g., 1000 for free tier, 10000 for paid
  monthlyApiLimit: number;
  storageLimit: number; // bytes
  isUnlimited: boolean;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

export interface UsageAlert {
  schoolId: string;
  alertType: 'MESSAGE_QUOTA' | 'API_QUOTA' | 'STORAGE_QUOTA' | 'SUSPICIOUS_ACTIVITY';
  threshold: number;
  currentUsage: number;
  percentage: number;
  createdAt: Date | null;
  acknowledgedAt?: Date | null;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  total: number;
}

export interface FeeItem {
  id: string;
  title?: string;
  amount?: number;
  status?: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  date?: string;
  [key: string]: unknown;
}

export interface MarkItem {
  subject: string;
  score: number;
  total: number;
  date: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  type?: 'ALERT' | 'INFO' | 'SUCCESS';
  isRead?: boolean;
  createdAt?: unknown;
  [key: string]: unknown;
}

export interface StudentAttendance {
  id: string;
  name?: string;
  avatar?: string;
  rollNo?: string;
  classId?: string;
  status?: unknown;
  uniqueId?: string;
  [key: string]: unknown;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface FeeRecordForUI {
  id: string;
  [key: string]: unknown;
}

export interface SchoolProfile {
  name?: string;
  logoUrl?: string;
  principal?: string;
  affiliation?: string;
  academicYear?: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}


