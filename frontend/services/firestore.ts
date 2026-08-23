
import { User, UserRole } from '@/types';
import { withRetry, AppError } from '@/utils/resilience';
import { logSecurityAction } from './audit';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_USERS, MOCK_CLASSES } from '@/constants';

const IS_DEMO_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

// Client-side rate limiting was previously implemented here as a local Map
// synced via localStorage. It was trivially bypassable (clear localStorage /
// cross-tab) and is replaced by the canonical Firestore-backed rate limit
// in `services/rateLimit.ts` (auth flows) and the Cloud Function
// `functions/src/rateLimit.ts` (server-enforced per-action limits).

const isDev = import.meta.env.DEV;
const log = {
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); }
};

// FIXED: Type-safe batch operation interface
export interface BatchOperation<T = DocumentData> {
  ref: DocumentReference<T>;
  data: Partial<T>;
  type: 'set' | 'update' | 'delete';
}

// FIXED: Type-safe school metadata interface
export interface SchoolMetadata {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  academicYear?: string;
  established?: number;
}

// FIXED: Type-safe class interface
export interface SchoolClass {
  id: string;
  name: string;
  section?: string;
  classTeacherId?: string;
  subjects?: string[];
  studentCount?: number;
  createdAt?: unknown;
}

// FIXED: Type-safe student interface (subset of User)
export interface StudentRecord {
  id: string;
  name: string;
  rollNo?: string | number;
  classId?: string;
  section?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  address?: string;
  dob?: string;
  bloodGroup?: string;
  avatar?: string;
  status?: string;
  createdAt?: unknown;
}

/**
 * SRE UTILITY: Chunked Batch Processor
 * Firestore limits batches to 500 operations. This engine handles 1000+ operations 
 * by automatically chunking them into multiple atomic batches.
 */
export const writeBatchChunked = async (
    operations: BatchOperation[]
) => {
    const CHUNK_SIZE = 450; // Safety margin below 500
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        const chunk = operations.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(op => {
            if (op.type === 'set') batch.set(op.ref as DocumentReference, op.data as Record<string, unknown>);
            else if (op.type === 'update') batch.update(op.ref as DocumentReference, op.data as Record<string, unknown>);
            else if (op.type === 'delete') batch.delete(op.ref as DocumentReference);
        });
        await batch.commit();
    }
};

export const userService = {
  async getUser(uid: string): Promise<User | null> {
    log.debug(`[Auth] Fetching profile for UID: ${uid}`);
    try {
        return await withRetry(async () => {
            const registryDoc = await getDoc(doc(db, 'users', uid));
            if (!registryDoc.exists()) {
                log.warn(`[Auth] UID ${uid} not found in global registry.`);
                return null;
            }

            const registryData = registryDoc.data();
            if (!registryData?.schoolId) {
                log.error(`[Auth] UID ${uid} has no schoolId in registry.`);
                return null;
            }

            const { schoolId } = registryData;

            const profileDoc = await getDoc(doc(db, 'schools', schoolId, 'users', uid));
            if (profileDoc.exists()) {
                const data = profileDoc.data();
                if (!data) {
                    log.error(`[Auth] UID ${uid} profile data is empty.`);
                    return null;
                }
                return {
                    ...data,
                    id: uid,
                    schoolId: schoolId,
                    phone: data.phone_number || data.phone,
                    avatar: data.profile_image_url || data.avatar
                } as User;
            }
            log.warn(`[Auth] UID ${uid} profile not found in school ${schoolId}.`);
            return null;
        }, 'userService.getUser');
    } catch (error) {
        log.error("CRITICAL: getUser failed:", error);
        throw new AppError('Failed to fetch user profile', 'USER_FETCH_ERROR', String(error));
    }
  },

  async createUser(user: User): Promise<void> {
    try {
        const batch = writeBatch(db);
        // 1. Registry Pointer
        batch.set(doc(db, 'users', user.id), {
            uid: user.id,
            schoolId: user.schoolId,
            role: user.role,
            uniqueId: user.uniqueId
        });
        // 2. Nested Profile
        batch.set(doc(db, 'schools', user.schoolId, 'users', user.id), {
            ...user,
            createdAt: serverTimestamp()
        });
        await batch.commit();
    } catch (error) {
        log.error("CreateUser failed:", error);
        throw error;
    }
  },

 async getUserByUniqueId(uniqueId: string, requestingSchoolId?: string): Promise<User | null> {
       try {
           const q = query(collection(db, 'users'), where('uniqueId', '==', uniqueId), limit(1));
           const snapshot = await getDocs(q);
           if (!snapshot.empty) {
               const { uid, schoolId } = snapshot.docs[0].data() as { uid: string; uniqueId: string; schoolId?: string };
               // IDOR Protection: Verify requesting user has access to this school
               if (requestingSchoolId && schoolId && schoolId !== requestingSchoolId) {
                 log.warn(`[IDOR] Blocked cross-school access attempt for uniqueId: ${uniqueId}`);
                 return null;
               }
   return this.getUser(uid);
           }
           return null;
       } catch (error) {
           log.error("getUserByUniqueId failed:", error);
           return null;
       }
     },

   async getAllUsers(schoolId: string): Promise<User[]> {
     if (IS_DEMO_MODE) return MOCK_USERS;
     try {
         const q = query(
           collection(db, 'schools', schoolId, 'users'),
           limit(50)
         );
         const snapshot = await getDocs(q);
         return snapshot.docs.map((doc: any) => ({
           id: doc.id,
           ...doc.data()
 })) as User[];
      } catch (error) {
          log.error("getAllUsers failed:", error);
          return [];
      }
   },

async updateUser(uid: string, data: Partial<User>, requestingSchoolId?: string): Promise<void> {
      try {
        const registryDoc = await getDoc(doc(db, 'users', uid));
        if (!registryDoc.exists()) return;
        const registryData = registryDoc.data();
        const { schoolId } = registryData;
        
        // IDOR Protection: Verify requesting user has access to this school
        if (requestingSchoolId && schoolId && schoolId !== requestingSchoolId) {
          log.warn(`[IDOR] Blocked cross-school update attempt for uid: ${uid}`);
          throw new AppError('Access denied', 'IDOR_VIOLATION', 'userService.updateUser');
        }
        
        await updateDoc(doc(db, 'schools', schoolId, 'users', uid), data);
      } catch (error) {
        log.error("updateUser failed:", error);
        throw error;
      }
    }
};

export const schoolService = {
  async getStudents(schoolId: string, maxLimit: number = 50): Promise<StudentRecord[]> {
    if (IS_DEMO_MODE) {
      return MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, maxLimit) as unknown as StudentRecord[];
    }
    try {
      // 1C-1: students are stored in schools/{id}/users with role==STUDENT, not
      // in a separate `students` subcollection. The legacy collection is empty
      // for all tenants that went through the live signup/import path.
      const q = query(
        collection(db, 'schools', schoolId, 'users'),
        where('role', '==', 'STUDENT'),
        limit(maxLimit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as StudentRecord[];
    } catch (error) {
      log.error("getStudents failed:", error);
      return [];
    }
  },

  async getTeachers(schoolId: string): Promise<StudentRecord[]> {
    if (IS_DEMO_MODE) {
      return MOCK_USERS.filter(u => u.role === UserRole.TEACHER) as unknown as StudentRecord[];
    }
    try {
      const q = query(
        collection(db, 'schools', schoolId, 'users'),
        where('role', '==', 'TEACHER'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email,
        phone: doc.data().phone,
        uniqueId: doc.data().uniqueId
      })) as StudentRecord[];
    } catch (error) {
      log.error("getTeachers failed:", error);
      return [];
    }
  },

  async getChildren(parentId: string, schoolId: string): Promise<StudentRecord[]> {
    if (IS_DEMO_MODE) {
      return MOCK_USERS.filter(u => u.role === UserRole.STUDENT) as unknown as StudentRecord[];
    }
    try {
      const parentDoc = await getDoc(doc(db, 'schools', schoolId, 'users', parentId));
      if (!parentDoc.exists()) return [];
      const linkedStudents = parentDoc.data().linkedStudents || [];
      if (linkedStudents.length === 0) return [];
      const children: StudentRecord[] = [];
      for (let i = 0; i < linkedStudents.length; i += 10) {
        const batch = linkedStudents.slice(i, i + 10);
        const q = query(collection(db, 'schools', schoolId, 'users'), where('__name__', 'in', batch));
        const snapshot = await getDocs(q);
        snapshot.forEach((childDoc: any) => {
          children.push({
            id: childDoc.id,
            name: childDoc.data().name || '',
            classId: childDoc.data().classId
          });
        });
      }
      return children;
    } catch (error) {
      log.error("getChildren failed:", error);
      return [];
    }
  },

  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    if (IS_DEMO_MODE) return MOCK_CLASSES as unknown as SchoolClass[];
    try {
      const q = query(collection(db, 'schools', schoolId, 'classes'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as SchoolClass[];
    } catch (error) {
      log.error("getClasses failed:", error);
      return [];
    }
  },

  // FIXED: Proper return type using SchoolMetadata interface
  async getMetadata(schoolId: string): Promise<SchoolMetadata> {
    try {
        // Pointing to the new NESTED metadata path
        const infoDoc = await getDoc(doc(db, 'schools', schoolId, 'metadata', 'info'));
        if (infoDoc.exists()) {
          return { ...infoDoc.data(), id: schoolId } as SchoolMetadata;
        }
        return { name: 'SmartSchool', id: schoolId } as SchoolMetadata;
    } catch (error) {
        return { name: 'Offline School', id: schoolId } as SchoolMetadata;
    }
  },

  subscribeToAnnouncements(schoolId: string, callback: (docs: Record<string, unknown>[]) => void): () => void {
    const q = query(
      collection(db, 'schools', schoolId, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    let initialLoad = true;
    const unsub = onSnapshot(q, (snapshot) => {
      if (initialLoad || snapshot.docChanges().length > 0) {
        initialLoad = false;
        callback(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      }
    }, (err) => {
      log.error('Announcements subscription error:', err);
    });
    return unsub;
  },

  // DEPRECATED (1C-1/1C-2): these methods read/wrote the legacy
  // `schools/{id}/students/{sid}/...` and `schools/{id}/students/{sid}/attendance`
  // subcollection trees. The live paths are `schools/{id}/users` (role==STUDENT)
  // for students and `schools/{id}/attendance/{date}` for attendance. They
  // throw to prevent silent reads from an empty ghost collection.
  _deprecated_student_paths: undefined as never,

  subscribeToStudentFees(_schoolId: string, _studentId: string, _callback: (fees: Record<string, unknown>[]) => void): () => void {
    throw new Error('[schoolService] subscribeToStudentFees is deprecated. Use schools/{id}/fees (collection, all students) instead.');
  },

  subscribeToStudentAttendance(_schoolId: string, _studentId: string, _callback: (records: Record<string, unknown>[]) => void): () => void {
    throw new Error('[schoolService] subscribeToStudentAttendance is deprecated. Use services/attendance.ts (schools/{id}/attendance/{date}) instead.');
  },

  subscribeToStudentSubjects(_schoolId: string, _studentId: string, _callback: (subjects: Record<string, unknown>[]) => void): () => void {
    throw new Error('[schoolService] subscribeToStudentSubjects is deprecated. Use a subjects collection or schools/{id}/users/{sid}.subjects field.');
  },

  subscribeToStudentResults(_schoolId: string, _studentId: string, _callback: (results: Record<string, unknown>[]) => void): () => void {
    throw new Error('[schoolService] subscribeToStudentResults is deprecated. Use schools/{id}/results (collection) instead.');
  },

  async createStudent(schoolId: string, studentData: any): Promise<string> {
    // 1C-1: write to the canonical path with role==STUDENT instead of the
    // legacy `students` subcollection.
    try {
      const usersRef = collection(db, 'schools', schoolId, 'users');
      const newDoc = doc(usersRef);
      await setDoc(newDoc, { ...studentData, role: 'STUDENT', createdAt: serverTimestamp() });
      log.info('[schoolService] Student created at users/:', newDoc.id);
      return newDoc.id;
    } catch (error) {
      log.error('[schoolService] createStudent failed:', error);
      throw error;
    }
  },

  async updateStudent(schoolId: string, studentId: string, updates: any): Promise<void> {
    try {
      const userRef = doc(db, 'schools', schoolId, 'users', studentId);
      await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
      log.info('[schoolService] Student updated (users/):', studentId);
    } catch (error) {
      log.error('[schoolService] updateStudent failed:', error);
      throw error;
    }
  },

  async deleteStudent(schoolId: string, studentId: string): Promise<void> {
    // 1C-1 + 1E-8: prefer the atomic cascade in studentDeleteService for full
    // cleanup (fees, attendance, results, library, etc.). This shim is kept
    // for backward compatibility — it now delegates to the cascade service.
    const { deleteStudentCascade } = await import('./studentDeleteService');
    await deleteStudentCascade(schoolId, studentId, { id: 'system', schoolId, role: 'ADMIN' });
  },

  async createFee(schoolId: string, studentId: string, feeData: any): Promise<string> {
    // 1C-1: fees are stored in schools/{id}/fees (top-level), not nested under
    // the (deprecated) students subcollection.
    try {
      const feesRef = collection(db, 'schools', schoolId, 'fees');
      const newDoc = doc(feesRef);
      await setDoc(newDoc, { ...feeData, studentId, schoolId, createdAt: serverTimestamp() });
      log.info('[schoolService] Fee record created:', newDoc.id);
      return newDoc.id;
    } catch (error) {
      log.error('[schoolService] createFee failed:', error);
      throw error;
    }
  },

  async updateFee(schoolId: string, _studentId: string, feeId: string, updates: any): Promise<void> {
    try {
      const feeRef = doc(db, 'schools', schoolId, 'fees', feeId);
      await updateDoc(feeRef, { ...updates, updatedAt: serverTimestamp() });
      log.info('[schoolService] Fee updated:', feeId);
    } catch (error) {
      log.error('[schoolService] updateFee failed:', error);
      throw error;
    }
  },

  async recordAttendance(_schoolId: string, _studentId: string, _date: string, _status: string): Promise<void> {
    // 1C-2: dead. Use services/attendance.ts markAttendance() which writes
    // schools/{id}/attendance/{date}/{studentId} in a batch with audit.
    throw new Error('[schoolService] recordAttendance is deprecated. Use services/attendance.ts markAttendance() instead.');
  },

  async submitHomework(schoolId: string, _classId: string, homeworkId: string, studentId: string, submissionData: any): Promise<void> {
    try {
      const submissionRef = doc(db, 'schools', schoolId, 'homework', homeworkId, 'submissions', studentId);
      await setDoc(submissionRef, { ...submissionData, submittedAt: serverTimestamp() });
      log.info('[schoolService] Homework submitted by:', studentId);
    } catch (error) {
      log.error('[schoolService] submitHomework failed:', error);
      throw error;
    }
  },

  async recordExamResult(schoolId: string, studentId: string, resultData: any): Promise<string> {
    // 1C-1: results are stored in schools/{id}/results, not nested under students.
    try {
      const resultsRef = collection(db, 'schools', schoolId, 'results');
      const newDoc = doc(resultsRef);
      await setDoc(newDoc, { ...resultData, studentId, schoolId, createdAt: serverTimestamp() });
      log.info('[schoolService] Exam result recorded:', newDoc.id);
      return newDoc.id;
    } catch (error) {
      log.error('[schoolService] recordExamResult failed:', error);
      throw error;
    }
  }
};
