
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type SecurityAction = 
  | 'DELETE_STUDENT' 
  | 'DELETE_TEACHER' 
  | 'EXPORT_FEES' 
  | 'UPDATE_MARKS' 
  | 'LOGIN_FAILURE' 
  | 'UNAUTHORIZED_ACCESS'
  | 'PIRACY_ATTEMPT'
  | 'CREATE_STUDENT'
  | 'UPDATE_STUDENT'
  | 'CREATE_TEACHER'
  | 'UPDATE_TEACHER'
  | 'FEE_PAYMENT'
  | 'FEE_REFUND'
  | 'EXAM_PUBLISH'
  | 'NOTICE_PUBLISH'
  | 'ATTENDANCE_SUBMIT'
  | 'ATTENDANCE_EDIT';

export interface AuditMetadata {
  schoolId?: string;
  classId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  // Additional metadata fields
  action?: string;
  date?: string;
  count?: number;
  status?: string;
  type?: string;
  [key: string]: string | number | boolean | undefined | Record<string, unknown> | null;
}

export const logSecurityAction = async (
  action: SecurityAction, 
  targetId: string, 
  schoolId: string,
  metadata: AuditMetadata = {}
) => {
  try {
    const user = auth.currentUser;

    // FIXED: Security logs are now properly scoped to schoolId (Multi-tenant isolation)
    const logRef = collection(db, 'schools', schoolId, 'security_logs');

    // Use a unique anonymous id (prefixed) when no auth — still traceable in logs.
    const anonymousUid = `anon-${(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;

    await addDoc(logRef, {
      actorUid: user?.uid || anonymousUid,
      actorEmail: user?.email || 'N/A',
      schoolId, // Critical for multi-tenant isolation
      action,
      targetId,
      metadata: {
        ...metadata,
        schoolId,
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      },
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[Security Audit] Failed to log action:', action, error);
    
    // RESILIENCE: Queue failed logs to localStorage for retry
    if (typeof window !== 'undefined') {
      const pendingLogs = JSON.parse(localStorage.getItem('pending_audit_logs') || '[]');
      pendingLogs.push({
        action,
        targetId,
        schoolId,
        metadata,
        timestamp: Date.now(),
        retryCount: 0
      });
      localStorage.setItem('pending_audit_logs', JSON.stringify(pendingLogs.slice(-50))); // Keep last 50
    }
  }
};

/**
 * Background worker to retry failed audit logs.
 */
export const processPendingAuditLogs = async () => {
  if (typeof window === 'undefined') return;
  
  const pendingLogs = JSON.parse(localStorage.getItem('pending_audit_logs') || '[]');
  if (pendingLogs.length === 0) return;
  
  const remainingLogs = [];
  for (const log of pendingLogs) {
    try {
      await logSecurityAction(log.action, log.targetId, log.schoolId, log.metadata);
    } catch (e) {
      if (log.retryCount < 3) {
        remainingLogs.push({ ...log, retryCount: log.retryCount + 1 });
      }
    }
  }
  localStorage.setItem('pending_audit_logs', JSON.stringify(remainingLogs));
};
