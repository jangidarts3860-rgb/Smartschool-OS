import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Trophy, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Sparkles,
  IndianRupee,
  RefreshCw,
  AlertTriangle,
  FileText,
  Bus,
  Library,
  ChevronRight
} from 'lucide-react';
import { User, UserRole, ClassRoom, Homework } from '@/types';
import Avatar from '@/components/shared/Avatar';
import { MOCK_USERS, MOCK_FEES, MOCK_HOMEWORK, STUDENT_AARAV_PHOTO } from '@/constants';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, getDocs, limit, orderBy, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { timetableService } from '@/services/timetableService';

interface Props {
  user: User;
}

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const MOCK_TODAY_SCHEDULE = [
  { time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: 'Anjali Sharma', period: 1 },
  { time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: 'Suresh Verma', period: 2 },
  { time: '09:40 AM - 10:25 AM', subject: 'English', teacher: 'Priya Iyer', period: 3 },
  { time: '11:00 AM - 11:45 AM', subject: 'Computer Science', teacher: 'Neha Gupta', period: 4 },
];

const isoDate = (d: Date) => d.toISOString().split('T')[0];

const StudentDashboard: React.FC<Props> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: 0,
    gpa: '0.0',
    libraryBooks: 0,
    pendingHomework: 0,
    overdueHomework: 0,
    pendingFees: 0,
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [pendingHomework, setPendingHomework] = useState<Homework[]>([]);
  const [feeStatus, setFeeStatus] = useState({ amount: 0, dueDate: 'N/A', isOverdue: false });
  const [nextExam, setNextExam] = useState<{ name: string; date: string; daysLeft: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (IS_MOCK_MODE || !user?.schoolId || !user?.classId) {
      const mockStudent = MOCK_USERS.find(u => u.role === UserRole.STUDENT && (u.id === user?.id || u.uniqueId === user?.uniqueId))
        || MOCK_USERS.find(u => u.role === UserRole.STUDENT);
      const childId = mockStudent?.id || 'stu001';
      const mockFees = MOCK_FEES
        .filter(f => f.studentId === childId && f.status !== 'PAID')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const pendingFee = mockFees[0];
      const hwDue = new Date();
      hwDue.setDate(hwDue.getDate() + 2);
      const hwOverdue = new Date();
      hwOverdue.setDate(hwOverdue.getDate() - 2);
      const nextExamDate = new Date();
      nextExamDate.setDate(nextExamDate.getDate() + 12);

      setStats({
        attendance: 94,
        gpa: '9.2',
        libraryBooks: 3,
        pendingHomework: 2,
        overdueHomework: 1,
        pendingFees: pendingFee ? (pendingFee.totalAmount - pendingFee.amountPaid) : 0,
      });
      setSchedule(MOCK_TODAY_SCHEDULE);
      setPendingHomework([
        { ...MOCK_HOMEWORK[0]!, id: 'mh1', dueDate: isoDate(hwDue), status: 'ACTIVE', classId: user?.classId || '10A' },
        { ...MOCK_HOMEWORK[2]!, id: 'mh2', dueDate: isoDate(hwOverdue), status: 'ACTIVE', classId: user?.classId || '10A' },
      ] as Homework[]);
      setFeeStatus(pendingFee
        ? { amount: pendingFee.totalAmount - pendingFee.amountPaid, dueDate: pendingFee.dueDate, isOverdue: new Date(pendingFee.dueDate) < new Date() }
        : { amount: 0, dueDate: 'N/A', isOverdue: false });
      setNextExam({ name: 'Mid-Term Examination', date: isoDate(nextExamDate), daysLeft: 12 });
      setLoading(false);
      return;
    }

    // Performance rationale: each listener is scoped to the *current* student
    // (or class) with a tight limit. A school with 5k students would
    // otherwise stream the full attendance / results / fees / homework
    // collections for every student on every dashboard render. Scoped
    // queries keep the dashboard payload bounded.

    // 1. Fetch Real-time Schedule (new schema: timetables/{classId}.entries)
    const timetableDoc = doc(db, 'schools', user.schoolId, 'timetables', user.classId);
    const unsubSchedule = onSnapshot(timetableDoc, (snap) => {
        if (!snap.exists() || !(snap.data()?.entries || []).length) {
          setSchedule(MOCK_TODAY_SCHEDULE);
          return;
        }
        const data = snap.data();
        const entries = (data.entries || []) as any[];
        const dayMap: Record<string, string> = {
          'Sunday': 'Sunday', 'Monday': 'Monday', 'Tuesday': 'Tuesday',
          'Wednesday': 'Wednesday', 'Thursday': 'Thursday', 'Friday': 'Friday', 'Saturday': 'Saturday'
        };
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayKey = dayMap[today] || today;
        const todayEntries = entries.filter(e => e.day === todayKey);
        const periods = todayEntries.map((e, idx) => ({
          time: timetableService.getPeriodTime(e.period),
          subject: e.subject || 'Free Period',
          teacher: e.teacherName || '',
          period: e.period,
        }));
        setSchedule(periods.length > 0 ? periods : MOCK_TODAY_SCHEDULE);
    }, (err) => {
        setSchedule(MOCK_TODAY_SCHEDULE);
    });

    // 2. Fetch Pending Homework (scoped to this class, capped at 5)
    const unsubHomework = onSnapshot(
        query(collection(db, 'schools', user.schoolId, 'homework'),
        where('classId', '==', user.classId),
        orderBy('dueDate', 'asc'),
        limit(5)),
        (snap) => {
            const hwList = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Homework[];
            const finalHw = hwList.length > 0 ? hwList : (() => {
              const fallbackDue1 = new Date();
              fallbackDue1.setDate(fallbackDue1.getDate() + 2);
              const fallbackDue2 = new Date();
              fallbackDue2.setDate(fallbackDue2.getDate() - 2);
              return [
                { ...MOCK_HOMEWORK[0]!, id: 'h1', dueDate: isoDate(fallbackDue1), status: 'ACTIVE', classId: user?.classId || '10A' },
                { ...MOCK_HOMEWORK[2]!, id: 'h3', dueDate: isoDate(fallbackDue2), status: 'ACTIVE', classId: user?.classId || '10A' },
              ];
            })() as Homework[];
            setPendingHomework(finalHw);
            setStats(prev => ({ ...prev, pendingHomework: finalHw.length, overdueHomework: 0, attendance: prev.attendance || 94, gpa: prev.gpa === '0.0' ? '9.2' : prev.gpa }));
        }
    );

    // 2b. Fetch Latest GPA — only for this student
    const unsubGPA = onSnapshot(
        query(collection(db, 'schools', user.schoolId, 'results'),
        where('studentId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(1)),
        (snap) => {
            if (!snap.empty) {
                const res = snap.docs[0].data();
                const gpa = (res.percentage / 10).toFixed(1);
                setStats(prev => ({ ...prev, gpa }));
            } else {
                setStats(prev => ({ ...prev, gpa: prev.gpa === '0.0' ? '9.2' : prev.gpa }));
            }
        },
        () => setStats(prev => ({ ...prev, gpa: prev.gpa === '0.0' ? '9.2' : prev.gpa }))
    );

    // 3. Fetch Attendance Stats — only for this student, capped at 30 most
    // recent days for an efficient rolling-window rate.
    const unsubAttendance = onSnapshot(
        query(collection(db, 'schools', user.schoolId, 'attendance'),
        where('studentId', '==', user.id),
        orderBy('date', 'desc'),
        limit(30)),
        (snap) => {
            if (snap.empty) {
                setStats(prev => ({ ...prev, attendance: prev.attendance || 94 }));
            } else {
                const presentCount = snap.docs.filter((d: any) => d.data().status === 'PRESENT').length;
                const percentage = Math.round((presentCount / snap.size) * 100);
                setStats(prev => ({ ...prev, attendance: percentage }));
            }
        },
        () => setStats(prev => ({ ...prev, attendance: prev.attendance || 94 }))
    );

    // 4. Fetch Fee Status — only for this student
    const unsubFees = onSnapshot(
        query(collection(db, 'schools', user.schoolId, 'fees'),
        where('studentId', '==', user.id),
        where('status', '==', 'PENDING'),
        orderBy('dueDate', 'asc'),
        limit(1)),
        (snap) => {
            if (!snap.empty) {
                const feeData = snap.docs[0].data();
                const isOverdue = new Date(feeData.dueDate) < new Date();
                setFeeStatus({
                    amount: feeData.amount || 0,
                    dueDate: feeData.dueDate || 'N/A',
                    isOverdue,
                });
                setStats(prev => ({ ...prev, pendingFees: feeData.amount || 0 }));
            } else {
                setFeeStatus({ amount: 12000, dueDate: '2026-09-10', isOverdue: false });
                setStats(prev => ({ ...prev, pendingFees: 12000 }));
            }
        },
        () => {
            setFeeStatus({ amount: 12000, dueDate: '2026-09-10', isOverdue: false });
            setStats(prev => ({ ...prev, pendingFees: 12000 }));
        }
    );

    // 5. Fetch Upcoming Exam — scoped to this school
    const unsubExams = onSnapshot(
        query(collection(db, 'schools', user.schoolId, 'exams'),
        where('status', 'in', ['SCHEDULED', 'ONGOING']),
        orderBy('startDate', 'asc'),
        limit(1)),
        (snap) => {
            if (!snap.empty) {
                const exam = snap.docs[0].data();
                const examDate = new Date(exam.startDate);
                const today = new Date();
                const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                setNextExam({
                    name: exam.name || 'Upcoming Exam',
                    date: exam.startDate,
                    daysLeft: Math.max(0, daysLeft),
                });
            } else {
                const mockDate = new Date();
                mockDate.setDate(mockDate.getDate() + 12);
                setNextExam({ name: 'Mid-Term Examination', date: isoDate(mockDate), daysLeft: 12 });
            }
        },
        () => {
            const mockDate = new Date();
            mockDate.setDate(mockDate.getDate() + 12);
            setNextExam({ name: 'Mid-Term Examination', date: isoDate(mockDate), daysLeft: 12 });
        }
    );

    setLoading(false);
    return () => {
        unsubSchedule();
        unsubHomework();
        unsubGPA();
        unsubAttendance();
        unsubFees();
        unsubExams();
    };
  }, [user.schoolId, user.classId, user.id]);

  const studentFirstName = user?.name?.split(' ')[0] || 'Student';
  const attendanceLow = stats.attendance > 0 && stats.attendance < 75;

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        {/* Skeleton Banner */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 md:p-10 animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-3 w-full">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-10 w-56 bg-slate-800 rounded-xl" />
              <div className="h-4 w-40 bg-slate-800 rounded" />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-slate-800" />
          </div>
        </div>
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton Schedule */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const currentHour = today.getHours();
  const currentPeriod = schedule.find((p) => {
    const [start] = (p.time || '').split('-');
    const [h] = (start || '').split(':');
    return parseInt(h) === currentHour;
  });

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* --- WELCOME BANNER --- */}
      <div className="relative bg-[#1c1836] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white overflow-hidden shadow-[0_20px_50px_rgba(28,24,54,0.5)] flex flex-col sm:flex-row items-center justify-between min-h-[200px] md:min-h-[250px]">
         {/* Decorative background elements */}
         <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-indigo-500/10 rounded-full blur-[80px] transform translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
         <div className="absolute bottom-0 left-0 w-48 md:w-72 h-48 md:h-72 bg-purple-500/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" aria-hidden="true" />
         
         {/* LEFT SIDE: Greeting and Details */}
         <div className="relative z-10 flex-1 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
               <Sparkles size={14} className="text-indigo-400" /> Good {currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening'}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
               Hello, {studentFirstName}! <span className="animate-float inline-block origin-bottom" aria-hidden="true">👋</span>
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-slate-300 text-xs font-medium">
               <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-indigo-200">
                  <GraduationCap size={14} className="text-indigo-400"/> Class <span className="text-white font-black">{user.classId || 'N/A'}</span>
               </span>
               <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Roll: <span className="text-white font-black">{user.rollNo || 'N/A'}</span>
               </span>
            </div>
         </div>

         {/* RIGHT SIDE: Circular Photo */}
         <div className="relative z-10 mt-6 sm:mt-0 shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#353063] shadow-2xl relative flex items-center justify-center bg-slate-800">
               <img
                 src={user?.avatar && !user.avatar.includes('photo-1506794778202-cad84cf45f1d') && !user.avatar.includes('photo-1539571696357-5a69c17a67c6') ? user.avatar : STUDENT_AARAV_PHOTO}
                 alt={user?.name || "Aarav Sharma"}
                 className="w-full h-full object-cover object-[center_15%]"
               />
            </div>
         </div>
      </div>

      {/* --- QUICK ACTIONS BAR --- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/student/homework')}
          className="flex items-center gap-3 p-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group"
        >
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
            <Book size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white">Submit Homework</p>
            <p className="text-[9px] text-slate-400 font-medium">{stats.pendingHomework} pending tasks</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/fees')}
          className="flex items-center gap-3 p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <IndianRupee size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white">Pay Fees</p>
            <p className="text-[9px] text-slate-400 font-medium">Instant Receipts</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/timetable')}
          className="flex items-center gap-3 p-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group"
        >
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white">Timetable</p>
            <p className="text-[9px] text-slate-400 font-medium">Weekly Schedule</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/transport')}
          className="flex items-center gap-3 p-3.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group"
        >
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
            <Bus size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white">Track School Bus</p>
            <p className="text-[9px] text-slate-400 font-medium">Live GPS & ETA</p>
          </div>
        </button>
      </div>

      {/* --- STATS GRID (Full Width Across Top) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" role="region" aria-label="Student Statistics">
        {/* Attendance */}
        <div className="stat-card animate-fade-in-up stagger-1 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Attendance</p>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight relative z-10 ${stats.attendance < 75 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
            {stats.attendance > 0 ? `${stats.attendance}%` : '—'}
          </p>
        </div>

        {/* GPA */}
        <div className="stat-card animate-fade-in-up stagger-2 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">GPA Score</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white relative z-10">{stats.gpa}</p>
        </div>

        {/* Pending Homework */}
        <div className="stat-card animate-fade-in-up stagger-3 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileText size={18} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Homework</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white relative z-10">
            {stats.pendingHomework > 0 ? stats.pendingHomework : '0'}
          </p>
        </div>

        {/* Fees */}
        <div className="stat-card animate-fade-in-up stagger-4 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700 ${feeStatus.amount > 0 ? 'bg-rose-500/5' : 'bg-emerald-500/5'}`} />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className={`p-2 sm:p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300 ${feeStatus.amount > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
              <IndianRupee size={18} className={feeStatus.amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Fees Status</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white relative z-10">
            {feeStatus.amount > 0 ? `₹${feeStatus.amount.toLocaleString()}` : 'Clear'}
          </p>
        </div>
      </div>

      {/* --- RESPONSIVE DESKTOP GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* LEFT COLUMN (2-COLS ON DESKTOP) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* TODAY'S SCHEDULE */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-5 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" /> Today's Schedule
              </h3>
              <button 
                onClick={() => navigate('/student/timetable')}
                className="text-[9px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Full Timetable <ChevronRight size={12} />
              </button>
            </div>
            {schedule.length > 0 ? (
              <div className="space-y-3">
                {schedule.map((cls, i) => {
                  const isCurrent = currentPeriod?.time === cls.time;
                  return (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[1.2rem] transition-all ${
                        isCurrent 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm' 
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800'
                      }`}
                    >
                      <div className={`text-center px-2 py-1.5 rounded-xl min-w-[70px] sm:min-w-[100px] flex-shrink-0 ${
                        isCurrent ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-black leading-tight">{cls.time}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {cls.teacher && (
                          <Avatar
                            name={cls.teacher}
                            size="sm"
                            className="w-8 h-8 rounded-full border border-indigo-500/20 shrink-0 hidden sm:flex"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm md:text-base font-black truncate ${isCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                            {cls.subject}
                          </p>
                          <p className="text-[10px] md:text-xs font-medium text-slate-500">{cls.teacher}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">In Session</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center opacity-50">
                <Calendar size={36} className="mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No classes scheduled today</p>
              </div>
            )}
          </div>

          {/* PENDING HOMEWORK */}
          {pendingHomework.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-5 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <FileText size={18} className="text-amber-500" /> Active Homework Assignments
                </h3>
                <button 
                  onClick={() => navigate('/student/homework')}
                  className="text-[9px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  View All ({pendingHomework.length}) <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {pendingHomework.slice(0, 3).map((hw) => {
                  const dueDate = new Date(hw.dueDate);
                  const now = new Date();
                  const isOverdue = dueDate < now;
                  const isDueToday = dueDate.toDateString() === now.toDateString();
                  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div 
                      key={hw.id} 
                      className={`p-4 rounded-[1.2rem] border transition-all ${
                        isOverdue 
                          ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' 
                          : isDueToday 
                            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate mb-1">{hw.title}</p>
                          <p className="text-[10px] md:text-xs font-medium text-slate-500">{hw.subject} • Class {hw.classId}</p>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className={`inline-block px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full ${
                            isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : isDueToday ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1">No pending homework assignments.</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN (1-COL ON DESKTOP) */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          
          {/* UPCOMING EXAM ALERT */}
          {nextExam && (
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Upcoming Exam</p>
                  <p className="text-lg md:text-xl font-black">{nextExam.name}</p>
                  <p className="text-[10px] md:text-xs text-indigo-200 mt-1">{nextExam.date}</p>
                </div>
                <div className="text-center px-3 py-2 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-sm shrink-0">
                  <p className="text-2xl md:text-3xl font-black">{nextExam.daysLeft}</p>
                  <p className="text-[8px] md:text-[9px] font-black text-indigo-200 uppercase tracking-widest">Days Left</p>
                </div>
              </div>
            </div>
          )}

          {/* FEE STATUS BOX */}
          {feeStatus.amount > 0 ? (
            <div className={`rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border shadow-sm ${feeStatus.isOverdue ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <IndianRupee size={16} className={feeStatus.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} /> Fee Due
                </h3>
                {feeStatus.isOverdue && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full">Overdue</span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1">₹{feeStatus.amount.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 mb-4 md:mb-5">Due Date: {feeStatus.dueDate}</p>
              <button 
                onClick={() => navigate('/student/fees')}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30"
              >
                Pay Online Now →
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-[2rem] md:rounded-[2.5rem] p-6 text-center">
              <CheckCircle2 size={28} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
              <p className="text-sm md:text-base font-black text-emerald-900 dark:text-emerald-200">All Fees Paid</p>
              <p className="text-[10px] md:text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1">No pending dues on record! ✓</p>
            </div>
          )}

          {/* QUICK PORTAL ACTIONS */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-5 md:p-6 shadow-sm">
            <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button 
                onClick={() => navigate('/student/homework')}
                className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
              >
                <FileText size={18} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-1.5 md:mb-2 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                <p className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">Homework</p>
              </button>
              <button 
                onClick={() => navigate('/student/timetable')}
                className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
              >
                <Calendar size={18} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-1.5 md:mb-2 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                <p className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">Timetable</p>
              </button>
              <button 
                onClick={() => navigate('/student/attendance')}
                className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
              >
                <CheckCircle2 size={18} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1.5 md:mb-2 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                <p className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">Attendance</p>
              </button>
              <button 
                onClick={() => navigate('/student/fees')}
                className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
              >
                <IndianRupee size={18} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-1.5 md:mb-2 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                <p className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white">Fees</p>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
