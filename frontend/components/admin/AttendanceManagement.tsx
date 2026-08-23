import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Search, Filter,
  Wifi, WifiOff, CloudOff, RefreshCw, ChevronRight,
  AlertCircle, Loader2, Calendar, Download, FileText,
  TrendingDown, Eye
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { writeBatchChunked, BatchOperation } from '@/services/firestore';
import { User as UserType, UserRole } from '@/types';
import { toast } from 'react-hot-toast';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { exportAttendanceToCSV, downloadCSV } from '@/services/attendance';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/shared/Avatar';
import { MOCK_USERS } from '@/constants';

interface Props {
  user: UserType;
}

interface DefaulterStudent {
  id: string;
  name: string;
  classId: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const AttendanceManagement: React.FC<Props> = ({ user }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<UserType[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'defaulters'>('daily');
  const [defaulters, setDefaulters] = useState<DefaulterStudent[]>([]);
  const [loadingDefaulters, setLoadingDefaulters] = useState(false);

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back Online! Syncing changes...', { icon: '✅' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Offline Mode — Data saved locally', { icon: '⚠️' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isMock || !user.schoolId) {
      const mockClasses = [
        { id: '10A', name: 'Class 10-A' },
        { id: '9A',  name: 'Class 9-A' },
        { id: '8A',  name: 'Class 8-A' },
        { id: '7A',  name: 'Class 7-A' },
      ];
      setClasses(mockClasses);
      setSelectedClass('10A');
      return;
    }
    
    const unsub = onSnapshot(collection(db, 'schools', user.schoolId, 'classes'), (snap) => {
      let clsData = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      if (user.role === UserRole.TEACHER) {
        clsData = clsData.filter((c: any) => c.id === user.classId || user.assignedClasses?.includes(c.id));
      }
      const finalClasses = clsData.length > 0 ? clsData : [
        { id: '10A', name: 'Class 10-A' }, { id: '9A', name: 'Class 9-A' },
        { id: '8A', name: 'Class 8-A' }, { id: '7A', name: 'Class 7-A' },
      ];
      setClasses(finalClasses);
      if (finalClasses.length > 0 && !selectedClass) {
        const defaultClass = finalClasses.find((c: any) => c.id === user.classId) || finalClasses[0];
        setSelectedClass(defaultClass.id);
      }
    }, () => {
      setClasses([{ id: '10A', name: 'Class 10-A' }, { id: '9A', name: 'Class 9-A' }]);
      setSelectedClass('10A');
    });
    return () => unsub();
  }, [user.schoolId, user.role, user.classId, user.assignedClasses, isMock]);

  useEffect(() => {
    if (isMock || !user.schoolId) {
      const mockStudents = MOCK_USERS.filter((u: any) => u.role === 'STUDENT').slice(0, 20);
      setStudents(mockStudents);
      const mockAtt: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      mockStudents.forEach((s, idx) => {
        mockAtt[s.id] = idx === 3 ? 'ABSENT' : idx === 7 ? 'LATE' : 'PRESENT';
      });
      setAttendance(mockAtt);
      setLoading(false);
      return;
    }
    setLoading(true);

    const qStudents = query(
      collection(db, 'schools', user.schoolId, 'users'),
      where('role', '==', UserRole.STUDENT),
      where('classId', '==', selectedClass)
    );

    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
      setStudents(data.length > 0 ? data : MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 30));
      setLoading(false);
    }, () => {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT).slice(0, 30));
      setLoading(false);
    });

    const qAttendance = query(
      collection(db, 'schools', user.schoolId, 'attendance'),
      where('classId', '==', selectedClass),
      where('date', '==', selectedDate)
    );

    const unsubAttendance = onSnapshot(qAttendance, (snap) => {
      const records: Record<string, any> = {};
      snap.docs.forEach((d: any) => {
        const data = d.data();
        records[data.studentId] = data.status;
      });
      setAttendance(records);
    }, () => {});

    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, [user.schoolId, selectedClass, selectedDate]);

  const loadDefaulters = async () => {
    if (!user.schoolId) return;

    setLoadingDefaulters(true);
    try {
      const allStudentsQuery = query(
        collection(db, 'schools', user.schoolId, 'users'),
        where('role', '==', UserRole.STUDENT)
      );
      const studentsSnap = await getDocs(allStudentsQuery);
      const allStudents = studentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

      const allAttendanceQuery = query(
        collection(db, 'schools', user.schoolId, 'attendance')
      );
      const attendanceSnap = await getDocs(allAttendanceQuery);
      const attendanceRecords = attendanceSnap.docs.map((d: any) => d.data());

      const studentStats = new Map<string, { present: number; absent: number; late: number; total: number; name: string; classId: string }>();

      allStudents.forEach((s: any) => {
        studentStats.set(s.id, { present: 0, absent: 0, late: 0, total: 0, name: s.name, classId: s.classId });
      });

      attendanceRecords.forEach((r: any) => {
        const stats = studentStats.get(r.studentId);
        if (stats) {
          stats.total++;
          if (r.status === 'PRESENT') stats.present++;
          else if (r.status === 'ABSENT') stats.absent++;
          else if (r.status === 'LATE') stats.late++;
        }
      });

      const defaultersList: DefaulterStudent[] = [];
      studentStats.forEach((stats, id) => {
        if (stats.total > 0) {
          const percentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
          if (percentage < 75) {
            defaultersList.push({
              id,
              name: stats.name,
              classId: stats.classId,
              present: stats.present,
              absent: stats.absent,
              late: stats.late,
              total: stats.total,
              percentage,
            });
          }
        }
      });

      defaultersList.sort((a, b) => a.percentage - b.percentage);
      setDefaulters(defaultersList);
    } catch (err) {
      console.error('Load defaulters failed:', err);
      toast.error('Failed to load defaulter list');
    } finally {
      setLoadingDefaulters(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'defaulters') {
      loadDefaulters();
    }
  }, [activeTab]);

  const handleMark = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    if (!user.schoolId) return;

    try {
      setIsSyncing(true);
      const attendanceRef = doc(db, 'schools', user.schoolId, 'attendance', `${selectedDate}_${studentId}`);
      await setDoc(attendanceRef, {
        studentId,
        studentName: students.find(s => s.id === studentId)?.name,
        classId: selectedClass,
        status,
        date: selectedDate,
        markedBy: user.id,
        timestamp: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Marking error:', err);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

const handleMarkAll = async (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!user.schoolId || students.length === 0) return;

    setIsSyncing(true);
    try {
      const operations: BatchOperation[] = students.map(student => {
        const ref = doc(db, 'schools', user.schoolId, 'attendance', `${selectedDate}_${student.id}`);
        return {
          type: 'set' as const,
          ref,
          data: {
            studentId: student.id,
            studentName: student.name,
            classId: selectedClass,
            status,
            date: selectedDate,
            markedBy: user.id,
            timestamp: serverTimestamp(),
          }
        };
      });
      await writeBatchChunked(operations);
      toast.success(`Batch Sync Complete: ${students.length} students`);
    } catch (err) {
      console.error('Batch error:', err);
      toast.error("Batch operation failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      id: `${selectedDate}_${studentId}`,
      studentId,
      classId: selectedClass,
      schoolId: user.schoolId,
      date: selectedDate,
      status,
      markedBy: user.id,
      timestamp: new Date().toISOString(),
    }));

    if (records.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = exportAttendanceToCSV(records as any, students as any);
    downloadCSV(csv, `attendance_${selectedClass}_${selectedDate}.csv`);
    toast.success('CSV exported successfully');
  };

  const handleExportDefaultersCSV = () => {
    if (defaulters.length === 0) {
      toast.error('No defaulter data to export');
      return;
    }

    const headers = ['Student ID', 'Name', 'Class', 'Present', 'Absent', 'Late', 'Total Days', 'Attendance %'];
    const rows = defaulters.map(d => [
      d.id, d.name, d.classId, d.present, d.absent, d.late, d.total, `${d.percentage}%`
    ].map(v => `"${v}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, `attendance_defaulters_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Defaulter list exported');
  };

  const getStatusStyles = (status: string, studentId: string) => {
    const active = attendance[studentId] === status;
    if (!active) return 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-indigo-200';
    switch(status) {
      case 'PRESENT': return 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20';
      case 'ABSENT': return 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20';
      case 'LATE': return 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20';
      default: return '';
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter(s => attendance[s.id] === 'PRESENT').length;
  const absentCount = students.filter(s => attendance[s.id] === 'ABSENT').length;
  const lateCount = students.filter(s => attendance[s.id] === 'LATE').length;

  if (loading) return (
    <div className="space-y-6 p-6">
      <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-[2.5rem] animate-pulse" />
      <TableSkeleton />
    </div>
  );

  return (
    <div className="space-y-8 pb-32 animate-fade-in-up">
      {!isOnline && (
        <div className="bg-rose-500 text-white px-8 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <CloudOff size={18} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Mode — Working on Local Cache</p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase">Resilient Mode</span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              <Calendar size={18} /> Daily Enrollment Track
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">Roll Call Intel</h1>
            <p className="text-zinc-500 font-medium max-w-xl">Mark daily attendance for {selectedClass}. Data syncs automatically once back online.</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> Mark All Present
            </button>
            <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
              {isOnline ? <Wifi size={20}/> : <WifiOff size={20}/>}
              <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Network: Healthy' : 'Network: Offline'}</span>
            </div>
          </div>
        </div>
        <Users size={150} className="absolute -bottom-10 -right-10 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'daily' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Daily View
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'defaulters' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Defaulter List
        </button>
      </div>

      {activeTab === 'daily' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-bold shadow-sm outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none transition-all"
              />
            </div>
            <div className="flex gap-4 lg:col-span-2">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="flex-1 px-8 py-4 bg-white dark:bg-zinc-950 rounded-2xl border-2 border-transparent focus:border-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-sm outline-none transition-all"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name || `Class ${c.id}`}</option>
                ))}
                {classes.length === 0 && <option value="">No Classes Found</option>}
              </select>
              <button
                onClick={handleExportCSV}
                className="p-4 bg-white dark:bg-zinc-950 rounded-2xl text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:text-indigo-600 transition-colors"
                aria-label="Export CSV"
              >
                <Download size={20}/>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-50 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Student Roster</h3>
              {isSyncing && <div className="flex items-center gap-2 text-indigo-600 animate-pulse"><RefreshCw size={14} className="animate-spin" /><span className="text-[9px] font-black uppercase">Syncing...</span></div>}
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredStudents.map(student => (
                <div key={student.id} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group">
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all flex-shrink-0">
                      <Avatar src={student.avatar} name={student.name} size="xl" className="w-full h-full rounded-[1.25rem] sm:rounded-[1.5rem]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-tight mb-1 truncate">{student.name}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">ID: {student.id.substring(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-start sm:justify-end flex-wrap sm:flex-nowrap">
                    {[
                      { id: 'PRESENT', label: 'Present', icon: CheckCircle2 },
                      { id: 'ABSENT', label: 'Absent', icon: XCircle },
                      { id: 'LATE', label: 'Late', icon: Clock }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleMark(student.id, opt.id as any)}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 border-2 ${getStatusStyles(opt.id, student.id)}`}
                      >
                        <opt.icon size={14} /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="py-12">
                  <EmptyState 
                    variant="students" 
                    title="No Students Found" 
                    description="No students match your criteria in this segment." 
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'defaulters' && (
        <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-50 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingDown size={20} className="text-rose-500" /> Students Below 75% Attendance
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Students who need attention to maintain exam eligibility</p>
            </div>
            <button
              onClick={handleExportDefaultersCSV}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {loadingDefaulters ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Loading defaulter list...</p>
            </div>
          ) : defaulters.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                variant="generic" 
                title="All Clear!" 
                description="No attendance defaulters found. All students are above 75%." 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-6 text-left">Student</th>
                    <th className="p-6 text-center">Class</th>
                    <th className="p-6 text-center">Present</th>
                    <th className="p-6 text-center">Absent</th>
                    <th className="p-6 text-center">Total</th>
                    <th className="p-6 text-center">Attendance %</th>
                    <th className="p-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {defaulters.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="p-6">
                        <p className="font-bold text-zinc-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-zinc-400">ID: {d.id.substring(0, 8)}</p>
                      </td>
                      <td className="p-6 text-center text-sm font-bold text-zinc-500">{d.classId}</td>
                      <td className="p-6 text-center text-sm font-bold text-emerald-600">{d.present}</td>
                      <td className="p-6 text-center text-sm font-bold text-rose-600">{d.absent}</td>
                      <td className="p-6 text-center text-sm font-bold text-zinc-500">{d.total}</td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          d.percentage >= 65
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {d.percentage}%
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <button className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1 mx-auto">
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl"><AlertCircle size={20} className="text-indigo-400"/></div>
          <div>
            <p className="text-sm font-black tracking-tight">Smart-Sync Intelligence</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Local-first architecture ensures 0% data loss.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Marked Today</p>
            <p className="text-lg font-black">{Object.keys(attendance).length} / {students.length}</p>
          </div>
          <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Present</p>
            <p className="text-lg font-black text-emerald-400">{presentCount}</p>
          </div>
          <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Absent</p>
            <p className="text-lg font-black text-rose-400">{absentCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
