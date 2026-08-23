import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Printer,
  Plus,
  Trash2,
  FileText,
  Users,
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  Clock,
  MapPin,
  Loader2,
  Save,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  School,
  Zap
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/shared/Avatar';
import { db } from '@/services/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { User as UserType, UserRole, SchoolProfile } from '@/types';
import { toast } from 'react-hot-toast';
import { MOCK_USERS } from '@/constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Props {
  user: UserType;
}

interface ExamSubject {
  subject: string;
  date: string;
  time: string;
  duration: string;
  room: string;
}

interface ExamSchedule {
  id: string;
  type: 'Unit Test' | 'Mid Term' | 'Final';
  class: string;
  section: string;
  subjects: ExamSubject[];
  createdAt: any;
}

const ExamManagement: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'TICKETS'>('SCHEDULE');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string; sections?: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Scheduling State
  const [newSchedule, setNewSchedule] = useState<Partial<ExamSchedule>>({
    type: 'Unit Test', class: '', section: '', subjects: []
  });
  const [tempSubject, setTempSubject] = useState<ExamSubject>({
    subject: '', date: '', time: '', duration: '3 Hours', room: ''
  });

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  const MOCK_EXAM_SCHEDULES: ExamSchedule[] = [
    {
      id: 'ex-1',
      type: 'Mid Term',
      class: '10',
      section: 'A',
      createdAt: new Date().toISOString(),
      subjects: [
        { subject: 'Mathematics', date: '2026-09-15', time: '09:00 AM', duration: '3 Hours', room: 'Hall A' },
        { subject: 'Science', date: '2026-09-17', time: '09:00 AM', duration: '3 Hours', room: 'Hall A' },
        { subject: 'English', date: '2026-09-19', time: '09:00 AM', duration: '3 Hours', room: 'Hall B' },
      ]
    },
    {
      id: 'ex-2',
      type: 'Unit Test',
      class: '9',
      section: 'A',
      createdAt: new Date().toISOString(),
      subjects: [
        { subject: 'Social Studies', date: '2026-09-22', time: '10:00 AM', duration: '2 Hours', room: 'Room 102' },
        { subject: 'Computer Science', date: '2026-09-24', time: '10:00 AM', duration: '2 Hours', room: 'Lab 1' },
      ]
    }
  ];

  const MOCK_EXAM_CLASSES = [
    { id: '10A', name: '10', sections: ['A', 'B'] },
    { id: '9A', name: '9', sections: ['A', 'B'] }
  ];

  useEffect(() => {
    const schoolId = user.schoolId;
    if (!schoolId) {
      setSchedules(MOCK_EXAM_SCHEDULES);
      setClasses(MOCK_EXAM_CLASSES);
      setLoading(false);
      return;
    }

    if (isMock) {
      setSchedules(MOCK_EXAM_SCHEDULES);
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setClasses(MOCK_EXAM_CLASSES);
      setLoading(false);
      return;
    }

    const unsubSchedules = onSnapshot(collection(db, 'schools', schoolId, 'examSchedules'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as ExamSchedule[];
      setSchedules(docs.length > 0 ? docs : MOCK_EXAM_SCHEDULES);
    }, () => setSchedules(MOCK_EXAM_SCHEDULES));

    const mockStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
    const unsubStudents = onSnapshot(query(collection(db, 'schools', schoolId, 'users'), where('role', '==', UserRole.STUDENT)), (snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
      setStudents(list.length > 0 ? list : mockStudents);
    }, () => setStudents(mockStudents));

    const unsubClasses = onSnapshot(collection(db, 'schools', schoolId, 'classes'), (snap) => {
      const classList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
      setClasses(classList.length > 0 ? classList : MOCK_EXAM_CLASSES);
      if (classList.length > 0 && !newSchedule.class) {
        const firstClass = classList[0];
        setNewSchedule(prev => ({ 
          ...prev, 
          class: firstClass.id, 
          section: (firstClass.sections && firstClass.sections.length > 0) ? firstClass.sections[0] : 'A' 
        }));
      }
    }, () => setClasses(MOCK_EXAM_CLASSES));

    // P0 fix: read school profile from canonical `config/profile`, with legacy `profile/general` fallback.
    // Uses a flag to ensure we only use the legacy path when the canonical doc is missing.
    let usingLegacy = false;
    const unsubProfileNew = onSnapshot(doc(db, 'schools', schoolId, 'config', 'profile'), (snap) => {
      if (snap.exists()) {
        usingLegacy = false;
        setSchoolProfile(snap.data() as SchoolProfile);
      } else {
        usingLegacy = true;
      }
    });
    const unsubProfileLegacy = onSnapshot(doc(db, 'schools', schoolId, 'profile', 'general'), (legacySnap) => {
      if (usingLegacy && legacySnap.exists()) {
        setSchoolProfile(legacySnap.data() as SchoolProfile);
      }
    });

    setLoading(false);
    return () => {
      unsubSchedules();
      unsubStudents();
      unsubClasses();
      unsubProfileNew();
      unsubProfileLegacy();
    };
  }, [user.schoolId]);

  const handleAddSubject = () => {
    if (!tempSubject.subject || !tempSubject.date) return toast.error("Fill subject and date");
    setNewSchedule(prev => ({
      ...prev,
      subjects: [...(prev.subjects || []), tempSubject]
    }));
    setTempSubject({ subject: '', date: '', time: '', duration: '3 Hours', room: '' });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Remove this exam schedule?")) return;
    if (!user.schoolId) return;
    try {
      await deleteDoc(doc(db, 'schools', user.schoolId, 'examSchedules', id));
      toast.success("Schedule Removed");
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleSaveSchedule = async () => {
    if ((newSchedule.subjects?.length || 0) === 0) return toast.error("Add subjects");
    if (!user.schoolId) return;
    setIsGenerating(true);
    try {
      await addDoc(collection(db, 'schools', user.schoolId, 'examSchedules'), {
        ...newSchedule,
        schoolId: user.schoolId,
        createdAt: serverTimestamp()
      });
      toast.success("Exam Schedule Published!");
      setNewSchedule(prev => ({ ...prev, subjects: [] }));
    } catch (err) { toast.error("Save failed"); }
    finally { setIsGenerating(false); }
  };

  const renderAdmitCardToPDF = (doc: any, student: UserType, schedule: ExamSchedule, isFirst: boolean = true) => {
    if (!isFirst) doc.addPage();
    
    const rollNo = `${schedule.class}${schedule.section}-${student.id.substring(0, 3).toUpperCase()}`;

    // --- Background & Border ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(2);
    doc.rect(5, 5, 200, 287);

    // --- Institutional Header ---
    doc.setFillColor(79, 70, 229);
    doc.rect(5, 5, 200, 35, 'F');
    
    if (schoolProfile?.logoUrl) {
       try {
          doc.addImage(schoolProfile.logoUrl, 'PNG', 15, 10, 25, 25);
       } catch (e) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(30);
          doc.text("S", 22, 28);
       }
    }

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(schoolProfile?.name || 'SMARTSCHOOL', 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentYear = new Date().getFullYear();
    const sessionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    doc.text(`OFFICIAL EXAMINATION ADMIT CARD • SESSION ${sessionYear}`, 105, 33, { align: 'center' });

    // --- Anti-Fraud Watermark ---
    doc.saveGraphicsState();
    const gState = new (doc as any).GState({ opacity: 0.05 });
    doc.setGState(gState);
    doc.setFontSize(40);
    doc.setTextColor(150);
    doc.text(`VERIFIED: ${student.uniqueId || student.id}`, 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();

    // --- Student Profile Area ---
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 50, 180, 55, 3, 3, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255);
    doc.rect(25, 58, 35, 40, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("PHOTO", 42.5, 80, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("STUDENT NAME", 70, 65);
    doc.text("ROLL NUMBER", 70, 78);
    doc.text("EXAM CATEGORY", 140, 65);
    doc.text("CLASS & SEC", 140, 78);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(student.name, 70, 72);
    doc.text(rollNo, 70, 85);
    doc.text(schedule.type, 140, 72);
    doc.text(`${schedule.class}-${schedule.section}`, 140, 85);

    // --- Schedule Table ---
    const tableData = schedule.subjects.map(s => [s.subject, s.date, s.time, s.room, s.duration]);
    (doc as any).autoTable({
      startY: 115,
      head: [['Subject Name', 'Date', 'Start Time', 'Hall/Room', 'Duration']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("CANDIDATE INSTRUCTIONS:", 15, finalY);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    const rules = [
      "• Mandatory to carry this original hall ticket to every examination session.",
      "• Reporting time: 45 minutes prior to exam commencement.",
      "• Electronic devices, calculators (unless specified) are strictly prohibited.",
      "• Any form of malpractice will lead to immediate disqualification."
    ];
    rules.forEach((rule, i) => doc.text(rule, 15, finalY + 8 + (i * 5)));

    doc.text("_______________________", 30, 265);
    doc.text("CANDIDATE SIGNATURE", 30, 270);
    doc.text("_______________________", 140, 265);
    doc.text("CONTROLLER OF EXAMINATIONS", 140, 270);
  };

  const generateHallTicket = (student: UserType, schedule: ExamSchedule) => {
    const doc = new jsPDF() as any;
    renderAdmitCardToPDF(doc, student, schedule, true);
    doc.save(`${student.name}_AdmitCard.pdf`);
    toast.success("Admit Card Generated");
  };

  const generateBulkTickets = async (selectedClass: string, selectedSection: string, schedule: ExamSchedule) => {
    setIsGenerating(true);
    try {
      const classStudents = students.filter(s => s.classId === `${selectedClass}-${selectedSection}` || (s.class === selectedClass && s.section === selectedSection));
      if (classStudents.length === 0) return toast.error("No students found in this class");

      const doc = new jsPDF() as any;
      classStudents.forEach((student, index) => {
        renderAdmitCardToPDF(doc, student, schedule, index === 0);
      });

      doc.save(`Bulk_AdmitCards_${selectedClass}_${selectedSection}.pdf`);
      toast.success(`Bulk Generation Complete (${classStudents.length} Students)`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Exam Data</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-32 animate-fade-in-up">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Exam Management</h1>
           <p className="text-slate-500 font-medium">Schedule academic evaluations and generate secure admit cards.</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          {[
            { id: 'SCHEDULE', label: 'Define Schedule', icon: Calendar },
            { id: 'TICKETS', label: 'Hall Tickets', icon: Printer },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'SCHEDULE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Schedule New Exam</h3>
                 <select 
                    value={newSchedule.type} 
                    onChange={e => setNewSchedule({...newSchedule, type: e.target.value as any})}
                    className="bg-slate-50 dark:bg-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase border-none outline-none text-indigo-600"
                 >
                    <option>Unit Test</option>
                    <option>Mid Term</option>
                    <option>Final</option>
                 </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Class</label>
                    <select value={newSchedule.class} onChange={e => setNewSchedule({...newSchedule, class: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white">
                       <option value="">Select Class...</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Section</label>
                    <select value={newSchedule.section} onChange={e => setNewSchedule({...newSchedule, section: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white">
                       <option value="">Select Section...</option>
                       {(classes.find(c => c.id === newSchedule.class)?.sections || []).map((s: string) => <option key={s}>{s}</option>)}
                    </select>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject</label>
                       <input type="text" value={tempSubject.subject} onChange={e => setTempSubject({...tempSubject, subject: e.target.value})} placeholder="Maths..." className="w-full px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                       <input type="date" value={tempSubject.date} onChange={e => setTempSubject({...tempSubject, date: e.target.value})} className="w-full px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Time</label>
                       <input type="time" value={tempSubject.time} onChange={e => setTempSubject({...tempSubject, time: e.target.value})} className="w-full px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Duration</label>
                       <input type="text" value={tempSubject.duration} onChange={e => setTempSubject({...tempSubject, duration: e.target.value})} placeholder="3 Hours" className="w-full px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Room / Hall</label>
                       <input type="text" value={tempSubject.room} onChange={e => setTempSubject({...tempSubject, room: e.target.value})} placeholder="Main Hall..." className="w-full px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                 </div>
                 <button onClick={handleAddSubject} className="w-full py-4 bg-indigo-600/10 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add to Date Sheet
                 </button>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Scheduled Subjects ({newSchedule.subjects?.length})</h4>
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {newSchedule.subjects?.map((s, i) => (
                       <div key={i} className="py-4 flex justify-between items-center group">
                          <div>
                             <p className="text-sm font-black text-slate-900 dark:text-white">{s.subject}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{s.date} • {s.time} • {s.room}</p>
                          </div>
                          <button onClick={() => setNewSchedule({...newSchedule, subjects: newSchedule.subjects?.filter((_, idx) => idx !== i)})} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                       </div>
                    ))}
                 </div>
              </div>

              <button onClick={handleSaveSchedule} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                 <Save size={18} /> Synchronize & Publish Schedule
              </button>
           </div>

           <div className="lg:col-span-4 space-y-8">
               <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Published Schedules</h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                     {schedules.map(s => (
                        <div key={s.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                           <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{s.type}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Class {s.class}-{s.section}</p>
                           </div>
                           <button onClick={() => handleDeleteSchedule(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                     {schedules.length === 0 && (
                        <EmptyState
                          variant="exams"
                          title="No Exam Schedules"
                          description="No exam schedules have been created yet. Create your first exam schedule to get started."
                          actionButton={
                            <button
                              onClick={() => { setShowCreateForm(true); setActiveTab('SCHEDULE'); }}
                              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                            >
                              Create Schedule
                            </button>
                          }
                        />
                     )}
                  </div>
               </div>

               <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 bg-white/20 rounded-2xl"><ShieldCheck size={20}/></div>
                     <h3 className="text-xl font-black">Security Vault</h3>
                  </div>
                  <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-8">Admit cards are encrypted with institutional watermarks to prevent forgery.</p>
                  <button onClick={() => setActiveTab('TICKETS')} className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Batch Ticket Control</button>
               </div>
           </div>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="space-y-10">
           <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Hall Ticket Engine</h3>
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                        type="text" 
                        placeholder="Search student..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-xs font-bold dark:text-white" 
                       />
                    </div>
                    <button className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-500"><Filter size={20}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                    <div key={student.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500 transition-all">
                       <div className="flex items-center gap-4">
                          <Avatar src={student.avatar} name={student.name} size="lg" className="w-14 h-14 rounded-2xl" />
                          <div>
                             <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{student.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {student.classId || `Class ${student.class}-${student.section}`}
                             </p>
                          </div>
                       </div>
                        <button 
                           onClick={() => {
                             const classId = student.classId || '';
                             const [classNo, section] = classId.split('-');
                             const schedule = schedules.find(s => s.class === classNo && s.section === section);
                             if (schedule) generateHallTicket(student, schedule);
                             else toast.error("No schedule found for this class");
                           }}
                           className="p-3 bg-white dark:bg-slate-950 text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Download size={18}/>
                       </button>
                    </div>
                 ))}
              </div>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {classes.map(c => (
                    c.sections?.map((s: string) => (
                      <button 
                        key={`${c.id}-${s}`}
                        onClick={() => {
                           const schedule = schedules.find(sch => sch.class === c.id && sch.section === s);
                           if (schedule) generateBulkTickets(c.id, s, schedule);
                           else toast.error(`No schedule published for Class ${c.name}-${s}`);
                        }}
                        disabled={isGenerating}
                        className="p-6 bg-indigo-600/10 text-indigo-600 rounded-3xl border border-indigo-200 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between group"
                      >
                         <span className="flex items-center gap-3">
                            <Printer size={16}/>
                            Print {c.name} - Sec {s}
                         </span>
                         <Zap size={14} className="opacity-0 group-hover:opacity-100 transition-all"/>
                      </button>
                    ))
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
