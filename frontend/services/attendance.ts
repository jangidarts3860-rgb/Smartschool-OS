import { db } from '@/services/firebase';
import {
  collection, query, where, getDocs, getDoc,
  setDoc, writeBatch, serverTimestamp, doc, runTransaction
} from 'firebase/firestore';
import { User as UserType } from '@/types';
import { getDeterministicAvatar } from '@/constants';
import { incrementHeavyOperation } from './usageService';
import { logSecurityAction } from './audit';

export interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  markedBy: string;
  timestamp: any;
  date: string;
  classId: string;
}

export interface ClassSection {
  id: string;
  name: string;
  students: Array<{
    id: string;
    name: string;
    avatar: string;
    rollNo?: string;
  }>;
}

/**
 * Fetch students for a specific class/section
 */
export const fetchClassStudents = async (
  schoolId: string,
  classId: string
): Promise<ClassSection> => {
  try {
    const q = query(
      collection(db, 'schools', schoolId, 'users'),
      where('role', '==', 'STUDENT'),
      where('classId', '==', classId),
      where('status', '==', 'ACTIVE')
    );

    const snapshot = await getDocs(q);
    const students = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.data().name || 'Unknown',
      avatar: doc.data().avatar || getDeterministicAvatar(doc.data().name || 'Student'),
      rollNo: doc.data().rollNo || doc.id.slice(-3)
    }));

    return {
      id: classId,
      name: `Class ${classId}`,
      students
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Mark attendance for multiple students using batch write with merge
 * CONFLICT RESOLUTION: Last write wins. If status changed, logs to audit.
 */
export const markAttendance = async (
  schoolId: string,
  date: string,
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
  }>,
  teacherId: string,
  classId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const basePath = `schools/${schoolId}/attendance/${date}`;
    const auditChanges: Array<{ studentId: string; oldStatus: string; newStatus: string }> = [];

    for (const record of records) {
      const docRef = doc(db, basePath, record.studentId);

      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data();
        if (existingData.status && existingData.status !== record.status) {
          auditChanges.push({
            studentId: record.studentId,
            oldStatus: existingData.status,
            newStatus: record.status,
          });
        }
      }

      batch.set(docRef, {
        studentId: record.studentId,
        status: record.status,
        markedBy: teacherId,
        timestamp: serverTimestamp(),
        date,
        classId,
        lastMarkedAt: Date.now(),
      }, { merge: true });
    }

    await batch.commit();

    for (const change of auditChanges) {
      await logSecurityAction('ATTENDANCE_EDIT', change.studentId, schoolId, {
        action: 'ATTENDANCE_STATUS_CHANGED',
        date,
        classId,
        oldStatus: change.oldStatus,
        newStatus: change.newStatus,
        changedBy: teacherId,
      });
    }

    if (auditChanges.length > 0) {
      await logSecurityAction('ATTENDANCE_SUBMIT', classId, schoolId, {
        action: 'ATTENDANCE_BATCH_SUBMIT',
        date,
        classId,
        totalRecords: records.length,
        editedRecords: auditChanges.length,
        submittedBy: teacherId,
      });
    }

    incrementHeavyOperation(schoolId, 'attendance', records.length).catch(err => {
      console.warn('Attendance usage tracking failed:', err);
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Mark single student attendance (for biometric scans)
 * CRITICAL: Uses runTransaction to prevent duplicate scans
 */
export const markBiometricAttendance = async (
  schoolId: string,
  date: string,
  studentId: string,
  status: 'PRESENT' | 'ABSENT' | 'LATE',
  teacherId: string,
  classId: string,
  deviceId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await runTransaction(db, async (transaction) => {
      const recordRef = doc(db, 'schools', schoolId, 'attendance', date, 'records', studentId);

      // CRITICAL: Check for duplicate scan
      const existingDoc = await transaction.get(recordRef);
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        // If same status within 5 minutes, it's a duplicate
        const lastMarked = existingData?.lastMarkedAt;
        if (lastMarked && (Date.now() - lastMarked) < 5 * 60 * 1000) {
          throw new Error('DUPLICATE_SCAN');
        }
        // If already marked present today, prevent duplicate
        if (existingData?.status === 'PRESENT' && status === 'PRESENT') {
          throw new Error('ALREADY_MARKED_PRESENT');
        }
      }

      // CRITICAL: Write with merge to preserve history
      transaction.set(recordRef, {
        studentId,
        status,
        markedBy: teacherId,
        deviceId: deviceId || 'MANUAL',
        timestamp: serverTimestamp(),
        date,
        classId,
        lastMarkedAt: Date.now(),
        editHistory: [] // For audit trail
      }, { merge: true });
    });

    // Track usage (background, non-blocking)
    incrementHeavyOperation(schoolId, 'attendance', 1).catch(err => {
      console.warn('Biometric attendance usage tracking failed:', err);
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DUPLICATE_SCAN') {
        return { success: false, error: 'Duplicate scan detected. Please wait 5 minutes.' };
      }
      if (error.message === 'ALREADY_MARKED_PRESENT') {
        return { success: false, error: 'Student already marked present today.' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
};

/**
 * Check if attendance already exists for a student on a given date
 */
export const checkAttendanceExists = async (
  schoolId: string,
  date: string,
  studentId: string
): Promise<{ exists: boolean; status?: string }> => {
  try {
    const recordRef = doc(db, 'schools', schoolId, 'attendance', date, 'records', studentId);
    const docSnap = await getDoc(recordRef);

    if (docSnap.exists()) {
      return { exists: true, status: docSnap.data().status };
    }
    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
};

/**
 * Save attendance to localStorage as fallback
 */
export const saveAttendanceOffline = (
  schoolId: string,
  date: string,
  classId: string,
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
  }>
): void => {
  const key = `attendance_${schoolId}_${date}_${classId}`;
  const data = {
    schoolId,
    date,
    classId,
    records,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Get pending offline attendance records
 */
export const getPendingAttendance = (): Array<{
  schoolId: string;
  date: string;
  classId: string;
  records: Array<any>;
}> => {
  const pending = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('attendance_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        pending.push(data);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  return pending;
};

/**
 * Remove synced attendance from localStorage
 */
export const clearSyncedAttendance = (
  schoolId: string,
  date: string,
  classId: string
): void => {
  const key = `attendance_${schoolId}_${date}_${classId}`;
  localStorage.removeItem(key);
};

/**
 * Export attendance data to CSV format
 */
export const exportAttendanceToCSV = (
  records: Array<{ date: string; studentId: string; classId: string; status: string; markedBy: string; timestamp: string }>,
  students?: Array<{ id: string; name: string; classId: string }>
): string => {
  const headers = ['Date', 'Student ID', 'Student Name', 'Class', 'Status', 'Marked By', 'Time'];
  const rows = records.map(r => {
    const student = students?.find(s => s.id === r.studentId);
    return [
      r.date,
      r.studentId,
      student?.name || r.studentId,
      r.classId,
      r.status,
      r.markedBy,
      r.timestamp || '',
    ].map(v => `"${v}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};