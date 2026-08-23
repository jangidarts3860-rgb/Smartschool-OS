import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  ArrowLeft,
  AlertTriangle,
  Users,
  User as UserIcon,
  Printer,
  Clock,
  Trash2,
  Plus,
  Loader2,
  ShieldCheck,
  Zap,
  GripVertical,
  Info
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { User as UserType, SchoolProfile } from '@/types';
import { MOCK_TEACHERS } from '@/constants';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Props {
  user: UserType;
  onBack: () => void;
}

interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TimetableManagement: React.FC<Props> = ({ user, onBack }) => {
  const [viewMode, setViewMode] = useState<'ADMIN' | 'TEACHER' | 'STUDENT'>('ADMIN');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<UserType[]>([]);
  const [subjects, setSubjects] = useState<{ name: string; code?: string }[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalTimetable, setGlobalTimetable] = useState<any[]>([]);

  // Drag State
  const [draggedItem, setDraggedItem] = useState<{ type: 'SUBJECT' | 'TEACHER', value: string, name: string } | null>(null);

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  const MOCK_CLASSES = [
    { id: '10A', name: '10', section: 'A' },
    { id: '10B', name: '10', section: 'B' },
    { id: '9A', name: '9', section: 'A' }
  ];

  const MOCK_SUBJECT_LIST = [
    { name: 'Mathematics', code: 'MATH101' },
    { name: 'Science', code: 'SCI101' },
    { name: 'English', code: 'ENG101' },
    { name: 'Social Studies', code: 'SST101' },
    { name: 'Computer Science', code: 'CS101' }
  ];

  useEffect(() => {
    const schoolId = user.schoolId;
    if (isMock) return;
    if (!schoolId) {
      setClasses(MOCK_CLASSES);
      setSelectedClass('10A');
      setSubjects(MOCK_SUBJECT_LIST);
      setTeachers(MOCK_TEACHERS);
      setLoading(false);
      return;
    }

    const unsubClasses = onSnapshot(collection(db, 'schools', schoolId, 'classes'), (snap) => {
      const classList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setClasses(classList.length > 0 ? classList : MOCK_CLASSES);
      if (!selectedClass) setSelectedClass(classList[0]?.id || '10A');
    }, () => {
      setClasses(MOCK_CLASSES);
      setSelectedClass('10A');
    });

    const unsubTeachers = onSnapshot(query(collection(db, 'schools', schoolId, 'users'), where('role', '==', 'TEACHER')), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
      setTeachers(docs.length > 0 ? docs : MOCK_TEACHERS);
    }, () => setTeachers(MOCK_TEACHERS));

    const unsubSubjects = onSnapshot(collection(db, 'schools', schoolId, 'subjects'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ name: d.data().name, code: d.data().code }));
      setSubjects(docs.length > 0 ? docs : MOCK_SUBJECT_LIST);
    }, () => setSubjects(MOCK_SUBJECT_LIST));

    setLoading(false);
    return () => {
      unsubClasses();
      unsubTeachers();
      unsubSubjects();
    };
  }, [user.schoolId]);

  useEffect(() => {
    if (selectedClass) {
      const classData = globalTimetable.find(t => t.classId === selectedClass);
      setTimetable(classData?.entries || []);
    }
  }, [selectedClass, globalTimetable]);

  const checkGlobalConflict = (day: string, period: number, teacherId: string, currentClassId: string): string | null => {
    if (!teacherId) return null;
    for (const t of globalTimetable) {
        if (t.classId === currentClassId) continue;
        const conflict = t.entries.find((e: any) => e.day === day && e.period === period && e.teacherId === teacherId);
        if (conflict) return t.classId;
    }
    return null;
  };

  const handleDragStart = (type: 'SUBJECT' | 'TEACHER', value: string, name: string) => {
    setDraggedItem({ type, value, name });
  };

  const handleDrop = (day: string, period: number) => {
    if (!draggedItem) return;
    
    setTimetable(prev => {
      const existingIdx = prev.findIndex(e => e.day === day && e.period === period);
      const newEntries = [...prev];
      
      if (existingIdx > -1) {
        const updated: TimetableEntry = { ...newEntries[existingIdx]! };
        if (draggedItem.type === 'SUBJECT') updated.subject = draggedItem.name;
        else {
          const conflict = checkGlobalConflict(day, period, draggedItem.value, selectedClass);
          if (conflict) {
            toast.error(`${draggedItem.name} is busy in Class ${conflict}`);
            return prev;
          }
          updated.teacherId = draggedItem.value;
          updated.teacherName = draggedItem.name;
        }
        newEntries[existingIdx] = updated;
      } else {
        newEntries.push({
          day, period,
          subject: draggedItem.type === 'SUBJECT' ? draggedItem.name : '',
          teacherId: draggedItem.type === 'TEACHER' ? draggedItem.value : '',
          teacherName: draggedItem.type === 'TEACHER' ? draggedItem.name : ''
        });
      }
      return newEntries;
    });
    setDraggedItem(null);
  };

  const handleSave = async () => {
    if (!selectedClass || !user.schoolId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'schools', user.schoolId, 'timetables', selectedClass), {
        entries: timetable,
        updatedAt: serverTimestamp(),
        updatedBy: user.name
      }, { merge: true });
      toast.success('Institutional Schedule Synchronized');
    } catch (error) { toast.error('Sync failed'); }
    finally { setSaving(false); }
  };

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text(schoolProfile?.name || 'SMARTSCHOOL', pageWidth/2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`OFFICIAL CLASS SCHEDULE: ${selectedClass}`, pageWidth/2, 32, { align: 'center' });

    const head = [['Period', ...DAYS]];
    const body = PERIODS.map(p => {
        const row = [`P${p}`];
        DAYS.forEach(d => {
            const entry = timetable.find(e => e.day === d && e.period === p);
            row.push(entry ? `${entry.subject}\n(${entry.teacherName})` : '-');
        });
        return row;
    });

    (doc as any).autoTable({
        startY: 50,
        head, body,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center', fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
    });
    doc.save(`Timetable_${selectedClass}.pdf`);
    toast.success("Schedule exported for classroom deployment");
  };

const ReadOnlyTimetable = () => {
     if (!selectedClass) {
       return (
         <div className="bg-white dark:bg-slate-950 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center min-h-[40vh] shadow-sm">
           <Info size={48} className="text-slate-300 mb-4"/>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a Class</p>
           <p className="text-[10px] text-slate-300 mt-2">Choose a class from the dropdown above to view its timetable</p>
         </div>
       );
     }

     return (
       <div className="bg-white dark:bg-slate-950 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
         <div className="overflow-x-auto no-scrollbar">
           <table className="w-full border-collapse">
             <thead>
               <tr>
                 <th className="bg-slate-50 dark:bg-slate-900/50 p-6 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-100 dark:border-slate-800">P#</th>
                 {DAYS.map(day => <th key={day} className="bg-slate-50 dark:bg-slate-900/50 p-6 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-100 dark:border-slate-800">{day}</th>)}
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {PERIODS.map(p => (
                 <tr key={p}>
                   <td className="p-6 bg-slate-50 dark:bg-slate-900/30 font-black text-2xl text-slate-900 dark:text-white text-center border-r border-slate-100 dark:border-slate-800">{p}</td>
                   {DAYS.map(day => {
                     const entry = timetable.find(e => e.day === day && e.period === p);
                     return (
                       <td key={`${day}-${p}`} className="p-4 border-r border-slate-100 dark:border-slate-800 min-w-[160px] cursor-default">
                         <div className="space-y-1">
                           {entry?.subject ? (
                             <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">{entry.subject}</p>
                           ) : (
                             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Free</p>
                           )}
                           {entry?.teacherName ? (
                             <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{entry.teacherName}</p>
                           ) : (
                             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">-</p>
                           )}
                         </div>
                       </td>
                     );
                   })}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
     );
   };

   // --- Shared: Class selector for all views ---
   const classSelector = (
     <select
       value={selectedClass}
       onChange={(e) => {
         setSelectedClass(e.target.value);
         if (viewMode !== 'ADMIN') {
           const classData = globalTimetable.find(t => t.classId === e.target.value);
           setTimetable(classData?.entries || []);
         }
       }}
       className="w-full md:w-80 bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl text-xs font-black uppercase border-none outline-none dark:text-white shadow-inner"
        disabled={viewMode === 'TEACHER' && !!user.classId}
     >
       <option value="">Select Class...</option>
       {classes.map(c => (
         <option key={c.id} value={c.id}>{c.name || c.id}</option>
       ))}
     </select>
   );

if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orchestrating Resource Grid</p>
      </div>
    );

  return (
    <div className="w-full space-y-6 pb-24 page-enter">

      {/* --- HEADER --- */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Calendar size={18} /> Global Scheduler
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Timetable Matrix</h1>
            <p className="text-slate-400 max-w-2xl font-medium leading-relaxed italic opacity-80">Design institutional schedules with interactive drag-and-drop mechanics and real-time faculty conflict detection.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={generatePDF} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-xl"><Printer size={24}/></button>
             <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-xl"><ArrowLeft size={24}/></button>
          </div>
        </div>
      </div>

      {/* --- VIEW MODE TABS --- */}
      <div className="flex gap-4 p-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-xl">
        {['ADMIN', 'TEACHER', 'STUDENT'].map(tab => (
          <button
            key={tab}
            onClick={() => setViewMode(tab as any)}
            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
          >
            {tab} View
          </button>
        ))}
      </div>

      {viewMode === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* --- DRAG SIDEBAR --- */}
          <div className="lg:col-span-3 space-y-8">
             <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Draggable Roster</h4>

                <div className="space-y-6">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Subjects</p>
                      <div className="grid grid-cols-1 gap-2">
                         {subjects.map(s => (
                           <div
                             key={s.name}
                             draggable
                             onDragStart={() => handleDragStart('SUBJECT', s.name, s.name)}
                             className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all flex justify-between items-center group"
                           >
                              {s.name} <GripVertical size={14} className="text-slate-300 group-hover:text-indigo-500"/>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Faculty</p>
                      <div className="grid grid-cols-1 gap-2">
                         {teachers.map(t => (
                           <div
                             key={t.id}
                             draggable
                             onDragStart={() => handleDragStart('TEACHER', t.id, t.name)}
                             className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/20 text-[10px] font-black uppercase cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all flex justify-between items-center group"
                           >
                              {t.name} <GripVertical size={14} className="text-slate-300 group-hover:text-indigo-500"/>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                   <Info size={20}/>
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Usage Guide</h4>
                </div>
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed italic opacity-80">Drag a subject or teacher from the roster and drop them onto a time slot in the matrix below. Conflict detection will trigger automatically.</p>
             </div>
          </div>

          {/* --- MATRIX GRID --- */}
          <div className="lg:col-span-9 space-y-8">
             <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-slate-50 dark:bg-slate-900 px-8 py-4 rounded-2xl text-xs font-black uppercase border-none outline-none dark:text-white w-full md:w-80 shadow-inner">
                   <option value="">Select Target Class...</option>
                   {classes.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                </select>
                <button onClick={handleSave} disabled={saving || !selectedClass} className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                   {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Synchronize Matrix
                </button>
             </div>

             <div className="bg-white dark:bg-slate-950 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full border-collapse">
                      <thead>
                         <tr>
                            <th className="bg-slate-50 dark:bg-slate-900/50 p-6 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-100 dark:border-slate-800">P#</th>
                            {DAYS.map(day => <th key={day} className="bg-slate-50 dark:bg-slate-900/50 p-6 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-100 dark:border-slate-800">{day}</th>)}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {PERIODS.map(p => (
                            <tr key={p}>
                               <td className="p-6 bg-slate-50 dark:bg-slate-900/30 font-black text-2xl text-slate-900 dark:text-white text-center border-r border-slate-100 dark:border-slate-800">{p}</td>
                               {DAYS.map(day => {
                                  const entry = timetable.find(e => e.day === day && e.period === p);
                                  const conflict = entry?.teacherId ? checkGlobalConflict(day, p, entry.teacherId, selectedClass) : null;

                                  return (
                                     <td
                                       key={`${day}-${p}`}
                                       onDragOver={e => e.preventDefault()}
                                       onDrop={() => handleDrop(day, p)}
                                       className={`p-4 border-r border-slate-100 dark:border-slate-800 min-w-[160px] transition-all relative group cursor-pointer ${conflict ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'}`}
                                     >
                                        <div className="space-y-1">
                                           {entry?.subject ? (
                                              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">{entry.subject}</p>
                                           ) : (
                                              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Drop Subject</p>
                                           )}
                                           {entry?.teacherName ? (
                                              <p className={`text-[9px] font-black uppercase tracking-widest ${conflict ? 'text-rose-500' : 'text-indigo-600'}`}>{entry.teacherName}</p>
                                           ) : (
                                              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Drop Teacher</p>
                                           )}
                                           {conflict && (
                                              <div className="flex items-center gap-1 text-[7px] font-black text-rose-500 uppercase tracking-tighter mt-1">
                                                 <AlertTriangle size={10}/> Busy in {conflict}
                                              </div>
                                           )}
                                        </div>
                                        {entry && (
                                           <button onClick={() => setTimetable(prev => prev.filter(e => !(e.day === day && e.period === p)))} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                                        )}
                                     </td>
                                  );
                               })}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- TEACHER / STUDENT READ-ONLY VIEW --- */}
      {viewMode !== 'ADMIN' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm font-medium text-slate-500">
                <span className="font-bold text-indigo-600">{viewMode}</span> read-only view
              </p>
              {classSelector}
            </div>
          </div>

          {selectedClass ? (
            <ReadOnlyTimetable />
          ) : (
            <div className="bg-white dark:bg-slate-950 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center min-h-[30vh] shadow-sm">
              <Info size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a Class</p>
              <p className="text-[10px] text-slate-300 mt-2">Choose a class from the dropdown above to view the timetable</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
