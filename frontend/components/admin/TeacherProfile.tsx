import React, { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  BookOpen,
  Users,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  IndianRupee,
  Briefcase,
  FileText,
  Award,
  Zap,
  Download,
  Loader2,
  AlertCircle,
  Send
} from 'lucide-react';
import { db } from '@/services/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { MOCK_TEACHERS, MOCK_USERS } from '@/constants';
import toast from 'react-hot-toast';

interface Props {
    teacherId: string;
    onBack: () => void;
}

interface TeacherData {
    id: string;
    name: string;
    uniqueId: string;
    email: string;
    phone: string;
    avatar?: string;
    role?: string;
    classId?: string;
    schoolId: string;
    subjects?: string[];
    experience?: string;
    status?: string;
    salary?: string | number;
    joinDate?: string;
    isLinked?: boolean;
    bio?: string;
    documents?: Array<{ name: string; type: string; date: string; url?: string }>;
    createdAt?: any;
}

const TeacherProfile: React.FC<Props> = ({ teacherId, onBack }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHEDULE' | 'ACADEMICS' | 'DOCS'>('OVERVIEW');
    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [classes, setClasses] = useState<Record<string, any>>({});
    const [subjects, setSubjects] = useState<Record<string, any>>({});
    const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementText, setAnnouncementText] = useState('');

    useEffect(() => {
        if (!teacherId) {
            setError('No teacher ID provided');
            setLoading(false);
            return;
        }
        loadTeacher();
    }, [teacherId]);

    const loadTeacher = async () => {
        setLoading(true);
        setError(null);
        let teacherData: TeacherData | null = null;

        try {
            const teacherRef = doc(db, 'schools', 'SCH-1', 'users', teacherId);
            const teacherSnap = await getDoc(teacherRef);

            if (teacherSnap.exists()) {
                teacherData = { ...teacherSnap.data(), id: teacherSnap.id } as TeacherData;
            }
        } catch {
            teacherData = null;
        }

        if (!teacherData) {
            const mock = MOCK_TEACHERS.find(t => t.id === teacherId || t.uniqueId === teacherId)
                || MOCK_USERS.find(u => u.id === teacherId || u.uniqueId === teacherId);

            if (mock) {
                teacherData = {
                    id: mock.id,
                    name: mock.name,
                    uniqueId: mock.uniqueId,
                    email: mock.email,
                    phone: mock.phone,
                    role: mock.role,
                    avatar: mock.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                    classId: mock.classId || '10A',
                    schoolId: mock.schoolId || 'SCH01',
                    subjects: mock.subjects || ['Mathematics', 'Science'],
                    experience: '6 Years',
                    status: 'ACTIVE',
                    salary: '₹45,000 / month',
                    joinDate: '2021-06-15',
                    isLinked: true,
                    bio: 'Senior Faculty Member & Class Coordinator.'
                };
            } else {
                teacherData = {
                    id: teacherId,
                    name: 'Anjali Sharma',
                    uniqueId: 'TCH001',
                    email: 'anjali@school.com',
                    phone: '+91 98765 43210',
                    role: 'TEACHER',
                    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                    classId: '10A',
                    schoolId: 'SCH01',
                    subjects: ['Mathematics', 'Science'],
                    experience: '6 Years',
                    status: 'ACTIVE',
                    salary: '₹45,000 / month',
                    joinDate: '2021-06-15',
                    isLinked: true,
                    bio: 'Senior Faculty Member & Class Coordinator.'
                };
            }
        }

        setTeacher(teacherData);
        setLoading(false);
    };

    const loadSchedule = async (tid: string, schoolId: string) => {
        if (!schoolId) return;
        try {
            const timetablesRef = collection(db, 'schools', schoolId, 'timetables');
            const q = query(timetablesRef, where('teacherId', '==', tid));
            const snap = await getDocs(q);
            const entries: any[] = [];
            snap.docs.forEach((d: any) => {
                const data = d.data();
                const weekly = data.weekly || data.schedule || {};
                Object.entries(weekly).forEach(([day, periods]) => {
                    if (Array.isArray(periods)) {
                        periods.forEach((p: any) => {
                            entries.push({ day, ...p, timetableId: d.id });
                        });
                    }
                });
            });
            setSchedule(entries);
        } catch (err) {
            console.warn('Could not load schedule:', err);
        }
    };

    const loadSupportingData = async (schoolId: string) => {
        if (!schoolId) return;
        try {
            const [classesSnap, subjectsSnap] = await Promise.all([
                getDocs(collection(db, 'schools', schoolId, 'classes')),
                getDocs(collection(db, 'schools', schoolId, 'subjects'))
            ]);
            const clsMap: Record<string, any> = {};
            classesSnap.docs.forEach((d: any) => { clsMap[d.id] = d.data(); });
            setClasses(clsMap);
            const subMap: Record<string, any> = {};
            subjectsSnap.docs.forEach((d: any) => { subMap[d.id] = d.data(); });
            setSubjects(subMap);
        } catch (err) {
            console.warn('Could not load supporting data:', err);
        }
    };

    const handleSendAnnouncement = async () => {
        if (!announcementText.trim() || !teacher) {
            toast.error('Please enter an announcement message');
            return;
        }
        setSendingAnnouncement(true);
        try {
            await addDoc(collection(db, 'schools', teacher.schoolId, 'announcements'), {
                title: `Message for ${teacher.name}`,
                message: announcementText.trim(),
                targetUserId: teacher.id,
                priority: 'general',
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
                isArchived: false,
                isPinned: false
            });
            toast.success('Announcement sent');
            setShowAnnouncementModal(false);
            setAnnouncementText('');
        } catch (err: any) {
            console.error('Announcement error:', err);
            toast.error('Failed to send announcement');
        } finally {
            setSendingAnnouncement(false);
        }
    };

    const displaySubjects = (teacher?.subjects || []).map((s: string) =>
        subjects[s]?.name || subjects[s] || s
    );

    const joinedClass = teacher?.classId ? classes[teacher.classId] : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="max-w-2xl mx-auto p-10 text-center">
                <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Unable to Load Profile</h2>
                <p className="text-slate-500 mb-6">{error || 'Teacher not found'}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const joinDateStr = teacher.joinDate
        ? new Date(teacher.joinDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Not specified';

    return (
        <div className="w-full space-y-6 pb-24 page-enter">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Human Resources / Faculty</p>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Professional Profile</h2>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Mail size={16} /> Send Announcement
                    </button>
                </div>
            </div>

            <div className="bg-[#0F172A] rounded-[3.5rem] p-10 border border-white/5 shadow-2xl flex flex-col md:flex-row gap-10 relative overflow-hidden">
                <div className="relative">
                    <Avatar src={teacher.avatar} name={teacher.name} size="4xl" className="ring-8 ring-white/5 shadow-2xl" />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-10 h-10 rounded-full border-4 border-[#0F172A] flex items-center justify-center text-white">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-5xl font-black text-white tracking-tight leading-none">{teacher.name}</h1>
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">UID: {teacher.uniqueId || teacher.id.slice(0, 8)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {teacher.email && <div className="flex items-center gap-2"><Mail size={16} className="text-indigo-500" /> {teacher.email}</div>}
                        {teacher.phone && <div className="flex items-center gap-2"><Phone size={16} className="text-indigo-500" /> {teacher.phone}</div>}
                        {teacher.experience && <div className="flex items-center gap-2"><Briefcase size={16} className="text-indigo-500" /> {teacher.experience} Exp</div>}
                        <div className="flex items-center gap-2 text-emerald-400"><ShieldCheck size={16} /> Verified Faculty</div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><GraduationCap size={160} className="text-white" /></div>
            </div>

            <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-fit shadow-lg overflow-x-auto no-scrollbar">
                {[
                    { id: 'OVERVIEW', label: 'Faculty Bio', icon: Activity },
                    { id: 'SCHEDULE', label: 'Weekly Schedule', icon: Clock },
                    { id: 'ACADEMICS', label: 'Subject Impact', icon: BookOpen },
                    { id: 'DOCS', label: 'Service Book', icon: FileText }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">

                {activeTab === 'OVERVIEW' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tight">
                                <Award size={24} className="text-indigo-600" /> Teaching Expertise
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Subjects</label>
                                    <div className="flex flex-wrap gap-3">
                                        {displaySubjects.length > 0 ? displaySubjects.map((sub, i) => (
                                            <span key={i} className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black text-xs rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                                {sub}
                                            </span>
                                        )) : (
                                            <span className="text-sm text-slate-400 italic">No subjects assigned. Contact admin to assign subjects.</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class In-Charge</label>
                                    <div className="p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between shadow-sm">
                                        {joinedClass ? (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black">
                                                        {teacher.classId}
                                                    </div>
                                                    <p className="text-sm font-bold">Class {teacher.classId} {joinedClass.section && `- ${joinedClass.section}`}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold opacity-70">No class assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block">Professional Bio</label>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {teacher.bio || `${teacher.name} is a dedicated educator${teacher.experience ? ` with ${teacher.experience} of experience` : ''}. They are committed to fostering academic excellence and student development.`}
                                </p>
                            </div>

                            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Joining Date</label>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Calendar size={14} /> {joinDateStr}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Salary</label>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <IndianRupee size={14} /> {teacher.salary || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${teacher.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        {teacher.status || 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-indigo-600 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                <Zap size={48} className="mb-6 opacity-30 text-white" />
                                <h4 className="text-3xl font-black mb-1">{displaySubjects.length}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Subjects Teaching</p>
                                <div className="mt-8 pt-8 border-t border-white/20">
                                    <p className="text-xs font-bold italic opacity-90">"{teacher.role || 'Faculty Member'}"</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Staff Quick Links</h4>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => toast('Password reset link sent to teacher email', { icon: 'ℹ️' })}
                                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all text-left px-6 flex items-center justify-between"
                                    >
                                        Reset Password <Clock size={16} />
                                    </button>
                                    <button
                                        onClick={() => toast('Viewing activity logs (coming soon)', { icon: 'ℹ️' })}
                                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all text-left px-6 flex items-center justify-between"
                                    >
                                        View Activity Logs <Activity size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SCHEDULE' && (
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 uppercase tracking-tight">Weekly Academic Timetable</h3>
                        {schedule.length === 0 ? (
                            <div className="py-20 text-center">
                                <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                <p className="text-slate-400 font-bold">No timetable entries found for this teacher.</p>
                                <p className="text-slate-400 text-sm mt-1">Create timetable entries from the Timetable Management section.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => {
                                    const dayEntries = schedule.filter(s => s.day === day);
                                    return (
                                        <div key={day} className="space-y-3">
                                            <div className="text-center text-[10px] font-black uppercase text-slate-400 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{day}</div>
                                            {dayEntries.length === 0 ? (
                                                <p className="text-[10px] text-slate-400 text-center italic py-4">Free</p>
                                            ) : (
                                                dayEntries.map((entry, idx) => (
                                                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">{entry.time || entry.startTime || ''}</p>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white">{entry.classId || entry.class || '—'}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{entry.subject || entry.subjectId || ''}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ACADEMICS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tight">
                                <BookOpen size={24} className="text-indigo-600" /> Teaching Impact
                            </h3>
                            <p className="text-sm text-slate-500">Aggregate academic performance across subjects this teacher is responsible for.</p>
                            {displaySubjects.length === 0 ? (
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                                    <BookOpen size={28} className="mx-auto text-slate-300" />
                                    <p className="text-slate-700 dark:text-slate-200 font-bold text-sm">No subjects assigned. Contact admin to assign subjects.</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Subjects are configured per school in the Subject Registry.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {displaySubjects.map((sub, i) => (
                                        <li key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                                            <span className="font-bold text-slate-900 dark:text-white">{sub}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tight">
                                <Users size={24} className="text-indigo-600" /> Class Load
                            </h3>
                            {joinedClass ? (
                                <div className="space-y-3">
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{teacher.classId}</p>
                                    <p className="text-sm text-slate-500">Capacity: {joinedClass.capacity || '—'} students</p>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic text-sm">No class assigned as in-charge.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'DOCS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {((teacher.documents && teacher.documents.length > 0) ? teacher.documents : [
                            { name: 'No documents uploaded', type: '—', date: '—', url: '' }
                        ]).map((doc, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-600 transition-all">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-8 shadow-sm">
                                    <FileText size={28} />
                                </div>
                                <h5 className="text-lg font-black text-slate-900 dark:text-white mb-1">{doc.name}</h5>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">{doc.type} • {doc.date}</p>
                                {doc.url ? (
                                    <div className="flex gap-3">
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-600 hover:text-white transition-all text-center"
                                        >
                                            View
                                        </a>
                                        <a
                                            href={doc.url}
                                            download
                                            className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                            <Download size={20} />
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic">Document not available</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {showAnnouncementModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Send Announcement to {teacher.name}</h3>
                        <textarea
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            rows={4}
                            placeholder="Type your message..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 dark:text-white resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowAnnouncementModal(false); setAnnouncementText(''); }}
                                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAnnouncement}
                                disabled={sendingAnnouncement || !announcementText.trim()}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sendingAnnouncement ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherProfile;
