/**
 * services/index.ts
 *
 * Public API barrel for the services layer. Re-exports the public surface of
 * every service module so consumers can `import { authService, api, ... } from
 * '@/services'` instead of reaching into individual files. This makes future
 * tree-shaking and refactors easier without forcing every caller onto the deep
 * import path today.
 *
 * Intentionally omitted:
 *   - `./firebase`  — heavy side effects on import (Firebase app init, env
 *                     hard-fail). Import directly from '@/services/firebase'.
 *   - `./seedDatabase` — throws at module load in non-DEV builds. Import
 *                     directly when seeding is needed.
 */

export { api } from './api';

export {
  logSecurityAction,
  processPendingAuditLogs
} from './audit';
export type { SecurityAction, AuditMetadata } from './audit';

export {
  authService,
  maskContact
} from './authService';
export type { TokenType } from './authService';

export {
  userService,
  schoolService,
  writeBatchChunked
} from './firestore';
export type { BatchOperation, SchoolMetadata, SchoolClass, StudentRecord } from './firestore';

export {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit
} from './rateLimit';

export {
  fetchClassStudents,
  markAttendance,
  markBiometricAttendance,
  checkAttendanceExists,
  saveAttendanceOffline,
  getPendingAttendance,
  clearSyncedAttendance,
  exportAttendanceToCSV,
  downloadCSV
} from './attendance';
export type { AttendanceRecord, ClassSection } from './attendance';

export {
  bulkImportStudents,
  bulkImportTeachers,
  downloadStudentTemplate,
  downloadTeacherTemplate
} from './bulkImportService';

export { cerebro } from './cerebroEngine';
export type { CerebroResponse } from './cerebroEngine';

export { examService } from './examService';
export type { SubjectMarks, UnifiedResult } from './examService';

export {
  requestNotificationPermission,
  getFcmToken,
  saveFcmToken,
  removeFcmToken,
  onForegroundMessage,
  initializeFcmForUser
} from './fcmService';
export type { FcmMessageResult } from './fcmService';

export { idCardService } from './idCardService';
export type { IDCardData } from './idCardService';

export { initializeDatabase } from './initData';

export {
  validateFeePayment,
  generateIdempotencyKey,
  validateBiometricScan,
  calculateNetSalary,
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidRole,
  isValidStatus,
  isValidAmount,
  isValidDate,
  isNonEmptyString,
  isAdmin,
  canAccessRoute,
  canAccessStudentData,
  validateBatchAttendance
} from './kiloValidation';
export type {
  FeeValidationResult,
  AttendanceValidationResult,
  PayrollCalculationResult,
  BatchAttendanceValidation
} from './kiloValidation';

export { libraryService } from './libraryService';

export { reportCardService } from './reportCardService';
export type { StudentMarks } from './reportCardService';

export { reportService } from './reportService';
export type { MonthlyFeeData, ChartDataPoint, FeeStatsResult, CSVExportData, PDFExportRow } from './reportService';

export {
  deleteStudentCascade,
  softDeleteStudent,
  checkOrphanedData
} from './studentDeleteService';

export { timetableService } from './timetableService';
export type { TimetableEntry, TimetableData, TimeTablePeriod } from './timetableService';

export {
  getUsageStats,
  incrementCounter,
  addBytes,
  incrementWhatsApp,
  incrementFirestore,
  incrementStorage,
  incrementAI,
  incrementUser,
  incrementHeavyOperation,
  checkUsageLimits,
  shouldBlockOperation,
  monitorUsageAndAlert
} from './usageService';

export { getAIResponse, simulateAIResponseDev } from './geminiService';
export { createGhostSession, validateGhostToken } from './ghostMode';

export {
  getHomeworkRef,
  getSubmissionsRef,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkById,
  onHomeworkByTeacher,
  onHomeworkByClass,
  onAllHomework,
  submitHomework,
  gradeSubmission,
  onSubmissions,
  onStudentSubmissionsAcross,
  getSubmissionByStudent,
  uploadAttachment,
  deleteAttachment,
  getHomeworkByStudent,
  getCompletionStats
} from './homework';

export {
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
  markAsRead,
  onActiveAnnouncements,
  onArchivedAnnouncements,
  onAnnouncementsByRole,
  onAllAnnouncementsByRole,
  getAnnouncementById,
  getUnreadCount,
  getReadStats,
  scheduleAnnouncement,
  shareNoticeWhatsApp,
  broadcastNoticeWhatsApp
} from './notices';

export {
  getWhatsAppPhoneMapping,
  saveWhatsAppPhoneMapping,
  verifyWhatsAppPhoneMapping,
  notificationService
} from './notificationService';

export { notificationScheduler } from './notificationScheduler';

export { notificationTriggers } from './notificationTriggers';
export type { AbsenteeAlertData, FeeDueReminderData, ResultReadyData } from './notificationTriggers';

export {
  onRoutes,
  onRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  onAssignments,
  onStudentAssignment,
  onAssignmentsByClass,
  assignStudent,
  removeAssignment,
  getAssignmentsByRoute,
  onBusLocation,
  onAllBusLocations,
  updateBusLocation,
  createBus,
  updateBus,
  sanitizePhone,
  getRouteETA,
  formatETA
} from './transport';
