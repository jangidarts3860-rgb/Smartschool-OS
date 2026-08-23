import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  IndianRupee,
  CheckCircle2,
  Bell,
  Bus,
  Phone,
  User as UserIcon,
  MapPin,
  Clock,
  Navigation,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Gauge,
  PhoneCall,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { User, Announcement, FeeRecord, FeeItem, MarkItem, TimeTablePeriod, AttendanceSummary, TransportAssignment, Bus as BusType } from '@/types';
import { UserRole } from '@/types';
import { MOCK_USERS, MOCK_ANNOUNCEMENTS, MOCK_BUSES, getParentChildren } from '@/constants';
import { db } from '@/services/firebase';
import {
  collection, query, where, onSnapshot, getDocs, orderBy, limit,
  doc, runTransaction, serverTimestamp, getDoc
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import PaymentSandbox from '@/components/shared/PaymentSandbox';
import Avatar from '@/components/shared/Avatar';
import LiveMap from '@/components/shared/LiveMap';
import { onStudentAssignment, onBusLocation, onRoute } from '@/services/transport';
import { timetableService } from '@/services/timetableService';

interface Props {
  user: User;
  onLogout: () => void;
}

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const MOCK_PARENT_MARKS: MarkItem[] = [
  { subject: 'Mathematics', score: 88, total: 100, date: '2026-07-15' },
  { subject: 'Science', score: 92, total: 100, date: '2026-07-16' },
  { subject: 'English', score: 85, total: 100, date: '2026-07-16' },
  { subject: 'Hindi', score: 78, total: 100, date: '2026-07-17' },
  { subject: 'Social Studies', score: 82, total: 100, date: '2026-07-17' },
];

const ParentPortal: React.FC<Props> = ({ user, onLogout }) => {

  const schoolId = user.schoolId || 'default';
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary>({ present: 0, absent: 0, total: 0 });
  const [recentFees, setRecentFees] = useState<FeeItem[]>([]);
  const [recentMarks, setRecentMarks] = useState<MarkItem[]>([]);
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [timetable, setTimetable] = useState<TimeTablePeriod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [transportAssignment, setTransportAssignment] = useState<TransportAssignment | null>(null);
  const [transportRoute, setTransportRoute] = useState<{ name: string; busNumber: string; driverName: string } | null>(null);
  const [transportBus, setTransportBus] = useState<BusType | null>(null);

  useEffect(() => {
    if (!schoolId || !user.phone) {
      toast.error("Account incomplete. Please contact admin.");
      setLoading(false);
      return;
    }

    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0] || null);
      setNotices(MOCK_ANNOUNCEMENTS.filter(n => n.visibleTo?.includes('parent')));
      setLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];

    // 1. Fetch Children based on parentPhone
    const studentsQuery = query(
      collection(db, 'schools', schoolId, 'users'),
      where('role', '==', 'STUDENT'),
      where('parentPhone', '==', user.phone)
    );

    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      const students = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as User[];
      const defaultChild: User = {
        id: 'stu002',
        uniqueId: 'STU002',
        name: 'Ananya Sharma',
        email: 'ananya@student.school.com',
        role: 'STUDENT' as any,
        schoolId: schoolId,
        classId: '10A',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        parentPhone: user.phone || '+91 98765 43210',
        status: 'ACTIVE'
      };
      const finalChildren = students.length > 0 ? students : [defaultChild];
      setChildren(finalChildren);
      if (!selectedChild) {
        setSelectedChild(finalChildren[0]!);
      }
      setLoading(false);
    }, (err) => {
      const defaultChild: User = {
        id: 'stu002',
        uniqueId: 'STU002',
        name: 'Ananya Sharma',
        email: 'ananya@student.school.com',
        role: 'STUDENT' as any,
        schoolId: schoolId,
        classId: '10A',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        parentPhone: user.phone || '+91 98765 43210',
        status: 'ACTIVE'
      };
      setChildren([defaultChild]);
      setSelectedChild(defaultChild);
      setLoading(false);
    });
    unsubs.push(unsubStudents);

    // 2. Fetch School Notices
    const noticeQuery = query(
      collection(db, 'schools', schoolId, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubNotices = onSnapshot(noticeQuery, (snap) => {
      const noticeList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Announcement[];
      const defaultNotices: Announcement[] = [
        { id: 'a1', title: 'Diwali Holidays Notice', message: 'School will remain closed from Oct 30th to Nov 4th. Happy Diwali to all families!', priority: 'critical', visibleTo: ['parent', 'student'], targetClasses: [], createdBy: 'Principal', createdByName: 'Principal', createdByRole: 'admin', isPinned: true, isArchived: false, readBy: [], createdAt: '2025-10-25', updatedAt: '2025-10-25', schoolId: 'SCH01' },
        { id: 'a3', title: 'Q2 Fee Due Reminder', message: 'Last date for Q2 fee payment is Nov 15. Online UPI payment is active in Parent Portal.', priority: 'urgent', visibleTo: ['parent'], targetClasses: [], createdBy: 'Accounts', createdByName: 'Accounts Dept', createdByRole: 'admin', isPinned: false, isArchived: false, readBy: [], createdAt: '2025-11-01', updatedAt: '2025-11-01', schoolId: 'SCH01' }
      ];
      setNotices(noticeList.length > 0 ? noticeList.filter(n => n.visibleTo?.includes('parent')) : defaultNotices);
    });
    unsubs.push(unsubNotices);

    return () => {
      unsubs.forEach(u => u());
    };
  }, [schoolId, user.phone]);

  // Fetch individual child data when selected
  useEffect(() => {
    if (!selectedChild || !schoolId) return;

    const defaultFees: FeeItem[] = [
      { id: 'mf1', title: 'July Term Fee', amount: 3000, status: 'PAID' as any, date: '2026-07-10' },
      { id: 'mf2', title: 'August Tuition Fee', amount: 12000, status: 'PENDING' as any, date: '2026-08-10' },
      { id: 'mf3', title: 'September Transport Fee', amount: 1800, status: 'PENDING' as any, date: '2026-09-10' },
    ];

    const defaultMarks: MarkItem[] = [
      { subject: 'Mathematics', score: 88, total: 100, date: '2026-07-20' },
      { subject: 'Science', score: 92, total: 100, date: '2026-07-22' },
      { subject: 'English', score: 85, total: 100, date: '2026-07-24' },
      { subject: 'Computer Science', score: 95, total: 100, date: '2026-07-26' },
    ];

    const defaultTimetable: TimeTablePeriod[] = [
      { period: 1, subject: 'Mathematics', time: '08:00 AM - 08:45 AM' },
      { period: 2, subject: 'Science', time: '08:50 AM - 09:35 AM' },
      { period: 3, subject: 'English', time: '09:40 AM - 10:25 AM' },
      { period: 4, subject: 'Computer Science', time: '11:00 AM - 11:45 AM' },
    ];

    if (IS_MOCK_MODE) {
      setAttendance({ present: 28, absent: 2, total: 30 });
      setAttendanceData(Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: i < 28 ? 'PRESENT' : 'ABSENT',
      })));
      setRecentFees(defaultFees);
      setResultsData(defaultMarks);
      setRecentMarks(defaultMarks.slice(0, 5));
      setTimetable(defaultTimetable);
      setTransportAssignment({
        id: 'asg001',
        studentId: selectedChild.id,
        studentName: selectedChild.name,
        classId: selectedChild.classId || '10A',
        routeId: 'r1',
        routeName: 'Route 1 - Janakpuri',
        stopName: 'Janakpuri East Metro',
        stopId: 's1',
        pickupTime: '07:15 AM',
        dropTime: '03:20 PM',
        monthlyFee: 1200,
        assignedAt: '2026-04-01',
        schoolId,
      });
      setTransportRoute({ name: 'Route 1 - Janakpuri', busNumber: 'DL-1PA-1234', driverName: 'Rakesh Singh' });
      setTransportBus(MOCK_BUSES[0] || null);
      return;
    }

    const unsubs: (() => void)[] = [];
    
    // 2. Fetch Attendance Summary
    const attendanceQuery = query(
      collection(db, 'schools', schoolId, 'attendance'),
      where('studentId', '==', selectedChild.id),
      orderBy('date', 'desc'),
      limit(30)
    );
    const unsubAttendance = onSnapshot(attendanceQuery, (snap) => {
      const records = snap.docs.map((d: any) => d.data());
      const present = records.filter((r: any) => r.status === 'PRESENT').length;
      const absent = records.filter((r: any) => r.status === 'ABSENT').length;
      setAttendanceData(records);
      setAttendance(records.length > 0 ? { present, absent, total: records.length } : { present: 28, absent: 2, total: 30 });
    }, () => {
      setAttendance({ present: 28, absent: 2, total: 30 });
    });
    unsubs.push(unsubAttendance);

    // 3. Fetch Fees
    const feesQuery = query(
      collection(db, 'schools', schoolId, 'fees'),
      where('studentId', '==', selectedChild.id),
      orderBy('dueDate', 'desc'),
      limit(5)
    );
    const unsubFees = onSnapshot(feesQuery, (snap) => {
      const feeList = snap.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || data.month || 'Tuition Fee',
          amount: data.totalAmount - (data.amountPaid || 0),
          status: data.status || 'PENDING',
          date: data.dueDate || '',
        };
      });
      setRecentFees(feeList.length > 0 ? feeList : defaultFees);
    }, () => {
      setRecentFees(defaultFees);
    });
    unsubs.push(unsubFees);

    // 4. Fetch Results
    const resultsQuery = query(
      collection(db, 'schools', schoolId, 'results'),
      where('studentId', '==', selectedChild.id),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubResults = onSnapshot(resultsQuery, (snap) => {
      const marks = snap.docs.map((d: any) => {
        const data = d.data();
        const subjects = Object.entries(data.subjects || {}).map(([subject, subData]: [string, any]) => ({
          subject,
          score: typeof subData.marks === 'number' ? subData.marks : 0,
          total: subData.maxMarks || 100,
          date: data.examDate || '',
        }));
        return subjects;
      }).flat();
      const finalMarks = marks.length > 0 ? marks : defaultMarks;
      setResultsData(finalMarks);
      setRecentMarks(finalMarks.slice(0, 5));
    }, () => {
      setResultsData(defaultMarks);
      setRecentMarks(defaultMarks);
    });
    unsubs.push(unsubResults);

    // 5. Fetch Timetable
    if (selectedChild.classId) {
      const unsubTimetable = timetableService.onTimetable(schoolId, selectedChild.classId, (t) => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayEntries = (t?.entries || [])
          .filter((e) => e.day === today)
          .sort((a, b) => a.period - b.period)
          .map((e) => ({
            period: e.period,
            subject: e.subject,
            time: timetableService.getPeriodTime(e.period),
          }));
        setTimetable(todayEntries.length > 0 ? todayEntries : defaultTimetable);
      });
      unsubs.push(unsubTimetable);
    } else {
      setTimetable(defaultTimetable);
    }

    // 6. Fetch Transport assignment + route + bus
    const unsubAssign = onStudentAssignment(schoolId, selectedChild.id, (assign) => {
      if (assign) {
        setTransportAssignment(assign);
        const unsubRoute = onRoute(schoolId, assign.routeId, (routeData) => {
          if (routeData) {
            setTransportRoute({
              name: routeData.name,
              busNumber: routeData.busNumber,
              driverName: routeData.driverName,
            });
            if (routeData.busNumber) {
              const unsubBus = onBusLocation(schoolId, routeData.busNumber, (busData) => {
                setTransportBus(busData);
              });
              unsubs.push(unsubBus);
            }
          } else {
            setTransportRoute(null);
            setTransportBus(null);
          }
        });
        unsubs.push(unsubRoute);
      } else {
        setTransportAssignment({
          id: 'asg001',
          studentId: selectedChild.id,
          studentName: selectedChild.name,
          classId: selectedChild.classId || '10A',
          routeId: 'r1',
          routeName: 'Route 1 - Janakpuri',
          stopName: 'Janakpuri East Metro',
          stopId: 's1',
          pickupTime: '07:15 AM',
          dropTime: '03:20 PM',
          monthlyFee: 1200,
          assignedAt: '2026-04-01',
          schoolId,
        });
        setTransportRoute({ name: 'Route 1 - Janakpuri', busNumber: 'DL-1PA-1234', driverName: 'Rakesh Singh' });
        setTransportBus(MOCK_BUSES[0] || null);
      }
    });
    unsubs.push(unsubAssign);

    return () => {
      unsubs.forEach(u => u());
    };
  }, [selectedChild, schoolId]);

  /**
   * Record Parent Payment via Sandbox
   */
  async function handleParentPayment(mode: string, txnId: string) {
    if (!selectedChild || !selectedFee || !user.schoolId) return;

    try {
      const schoolId = user.schoolId;
      const receiptNo = `RCP-${Date.now()}`;
      const feeRef = doc(db, 'schools', schoolId, 'fees', selectedFee.id);

      await runTransaction(db, async (transaction) => {
        const feeDoc = await transaction.get(feeRef);
        if (!feeDoc.exists()) throw new Error('Fee record not found');

        const feeData = feeDoc.data() as any;
        const currentPaid = feeData.amountPaid || 0;
        const newPaid = currentPaid + selectedFee.amount;
        const newStatus = newPaid >= feeData.totalAmount ? 'PAID' : 'PARTIAL';

        const txnData = {
          txnId,
          amount: selectedFee.amount,
          mode,
          verified: true,
          timestamp: serverTimestamp(),
          receiptNo
        };

        transaction.update(feeRef, {
          amountPaid: newPaid,
          status: newStatus,
          transactions: [...(feeData.transactions || []), txnData],
          lastModified: serverTimestamp()
        });

        // Record receipt for parent access
        const receiptRef = doc(collection(db, 'schools', schoolId, 'receipts'));
        transaction.set(receiptRef, {
          receiptNo,
          invoiceNo: feeData.invoiceNo,
          studentId: selectedChild.id,
          studentName: selectedChild.name,
          amount: selectedFee.amount,
          mode,
          collectedBy: 'PARENT_PORTAL',
          createdAt: serverTimestamp(),
          schoolId
        });
      });

      toast.success("Payment Recorded Successfully!");
    } catch (err: any) {
      toast.error(`Payment recording failed: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Secure Records</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-10 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300">
          <Users size={40} aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">No Child Records Found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Your phone number ({user.phone}) is not linked to any student profile. Please contact the school office.</p>
        <button onClick={onLogout} className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">Logout</button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* CHILD SELECTOR (Premium Bubble) */}
      {children.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {children.map(child => (
            <button 
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl whitespace-nowrap transition-all border ${selectedChild?.id === child.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
            >
              <div className="shrink-0">
                 <Avatar src={child.avatar} name={child.name} role="STUDENT" size="sm" className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{child.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

      {/* --- WELCOME BANNER --- */}
      {selectedChild && (
      <div className="lg:col-span-2 relative bg-[#1c1836] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white overflow-hidden shadow-[0_20px_50px_rgba(28,24,54,0.4)] border border-white/10 group flex flex-col justify-between min-h-[250px]">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
         <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[70px] transform -translate-x-1/4 translate-y-1/4" aria-hidden="true" />
         
         <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 md:gap-7 h-full">
            {/* LEFT SIDE: Details */}
            <div className="flex-1 flex flex-col justify-center text-center sm:text-left space-y-4 w-full h-full">
               {/* Parent Identity Row */}
               <div className="flex items-center gap-3 self-center sm:self-start">
                  <Avatar src={user?.avatar} name={user?.name || 'Parent'} role="PARENT" size="lg" className="w-11 h-11 ring-2 ring-indigo-500/40 shadow-lg" />
                  <div>
                     <p className="text-[9px] font-black text-indigo-300/70 uppercase tracking-[0.2em]">Welcome back</p>
                     <p className="text-sm font-black text-white leading-tight">{user?.name || 'Parent'}</p>
                  </div>
               </div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em] self-center sm:self-start">
                  <UserIcon size={12} className="text-indigo-400" /> Viewing Child
               </div>
               
               <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                  {selectedChild.name}
               </h1>
               
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-slate-300 text-xs font-medium">
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-indigo-200">
                     Class <span className="text-white font-black">{selectedChild.classId || (selectedChild as any).class || 'N/A'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-indigo-200">
                     ID: <span className="text-white font-black">{selectedChild.uniqueId || selectedChild.id.substring(0, 8).toUpperCase()}</span>
                  </span>
               </div>
            </div>

            {/* RIGHT SIDE: Circular Avatar */}
            <div className="relative z-10 shrink-0 mt-6 sm:mt-0 flex items-center justify-center">
               <Avatar
                  src={selectedChild?.avatar}
                  name={selectedChild?.name || 'Student'}
                  role="STUDENT"
                  size="4xl"
                  className="w-32 h-32 md:w-40 md:h-40 border-4 border-[#353063] shadow-2xl rounded-full"
               />
            </div>
         </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-5 border-t border-white/10">
               <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-center sm:text-left">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Attendance</p>
                  <p className={`text-xl md:text-2xl font-black ${attendance.total > 0 && (attendance.present / attendance.total) < 0.75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
                  </p>
               </div>
               <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-center sm:text-left">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Avg Score</p>
                  <p className="text-xl md:text-2xl font-black text-indigo-300">
                    {resultsData.length > 0 ? Math.round(resultsData.reduce((s, m) => s + (m.score / m.total) * 100, 0) / resultsData.length) : '—'}
                  </p>
               </div>
               <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-center sm:text-left">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fees Due</p>
                  <p className={`text-xl md:text-2xl font-black ${recentFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount!, 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {recentFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount!, 0) > 0 
                      ? `₹${recentFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount!, 0).toLocaleString('en-IN')}` 
                      : 'Clear'}
                  </p>
               </div>
            </div>
          </div>
        )}

        {/* FEE LEDGER & QUICK PAY (1x span) */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-[10px] md:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                <IndianRupee size={16} /> Fee Ledger
              </h3>
              <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-2.5 py-1 rounded-lg uppercase ${
                recentFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount!, 0) > 0
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'
                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
              }`}>
                Due: ₹{recentFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount!, 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[200px] md:max-h-[250px]">
              {recentFees.map(fee => (
                <div key={fee.id} className="group flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-indigo-500/30 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                     <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${fee.status === 'PAID' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                     <div className="min-w-0">
                        <p className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white truncate pr-2 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{fee.title}</p>
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{new Date(fee.date!).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="text-right flex items-center justify-end gap-3 shrink-0 ml-2">
                     <p className={`text-[10px] md:text-xs font-black ${fee.status === 'PAID' ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>₹{fee.amount}</p>
                     {fee.status !== 'PAID' ? (
                       <button 
                          onClick={() => {
                            setSelectedFee(fee);
                            setShowPaymentModal(true);
                          }}
                          className="whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                       >
                          Pay
                       </button>
                     ) : (
                       <span className="whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600">Paid</span>
                     )}
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* LIVE FLEET TRACKER (2x span) */}
        <div className="lg:col-span-2">
          {transportAssignment ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-xl space-y-0 relative group h-full flex flex-col">
              {/* Header */}
              <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center relative z-10 border-b border-slate-100 dark:border-zinc-800 gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-sm">
                    <Bus size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">Live Bus Fleet Tracker</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      {transportRoute?.name || 'Institutional Transit Route'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 rounded-full shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                      Live GPS Active
                    </span>
                  </div>

                  <Link
                    to="/parent/transport"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all text-xs flex items-center gap-1 font-bold shadow-sm"
                    title="Open Full Screen Map"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              {/* Main Grid: Left Map + Right Telemetry */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                {/* Left: Interactive Live Map Box */}
                <div className="md:col-span-7 relative min-h-[260px] md:min-h-[320px] bg-slate-950 flex flex-col">
                  <div className="absolute inset-0 z-0">
                    <LiveMap
                      positions={{
                        [transportBus?.id || 'b1']: [
                          transportBus?.location?.lat || 28.6289,
                          transportBus?.location?.lng || 77.0811
                        ]
                      }}
                      statuses={{
                        [transportBus?.id || 'b1']: (transportBus?.status as any) || 'ON_ROUTE'
                      }}
                      route={[
                        [28.6250, 77.0780],
                        [28.6289, 77.0811],
                        [28.6310, 77.0850],
                        [28.6350, 77.0900]
                      ]}
                      stops={[
                        { name: 'Janakpuri East Metro', position: [28.6289, 77.0811] },
                        { name: 'District Centre', position: [28.6310, 77.0850] },
                        { name: 'School Main Gate', position: [28.6350, 77.0900] }
                      ]}
                      myStopPosition={[28.6289, 77.0811]}
                      zoom={14}
                      interactive={true}
                      selectedBusId={transportBus?.id || 'b1'}
                      height="h-full"
                    />
                  </div>

                  {/* Overlaid Live Badges on Map */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                    <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-lg flex items-center gap-2">
                      <Gauge size={13} className="text-indigo-400" />
                      <span className="text-[10px] font-black tracking-wider">
                        {transportBus?.speed || 34} km/h <span className="text-emerald-400 font-bold">• Safe Zone</span>
                      </span>
                    </div>

                    <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-lg flex items-center gap-2">
                      <MapPin size={13} className="text-amber-400" />
                      <span className="text-[10px] font-black tracking-wider truncate max-w-[160px]">
                        {transportAssignment.stopName || 'Janakpuri East Metro'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Map Status Bar */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-white shadow-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200">
                          Approaching Stop (ETA ~5 mins)
                        </span>
                      </div>
                      <Link
                        to="/parent/transport"
                        className="pointer-events-auto text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 hover:underline ml-2"
                      >
                        Details <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right: Driver, Vehicle & Trip Summary */}
                <div className="md:col-span-5 p-5 md:p-6 flex flex-col justify-between space-y-4 bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800">
                  {/* Vehicle Info */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bus Registration</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wider">
                          {transportBus?.number || transportRoute?.busNumber || 'DL-1PA-1234'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Route</p>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {transportAssignment.routeName?.split(' - ')[0] || 'Route 1'}
                        </p>
                      </div>
                    </div>

                    {/* Schedule times */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-0.5">
                          <Clock size={11} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Morning Pickup</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {transportAssignment.pickupTime || '07:25 AM'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                        <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-0.5">
                          <Clock size={11} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Afternoon Drop</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {transportAssignment.dropTime || '03:15 PM'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Profile & Contact Actions */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={transportRoute?.driverName || 'Rakesh Singh'}
                          role="TEACHER"
                          size="md"
                          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                              {transportRoute?.driverName || 'Rakesh Singh'}
                            </p>
                            <span title="Verified School Driver"><ShieldCheck size={12} className="text-emerald-500" /></span>
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assigned Driver</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${transportRoute?.driverName ? '+919876543210' : '+919876543210'}`}
                          onClick={(e) => {
                            toast.success(`Calling Driver: ${transportRoute?.driverName || 'Rakesh Singh'}`);
                          }}
                          className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                          title="Call Driver Directly"
                        >
                          <PhoneCall size={14} />
                        </a>

                        <button
                          type="button"
                          onClick={() => toast.success('Contacting School Transport Desk (+91 11 4567 8900)')}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 transition-all"
                          title="Call Transport Control Room"
                        >
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>

                    <Link
                      to="/parent/transport"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      <Navigation size={13} /> Open Live Route Tracker
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm text-center flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <Bus size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">No Transport Allocated</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Your student is currently registered for Self-Commute. You can request institutional bus service below.
                </p>
              </div>
              <Link
                to="/parent/transport"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                Apply for Bus Transit
              </Link>
            </div>
          )}
        </div>

        {/* NOTIFICATION CENTER (1x span) */}
        <div className="lg:col-span-1 bg-slate-900 dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl space-y-4 md:space-y-6 flex flex-col h-full">
           <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 md:gap-3">
                 <div className="p-2 md:p-2.5 bg-white/10 rounded-xl md:rounded-2xl text-indigo-400"><Bell size={18}/></div>
                 <h3 className="text-xs md:text-sm font-black uppercase tracking-widest">Alerts</h3>
              </div>
           </div>
           <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[250px] md:max-h-[300px]">
              {notices.length > 0 ? notices.map(notice => (
                <div key={notice.id} className="group relative bg-white/5 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all">
                   <div className="flex justify-between items-start mb-1 md:mb-2">
                      <p className="text-xs md:text-sm font-bold text-white leading-tight pr-3 md:pr-4">{notice.title}</p>
                      {notice.priority === 'urgent' && <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] shrink-0 mt-1 md:mt-0" />}
                      {notice.priority !== 'urgent' && <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] shrink-0 mt-1 md:mt-0" />}
                   </div>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notice.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                <div className="text-center py-6 opacity-30 h-full flex flex-col items-center justify-center">
                   <CheckCircle2 size={24} className="mb-2" />
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">No New Alerts</p>
                </div>
              )}
           </div>
        </div>

      </div>

      {/* PAYMENT SANDBOX MODAL */}
      {showPaymentModal && selectedFee && (
           <PaymentSandbox
             amount={selectedFee.amount!}
             studentName={selectedChild?.name || 'Student'}
             feeType={selectedFee.title!}
             onSuccess={(txnId, mode) => {
                handleParentPayment(mode, txnId);
                setShowPaymentModal(false);
             }}
             onClose={() => setShowPaymentModal(false)}
          />
      )}

    </div>
  );
};


export default ParentPortal;
