import { db } from '@/services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

// ─── Firestore Path Helpers ───

const resultsPath = (schoolId: string) =>
  collection(db, 'schools', schoolId, 'results');

const resultDocPath = (schoolId: string, examId: string, studentId: string) =>
  doc(db, 'schools', schoolId, 'results', `${examId}_${studentId}`);

const examsPath = (schoolId: string) =>
  collection(db, 'schools', schoolId, 'exams');

const examSchedulesPath = (schoolId: string) =>
  collection(db, 'schools', schoolId, 'examSchedules');

// ─── Unified Result Schema ───
// results/{examId}_{studentId}
// {
//   studentId, studentName, rollNo, classId, section,
//   examId, examName,
//   subjects: { subjectName: { marks, maxMarks, grade } },
//   totalMarks, maxTotalMarks, percentage, rank,
//   overallGrade, remarks, teacherRemarks, teacherName,
//   isPublished, publishedAt, createdBy, updatedAt,
//   academicYear, createdAt, showGraceFlag
// }

export interface SubjectMarks {
  marks: number | 'AB' | 'ML';
  maxMarks: number;
  grade: string;
  remarks?: string;
  isGraceApplied?: boolean;
}

export interface UnifiedResult {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  classId: string;
  section?: string;
  examId: string;
  examName: string;
  subjects: Record<string, SubjectMarks>;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  rank?: number;
  overallGrade: string;
  remarks?: string;
  teacherRemarks?: string;
  teacherName?: string;
  isPublished: boolean;
  publishedAt?: Timestamp;
  publishedBy?: string;
  createdBy: string;
  updatedAt?: Timestamp;
  academicYear?: string;
  createdAt?: Timestamp;
  showGraceFlag?: boolean;
  schoolId: string;
}

// ─── Exam Service ───

export const examService = {
  // ── Exams ──

  async createExam(schoolId: string, examData: {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    status: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED';
  }): Promise<string> {
    const docRef = await addDoc(examsPath(schoolId), {
      ...examData,
      schoolId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getExams(schoolId: string): Promise<any[]> {
    const snap = await getDocs(query(examsPath(schoolId), orderBy('startDate', 'desc')));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  async updateExam(schoolId: string, examId: string, data: Partial<any>): Promise<void> {
    await updateDoc(doc(db, 'schools', schoolId, 'exams', examId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteExam(schoolId: string, examId: string): Promise<void> {
    await deleteDoc(doc(db, 'schools', schoolId, 'exams', examId));
  },

  // ── Exam Schedules ──

  async createSchedule(schoolId: string, scheduleData: any): Promise<string> {
    const docRef = await addDoc(examSchedulesPath(schoolId), {
      ...scheduleData,
      schoolId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getSchedules(schoolId: string): Promise<any[]> {
    const snap = await getDocs(query(examSchedulesPath(schoolId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  async deleteSchedule(schoolId: string, scheduleId: string): Promise<void> {
    await deleteDoc(doc(db, 'schools', schoolId, 'examSchedules', scheduleId));
  },

  // ── Results (Unified Schema) ──

  async saveResult(schoolId: string, result: Omit<UnifiedResult, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<void> {
    const ref = resultDocPath(schoolId, result.examId, result.studentId);
    await setDoc(ref, {
      ...result,
      schoolId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  async saveResultsBatch(schoolId: string, results: Omit<UnifiedResult, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    for (const result of results) {
      const ref = resultDocPath(schoolId, result.examId, result.studentId);
      batch.set(ref, {
        ...result,
        schoolId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  },

  async getResult(schoolId: string, examId: string, studentId: string): Promise<UnifiedResult | null> {
    const snap = await getDoc(resultDocPath(schoolId, examId, studentId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UnifiedResult;
  },

  async getResultsByStudent(schoolId: string, studentId: string): Promise<UnifiedResult[]> {
    const snap = await getDocs(
      query(resultsPath(schoolId), where('studentId', '==', studentId), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[];
  },

  async getPublishedResultsByStudent(schoolId: string, studentId: string): Promise<UnifiedResult[]> {
    /*
     * Composite index required (firestore.indexes.json):
     *   collection: results
     *   fields: [studentId ASC, isPublished ASC, createdAt DESC]
     *
     * The path-scoped variant (`schools/{schoolId}/results`) re-uses the
     * same index fields but the index must be defined on the same path.
     */
    const snap = await getDocs(
      query(
        resultsPath(schoolId),
        where('studentId', '==', studentId),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    );
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[];
  },

  async getResultsByClassExam(schoolId: string, classId: string, examId: string): Promise<UnifiedResult[]> {
    const snap = await getDocs(
      query(
        resultsPath(schoolId),
        where('classId', '==', classId),
        where('examId', '==', examId)
      )
    );
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[];
  },

  async publishResult(schoolId: string, examId: string, studentId: string, publishedBy: string): Promise<void> {
    const ref = resultDocPath(schoolId, examId, studentId);
    await updateDoc(ref, {
      isPublished: true,
      publishedAt: serverTimestamp(),
      publishedBy,
      updatedAt: serverTimestamp(),
    });
  },

  async publishAllResults(schoolId: string, examId: string, classId: string, publishedBy: string): Promise<void> {
    // Read all matching results, then atomically publish each inside a single
    // transaction so concurrent edits don't race (e.g. another teacher
    // unpublishing or re-grading mid-publish).
    const results = await this.getResultsByClassExam(schoolId, classId, examId);
    if (results.length === 0) return;

    await runTransaction(db, async (transaction) => {
      // Re-read each result inside the txn so we write against a fresh snapshot.
      for (const r of results) {
        const ref = resultDocPath(schoolId, r.examId, r.studentId);
        const fresh = await transaction.get(ref);
        if (!fresh.exists()) continue;
        // Only flip isPublished if it's not already true — keeps idempotency.
        if (fresh.get('isPublished') === true) continue;
        transaction.update(ref, {
          isPublished: true,
          publishedAt: serverTimestamp(),
          publishedBy,
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  async unpublishResult(schoolId: string, examId: string, studentId: string): Promise<void> {
    const ref = resultDocPath(schoolId, examId, studentId);
    await updateDoc(ref, {
      isPublished: false,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteResult(schoolId: string, examId: string, studentId: string): Promise<void> {
    await deleteDoc(resultDocPath(schoolId, examId, studentId));
  },

  // ── Rank Calculation ──

  async calculateAndSetRanks(schoolId: string, examId: string, classId: string): Promise<void> {
    const results = await this.getResultsByClassExam(schoolId, classId, examId);
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);

    const batch = writeBatch(db);
    sorted.forEach((r, index) => {
      const ref = resultDocPath(schoolId, r.examId, r.studentId);
      batch.update(ref, { rank: index + 1 });
    });
    await batch.commit();
  },

  // ── Real-time Listeners ──

  onResultsByStudent(schoolId: string, studentId: string, callback: (results: UnifiedResult[]) => void): () => void {
    if (IS_MOCK) { callback([]); return () => {}; }
    const q = query(
      resultsPath(schoolId),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[]);
    });
  },

  onPublishedResultsByStudent(schoolId: string, studentId: string, callback: (results: UnifiedResult[]) => void): () => void {
    if (IS_MOCK) { callback([]); return () => {}; }
    const q = query(
      resultsPath(schoolId),
      where('studentId', '==', studentId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[]);
    });
  },

  onResultsByClassExam(schoolId: string, classId: string, examId: string, callback: (results: UnifiedResult[]) => void): () => void {
    if (IS_MOCK) { callback([]); return () => {}; }
    const q = query(
      resultsPath(schoolId),
      where('classId', '==', classId),
      where('examId', '==', examId)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UnifiedResult[]);
    });
  },
};
