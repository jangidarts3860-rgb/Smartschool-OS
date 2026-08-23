import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Search, 
  User, 
  Users, 
  Filter, 
  History, 
  ShieldCheck, 
  Zap, 
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Calendar,
  CreditCard,
  BookOpen,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs, limit, doc } from 'firebase/firestore';
import { User as UserType, UserRole } from '@/types';
import { MOCK_USERS, MOCK_CLASSES } from '@/constants';
import Avatar from '@/components/shared/Avatar';
import { toast } from 'react-hot-toast';

interface Props {
  user: UserType;
  onBack?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'FEE' | 'HOMEWORK' | 'ATTENDANCE' | 'GENERAL';
  createdAt: any;
  isRead: boolean;
  userId: string;
  studentName?: string;
}

function formatNotificationTime(createdAt: any): string {
  if (!createdAt) return '—';
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', title: 'Fee Reminder: Term 2 Dues', message: 'Dear Parent, this is a reminder that Term 2 fees are due on 25th of this month.', type: 'FEE', createdAt: new Date().toISOString(), isRead: true, userId: 'all', studentName: 'General Broadcast' },
  { id: 'notif-2', title: 'Annual Sports Day Notice', message: 'Annual Sports Meet will be organized on coming Saturday. All students must wear house uniforms.', type: 'GENERAL', createdAt: new Date().toISOString(), isRead: true, userId: 'all', studentName: 'General Broadcast' },
  { id: 'notif-3', title: 'Mathematics Assignment Due', message: 'Chapter 5 Quadratic Equations assignment must be submitted before Friday.', type: 'HOMEWORK', createdAt: new Date().toISOString(), isRead: false, userId: 'all', studentName: 'Class 10A' }
];

const NotificationCenter: React.FC<Props> = ({ user, onBack }) => {
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [students, setStudents] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Notification['type']>('GENERAL');
  const [history, setHistory] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    const mockStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
    if (!user.schoolId || isMock) {
      setStudents(mockStudents);
      setHistory(DEFAULT_NOTIFICATIONS);
      setIsLoading(false);
      return;
    }

    // Fetch Students
    const unsubStudents = onSnapshot(
      query(collection(db, 'schools', user.schoolId, 'users'), where('role', '==', UserRole.STUDENT)),
      (snap) => {
        const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
        setStudents(docs.length > 0 ? docs : mockStudents);
      },
      () => setStudents(mockStudents)
    );

    // Fetch History
    const unsubHistory = onSnapshot(
      query(collection(db, 'schools', user.schoolId, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => {
        const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Notification[];
        setHistory(docs.length > 0 ? docs : DEFAULT_NOTIFICATIONS);
      },
      () => setHistory(DEFAULT_NOTIFICATIONS)
    );

    setIsLoading(false);
    return () => {
      unsubStudents();
      unsubHistory();
    };
  }, [user.schoolId]);

  const [broadcastMode, setBroadcastMode] = useState<'SINGLE' | 'CLASS' | 'SCHOOL'>('SINGLE');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>(MOCK_CLASSES);
  const [templates, setTemplates] = useState<any[]>([]);

  const NOTIFICATION_TEMPLATES = {
    GENERAL: ["Dear Parents, this is to inform you that...", "Kindly take note of the upcoming school event..."],
    FEE: ["Friendly Reminder: The second installment of school fees is due on...", "Fee Payment Alert: Please clear the outstanding balance of ₹..."],
    ATTENDANCE: ["Daily Attendance: Your ward was marked absent today.", "Late Arrival Alert: Student arrived 15 minutes after school start time."],
    PERFORMANCE: ["Exam Results: The report cards for the mid-term exams are now live.", "Academic Update: Please review the latest performance metrics on the dashboard."]
  };

  useEffect(() => {
    // Fetch Classes for broadcast
    if (!user.schoolId || isMock) return;
    const unsub = onSnapshot(collection(db, 'schools', user.schoolId, 'classes'), (snap) => {
      setClasses(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user.schoolId]);

  const handleSendNotification = async () => {
    if (broadcastMode === 'SINGLE' && !selectedStudent) {
      toast.error("Please select a student"); return;
    }
    if (broadcastMode === 'CLASS' && !selectedClass) {
      toast.error("Please select a class"); return;
    }
    if (!message.trim()) {
      toast.error("Enter message content"); return;
    }
    if (!user.schoolId) return;

    setIsSending(true);
    try {
      const batch = (await import('firebase/firestore')).writeBatch(db);
      let targetStudents: UserType[] = [];

      if (broadcastMode === 'SINGLE' && selectedStudent) {
        targetStudents = [selectedStudent];
      } else if (broadcastMode === 'CLASS') {
        const q = query(
          collection(db, 'schools', user.schoolId, 'users'), 
          where('role', '==', UserRole.STUDENT),
          where('classId', '==', selectedClass)
        );
        const snap = await getDocs(q);
        targetStudents = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as UserType));
      } else if (broadcastMode === 'SCHOOL') {
        const q = query(collection(db, 'schools', user.schoolId, 'users'), where('role', '==', UserRole.STUDENT));
        const snap = await getDocs(q);
        targetStudents = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as UserType));
      }

      if (targetStudents.length === 0) {
        toast.error("No recipients found for this scope");
        return;
      }

      targetStudents.forEach(student => {
        const ref = doc(collection(db, 'schools', user.schoolId, 'notifications'));
        batch.set(ref, {
          studentId: student.id,
          studentName: student.name,
          title: type === 'FEE' ? 'Fee Alert' : type === 'ATTENDANCE' ? 'Attendance Alert' : 'School Broadcast',
          message: message.trim(),
          type,
          createdAt: serverTimestamp(),
          readStatus: false,
          senderId: user.id,
          scope: broadcastMode
        });
      });

      await batch.commit();
      toast.success(`Broadcast delivered to ${targetStudents.length} dashboard(s)!`);
      
      setMessage('');
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      toast.error("Delivery failure");
    } finally {
      setIsSending(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 animate-fade-in-up">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          {onBack && (
            <button onClick={onBack} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:scale-110 transition-all text-slate-500 shadow-sm">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Internal Communication</h1>
            <p className="text-slate-500 font-medium">Send secure in-app alerts directly to parent dashboards.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <ShieldCheck className="text-indigo-600" size={20} />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ecosystem Protected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- LEFT: COMPOSER --- */}
        <div className="lg:col-span-7 space-y-8">
           <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Send size={20}/></div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">Compose Alert</h3>
              </div>
              
              <div className="space-y-8">
                  {/* Broadcast Scope */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">1. Delivery Scope</label>
                     <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        {[
                          { id: 'SINGLE', label: 'Single Student', icon: User },
                          { id: 'CLASS', label: 'Whole Class', icon: Users },
                          { id: 'SCHOOL', label: 'Entire School', icon: Bell }
                        ].map(m => (
                          <button 
                            key={m.id}
                            onClick={() => setBroadcastMode(m.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${broadcastMode === m.id ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                          >
                             <m.icon size={14} /> {m.label}
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Recipient Selection based on Scope */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">2. Recipient Targeting</label>
                     
                     {broadcastMode === 'SINGLE' && (
                        <div className="relative">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input 
                              type="text" 
                              placeholder="Type name or ID card number..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-3xl text-sm font-bold outline-none transition-all shadow-sm dark:text-white"
                           />
                           {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar p-2 animate-in fade-in slide-in-from-top-2">
                                 {filteredStudents.map(s => (
                                 <button 
                                    key={s.id}
                                    onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                                 >
                                    <Avatar src={s.avatar} name={s.name} size="md" className="w-10 h-10 rounded-xl" />
                                    <div className="text-left">
                                       <p className="text-sm font-black text-slate-900 dark:text-white">{s.name}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.uniqueId}</p>
                                    </div>
                                 </button>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}

                     {broadcastMode === 'CLASS' && (
                        <select 
                           value={selectedClass}
                           onChange={e => setSelectedClass(e.target.value)}
                           className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-3xl text-sm font-bold outline-none transition-all shadow-sm dark:text-white"
                        >
                           <option value="">Select Target Class...</option>
                           {classes.map(c => (
                              <option key={c.id} value={c.id}>{c.name || `Class ${c.id}`}</option>
                           ))}
                        </select>
                     )}

                     {broadcastMode === 'SCHOOL' && (
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
                           <ShieldCheck className="text-indigo-600" size={24} />
                           <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight">Warning: This alert will be broadcasted to ALL active students.</p>
                        </div>
                     )}

                     {broadcastMode === 'SINGLE' && selectedStudent && (
                        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl border border-indigo-100 dark:border-indigo-800 animate-in zoom-in-95">
                           <div className="flex items-center gap-4">
                              <Avatar src={selectedStudent.avatar} name={selectedStudent.name} size="lg" className="w-12 h-12 rounded-xl border-2 border-white dark:border-slate-800" />
                              <div>
                                 <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">{selectedStudent.name}</p>
                                 <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Selected Recipient</p>
                              </div>
                           </div>
                           <button onClick={() => setSelectedStudent(null)} className="p-3 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                        </div>
                     )}
                  </div>

                  {/* Alert Type */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">3. Alert Category</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { id: 'GENERAL', label: 'General', icon: MessageCircle, color: 'indigo', border: 'border-indigo-600', bg: 'bg-indigo-600', text: 'text-indigo-500' },
                          { id: 'FEE', label: 'Fees', icon: CreditCard, color: 'emerald', border: 'border-emerald-600', bg: 'bg-emerald-600', text: 'text-emerald-500' },
                          { id: 'ATTENDANCE', label: 'Attendance', icon: Calendar, color: 'amber', border: 'border-amber-600', bg: 'bg-amber-600', text: 'text-amber-500' },
                          { id: 'PERFORMANCE', label: 'Academic', icon: BookOpen, color: 'rose', border: 'border-rose-600', bg: 'bg-rose-600', text: 'text-rose-500' }
                        ].map(t => (
                          <button 
                             key={t.id}
                             onClick={() => setType(t.id as any)}
                             className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group ${type === t.id ? `${t.bg} ${t.border} text-white shadow-sm` : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-600'}`}
                          >
                             <t.icon size={24} className={type === t.id ? 'text-white' : `${t.text} opacity-60 group-hover:opacity-100`} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">4. Smart Templates</label>
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {((NOTIFICATION_TEMPLATES as Record<string, string[]>)[type] || []).map((tmpl: any, idx: any) => (
                           <button 
                              key={idx}
                              onClick={() => setMessage(tmpl)}
                              className="whitespace-nowrap px-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-all uppercase tracking-widest"
                           >
                              Template {idx + 1}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Message Body */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">5. Message Content</label>
                     <textarea 
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type the message that will appear on the parent's dashboard..."
                        className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] text-sm font-medium outline-none transition-all shadow-sm dark:text-white resize-none"
                     />
                  </div>

                 <button 
                    onClick={handleSendNotification}
                    disabled={isSending || (broadcastMode === 'SINGLE' && !selectedStudent) || !message.trim()}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isSending ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                    Deliver Secure Alert
                 </button>
              </div>
           </div>
        </div>

        {/* --- RIGHT: HISTORY --- */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl h-full flex flex-col space-y-8 overflow-hidden relative">
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                    <History className="text-indigo-400" size={20} />
                    <h3 className="text-xl font-black tracking-tight">Sent Records</h3>
                 </div>
                 <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-lg uppercase tracking-widest text-indigo-300">Live Feed</span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 relative z-10 pr-2">
                 {history.length > 0 ? history.map(item => (
                   <div key={item.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.type === 'FEE' ? 'bg-emerald-500/20 text-emerald-400' : item.type === 'ATTENDANCE' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                               {item.type === 'FEE' ? <CreditCard size={14}/> : <Bell size={14}/>}
                            </div>
                            <p className="text-sm font-black text-white">{item.studentName}</p>
                         </div>
                         <span className="text-[9px] font-bold text-slate-500 uppercase">{formatNotificationTime(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">{item.message}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                         <div className="flex items-center gap-2">
                            {item.isRead ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-slate-500" />}
                            <span className={`text-[8px] font-black uppercase tracking-widest ${item.isRead ? 'text-emerald-500' : 'text-slate-500'}`}>
                               {item.isRead ? 'Seen' : 'Sent'}
                            </span>
                         </div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{item.type}</p>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <History size={48} className="mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Sent Records Found</p>
                   </div>
                 )}
              </div>

              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />
           </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationCenter;
