
import { useState, useEffect, useMemo } from 'react';
import { User, UserRole, FeeRecord, Bus } from '@/types';
import {
  MOCK_USERS,
  MOCK_FEES,
  MOCK_BUSES,
  IS_DEMO_MODE
} from '@/constants';

import { db } from '@/services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface AttendanceData {
  id: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  date?: string;
  method?: string;
  time?: string;
}

export const useSchoolData = (schoolId: string | undefined) => {
  const [users, setUsers] = useState<User[]>(IS_DEMO_MODE ? MOCK_USERS : []);
  const [fees, setFees] = useState<FeeRecord[]>(IS_DEMO_MODE ? MOCK_FEES as FeeRecord[] : []);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [buses, setBuses] = useState<Bus[]>(IS_DEMO_MODE ? MOCK_BUSES as Bus[] : []);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (IS_DEMO_MODE || IS_MOCK_MODE || !schoolId) {
        setUsers(MOCK_USERS);
        setFees(MOCK_FEES as FeeRecord[]);
        setBuses(MOCK_BUSES as Bus[]);
        setAttendance([
            { id: 'att1', studentId: 's1', status: 'PRESENT', method: 'NFC_GATE', time: '08:15 AM', date: new Date().toISOString().split('T')[0] },
            { id: 'att2', studentId: 's2', status: 'PRESENT', method: 'NFC_GATE', time: '08:45 AM', date: new Date().toISOString().split('T')[0] },
        ]);
        setLoading(false);
        return;
    }

    setLoading(true);

    // Safety fallback timeout: ensure loading state is NEVER stuck forever
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setUsers(prev => prev.length > 0 ? prev : MOCK_USERS);
        setFees(prev => prev.length > 0 ? prev : MOCK_FEES as FeeRecord[]);
        setBuses(prev => prev.length > 0 ? prev : MOCK_BUSES as Bus[]);
        setLoading(false);
      }
    }, 1200);
    try {
      // 1E-5 + 1C-1: ONE subscription for `users` (which contains all roles including
      // STUDENT). The previous code also subscribed to the legacy `students`
      // subcollection AND the `users` collection, doubling the read load and
      // causing two state updates per render. The legacy `students` collection
      // is no longer the source of truth (1C-1).
      const usersQuery = query(collection(db, 'schools', schoolId, 'users'));
      const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        if (!isMounted) return;
        const usersData = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                schoolId: schoolId,
                avatar: data.profile_image_url || data.avatar
            } as User;
        });
        setUsers(usersData && usersData.length > 0 ? usersData : MOCK_USERS);
        setLoading(false);
      }, (err) => {
        setUsers(MOCK_USERS);
        setError(`User Sync Error: ${err.message}`);
        setLoading(false);
      });

      // 2. Fetch Fees from NESTED school fees collection
      const feesQuery = query(collection(db, 'schools', schoolId, 'fees'));
      const unsubFees = onSnapshot(feesQuery, (snapshot) => {
        if (!isMounted) return;
        const feesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as FeeRecord[];
        setFees(feesData && feesData.length > 0 ? feesData : MOCK_FEES as FeeRecord[]);
      }, (err) => {
        setFees(MOCK_FEES as FeeRecord[]);
        setError(`Fees Sync Error: ${err.message}`);
      });

      // 3. Fetch Attendance from NESTED school attendance collection
      const attQuery = query(collection(db, 'schools', schoolId, 'attendance'));
      const unsubAtt = onSnapshot(attQuery, (snapshot) => {
        if (!isMounted) return;
        const attData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AttendanceData[];
        setAttendance(attData || []);
      }, (err) => setError(`Attendance Sync Error: ${err.message}`));

      // 4. Buses — drop the redundant `where('schoolId', '==', schoolId)` filter
      const busQuery = query(collection(db, 'schools', schoolId, 'buses'));
      const unsubBuses = onSnapshot(busQuery, (snapshot) => {
        if (!isMounted) return;
        const busData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Bus[];
        setBuses(busData && busData.length > 0 ? busData : MOCK_BUSES as Bus[]);
      }, (err) => {
        setBuses(MOCK_BUSES as Bus[]);
        setError(`Bus Sync Error: ${err.message}`);
      });

      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        unsubUsers();
        unsubFees();
        unsubAtt();
        unsubBuses();
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [schoolId]);

  const insights = useMemo(() => ({
    pendingFeesCount: (fees || []).filter(f => f?.status === 'PENDING').length,
    totalRevenue: (fees || []).filter(f => f?.status === 'PAID').reduce((acc, curr) => acc + (curr?.totalAmount || 0), 0),
    attendanceRate: (attendance || []).length > 0
      ? Math.round(((attendance || []).filter(a => a?.status === 'PRESENT' || a?.status === 'LATE').length / Math.max(1, (attendance || []).length)) * 100)
      : 0
  }), [fees, attendance, users]);

  return { users, fees, attendance, buses, insights, loading, error };
};
