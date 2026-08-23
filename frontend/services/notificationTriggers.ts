import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { FeeRecord } from '@/types';

export interface AbsenteeAlertData {
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  markedBy: string;
}

export interface FeeDueReminderData {
  schoolId: string;
  studentId: string;
  studentName: string;
  amountDue: number;
  dueDate: string;
  className: string;
}

export interface ResultReadyData {
  schoolId: string;
  studentId: string;
  studentName: string;
  examName: string;
  overallGrade: string;
}

type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

const shouldNotify = async (
  schoolId: string,
  userId: string,
  priority: NotificationPriority
): Promise<boolean> => {
  try {
    const userSnap = await getDoc(doc(db, 'schools', schoolId, 'users', userId));
    if (!userSnap.exists()) return true;
    const data = userSnap.data() as { notificationPreferences?: { silentMode?: boolean } };
    const silentMode = data?.notificationPreferences?.silentMode === true;
    if (!silentMode) return true;
    return priority === 'URGENT' || priority === 'HIGH';
  } catch (err) {
    console.warn('[notificationTriggers] shouldNotify check failed, defaulting to true:', err);
    return true;
  }
};

const dispatchWhatsAppFeeReminder = async (
  schoolId: string,
  studentName: string,
  amountDue: number,
  dueDate: string,
  parentPhone: string | undefined,
  isOverdue: boolean
): Promise<void> => {
  // The dedicated `sendWhatsAppFeeReminder` Cloud Function does not exist yet.
  // The closest is `sendWhatsAppInvite` (functions/src/invites.ts) but it only
  // handles the predefined template types in WhatsAppTemplate — no FEE_DUE_REMINDER.
  // Until a dedicated function is added, WhatsApp dispatch is a no-op. The
  // in-app notification is still created above and visible to the parent.
  if (!parentPhone || !isOverdue) return;
  return;
};

export const notificationTriggers = {
  absenteeAlert: async (data: AbsenteeAlertData) => {
    try {
      const parentQuery = query(
        collection(db, 'schools', data.schoolId, 'users'),
        where('role', '==', 'PARENT'),
        where('childrenIds', 'array-contains', data.studentId)
      );

      const parentSnapshot = await getDocs(parentQuery);

      if (parentSnapshot.empty) {
        console.warn('No parent found for student:', data.studentId);
        return;
      }

      const batch = writeBatch(db);
      let notificationCount = 0;
      let skippedCount = 0;

      for (const parentDoc of parentSnapshot.docs) {
        const allowed = await shouldNotify(data.schoolId, parentDoc.id, 'URGENT');
        if (!allowed) {
          skippedCount++;
          continue;
        }
        const notifRef = doc(collection(db, 'schools', data.schoolId, 'users', parentDoc.id, 'notifications'));
        batch.set(notifRef, {
          title: 'Student Absent',
          message: `${data.studentName} (${data.className}) was marked absent on ${data.date} by ${data.markedBy}.`,
          type: 'ATTENDANCE',
          isRead: false,
          priority: 'URGENT',
          createdAt: serverTimestamp(),
        });
        notificationCount++;
      }

      if (notificationCount > 0) await batch.commit();
      console.log(`Sent ${notificationCount} absentee notifications (skipped ${skippedCount} via silentMode)`);
    } catch (error) {
      console.error('Failed to send absentee alert:', error);
      toast.error('Failed to send absentee alert');
    }
  },

  feeDueReminder: async (data: FeeDueReminderData) => {
    try {
      const parentQuery = query(
        collection(db, 'schools', data.schoolId, 'users'),
        where('role', '==', 'PARENT'),
        where('childrenIds', 'array-contains', data.studentId)
      );

      const parentSnapshot = await getDocs(parentQuery);

      if (parentSnapshot.empty) {
        console.warn('No parent found for student:', data.studentId);
        return;
      }

      const isOverdue = new Date(data.dueDate) < new Date(new Date().toISOString().split('T')[0]!);

      const batch = writeBatch(db);
      let notificationCount = 0;
      let skippedCount = 0;
      const whatsAppTargets: Array<{ phone: string; parentId: string }> = [];

      for (const parentDoc of parentSnapshot.docs) {
        const allowed = await shouldNotify(data.schoolId, parentDoc.id, isOverdue ? 'URGENT' : 'MEDIUM');
        if (!allowed) {
          skippedCount++;
          continue;
        }
        const notifRef = doc(collection(db, 'schools', data.schoolId, 'users', parentDoc.id, 'notifications'));
        batch.set(notifRef, {
          title: isOverdue ? 'Fee Overdue' : 'Fee Due Reminder',
          message: isOverdue
            ? `OVERDUE: Fee of ₹${data.amountDue} for ${data.studentName} (${data.className}) was due on ${data.dueDate}. Please pay immediately to avoid late fees.`
            : `Fee of ₹${data.amountDue} for ${data.studentName} (${data.className}) is due on ${data.dueDate}.`,
          type: 'FEES',
          isRead: false,
          priority: isOverdue ? 'URGENT' : 'MEDIUM',
          createdAt: serverTimestamp(),
          actionUrl: '/parent/fees',
        });
        notificationCount++;

        const parentData = parentDoc.data() as { phone?: string; parentPhone?: string };
        const phone = parentData.phone || parentData.parentPhone;
        if (phone) whatsAppTargets.push({ phone, parentId: parentDoc.id });
      }

      if (notificationCount > 0) await batch.commit();
      console.log(`Sent ${notificationCount} fee due notifications (skipped ${skippedCount} via silentMode)`);

      if (isOverdue) {
        for (const target of whatsAppTargets) {
          await dispatchWhatsAppFeeReminder(
            data.schoolId,
            data.studentName,
            data.amountDue,
            data.dueDate,
            target.phone,
            true
          );
        }
      }
    } catch (error) {
      console.error('Failed to send fee due reminder:', error);
      toast.error('Failed to send fee reminder');
    }
  },

  resultReady: async (data: ResultReadyData) => {
    try {
      const parentQuery = query(
        collection(db, 'schools', data.schoolId, 'users'),
        where('role', '==', 'PARENT'),
        where('childrenIds', 'array-contains', data.studentId)
      );

      const parentSnapshot = await getDocs(parentQuery);

      if (parentSnapshot.empty) {
        console.warn('No parent found for student:', data.studentId);
        return;
      }

      const batch = writeBatch(db);
      let notificationCount = 0;
      let skippedCount = 0;

      for (const parentDoc of parentSnapshot.docs) {
        const allowed = await shouldNotify(data.schoolId, parentDoc.id, 'MEDIUM');
        if (!allowed) {
          skippedCount++;
          continue;
        }
        const notifRef = doc(collection(db, 'schools', data.schoolId, 'users', parentDoc.id, 'notifications'));
        batch.set(notifRef, {
          title: 'Result Available',
          message: `${data.studentName}'s results for ${data.examName} are now available. Grade: ${data.overallGrade}`,
          type: 'NOTICE',
          isRead: false,
          priority: 'MEDIUM',
          createdAt: serverTimestamp(),
          actionUrl: '/parent/results',
        });
        notificationCount++;
      }

      if (notificationCount > 0) await batch.commit();
      console.log(`Sent ${notificationCount} result notifications (skipped ${skippedCount} via silentMode)`);
    } catch (error) {
      console.error('Failed to send result notification:', error);
      toast.error('Failed to send result notification');
    }
  },

  homeworkDueReminder: async (schoolId: string, homeworkId: string) => {
    try {
      const homeworkDoc = await getDoc(doc(db, 'schools', schoolId, 'homework', homeworkId));
      if (!homeworkDoc.exists()) return;

      const homework = homeworkDoc.data();

      // 1) Pre-fetch all parents for this school ONCE
      const allParentsSnap = await getDocs(query(
        collection(db, 'schools', schoolId, 'users'),
        where('role', '==', 'PARENT')
      ));
      // Build a map studentId -> [parentDocs] to avoid N+1
      const parentsByStudent = new Map<string, Array<{ id: string; data: any }>>();
      allParentsSnap.docs.forEach((p: any) => {
        const data = p.data() as { childrenIds?: string[] };
        const kids = Array.isArray(data.childrenIds) ? data.childrenIds : [];
        kids.forEach((sid) => {
          if (!parentsByStudent.has(sid)) parentsByStudent.set(sid, []);
          parentsByStudent.get(sid)!.push({ id: p.id, data });
        });
      });

      // 2) Fetch the class roster
      const studentsQuery = query(
        collection(db, 'schools', schoolId, 'users'),
        where('role', '==', 'STUDENT'),
        where('classId', '==', homework.classId)
      );
      const studentsSnapshot = await getDocs(studentsQuery);

      const batch = writeBatch(db);
      let notificationCount = 0;
      let skippedCount = 0;

      for (const studentDoc of studentsSnapshot.docs) {
        const linkedParents = parentsByStudent.get(studentDoc.id) || [];
        for (const parent of linkedParents) {
          const allowed = await shouldNotify(schoolId, parent.id, 'LOW');
          if (!allowed) {
            skippedCount++;
            continue;
          }
          const notifRef = doc(collection(db, 'schools', schoolId, 'users', parent.id, 'notifications'));
          batch.set(notifRef, {
            title: 'Homework Due Tomorrow',
            message: `Homework "${homework.title}" for ${homework.subject} is due tomorrow.`,
            type: 'HOMEWORK',
            isRead: false,
            priority: 'LOW',
            createdAt: serverTimestamp(),
            actionUrl: '/parent/homework',
          });
          notificationCount++;
        }
      }

      if (notificationCount > 0) await batch.commit();
      console.log(`Sent ${notificationCount} homework reminders (skipped ${skippedCount} via silentMode)`);
    } catch (error) {
      console.error('Failed to send homework reminder:', error);
    }
  },
};