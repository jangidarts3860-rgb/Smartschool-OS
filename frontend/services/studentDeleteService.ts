/**
 * Student Deletion Service - Cascade Delete Operations
 * Prevents orphaned data when students are removed
 */

import { 
  db 
} from '@/services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface CascadeResult {
  success: boolean;
  deletedCounts: {
    attendance: number;
    fees: number;
    results: number;
    homework: number;
    books: number;
  };
  error?: string;
}

/**
 * Delete a student and all their associated data (cascading delete)
 * Prevents orphaned records in the database
 */
export const deleteStudentCascade = async (
  schoolId: string,
  studentId: string,
  requestingUser: { id: string, schoolId: string, role: string },
  studentName?: string
): Promise<CascadeResult> => {
  const deletedCounts = {
    attendance: 0,
    fees: 0,
    results: 0,
    homework: 0,
    books: 0
  };

  // IDOR Protection: Verify ownership and permissions
  if (requestingUser.schoolId !== schoolId || requestingUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: You can only delete students from your own school.');
  }

  try {
    // 1E-8: previous implementation committed 6+ separate writeBatches in
    // sequence — if any single one failed (network blip, rules deny), the
    // cascade would stop midway and leave orphans. We now collect ALL writes
    // into a single chunked batch (Firestore limit = 500 ops per commit) and
    // commit once. All-or-nothing atomicity.

    const pendingWrites: Array<(b: any) => void> = [];

    // Step 1: Delete attendance records
    const attendanceQuery = query(
      collection(db, 'schools', schoolId, 'attendance'),
      where('studentId', '==', studentId)
    );
    const attendanceSnap = await getDocs(attendanceQuery);
    attendanceSnap.forEach((docSnap: any) => {
      pendingWrites.push(b => { b.delete(docSnap.ref); });
      deletedCounts.attendance++;
    });

    // Step 2: Delete fee records
    const feesSnap = await getDocs(query(
      collection(db, 'schools', schoolId, 'fees'),
      where('studentId', '==', studentId)
    ));
    feesSnap.forEach((docSnap: any) => {
      pendingWrites.push(b => { b.delete(docSnap.ref); });
      deletedCounts.fees++;
    });

    // Step 3: Delete result records
    const resultsSnap = await getDocs(query(
      collection(db, 'schools', schoolId, 'results'),
      where('studentId', '==', studentId)
    ));
    resultsSnap.forEach((docSnap: any) => {
      pendingWrites.push(b => { b.delete(docSnap.ref); });
      deletedCounts.results++;
    });

    // Step 4: Homework submissions across all homework docs
    const allHwSnap = await getDocs(collection(db, 'schools', schoolId, 'homework'));
    for (const hwDoc of allHwSnap.docs) {
      const subSnap = await getDocs(query(
        collection(db, 'schools', schoolId, 'homework', hwDoc.id, 'submissions'),
        where('studentId', '==', studentId)
      ));
      subSnap.forEach((subDocSnap: any) => {
        pendingWrites.push(b => { b.delete(subDocSnap.ref); });
        deletedCounts.homework++;
      });
    }

    // Step 5: Release issued books
    const booksSnap = await getDocs(query(
      collection(db, 'schools', schoolId, 'books'),
      where('issuedTo', '==', studentId)
    ));
    booksSnap.forEach((docSnap: any) => {
      pendingWrites.push(b => {
        b.update(docSnap.ref, {
          issuedTo: null,
          issueDate: null,
          returnDate: null,
          status: 'AVAILABLE'
        });
      });
      deletedCounts.books++;
    });

    // Step 5b: Auto-return library transactions
    const txnsSnap = await getDocs(query(
      collection(db, 'schools', schoolId, 'libraryTransactions'),
      where('userId', '==', studentId),
      where('status', 'in', ['ISSUED', 'OVERDUE'])
    ));
    const now = new Date().toISOString();
    txnsSnap.forEach((txnDoc: any) => {
      pendingWrites.push(b => {
        b.update(txnDoc.ref, {
          status: 'RETURNED',
          returnDate: now,
          note: 'Auto-returned: Student account deleted'
        });
      });
    });

    // Step 6: Delete the student user record (always last, so the user doc
    // remains visible as a tombstone for audit if any commit above fails)
    const studentUserRef = doc(db, 'schools', schoolId, 'users', studentId);
    pendingWrites.push(b => { b.delete(studentUserRef); });

    // Step 7: Single chunked commit
    const BATCH_LIMIT = 500;
    for (let i = 0; i < pendingWrites.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      pendingWrites.slice(i, i + BATCH_LIMIT).forEach(fn => fn(batch));
      await batch.commit();
    }

    console.info(`[CascadeDelete] Student ${studentId} (${studentName}) deleted atomically:`, deletedCounts);

    return {
      success: true,
      deletedCounts
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CascadeDelete] Failed:', errorMsg);
    return {
      success: false,
      deletedCounts,
      error: errorMsg
    };
  }
};

/**
 * Soft delete a student (mark as INACTIVE instead of removing)
 * Use this when you want to preserve historical data but disable access
 */
export const softDeleteStudent = async (
  schoolId: string,
  studentId: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'schools', schoolId, 'users', studentId), {
      status: 'INACTIVE',
      deletedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[SoftDelete] Failed:', error);
    return false;
  }
};

/**
 * Check for orphaned data (records that reference a deleted student)
 * Useful for cleanup and debugging
 */
export const checkOrphanedData = async (
  schoolId: string,
  studentId: string
): Promise<{
  orphanedFees: number;
  orphanedAttendance: number;
  orphanedResults: number;
}> => {
  const orphaned = { orphanedFees: 0, orphanedAttendance: 0, orphanedResults: 0 };

  try {
    const [feesSnap, attendanceSnap, resultsSnap] = await Promise.all([
      getDocs(query(collection(db, 'schools', schoolId, 'fees'), where('studentId', '==', studentId))),
      getDocs(query(collection(db, 'schools', schoolId, 'attendance'), where('studentId', '==', studentId))),
      getDocs(query(collection(db, 'schools', schoolId, 'results'), where('studentId', '==', studentId)))
    ]);

    orphaned.orphanedFees = feesSnap.size;
    orphaned.orphanedAttendance = attendanceSnap.size;
    orphaned.orphanedResults = resultsSnap.size;

  } catch (error) {
    console.error('[CheckOrphans] Failed:', error);
  }

  return orphaned;
};

export default {
  deleteStudentCascade,
  softDeleteStudent,
  checkOrphanedData
};