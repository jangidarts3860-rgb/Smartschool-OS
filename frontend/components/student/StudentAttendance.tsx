import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { User, AttendanceRecord } from '@/types';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import MonthlyCalendarGrid from '@/components/shared/MonthlyCalendarGrid';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const StudentAttendance: React.FC<Props> = ({ user }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  const generateMockAttendance = useMemo(() => {
    const records: AttendanceRecord[] = [];
    const now = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getDay() === 0) continue; // skip Sunday
      const dateStr = d.toISOString().split('T')[0]!;
      const isLate = i % 11 === 0;
      const isAbsent = i === 18;
      const status: 'PRESENT' | 'ABSENT' | 'LATE' = isAbsent ? 'ABSENT' : isLate ? 'LATE' : 'PRESENT';
      records.push({
        id: `att-stu-mock-${dateStr}`,
        studentId: user?.id || 'stu001',
        schoolId: user?.schoolId || 'SCH01',
        classId: user?.classId || '10A',
        date: dateStr,
        status,
        markedBy: 'TEACHER001',
        academicYear: '2026-27',
        timestamp: new Date().toISOString()
      });
    }
    return records;
  }, [user?.id, user?.schoolId, user?.classId]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setAttendance(generateMockAttendance);
      setLoading(false);
      return;
    }
    if (!user?.schoolId) {
      setAttendance(generateMockAttendance);
      setLoading(false);
      return;
    }

    const attendanceRef = collection(db, 'schools', user.schoolId, 'attendance');
    const q = query(
      attendanceRef,
      where('studentId', '==', user.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendance(records.length > 0 ? records : generateMockAttendance);
      setLoading(false);
    }, (err) => {
      if (import.meta.env.DEV) {
        console.error("Attendance subscription error:", err);
      }
      setAttendance(generateMockAttendance);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.schoolId, user?.id, generateMockAttendance]);

  const filteredAttendance = useMemo(() => {
    const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    return attendance.filter(record => record.date.startsWith(monthStr));
  }, [attendance, selectedDate]);

  const presentCount = filteredAttendance.filter(r => r.status === 'PRESENT').length;
  const absentCount = filteredAttendance.filter(r => r.status === 'ABSENT').length;
  const lateCount = filteredAttendance.filter(r => r.status === 'LATE').length;
  const totalCount = filteredAttendance.length;
  const attendancePercentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const handleDayTap = (date: string, record: AttendanceRecord | undefined) => {
    if (date === '__nav__') return;
    setSelectedDayRecord(record || null);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
              <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Attendance</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Track your daily attendance record</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Present</p>
          <p className="text-2xl font-black tracking-tight text-emerald-600">{presentCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
              <XCircle size={16} className="text-rose-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Absent</p>
          <p className="text-2xl font-black tracking-tight text-rose-600">{absentCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Clock size={16} className="text-amber-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Late</p>
          <p className="text-2xl font-black tracking-tight text-amber-600">{lateCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${attendancePercentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
              <TrendingUp size={16} className={attendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Percentage</p>
          <p className={`text-2xl font-black tracking-tight ${attendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {totalCount > 0 ? `${attendancePercentage}%` : '—'}
          </p>
        </div>
      </div>

      {attendancePercentage > 0 && attendancePercentage < 75 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Your attendance needs attention</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Below 75% may affect your exam eligibility. Keep attending regularly.</p>
          </div>
        </div>
      )}

      {attendancePercentage > 0 && attendancePercentage < 50 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Please contact your teacher</p>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">Your attendance is critically low. Speak with your class teacher immediately.</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <MonthlyCalendarGrid
          records={filteredAttendance}
          month={selectedDate.getMonth()}
          year={selectedDate.getFullYear()}
          onDayTap={handleDayTap}
          onMonthChange={(m, y) => setSelectedDate(new Date(y, m, 1))}
        />
        {filteredAttendance.length === 0 && attendance.length > 0 && (
          <p className="text-xs text-zinc-500 mt-4 text-center">
            No attendance recorded in {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
            Use the arrows to view other months.
          </p>
        )}
      </div>

      {selectedDayRecord && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex items-start gap-3">
          <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              {new Date(selectedDayRecord.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {selectedDayRecord.markedBy === 'SYSTEM' ? 'Marked by Biometric Scan' : `Marked by: ${selectedDayRecord.markedBy}`}
              {selectedDayRecord.timestamp && ` at ${new Date(selectedDayRecord.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              selectedDayRecord.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              selectedDayRecord.status === 'ABSENT' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {selectedDayRecord.status}
            </span>
          </div>
        </div>
      )}

      {attendance.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 md:p-12 text-center">
          <CalendarDays size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="text-sm font-bold text-zinc-500">No attendance records yet</p>
          <p className="text-xs text-zinc-400 mt-1">Records will appear once your teacher marks attendance</p>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
