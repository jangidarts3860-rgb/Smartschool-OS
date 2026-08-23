import { db } from '@/services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

export interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  classId?: string; // Optional: used for conflict checking across classes
}

export interface TimetableData {
  classId: string;
  schoolId: string;
  entries: TimetableEntry[];
  updatedAt?: any;
  updatedBy?: string;
}

export interface TimeTablePeriod {
  time: string;
  subject: string;
  teacher: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES: Record<number, string> = {
  1: '08:30 AM - 09:15 AM',
  2: '09:15 AM - 10:00 AM',
  3: '10:00 AM - 10:45 AM',
  4: '10:45 AM - 11:30 AM',
  5: '12:00 PM - 12:45 PM',
  6: '12:45 PM - 01:30 PM',
  7: '01:30 PM - 02:15 PM',
  8: '02:15 PM - 03:00 PM',
};

const MOCK_TIMETABLE: Record<string, TimetableData> = {
  '10A': {
    classId: '10A',
    schoolId: 'mock-school',
    entries: [
      { day: 'Monday', period: 1, subject: 'Mathematics', teacherId: 't1', teacherName: 'Mr. Sharma' },
      { day: 'Monday', period: 2, subject: 'Physics', teacherId: 't2', teacherName: 'Ms. Gupta' },
      { day: 'Tuesday', period: 1, subject: 'Chemistry', teacherId: 't3', teacherName: 'Dr. Verma' },
      { day: 'Wednesday', period: 1, subject: 'English', teacherId: 't4', teacherName: 'Mrs. Jones' },
      { day: 'Thursday', period: 2, subject: 'Biology', teacherId: 't5', teacherName: 'Mr. Roy' },
      { day: 'Friday', period: 3, subject: 'History', teacherId: 't6', teacherName: 'Ms. Sen' },
    ]
  }
};

export const timetableService = {
  async getTimetable(schoolId: string, classId: string): Promise<TimetableEntry[]> {
    if (IS_MOCK_MODE) {
      return MOCK_TIMETABLE[classId]?.entries || [];
    }
    try {
      const docRef = doc(db, 'schools', schoolId, 'timetables', classId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data().entries || [];
      }
      return [];
    } catch (error) {
      console.error('timetableService.getTimetable failed:', error);
      return [];
    }
  },

  onTimetable(schoolId: string, classId: string, callback: (data: TimetableData | null) => void): Unsubscribe {
    if (IS_MOCK_MODE) {
      callback(MOCK_TIMETABLE[classId] || null);
      return () => {};
    }
    const docRef = doc(db, 'schools', schoolId, 'timetables', classId);
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? ({ classId, schoolId, ...(snap.data() as object) } as TimetableData) : null);
    }, (err) => {
      console.warn('timetableService.onTimetable error:', err);
      callback(null);
    });
  },

  async saveTimetable(schoolId: string, classId: string, entries: TimetableEntry[], updatedBy?: string): Promise<void> {
    if (IS_MOCK_MODE) {
      MOCK_TIMETABLE[classId] = {
        classId,
        schoolId,
        entries,
        updatedAt: new Date().toISOString(),
        updatedBy
      };
      return;
    }
    try {
      const docRef = doc(db, 'schools', schoolId, 'timetables', classId);
      await setDoc(docRef, {
        classId,
        schoolId,
        entries,
        updatedAt: serverTimestamp(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('timetableService.saveTimetable failed:', error);
      throw error;
    }
  },

  async getAllTimetables(schoolId: string): Promise<TimetableData[]> {
    if (IS_MOCK_MODE) {
      return Object.values(MOCK_TIMETABLE);
    }
    try {
      const colRef = collection(db, 'schools', schoolId, 'timetables');
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((doc: any) => doc.data() as TimetableData);
    } catch (error) {
      console.error('timetableService.getAllTimetables failed:', error);
      return [];
    }
  },

  async getTeacherTimetable(schoolId: string, teacherId: string): Promise<{ classId: string, entries: TimetableEntry[] }[]> {
    try {
      const allTimetables = await this.getAllTimetables(schoolId);
      return allTimetables
        .filter(tt => tt.entries && tt.entries.some(e => e.teacherId === teacherId))
        .map(tt => ({
          classId: tt.classId,
          entries: tt.entries.filter(e => e.teacherId === teacherId)
        }));
    } catch (error) {
      console.error('timetableService.getTeacherTimetable failed:', error);
      return [];
    }
  },

  /**
   * Real-time listener for a teacher's schedule across all classes.
   * Note: Firestore does not support filtering by object properties inside array fields
   * (e.g. `where('entries', 'array-contains-any', [{ teacherId }])`), so we subscribe to
   * the full `timetables` collection and filter client-side. Documented as O(N_classes).
   */
  onTeacherTimetable(
    schoolId: string,
    teacherId: string,
    callback: (data: { classId: string; entries: TimetableEntry[] }[]) => void
  ): Unsubscribe {
    if (IS_MOCK_MODE) {
      const mock = Object.values(MOCK_TIMETABLE)
        .filter(tt => tt.entries.some(e => e.teacherId === teacherId))
        .map(tt => ({ classId: tt.classId, entries: tt.entries.filter(e => e.teacherId === teacherId) }));
      callback(mock);
      return () => {};
    }
    const colRef = collection(db, 'schools', schoolId, 'timetables');
    return onSnapshot(colRef, (snap) => {
      const result: { classId: string; entries: TimetableEntry[] }[] = [];
      snap.docs.forEach((d: any) => {
        const data = d.data() as TimetableData;
        if (!data.entries) return;
        const mine = data.entries.filter(e => e.teacherId === teacherId);
        if (mine.length > 0) {
          result.push({ classId: data.classId || d.id, entries: mine });
        }
      });
      callback(result);
    }, (err) => {
      console.warn('timetableService.onTeacherTimetable error:', err);
      callback([]);
    });
  },

  checkTeacherConflict(
    entries: TimetableEntry[],
    teacherId: string,
    day: string,
    period: number,
    excludeClassId?: string
  ): boolean {
    return entries.some(e =>
      e.teacherId === teacherId &&
      e.day === day &&
      e.period === period &&
      e.classId !== excludeClassId
    );
  },

  getSubjectHours(entries: TimetableEntry[], subject: string): number {
    return entries.filter(e => e.subject === subject).length;
  },

  getDays(): string[] {
    return DAYS;
  },

  getPeriods(): number[] {
    return PERIODS;
  },

  getPeriodTime(period: number): string {
    return PERIOD_TIMES[period] || 'N/A';
  },

  /**
   * Transforms flat TimetableEntry[] array from Firestore into Day-grouped Map
   * for beautiful UI rendering in Student/Parent dashboard widgets.
   */
  transformEntriesToMap(entries: TimetableEntry[]): Record<string, TimeTablePeriod[]> {
    const map: Record<string, TimeTablePeriod[]> = {};
    
    // Pre-populate days
    DAYS.forEach(day => {
      map[day] = [];
    });

    if (!entries || !Array.isArray(entries)) return map;

    // Map and group entries
    entries.forEach(entry => {
      if (!entry.day || !entry.period) return;
      
      const timeLabel = this.getPeriodTime(entry.period);
      const periodObj: TimeTablePeriod = {
        subject: entry.subject || 'Free Period',
        teacher: entry.teacherName || 'Self Study',
        time: timeLabel,
      };

      if (map[entry.day]) {
        map[entry.day]!.push(periodObj);
      }
    });

    // Sort periods of each day by timeline sequence
    DAYS.forEach(day => {
      map[day]!.sort((a, b) => {
        const periodA = Object.keys(PERIOD_TIMES).find(key => PERIOD_TIMES[Number(key)] === a.time);
        const periodB = Object.keys(PERIOD_TIMES).find(key => PERIOD_TIMES[Number(key)] === b.time);
        return Number(periodA || 0) - Number(periodB || 0);
      });
    });

    return map;
  }
};
