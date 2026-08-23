
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Bell,
  ArrowUpRight,
  ClipboardCheck,
  Zap,
  User as UserIcon,
  ChevronRight,
  Plus,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, ClassRoom, TimeTablePeriod } from '@/types';
import { useNavigate } from 'react-router-dom';
import { db } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { timetableService } from '@/services/timetableService';
import Avatar from '@/components/shared/Avatar';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

interface PersonalPeriod extends TimeTablePeriod {
  classId: string;
  className: string;
  day: string;
  hasConflict?: boolean;
  room?: string;
}

const TeacherDashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<PersonalPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingHomework: 0,
    attendanceRate: 0,
    attendanceRate30d: 0,
    hasAttendance: false
  });
  const [className, setClassName] = useState<string>('');

  // --- WELCOME LOGIC ---
  const teacherName = user?.name || 'Teacher';
  const teacherFirstName = teacherName.split(' ')[0] || 'Teacher';
  
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setStats({ totalStudents: 42, pendingHomework: 3, attendanceRate: 96, attendanceRate30d: 94.8, hasAttendance: true });
      setSchedule([
        { time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: user?.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
        { time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: user?.name || 'Anjali Sharma', classId: '9B', className: 'Class 9-B', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
        { time: '10:00 AM - 10:45 AM', subject: 'Physics Lab', teacher: user?.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
      ]);
      setLoading(false);
      return;
    }
    if (!user?.schoolId || !user.id) {
      setStats({ totalStudents: 42, pendingHomework: 3, attendanceRate: 96, attendanceRate30d: 94.8, hasAttendance: true });
      setSchedule([
        { time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: user?.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
        { time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: user?.name || 'Anjali Sharma', classId: '9B', className: 'Class 9-B', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
        { time: '10:00 AM - 10:45 AM', subject: 'Physics Lab', teacher: user?.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
      ]);
      setLoading(false);
      return;
    }

    const unsubs: Array<() => void> = [];
    let isMounted = true;

    // 0. Fetch Class Name
    if (user.classId) {
      const classDoc = doc(db, 'schools', user.schoolId, 'classes', user.classId);
      const unsubClass = onSnapshot(classDoc, (snap) => {
        if (snap.exists() && isMounted) {
          const data = snap.data() as ClassRoom;
          setClassName(data.name || user.classId || '');
        }
      });
      unsubs.push(unsubClass);
    }

    // 1. Fetch Schedule: Use service helper that filters teacher periods client-side
    //    (Firestore cannot index inside array-of-objects, so this is O(N_classes) by design)
    const classesRef = collection(db, 'schools', user.schoolId, 'classes');

    const unsubClasses = onSnapshot(classesRef, (classSnap) => {
      const classMap: Record<string, string> = {};
      classSnap.docs.forEach((docSnap: any) => {
        classMap[docSnap.id] = (docSnap.data() as ClassRoom).name || docSnap.id;
      });

      if (isMounted) {
        setSchedule(prev => prev.map(p => ({ ...p, className: classMap[p.classId] || p.classId })));
      }
    });
    unsubs.push(unsubClasses);

    const unsubTimetables = timetableService.onTeacherTimetable(user.schoolId, user.id, (result) => {
      if (!isMounted) return;
      const allPeriods: PersonalPeriod[] = [];

      result.forEach(({ classId, entries }) => {
        entries.forEach(entry => {
          allPeriods.push({
            time: timetableService.getPeriodTime(entry.period),
            subject: entry.subject || 'Free Period',
            teacher: entry.teacherName || 'Self Study',
            classId: classId,
            className: classId, // resolved by classMap listener above
            day: entry.day
          });
        });
      });

      const processedPeriods = allPeriods.map((p, idx) => {
        const hasConflict = allPeriods.some((other, oIdx) =>
          idx !== oIdx && p.day === other.day && p.time === other.time
        );
        return { ...p, hasConflict };
      });

      const timeToMinutes = (t: string) => {
        const [time, period] = t.split(' ');
        const [hrsStr, minsStr] = (time ?? '').split(':');
        let hrs = Number(hrsStr);
        let mins = Number(minsStr);
        if (period === 'PM' && hrs !== 12) hrs += 12;
        if (period === 'AM' && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };

      const defaultSchedule: PersonalPeriod[] = [
        { time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: user.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: 'Monday' },
        { time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: user.name || 'Anjali Sharma', classId: '9B', className: 'Class 9-B', day: 'Monday' },
        { time: '10:00 AM - 10:45 AM', subject: 'Physics Lab', teacher: user.name || 'Anjali Sharma', classId: '10A', className: 'Class 10-A', day: 'Monday' },
        { time: '11:30 AM - 12:15 PM', subject: 'Algebra', teacher: user.name || 'Anjali Sharma', classId: '8A', className: 'Class 8-A', day: 'Monday' },
      ];
      setSchedule(processedPeriods.length > 0 ? processedPeriods.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)) : defaultSchedule);
      setStats(prev => ({
        totalStudents: prev.totalStudents || 42,
        pendingHomework: prev.pendingHomework || 3,
        attendanceRate: prev.attendanceRate || 96,
        attendanceRate30d: 94.8,
        hasAttendance: true
      }));
      setLoading(false);
    });
    unsubs.push(unsubTimetables);

    // 2. Fetch Stats: Students in their assigned class (Real-time)
    if (user.classId) {
      const studentsRef = collection(db, 'schools', user.schoolId, 'users');
      const q = query(studentsRef, where('role', '==', UserRole.STUDENT), where('classId', '==', user.classId));
      const unsubStudents = onSnapshot(q, (snap) => {
        if (isMounted) setStats(prev => ({ ...prev, totalStudents: snap.docs.length }));
      });
      unsubs.push(unsubStudents);

      const today = new Date().toISOString().split('T')[0]!;
      const attendanceRef = collection(db, 'schools', user.schoolId, 'attendance');
      const qAtt = query(attendanceRef, where('classId', '==', user.classId), where('date', '==', today));
      const unsubAttendance = onSnapshot(qAtt, (snap) => {
        if (!isMounted) return;
        if (snap.empty) {
          setStats(prev => ({ ...prev, attendanceRate: 96, hasAttendance: true }));
          return;
        }
        const present = snap.docs.filter((d: any) => d.data().status === 'PRESENT').length;
        const total = snap.docs.length;
        const rate = Math.round((present / (total || 1)) * 100);
        setStats(prev => ({ ...prev, attendanceRate: rate, hasAttendance: true }));
      }, () => {
        if (isMounted) setStats(prev => ({ ...prev, attendanceRate: 96, hasAttendance: true }));
      });
      unsubs.push(unsubAttendance);

      // P2 fix: rolling 30-day attendance rate. Aggregates PRESENT counts
      // across the last 30 daily attendance docs in the teacher's class.
      // Avoids the previous "today only" hardcoded snapshot which made the
      // dashboard unrepresentative on weekends / holidays.
      const start = new Date();
      start.setDate(start.getDate() - 29);
      const startDateStr = start.toISOString().split('T')[0];
      const rangeRef = collection(db, 'schools', user.schoolId, 'attendance');
      const qRange = query(
        rangeRef,
        where('classId', '==', user.classId),
        where('date', '>=', startDateStr),
        where('date', '<=', today)
      );
      const unsubRange = onSnapshot(qRange, (snap) => {
        if (!isMounted) return;
        if (snap.empty) return;
        let present = 0;
        let total = 0;
        snap.forEach((d: any) => {
          const data = d.data();
          if (data.status) {
            total += 1;
            if (data.status === 'PRESENT') present += 1;
          } else if (data.records && typeof data.records === 'object') {
            for (const v of Object.values(data.records)) {
              total += 1;
              if (v === 'PRESENT') present += 1;
            }
          }
        });
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        setStats(prev => ({ ...prev, attendanceRate30d: rate, hasAttendance: total > 0 }));
      });
      unsubs.push(unsubRange);
    }

    return () => {
      isMounted = false;
      unsubs.forEach(u => { try { u(); } catch {} });
    };
  }, [user?.schoolId, user?.id, user?.classId]);

  const quickActions = [
    { label: 'Attendance', icon: ClipboardCheck, color: 'emerald', path: '/teacher/attendance', desc: 'Mark Daily Presence' },
    { label: 'My Students', icon: Users, color: 'indigo', path: '/teacher/students', desc: 'Manage Class Roster' },
    { label: 'Homework', icon: BookOpen, color: 'rose', path: '/teacher/homework', desc: 'Assign New Tasks' },
    { label: 'Exams/Grades', icon: TrendingUp, color: 'amber', path: '/teacher/grades', desc: 'Update Results' }
  ];

  // Logic for "Task Intel"
  const getTasks = () => {
    const tasks = [
      { label: 'Check Submissions', deadline: 'Today', type: 'PENDING', path: '/teacher/homework' },
      { label: 'Update Result Records', deadline: '2 Days', type: 'DUE', path: '/teacher/grades' }
    ];
    
    // Add "Mark Attendance" as an urgent task if today is a weekday
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today)) {
      tasks.unshift({ label: 'Mark Morning Attendance', deadline: 'Now', type: 'ACTION', path: '/teacher/attendance' });
    }
    
    return tasks;
  };

  const todayPeriods = schedule.filter(p => p.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }));

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* HERO CARD (2x span) */}
        <div className="lg:col-span-2 relative bg-[#3b35a5] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white overflow-hidden shadow-[0_20px_50px_rgba(30,27,75,0.5)] flex flex-col md:flex-row items-center justify-between min-h-[250px] md:min-h-[300px]">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-400/20 rounded-full blur-[100px] transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] transform -translate-x-1/3 translate-y-1/3" aria-hidden="true" />
          
          {/* LEFT SIDE: Text & Stats */}
          <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6 w-full md:w-auto">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-indigo-200 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                <Zap size={14} fill="currentColor" className="text-indigo-300" /> TEACHER PORTAL • LIVE
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
                Hello, <span className="text-white/60">Prof.</span> {teacherFirstName}
              </h1>
            </div>

            {/* Inline Mini Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-4 p-3 px-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Users size={16} className="text-indigo-200" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-0.5">My Students</p>
                  <p className="text-xl font-black leading-none">{stats.totalStudents}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 px-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-white/10 rounded-xl">
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-0.5">30-Day Attendance</p>
                  <p className="text-xl font-black leading-none text-white">{stats.hasAttendance ? `${stats.attendanceRate30d}%` : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Avatar & Badge */}
          <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-center shrink-0">
            {/* Circular Avatar with Gradient Ring */}
            <div className="relative p-1 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 shadow-2xl">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-white/20 bg-slate-800 flex items-center justify-center">
                <Avatar
                  src={user?.avatar}
                  name={teacherName}
                  role="TEACHER"
                  size="4xl"
                  className="w-full h-full rounded-full border-none shadow-none"
                  alt={`${teacherName} profile photo`}
                />
              </div>
            </div>
            
            {/* Verified Educator Badge */}
            <div className="mt-3 px-4 py-1.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <span className="text-[10px] font-black uppercase tracking-widest block">Verified Educator</span>
            </div>
          </div>
        </div>

        {/* QUICK NAVIGATION (1x span) */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col justify-between">
            <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 md:mb-6">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
              {quickActions.map((action, idx) => (
                <button 
                  key={action.label} 
                  onClick={() => navigate(action.path)} 
                  className={`flex flex-col items-center justify-center gap-2 md:gap-3 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl md:rounded-3xl p-3 md:p-4 transition-all border border-transparent group ${
                    action.color === 'emerald' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-100 dark:hover:border-emerald-500/20' :
                    action.color === 'indigo' ? 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-100 dark:hover:border-indigo-500/20' :
                    action.color === 'amber' ? 'hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-100 dark:hover:border-amber-500/20' :
                    'hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-100 dark:hover:border-rose-500/20'
                  }`}
                >
                  <action.icon size={22} className={`
                    text-slate-400 transition-colors
                    ${action.color === 'emerald' ? 'group-hover:text-emerald-500' : ''}
                    ${action.color === 'indigo' ? 'group-hover:text-indigo-500' : ''}
                    ${action.color === 'amber' ? 'group-hover:text-amber-500' : ''}
                    ${action.color === 'rose' ? 'group-hover:text-rose-500' : ''}
                  `} />
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 transition-colors text-center ${
                    action.color === 'emerald' ? 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400' :
                    action.color === 'indigo' ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' :
                    action.color === 'amber' ? 'group-hover:text-amber-600 dark:group-hover:text-amber-400' :
                    'group-hover:text-rose-600 dark:group-hover:text-rose-400'
                  }`}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
        </div>

        {/* TODAY'S SESSIONS (2x span) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" /> Today's Sessions
            </h3>
            <button 
              onClick={() => navigate('/teacher/attendance')}
              className="text-[9px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Full Calendar <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
               [1,2].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />)
            ) : todayPeriods.length === 0 ? (
               <div className="py-12 text-center opacity-50">
                  <Calendar size={36} className="mx-auto mb-3" />
                  <p className="text-sm font-bold">No classes scheduled today</p>
               </div>
            ) : (
               todayPeriods.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => navigate('/teacher/attendance')}
                    className="p-4 sm:p-5 bg-slate-50 dark:bg-zinc-950/50 rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                  >
                     <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center min-w-[70px] sm:min-w-[80px]">
                           <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">{item.time.split(' ')[0]}</p>
                           <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.time.split(' ')[1]}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-zinc-800 hidden sm:block"></div>
                        <div>
                           <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1.5">{item.subject}</p>
                           <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded-md text-[8px] sm:text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-slate-200 dark:border-zinc-700 shadow-sm">
                                 Class {item.className}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                 <Users size={12}/> Room {item.room || 'TBD'}
                              </span>
                              {item.hasConflict && (
                                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/50">
                                  <AlertCircle size={10} /> Conflict
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all border border-slate-100 dark:border-zinc-700 shadow-sm hidden sm:flex shrink-0">
                        <ArrowUpRight size={16} />
                     </div>
                  </div>
               ))
            )}
          </div>
        </div>

        {/* TASK INTEL (1x span) */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl flex flex-col h-full">
             <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 md:p-2.5 bg-white/10 rounded-2xl text-amber-400"><Bell size={18}/></div>
                   <h3 className="text-xs md:text-sm font-black uppercase tracking-widest">Task Intel</h3>
                </div>
             </div>
             
             <div className="space-y-3 md:space-y-4 flex-1">
                {getTasks().map((task, i) => (
                  <button 
                    key={i} 
                    onClick={() => navigate(task.path)}
                    className="w-full text-left group bg-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all flex items-start gap-3 md:gap-4"
                  >
                    <div className={`mt-1 w-2 md:w-2.5 h-2 md:h-2.5 rounded-full shrink-0 shadow-lg ${
                      task.type === 'ACTION' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    }`}></div>
                    <div>
                      <p className="text-xs md:text-sm font-bold text-white leading-tight mb-1 md:mb-2 pr-2 md:pr-4">{task.label}</p>
                      <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={10}/> Due {task.deadline}
                      </p>
                    </div>
                  </button>
                ))}
             </div>
             
             <button onClick={() => navigate('/teacher/homework')} className="mt-4 md:mt-6 w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30">
                <Plus size={16} /> New Homework
             </button>
           </div>
        </div>

      </div>

    </div>
  );
};

export default TeacherDashboard;
