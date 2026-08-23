import { db, storage } from '@/services/firebase';
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Homework, HomeworkSubmission, HomeworkAttachment } from '@/types';
import { MOCK_HOMEWORK } from '@/constants';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

export function getHomeworkRef(schoolId: string, homeworkId?: string) {
  const col = collection(db, 'schools', schoolId, 'homework');
  return homeworkId ? doc(col, homeworkId) : doc(col);
}

export function getSubmissionsRef(schoolId: string, homeworkId: string, submissionId?: string) {
  const col = collection(db, 'schools', schoolId, 'homework', homeworkId, 'submissions');
  return submissionId ? doc(col, submissionId) : doc(col);
}

export async function createHomework(
  schoolId: string,
  data: Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (IS_MOCK) return 'mock-' + Date.now();
  const docRef = getHomeworkRef(schoolId);
  const now = new Date().toISOString();
  await setDoc(docRef, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateHomework(
  schoolId: string,
  homeworkId: string,
  data: Partial<Homework>
): Promise<void> {
  if (IS_MOCK) return;
  const docRef = getHomeworkRef(schoolId, homeworkId);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteHomework(schoolId: string, homeworkId: string): Promise<void> {
  if (IS_MOCK) return;
  await deleteDoc(getHomeworkRef(schoolId, homeworkId));
}

export async function getHomeworkById(schoolId: string, homeworkId: string): Promise<Homework | null> {
  if (IS_MOCK) return MOCK_HOMEWORK.find(h => h.id === homeworkId) || MOCK_HOMEWORK[0] || null;
  const snap = await getDoc(getHomeworkRef(schoolId, homeworkId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Homework) : null;
}

export function onHomeworkByTeacher(
  schoolId: string,
  teacherId: string,
  callback: (homework: Homework[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_HOMEWORK); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, 'homework'),
    where('teacherId', '==', teacherId)
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Homework[];
    callback(items);
  }, (err) => {
    console.warn('onHomeworkByTeacher query error:', err);
    callback([]);
  });
}

export function onHomeworkByClass(
  schoolId: string,
  classId: string,
  callback: (homework: Homework[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_HOMEWORK); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, 'homework'),
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Homework[];
    callback(items);
  }, (err) => {
    console.warn('onHomeworkByClass query error:', err);
    callback([]);
  });
}

export function onAllHomework(
  schoolId: string,
  callback: (homework: Homework[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_HOMEWORK); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, 'homework')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Homework[];
    callback(items);
  }, (err) => {
    console.warn('onAllHomework query error:', err);
    callback([]);
  });
}

export async function submitHomework(
  schoolId: string,
  homeworkId: string,
  submissionData: {
    studentId: string;
    studentName: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    textContent?: string;
    isLate: boolean;
  }
): Promise<string> {
  if (IS_MOCK) return 'mock-sub-' + Date.now();
  const submissionsCol = collection(db, 'schools', schoolId, 'homework', homeworkId, 'submissions');
  const docRef = doc(submissionsCol);

  // P1: isLate flag from the client is untrusted. Re-derive it server-side
  // from the homework's dueDate. Server truth wins.
  const homeworkSnap = await getDoc(getHomeworkRef(schoolId, homeworkId));
  let serverIsLate = submissionData.isLate;
  if (homeworkSnap.exists()) {
    const due = homeworkSnap.data().dueDate;
    const dueMs = due?.toMillis ? due.toMillis() : (due ? new Date(due).getTime() : NaN);
    if (!Number.isNaN(dueMs)) {
      serverIsLate = Date.now() > dueMs;
    }
  }

  await setDoc(docRef, {
    homeworkId,
    ...submissionData,
    isLate: serverIsLate,
    submittedAt: new Date().toISOString(),
    status: serverIsLate ? 'LATE_SUBMITTED' : 'SUBMITTED',
    grade: undefined,
    feedback: undefined,
    gradedBy: undefined,
    gradedAt: undefined,
  });
  return docRef.id;
}

export async function gradeSubmission(
  schoolId: string,
  homeworkId: string,
  submissionId: string,
  gradeData: {
    grade: number;
    maxGrade: number;
    feedback?: string;
    gradedBy: string;
  }
): Promise<void> {
  if (IS_MOCK) return;
  const docRef = getSubmissionsRef(schoolId, homeworkId, submissionId);
  await updateDoc(docRef, {
    ...gradeData,
    status: 'GRADED',
    gradedAt: new Date().toISOString(),
  });
}

export function onSubmissions(
  schoolId: string,
  homeworkId: string,
  callback: (submissions: HomeworkSubmission[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, 'homework', homeworkId, 'submissions'),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as HomeworkSubmission[]);
  });
}

export function onStudentSubmissionsAcross(
  schoolId: string,
  studentId: string,
  callback: (submissions: HomeworkSubmission[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const subsRef = collectionGroup(db, 'submissions');
  const q = query(
    subsRef,
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc'),
    limit(200)
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })) as HomeworkSubmission[]),
    (err) => {
      console.warn('Student submissions listener error:', err);
      callback([]);
    }
  );
}

export async function getSubmissionByStudent(
  schoolId: string,
  homeworkId: string,
  studentId: string
): Promise<HomeworkSubmission | null> {
  if (IS_MOCK) return null;
  const q = query(
    collection(db, 'schools', schoolId, 'homework', homeworkId, 'submissions'),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0];
  return { id: first.id, ...first.data() } as HomeworkSubmission;
}

export async function uploadAttachment(
  schoolId: string,
  homeworkId: string,
  file: File,
  isSubmission = false
): Promise<{ url: string; name: string; size: number }> {
  // P1: sanitize the fileName — strip path components and unsafe characters
  // so a malicious filename can't escape the homework prefix or smuggle
  // characters that break storage rules / storage browsers.
  const baseName = file.name.split('/').pop()?.split('\\').pop() ?? 'file';
  const safeName = baseName.replace(/[^\w.\-]/g, '_') || 'file';
  const path = isSubmission
    ? `schools/${schoolId}/homework/${homeworkId}/submissions/${Date.now()}_${safeName}`
    : `schools/${schoolId}/homework/${homeworkId}/${Date.now()}_${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, name: safeName, size: file.size };
}

export async function deleteAttachment(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch {
    console.warn('Failed to delete attachment from storage');
  }
}

export async function getHomeworkByStudent(
  schoolId: string,
  studentClassId: string
): Promise<Homework[]> {
  if (IS_MOCK) return MOCK_HOMEWORK;
  const q = query(
    collection(db, 'schools', schoolId, 'homework'),
    where('classId', '==', studentClassId),
    orderBy('dueDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Homework[];
}

export async function getCompletionStats(
  schoolId: string,
  homeworkId: string,
  totalStudents: number
): Promise<{ submitted: number; graded: number; pending: number; late: number }> {
  if (IS_MOCK) {
    const submitted = MOCK_HOMEWORK.filter(h => h.id === homeworkId).length > 0 ? Math.min(totalStudents, 4) : 0;
    return { submitted, graded: 1, pending: totalStudents - submitted, late: 1 };
  }
  const q = query(
    collection(db, 'schools', schoolId, 'homework', homeworkId, 'submissions')
  );
  const snap = await getDocs(q);
  const submissions = snap.docs.map((d: any) => d.data()) as HomeworkSubmission[];
  return {
    submitted: submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED' || s.status === 'LATE_SUBMITTED').length,
    graded: submissions.filter(s => s.status === 'GRADED').length,
    pending: totalStudents - submissions.length,
    late: submissions.filter(s => s.isLate).length,
  };
}
