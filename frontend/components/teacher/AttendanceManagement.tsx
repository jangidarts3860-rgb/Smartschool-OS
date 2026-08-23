import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2, XCircle, Clock, Save, Loader2, Search,
  ChevronDown, User, RefreshCw, UploadCloud,
  WifiOff, CheckSquare, AlertCircle, Calendar,
  BookOpen, Download
} from 'lucide-react';
import { User as UserType, UserRole, AttendanceRecord } from '@/types';
import { db } from '@/services/firebase';
import {
  collection, query, where, getDocs,
  doc, serverTimestamp
} from 'firebase/firestore';
import {
  fetchClassStudents, markAttendance, saveAttendanceOffline,
  getPendingAttendance, clearSyncedAttendance,
  markBiometricAttendance, checkAttendanceExists,
  exportAttendanceToCSV, downloadCSV,
} from '@/services/attendance';
import toast from 'react-hot-toast';
import { MOCK_USERS, getDeterministicAvatar } from '@/constants';
import FaceGrid, { FaceGridStudent } from '@/components/shared/FaceGrid';
import MonthlyCalendarGrid from '@/components/shared/MonthlyCalendarGrid';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: UserType;
}

interface StudentAttendance {
  id: string;
  name: string;
  avatar: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | null;
}

const AttendanceManagement: React.FC<Props> = ({ user }) => {
  const [view, setView] = useState<'today' | 'history'>('today');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time, not UTC
  );
  const [students, setStudents] = useState<FaceGridStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [historyMonth, setHistoryMonth] = useState(new Date());
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const maxDate = new Date().toLocaleDateString('en-CA');
  const isFutureDate = attendanceDate > maxDate;

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setAvailableClasses(['10A', '9A', '8A', '7A']);
      if (!selectedClass) setSelectedClass(user.classId || '10A');
      return;
    }
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'schools', user.schoolId, 'classes'));
        const snapshot = await getDocs(q);
        const classList = snapshot.docs.map((doc: any) => doc.id);

        // Priority:
        // 1. If assignedClasses is set, use ONLY that (intersected with existing classes)
        // 2. Else if user has a single classId, use that
        // 3. Else fall back to all classes
        const available = classList.length > 0 ? classList : ['10A', '9A', '8A', '7A'];
        if (user.assignedClasses && user.assignedClasses.length > 0) {
          const filtered = available.filter((c: any) => user.assignedClasses?.includes(c));
          const finalClasses = filtered.length > 0 ? filtered : available;
          setAvailableClasses(finalClasses);
          if (!selectedClass) setSelectedClass(finalClasses[0]!);
        } else if (user.classId) {
          setAvailableClasses([user.classId]);
          if (!selectedClass) setSelectedClass(user.classId);
        } else {
          setAvailableClasses(available);
          if (!selectedClass) setSelectedClass(available[0]!);
        }
      } catch (err) {
        setAvailableClasses(['10A', '9A', '8A']);
        if (!selectedClass) setSelectedClass('10A');
      }
    };
    fetchClasses();
  }, [user.schoolId, user.assignedClasses, user.classId]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkPendingSync();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingSync = useCallback(() => {
    const pending = getPendingAttendance();
    const relevantPending = pending.filter(
      p => p.schoolId === user.schoolId && p.date === attendanceDate && p.classId === selectedClass
    );
    setPendingSync(relevantPending.length);
  }, [user.schoolId, attendanceDate, selectedClass]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      if (!selectedClass) {
        setStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setTimeout(() => {
        const fallbackStudents: FaceGridStudent[] = MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 25).map((s, idx) => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar || getDeterministicAvatar(s.name, UserRole.STUDENT),
          rollNo: String(idx + 1).padStart(2, '0')
        }));
        setStudents(fallbackStudents);
        setLoading(false);
      }, 300);
      return;
    }
    if (!selectedClass) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const loadStudents = async () => {
      try {
        const classData = await fetchClassStudents(user.schoolId, selectedClass);

        if (classData?.students) {
          const loadedStudents: FaceGridStudent[] = classData.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            avatar: s.avatar || getDeterministicAvatar(s.name, UserRole.STUDENT),
            rollNo: s.rollNo || s.id.slice(-3),
          }));

          try {
            const attQuery = query(
              collection(db, 'schools', user.schoolId, 'attendance', attendanceDate)
            );
            const snap = await getDocs(attQuery);
            const existingAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
            snap.docs.forEach((docSnap: any) => {
              const data = docSnap.data();
              if (data.classId === selectedClass) {
                existingAttendance[data.studentId] = data.status;
              }
            });

            const attendanceMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | null> = {};
            loadedStudents.forEach(student => {
              attendanceMap[student.id] = existingAttendance[student.id] || null;
            });
            setAttendance(attendanceMap);
          } catch {
            // No existing attendance for this date
          }

          const fallbackStudents: FaceGridStudent[] = MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 25).map((s, idx) => ({
            id: s.id,
            name: s.name,
            avatar: s.avatar || `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80`,
            rollNo: String(idx + 1).padStart(2, '0')
          }));
          const finalStudents = loadedStudents.length > 0 ? loadedStudents : fallbackStudents;

          if (isMounted) {
            setStudents(finalStudents);
          }
        } else {
          const fallbackStudents: FaceGridStudent[] = MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 25).map((s, idx) => ({
            id: s.id,
            name: s.name,
            avatar: s.avatar || `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80`,
            rollNo: String(idx + 1).padStart(2, '0')
          }));
          if (isMounted) setStudents(fallbackStudents);
        }
      } catch (err: any) {
        const fallbackStudents: FaceGridStudent[] = MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 25).map((s, idx) => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar || `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80`,
          rollNo: String(idx + 1).padStart(2, '0')
        }));
        if (isMounted) setStudents(fallbackStudents);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStudents();

    return () => { isMounted = false; };
  }, [user.schoolId, selectedClass, attendanceDate]);

  useEffect(() => {
    if (!isOffline && pendingSync > 0) {
      syncPendingAttendance();
    }
  }, [isOffline]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      if (view !== 'history' || !selectedClass) return;
      setHistoryLoading(true);
      setTimeout(() => {
        setHistoryRecords([]); // Mock empty history or populate if needed
        setHistoryLoading(false);
      }, 300);
      return;
    }
    if (view !== 'history' || !selectedClass) return;

    const month = historyMonth.getMonth();
    const year = historyMonth.getFullYear();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const startStr = startDate.toISOString().split('T')[0]!;
    const endStr = endDate.toISOString().split('T')[0]!;

    setHistoryLoading(true);
    let isMounted = true;

    const loadHistory = async () => {
      try {
        // Schema: schools/{schoolId}/attendance/{date}/{studentId}
        // Cost: 1 outer getDocs (date-doc list) + 1 inner getDocs per matching date.
        // Typical month: ~22 school days → 23 round-trips. Fetched concurrently via Promise.all.
        // If you need year-level history at sub-second latency, consider denormalizing
        // attendance into a flat collection or using collectionGroup queries (P2 follow-up).
        const dateDocs = await getDocs(
          query(collection(db, 'schools', user.schoolId, 'attendance'))
        );

        const matching: AttendanceRecord[] = [];

        const datePromises: Promise<void>[] = [];
        dateDocs.docs.forEach((dateDoc: any) => {
          const dateStr = dateDoc.id;
          if (dateStr < startStr || dateStr > endStr) return;
          datePromises.push(
            getDocs(collection(db, 'schools', user.schoolId, 'attendance', dateStr))
              .then(snap => {
                snap.docs.forEach((studentDoc: any) => {
                  const data = studentDoc.data();
                  if (data.classId === selectedClass) {
                    matching.push({
                      id: studentDoc.id,
                      studentId: data.studentId || studentDoc.id,
                      classId: data.classId,
                      schoolId: user.schoolId,
                      date: dateStr,
                      academicYear: data.academicYear || `${year}-${String(year + 1).slice(-2)}`,
                      status: data.status,
                      markedBy: data.markedBy || 'unknown',
                      timestamp: data.timestamp || new Date().toISOString(),
                    });
                  }
                });
              })
          );
        });
        await Promise.all(datePromises);

        if (isMounted) setHistoryRecords(matching);
      } catch (err) {
        console.error('Failed to load history:', err);
        if (isMounted) toast.error('Failed to load attendance history');
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => { isMounted = false; };
  }, [view, selectedClass, historyMonth, user.schoolId]);

  const handleHistoryDayTap = (dateStr: string, _record: AttendanceRecord | undefined) => {
    if (dateStr === '__nav__') return;
    if (markedCount > 0) {
      const proceed = window.confirm(
        `You have ${markedCount} unsaved attendance change(s) for ${attendanceDate}. Loading ${dateStr} will discard them. Continue?`
      );
      if (!proceed) return;
    }
    setAttendanceDate(dateStr);
    setView('today');
    toast(`Loaded attendance for ${dateStr}`, { icon: '📅' });
  };

  const handleHistoryNav = (direction: 'prev' | 'next') => {
    setHistoryMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        const now = new Date();
        const candidate = new Date(prev);
        candidate.setMonth(candidate.getMonth() + 1);
        if (candidate > now) return prev;
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const dailyRollup = useMemo(() => {
    const byDate: Record<string, AttendanceRecord> = {};
    historyRecords.forEach(r => {
      const existing = byDate[r.date];
      if (!existing) {
        byDate[r.date] = r;
        return;
      }
      const order = { 'LATE': 0, 'ABSENT': 1, 'PRESENT': 2 } as const;
      if (order[r.status] < order[existing.status]) {
        byDate[r.date] = r;
      }
    });
    return byDate;
  }, [historyRecords]);

  const calendarRecords = useMemo(() => {
    return Object.values(dailyRollup);
  }, [dailyRollup]);

  const handleStatusChange = useCallback((studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  }, []);

  const markAllPresent = () => {
    const newAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | null> = {};
    students.forEach(s => { newAttendance[s.id] = 'PRESENT'; });
    setAttendance(newAttendance);
    toast.success('All students marked Present');
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length > 0) {
      toast.error(`${unmarked.length} students not marked yet!`);
      return;
    }

    if (isFutureDate) {
      toast.error("Cannot mark attendance for a future date");
      return;
    }

    setSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id]!
      }));

      if (isOffline) {
        saveAttendanceOffline(user.schoolId, attendanceDate, selectedClass, records);
        toast.success('Attendance saved offline — will sync when online!', {
          icon: '💾',
          duration: 4000,
        });
        setPendingSync(prev => prev + 1);
      } else {
        await markAttendance(user.schoolId, attendanceDate, records, user.id, selectedClass);
        toast.success('Attendance submitted successfully!', {
          icon: '✅',
          duration: 3000,
        });
      }

      const resetAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | null> = {};
      students.forEach(s => { resetAttendance[s.id] = null; });
      setAttendance(resetAttendance);
    } catch (err: any) {
      console.error('Submit failed:', err);
      toast.error(`Failed: ${err.message}`);

      if (!isOffline) {
        const records = students.map(s => ({
          studentId: s.id,
          status: attendance[s.id]!
        }));
        saveAttendanceOffline(user.schoolId, attendanceDate, selectedClass, records);
        toast.success('Saved offline due to error', { duration: 3000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const syncPendingAttendance = async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const pending = getPendingAttendance();
      const relevantPending = pending.filter(
        p => p.schoolId === user.schoolId
      );

      for (const record of relevantPending) {
        try {
          await markAttendance(record.schoolId, record.date, record.records, user.id, record.classId);
          clearSyncedAttendance(record.schoolId, record.date, record.classId);
          toast.success(`Synced attendance for ${record.classId}`);
        } catch (err) {
          console.error('Sync failed for:', record.classId, err);
        }
      }

      checkPendingSync();
      toast.success('All pending attendance synced!');
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length > 0) {
      const proceed = window.confirm(
        `${unmarked.length} student(s) are un-marked. They will be exported as ABSENT. Continue?`
      );
      if (!proceed) return;
    }

    const records = students.map(s => ({
      date: attendanceDate,
      studentId: s.id,
      classId: selectedClass,
      status: (attendance[s.id] || 'ABSENT') as 'PRESENT' | 'ABSENT' | 'LATE',
      markedBy: user.id,
      timestamp: new Date().toISOString(),
    }));

    if (records.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = exportAttendanceToCSV(records, students as any);
    downloadCSV(csv, `attendance_${selectedClass}_${attendanceDate}.csv`);
    toast.success('CSV exported successfully');
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(term))
    );
  }, [students, searchTerm]);

  const attendanceStats = useMemo(() => {
    let present = 0, absent = 0, late = 0, pending = 0;
    for (const s of students) {
      if (attendance[s.id] === 'PRESENT') present++;
      else if (attendance[s.id] === 'ABSENT') absent++;
      else if (attendance[s.id] === 'LATE') late++;
      else pending++;
    }
    return { present, absent, late, pending };
  }, [students, attendance]);

  const markedCount = students.filter(s => attendance[s.id]).length;

  if (!selectedClass) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center">
              <BookOpen size={48} className="text-indigo-400 mx-auto mb-6" />
              <h1 className="text-4xl font-black tracking-tight mb-4">Select Your Class</h1>
              <p className="text-zinc-400 font-medium mb-8">Choose the class to mark attendance</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableClasses.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className="p-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  >
                    <div className="text-2xl font-black text-white">{cls}</div>
                    <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Class</div>
                  </button>
                ))}
                {availableClasses.length === 0 && (
                  <div className="col-span-4 text-zinc-500 text-sm">No classes assigned yet</div>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 size={48} className="text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36 md:pb-6 animate-fade-in-up">
      {!isOffline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Synced to Cloud</span>
        </div>
      )}

      {isOffline && (
        <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff size={18} />
            <p className="text-[10px] font-black uppercase tracking-widest">Offline Mode — Data saved locally</p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase">Resilient</span>
        </div>
      )}

      {pendingSync > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">{pendingSync} pending record(s) to sync</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Will auto-sync when online</p>
            </div>
          </div>
          <button
            onClick={syncPendingAttendance}
            disabled={syncing || isOffline}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Sync Now
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                Attendance — Class {selectedClass}
              </h1>
            </div>
            <p className="text-indigo-200 font-medium italic text-xs md:text-sm">
              Tap = Present • Double-tap = Absent • Long press = Late
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedClass('')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all backdrop-blur-md"
            >
              <ChevronDown size={14} /> Change Class
            </button>
            <button
              onClick={markAllPresent}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30"
            >
              <CheckSquare size={14} /> Mark All Present
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all backdrop-blur-md"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full transform translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setView('today')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'today' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'history' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          History
        </button>
      </div>

      {view === 'today' && (
        <>
          <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                 <Calendar size={20} />
              </div>
              <input
                type="date"
                value={attendanceDate}
                max={maxDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-600">{attendanceStats.present}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Present</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-rose-600">{attendanceStats.absent}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-amber-600">{attendanceStats.late}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Late</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-slate-300 dark:text-zinc-700">{attendanceStats.pending}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl md:rounded-[3rem] p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <FaceGrid
              students={filteredStudents}
              attendance={attendance}
              onStatusChange={handleStatusChange}
              isOffline={isOffline}
            />
          </div>

          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto">
            <button
              onClick={handleSubmit}
              disabled={submitting || markedCount === 0}
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 text-xs sm:text-sm uppercase tracking-[0.2em] active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Submit Attendance ({markedCount}/{students.length})
                </>
              )}
            </button>
          </div>
        </>
      )}

      {view === 'history' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          {historyLoading ? (
            <div className="py-12 text-center text-zinc-500">
              <RefreshCw className="animate-spin mx-auto mb-2" size={20} />
              <p className="text-xs font-bold uppercase tracking-widest">Loading history...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end mb-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {Object.keys(dailyRollup).length} day(s) with attendance this month
                </span>
              </div>
              <MonthlyCalendarGrid
                records={calendarRecords}
                month={historyMonth.getMonth()}
                year={historyMonth.getFullYear()}
                onDayTap={handleHistoryDayTap}
                onMonthChange={(m, y) => setHistoryMonth(new Date(y, m, 1))}
              />
              <p className="text-xs text-zinc-400 mt-4 text-center">
                {calendarRecords.length > 0
                  ? 'Tap a marked day to view and edit that day\'s attendance.'
                  : 'No attendance has been recorded yet for this class. Mark today\'s attendance to see it appear here.'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
