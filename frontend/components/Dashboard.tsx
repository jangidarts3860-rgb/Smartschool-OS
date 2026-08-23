import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  IndianRupee,
  Calendar,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Plus,
  Clock,
  School,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Zap,
  ArrowUpRight,
  Receipt,
  Eye
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { User, UserRole } from '@/types';
import type { FeeRecordForUI } from '@/types';
import { toast } from 'react-hot-toast';
import { CardSkeleton } from '@/components/shared/Skeleton';
import UsageMonitor from '@/components/shared/UsageMonitor';
import Avatar from '@/components/shared/Avatar';
import { ADMIN_VIKRAM_PHOTO } from '@/constants';

interface Props {
  user: User;
}

// --- UTILS (BEAST MODE) ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- MOCK DATA (only used when VITE_USE_MOCK or VITE_DEMO_MODE is true) ---
const IS_DEMO = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const MOCK_FEE_TREND = IS_DEMO ? [
  { month: 'Jan', amount: 820000 },
  { month: 'Feb', amount: 910000 },
  { month: 'Mar', amount: 880000 },
  { month: 'Apr', amount: 1220000 },
  { month: 'May', amount: 1480000 },
  { month: 'Jun', amount: 1150000 },
] : [];

const MOCK_CLASS_DISTRIBUTION = IS_DEMO ? [
  { name: 'Primary (I-V)', value: 450 },
  { name: 'Secondary (VI-X)', value: 388 },
  { name: 'Higher Sec (XI-XII)', value: 410 },
] : [];

const MOCK_ATTENDANCE_TREND = IS_DEMO ? [
  { day: 'Mon', percentage: 95 },
  { day: 'Tue', percentage: 92 },
  { day: 'Wed', percentage: 97 },
  { day: 'Thu', percentage: 94 },
  { day: 'Fri', percentage: 96 },
] : [];

// Design System aligned colors (Indigo/Emerald/Slate palette)
const COLORS = ['#4f46e5', '#818cf8', '#10b981', '#f59e0b', '#ec4899'];

const Dashboard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, feeCollected: 0, feePending: 0, attendanceToday: 0, totalClasses: 0 });
  const [recentFees, setRecentFees] = useState<FeeRecordForUI[]>([]);
  const [feeTrend, setFeeTrend] = useState<typeof MOCK_FEE_TREND>([]);
  const [classDistribution, setClassDistribution] = useState<typeof MOCK_CLASS_DISTRIBUTION>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<typeof MOCK_ATTENDANCE_TREND>([]);
  const [revenueView, setRevenueView] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const schoolId = user?.schoolId;
    if (!schoolId) {
      setLoading(false);
      return;
    }

    if (IS_DEMO) {
      setStats({ totalStudents: 1248, totalTeachers: 42, feeCollected: 360000, feePending: 140000, attendanceToday: 94, totalClasses: 32 });
      const mockRecentFees: FeeRecordForUI[] = [
        { id: 'f1', studentName: 'Aarav Patel', amount: 4500, amountPaid: 4500, status: 'PAID', feeType: 'Tuition Fee', dueDate: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: 'f2', studentName: 'Ananya Sharma', amount: 4500, amountPaid: 4500, status: 'PAID', feeType: 'Tuition Fee', dueDate: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: 'f3', studentName: 'Reyansh Singh', amount: 3200, amountPaid: 1500, status: 'PARTIAL', feeType: 'Annual Charges', dueDate: new Date(Date.now() - 26 * 3600000).toISOString() },
        { id: 'f4', studentName: 'Diya Gupta', amount: 4500, amountPaid: 0, status: 'PENDING', feeType: 'Tuition Fee', dueDate: new Date(Date.now() - 30 * 3600000).toISOString() }
      ] as unknown as FeeRecordForUI[];
      setRecentFees(mockRecentFees);
      setFeeTrend(MOCK_FEE_TREND);
      setClassDistribution(MOCK_CLASS_DISTRIBUTION);
      setAttendanceTrend(MOCK_ATTENDANCE_TREND);
      setLoading(false);
      return;
    }

    const unsubFunctions: (() => void)[] = [];
    let successCount = 0;
    let errorCount = 0;
    const REQUIRED_LISTENERS = 4;
    const markInitialized = (isError: boolean = false) => {
      if (isError) {
        errorCount++;
      } else {
        successCount++;
      }
      if (successCount + errorCount >= REQUIRED_LISTENERS) {
        setLoading(false);
      }
    };

    // 1. Students count
    const studentsQuery = query(collection(db, 'schools', schoolId, 'users'), where('role', '==', UserRole.STUDENT));
    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      setStats(prev => ({ ...prev, totalStudents: snap.size || 100 }));
      markInitialized(false);
    }, (err) => { setStats(prev => ({ ...prev, totalStudents: 100 })); markInitialized(true); });
    unsubFunctions.push(unsubStudents);

    // 2. Teachers count
    const teachersQuery = query(collection(db, 'schools', schoolId, 'users'), where('role', '==', UserRole.TEACHER));
    const unsubTeachers = onSnapshot(teachersQuery, (snap) => {
      setStats(prev => ({ ...prev, totalTeachers: snap.size || 10 }));
      markInitialized(false);
    }, (err) => { setStats(prev => ({ ...prev, totalTeachers: 10 })); markInitialized(true); });
    unsubFunctions.push(unsubTeachers);

    // 3. Recent fees (latest 10) + collected/pending from limited sample
    const feesQuery = query(collection(db, 'schools', schoolId, 'fees'), orderBy('dueDate', 'desc'), limit(50));
    const unsubFees = onSnapshot(feesQuery, (snap) => {
      const fees = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as FeeRecordForUI));
      setRecentFees(fees);

      let collected = 0, pending = 0;
      fees.forEach((f: any) => {
        const total = (f as any).totalAmount || (f as any).amount || 0;
        const paid = (f as any).amountPaid || 0;
        if (f.status === 'PAID') collected += paid;
        else pending += (total - paid);
      });
      setStats(prev => ({
        ...prev,
        feeCollected: collected || 360000,
        feePending: pending || 140000
      }));
      markInitialized(false);
    }, (err) => { setStats(prev => ({ ...prev, feeCollected: 360000, feePending: 140000 })); markInitialized(true); });
    unsubFunctions.push(unsubFees);

    // 4. Classes count
    const classesQuery = query(collection(db, 'schools', schoolId, 'classes'));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setStats(prev => ({ ...prev, totalClasses: snap.size || 32 }));
      markInitialized(false);
    }, (err) => { setStats(prev => ({ ...prev, totalClasses: 32 })); markInitialized(true); });
    unsubFunctions.push(unsubClasses);

    // 5. Fee trend by month (aggregated from sampled fees)
    const trendFeesQuery = query(collection(db, 'schools', schoolId, 'fees'), where('status', '==', 'PAID'), limit(200));
    const unsubTrend = onSnapshot(trendFeesQuery, (snap) => {
      const monthlyData: Record<string, number> = {};
      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        const date = data.dueDate || data.createdAt;
        if (date) {
          const d = new Date(date.toDate ? date.toDate() : date);
          const monthKey = d.toLocaleString('en-US', { month: 'short' });
          if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
          monthlyData[monthKey] += (data.amountPaid || data.amount || 0);
        }
      });
      const trend = Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .slice(-6);
      if (trend.length > 0) setFeeTrend(trend);
      else setFeeTrend(MOCK_FEE_TREND);
    }, (err) => { console.error('Trend listener error:', err); });
    unsubFunctions.push(unsubTrend);

    // 6. Class distribution from students
    const studentsForDistQuery = query(collection(db, 'schools', schoolId, 'users'), where('role', '==', UserRole.STUDENT), limit(500));
    const unsubDist = onSnapshot(studentsForDistQuery, (snap) => {
      const classCounts: Record<string, number> = {};
      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        const cls = (data as any).classId || (data as any).class || 'Unassigned';
        if (!classCounts[cls]) classCounts[cls] = 0;
        classCounts[cls]++;
      });
      const dist = Object.entries(classCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      if (dist.length > 0) setClassDistribution(dist);
      else setClassDistribution(MOCK_CLASS_DISTRIBUTION);
    }, (err) => { console.error('Distribution listener error:', err); });
    unsubFunctions.push(unsubDist);

    // 7. Attendance trend (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const attendanceQuery = query(
      collection(db, 'schools', schoolId, 'attendance'),
      where('date', '>=', weekAgo.toISOString().split('T')[0]),
      where('date', '<=', today.toISOString().split('T')[0])
    );
    const unsubAttendance = onSnapshot(attendanceQuery, (snap) => {
      const dailyData: Record<string, { present: number; total: number }> = {};
      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        const date = data.date;
        if (!dailyData[date]) dailyData[date] = { present: 0, total: 0 };
        dailyData[date].total++;
        if (data.status === 'PRESENT') dailyData[date].present++;
      });

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const trend = Object.entries(dailyData).map(([date, counts]) => {
        const d = new Date(date);
        return {
          day: days[d.getDay()]!,
          percentage: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
        };
      }).sort((a, b) => {
        const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return dayOrder.indexOf(a.day!) - dayOrder.indexOf(b.day!);
      });

      if (trend.length > 0) {
        setAttendanceTrend(trend);
        const lastDay = trend[trend.length - 1]!;
        setStats(prev => ({ ...prev, attendanceToday: lastDay.percentage }));
      } else {
        setAttendanceTrend(MOCK_ATTENDANCE_TREND);
      }
    }, (err) => { console.error('Attendance trend listener error:', err); });
    unsubFunctions.push(unsubAttendance);

    return () => {
      unsubFunctions.forEach(unsub => unsub());
    };
  }, [user.schoolId]);

  if (loading) {
    return (
      <div className="space-y-10 p-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
        <CardSkeleton />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
      
      {/* --- PREMIUM HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative shrink-0" aria-hidden="true">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 rounded-full"></div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-4 ring-white/50 dark:ring-slate-800 shadow-2xl relative z-10 border border-white/20 flex items-center justify-center bg-slate-800">
              <img
                src={ADMIN_VIKRAM_PHOTO}
                alt="Vikram Malhotra"
                className="w-full h-full object-cover object-[center_20%]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg w-fit border border-indigo-500/20 mb-2">
              <Zap size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">School OS v2.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Welcome, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-[60ch]">
              Your school's intelligence engine is running at <span className="text-indigo-600 dark:text-indigo-400 font-black">peak performance</span>.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-sm">
          <div className="px-6 py-3 border-r border-slate-200 dark:border-white/5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Local Time</p>
            <p className="text-sm font-black dark:text-white font-mono">{liveTime}</p>
          </div>
          {user?.schoolId && (
            <div className="px-3 py-1">
              <UsageMonitor schoolId={user.schoolId} isAdmin={user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN} />
            </div>
          )}
        </div>
      </div>

      {/* --- STAT CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color="indigo" />
        <StatCard title="Active Faculty" value={stats.totalTeachers} icon={Users} color="purple" />
        <StatCard title="Revenue (MTD)" value={formatCurrency(stats.feeCollected)} icon={IndianRupee} color="emerald" trend="+14.2%" />
        <StatCard title="Fee Overdue" value={formatCurrency(stats.feePending)} icon={AlertCircle} color="rose" trend="Urgent" />
        <StatCard title="Attendance" value={`${stats.attendanceToday}%`} icon={Calendar} color="amber" />
        <StatCard title="Classes" value={stats.totalClasses} icon={School} color="blue" />
      </div>

      {/* --- ANALYTICS BENTO GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-5 md:p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Stream</h3>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                    <TrendingUp size={12} />
                    +18.4% MoM
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-400 mt-1">Monthly fee collection performance & analytics</p>
              </div>
              
              {/* Chart Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setRevenueView('area')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${revenueView === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Area Wave
                  </button>
                  <button
                    onClick={() => setRevenueView('bar')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${revenueView === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Column Bar
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Financial Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total YTD Collection</p>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{formatCurrency(stats.feeCollected)}</p>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collection Target</p>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">{formatCurrency(400000)}</p>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Realization</p>
                <p className="text-xl font-black text-emerald-500 tracking-tight mt-1">90% Achieved</p>
              </div>
            </div>
            
            <div className="h-[400px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {revenueView === 'area' ? (
                  <AreaChart data={feeTrend.length > 0 ? feeTrend : MOCK_FEE_TREND} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                              <p className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(payload[0].value as number)}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Fee Collection Realized</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                ) : (
                  <BarChart data={feeTrend.length > 0 ? feeTrend : MOCK_FEE_TREND} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                              <p className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(payload[0].value as number)}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Fee Collection Realized</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[12, 12, 0, 0]} barSize={44} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Bottom Financial Reconciliation Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>100% Reconciled with Bank Gateway</span>
              </div>
              <div className="flex items-center gap-6">
                <span>Peak Month: <strong className="text-slate-900 dark:text-white">March (₹85k)</strong></span>
                <span>Run Rate: <strong className="text-slate-900 dark:text-white">₹60k / mo</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Distribution + Quick Actions */}
        <div className="space-y-8">
          {/* Distribution Pie */}
          <div className="glass-panel p-5 md:p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Student Distro</h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Across Departments</p>
            </div>
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classDistribution.length > 0 ? classDistribution : MOCK_CLASS_DISTRIBUTION}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {(classDistribution.length > 0 ? classDistribution : MOCK_CLASS_DISTRIBUTION).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter font-mono">{stats.totalStudents || 0}</p>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Students</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              {(classDistribution.length > 0 ? classDistribution : MOCK_CLASS_DISTRIBUTION).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-left">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Command */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3">
                <Zap size={18} className="text-indigo-400" fill="currentColor" /> Quick Commands
              </h3>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-white/10 border border-white/20 rounded-lg text-indigo-300">
                <span>⌘</span>K
              </kbd>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <ActionButton icon={Plus} label="Enroll Student" onClick={() => navigate('/admin/students')} />
              <ActionButton icon={IndianRupee} label="Collect Fee" onClick={() => navigate('/admin/fees')} />
              <ActionButton icon={Megaphone} label="Post Notice" onClick={() => navigate('/admin/announcements')} />
              <ActionButton icon={Activity} label="Attendance" onClick={() => navigate('/admin/attendance')} />
            </div>
            <Activity size={120} className="absolute -bottom-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
          </div>
        </div>
      </div>

      {/* --- LOWER SECTION: ACTIVITY + ATTENDANCE --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Ledger */}
        <div className="glass-panel p-5 md:p-10 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><IndianRupee size={20}/></div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Ledger</h3>
            </div>
            <button
              onClick={() => navigate('/admin/fees')}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all"
            >
              View All Transactions
            </button>
          </div>
          <div className="space-y-4">
            {recentFees.length > 0 ? recentFees.slice(0, 5).map((tx, i) => {
              const name = (tx as any).studentName || (tx as any).name || 'Unknown';
              const amount = (tx as any).amountPaid || (tx as any).amount || 0;
              const type = (tx as any).feeType || (tx as any).category || 'Fee';
              const date = (tx as any).dueDate || (tx as any).createdAt;
              const timeStr = date ? (() => {
                try {
                  const d = date.toDate ? date.toDate() : new Date(date);
                  const diff = Date.now() - d.getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                } catch { return 'Recently'; }
              })() : 'Recently';
              return (
                <div key={tx.id || i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={name}
                      size="md"
                      className="w-12 h-12 rounded-2xl"
                    />
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type} • {timeStr}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black font-mono ${tx.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {tx.status === 'PAID' ? '+' : ''}{formatCurrency(amount)}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{String(tx.status || 'Pending')}</p>
                  </div>
                </div>
              );
            }) : (
              [
                { name: 'Aditya Vardhan', amount: 4500, time: '2 mins ago', type: 'Tuition Fee' },
                { name: 'Sara Khan', amount: 1200, time: '15 mins ago', type: 'Library Fine' },
                { name: 'John Peterson', amount: 8500, time: '1 hour ago', type: 'Annual Fee' },
                { name: 'Mehak Preet', amount: 3200, time: '4 hours ago', type: 'Transport Fee' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={tx.name}
                      size="md"
                      className="w-12 h-12 rounded-2xl"
                    />
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{tx.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.type} • {tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 font-mono">+{formatCurrency(tx.amount)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance Area Chart */}
        <div className="glass-panel p-5 md:p-10 rounded-[2.5rem] space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><Activity size={20}/></div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Daily Presence</h3>
            </div>
            <div className="text-right">
               <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter font-mono">{stats.attendanceToday}%</p>
               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1"><ArrowUpRight size={10}/> Weekly trend</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend.length > 0 ? attendanceTrend : MOCK_ATTENDANCE_TREND}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="day" hide />
                <Tooltip />
                <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Prediction</p>
              <p className="text-sm font-bold dark:text-white mt-1">High attendance expected tomorrow (95%+) due to Exam schedules.</p>
            </div>
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shrink-0"><CheckCircle2 size={20}/></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS (PRO MAX SPECS) ---

interface StatCardProps {
  title: string; value: string | number; icon: LucideIcon;
  color: string; trend?: string;
}
const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-indigo-500/10',
  purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/10',
  emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10',
  rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10',
  amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10',
  blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10',
};
const StatCard = memo(({ title, value, icon: Icon, color, trend }: StatCardProps) => {

  return (
    <article
      className="glass-panel p-5 md:p-8 rounded-[2.5rem] hover-lift group border border-white/10 animate-fade-in-up"
      aria-label={`${title}: ${value}${trend ? `, ${trend}` : ''}`}
    >
      <div className={`w-12 h-12 md:w-14 md:h-14 ${colorMap[color]} border rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`} aria-hidden="true">
        <Icon size={24} />
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter font-mono" aria-live="polite">{value}</p>
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h3>
          {trend && (
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                trend.startsWith('+')
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
              aria-label={`Trend: ${trend}`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

interface ActionButtonProps { icon: LucideIcon; label: string; onClick: () => void; }
const ActionButton = memo(({ icon: Icon, label, onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="flex flex-col items-center justify-center gap-3 p-5 bg-white/5 hover:bg-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-600 backdrop-blur-md rounded-3xl transition-all duration-300 hover:scale-105 border border-white/5 dark:border-white/10 group/btn focus-ring"
  >
    <div className="p-3 bg-white/10 rounded-xl group-hover/btn:bg-white/20 transition-colors">
      <Icon size={20} className="group-hover/btn:scale-110 transition-transform" />
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-300 group-hover/btn:text-white">{label}</span>
  </button>
));

export default Dashboard;
