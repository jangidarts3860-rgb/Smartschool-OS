import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { notificationTriggers } from './notificationTriggers';
import { FeeRecord } from '@/types';

export const notificationScheduler = {
  checkDueFees: async (schoolId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]!;

      const feesQuery = query(
        collection(db, 'schools', schoolId, 'fees'),
        where('status', 'in', ['PENDING', 'PARTIAL', 'OVERDUE'])
      );

      const snapshot = await getDocs(feesQuery);

      const dueFees: FeeRecord[] = [];
      snapshot.forEach((d: any) => {
        const fee = d.data() as FeeRecord;
        const dueDate = fee.dueDate;
        if (dueDate && dueDate <= today) {
          dueFees.push({ ...fee, id: d.id });
        }
      });

      for (const fee of dueFees) {
        try {
          const userDoc = await getDocs(query(
            collection(db, 'schools', schoolId, 'users'),
            where('id', '==', fee.studentId)
          ));

          if (!userDoc.empty) {
            const studentData = userDoc.docs[0].data();
            await notificationTriggers.feeDueReminder({
              schoolId,
              studentId: fee.studentId,
              studentName: fee.studentName || studentData.name || 'Unknown',
              amountDue: fee.totalAmount - fee.amountPaid,
              dueDate: fee.dueDate || today,
              className: fee.classId || '',
            });
          }
        } catch (err) {
          console.warn(`Failed to send fee reminder for student ${fee.studentId}:`, err);
        }
      }

      console.log(`Processed ${dueFees.length} due fee reminders for school ${schoolId}`);
    } catch (error) {
      console.error('Failed to check due fees:', error);
    }
  },

  checkLowAttendance: async (schoolId: string) => {
    try {
      const studentsQuery = query(
        collection(db, 'schools', schoolId, 'users'),
        where('role', '==', 'STUDENT')
      );

      const snapshot = await getDocs(studentsQuery);

      for (const studentDoc of snapshot.docs) {
        const student = studentDoc.data();
        const studentId = studentDoc.id;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const attendanceQuery = query(
          collection(db, 'schools', schoolId, 'attendance'),
          where('date', '>=', `${currentMonth}-01`)
        );

        const attSnapshot = await getDocs(attendanceQuery);

        let presentCount = 0;
        let totalCount = 0;

        attSnapshot.forEach((d: any) => {
          const records = d.data().records || [];
          const studentRecord = records.find((r: { studentId: string }) => r.studentId === studentId);
          if (studentRecord) {
            totalCount++;
            if (studentRecord.status === 'PRESENT') presentCount++;
          }
        });

        if (totalCount > 0) {
          const percentage = (presentCount / totalCount) * 100;

          if (percentage < 75) {
            const parentQuery = query(
              collection(db, 'schools', schoolId, 'users'),
              where('role', '==', 'PARENT'),
              where('childrenIds', 'array-contains', studentId)
            );

            const parentSnapshot = await getDocs(parentQuery);

            const batch = writeBatch(db);

            parentSnapshot.docs.forEach((parentDoc: any) => {
              const notifRef = doc(collection(db, 'schools', schoolId, 'users', parentDoc.id, 'notifications'));
              batch.set(notifRef, {
                title: 'Low Attendance Alert',
                message: `${student.name}'s attendance is ${percentage.toFixed(1)}% this month. Please encourage regular attendance.`,
                type: 'ATTENDANCE',
                isRead: false,
                priority: 'MEDIUM',
                createdAt: serverTimestamp(),
              });
            });

            await batch.commit();
          }
        }
      }
    } catch (error) {
      console.error('Failed to check low attendance:', error);
    }
  },

  initializeDailyJob: (_schoolId?: string) => {
    // DEPRECATED: client-side setInterval/setTimeout is not reliable — it only
    // runs while the SPA is open, gets cleared on every navigation/reload, and
    // does not respect school-tenant boundaries (it would charge every open
    // browser tab against the same schoolId from localStorage).
    //
    // The correct implementation is a scheduled Cloud Function
    // (functions/src/scheduledNotices.ts is the template). When that exists,
    // call it from there and remove this function.
    console.warn(
      '[notificationScheduler] initializeDailyJob() is deprecated and does nothing. ' +
      'Migrate to a Cloud Function scheduled with functions.pubsub.schedule().'
    );
  },
};
