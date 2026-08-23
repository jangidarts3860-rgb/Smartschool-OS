 
import React, { useState, useEffect, useReducer } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Filter, 
  ArrowLeft,
  Loader2,
  Save,
  ChevronRight,
  ShieldCheck,
  Zap,
  Printer,
  BarChart3,
  Eye,
  EyeOff,
  Send,
  Clock,
  AlertTriangle,
  PieChart,
  BookOpen,
  XCircle
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import type { User as UserType, SchoolProfile } from '@/types';
import { UserRole } from '@/types';
import { MOCK_USERS } from '@/constants';
import Avatar from '@/components/shared/Avatar';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateGrade, getGradeColor, getGradeColorBg } from '@/utils/gradeCalculator';
import { examService } from '@/services/examService';

interface Props {
  user: UserType;
  onBack?: () => void;
}

interface SubjectEntry {
  subjectName: string;
  marksObtained: number | 'AB' | 'ML';
  maxMarks: number;
  grade: string;
}

interface ClassData {
  id: string;
  name: string;
  sections?: string[];
  subjects?: string[];
}

interface ExamOption {
  id: string;
  name: string;
}

const ResultManagement: React.FC<Props> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'ARCHIVE' | 'ANALYTICS'>('ENTRY');
  const [students, setStudents] = useState<UserType[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamName, setSelectedExamName] = useState('');
  
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [selectedForPublish, setSelectedForPublish] = useState<Set<string>>(new Set());

  // P2 fix: useReducer keyed on (schoolId, classId, sectionId, examId).
  // Switching any of those fully clears local edits, preventing the
  // "stale marks leaked from previous subject" bug where the same form
  // state survived a class/exam change.
  type FormAction =
    | { type: 'SET'; studentId: string; subject: string; value: string }
    | { type: 'CLEAR_ALL' };

  const formReducer = (
    state: { [studentId: string]: SubjectEntry[] },
    action: FormAction
  ): { [studentId: string]: SubjectEntry[] } => {
    switch (action.type) {
      case 'CLEAR_ALL':
        return {};
      case 'SET': {
        const currentMarks = state[action.studentId] || [];
        const newMarks = [...currentMarks];
        const idx = newMarks.findIndex((m) => m.subjectName === action.subject);
        if (action.value === '') {
          if (idx > -1) newMarks.splice(idx, 1);
          return { ...state, [action.studentId]: newMarks };
        }
        const marks = parseFloat(action.value);
        if (isNaN(marks) || marks < 0) {
          return { ...state, [action.studentId]: newMarks };
        }
        const entry: SubjectEntry = {
          subjectName: action.subject,
          marksObtained: marks,
          maxMarks: 100,
          grade: calculateGrade(marks, 100).grade,
        };
        if (idx > -1) newMarks[idx] = entry;
        else newMarks.push(entry);
        return { ...state, [action.studentId]: newMarks };
      }
      default:
        return state;
    }
  };

  const [pendingMarks, dispatchForm] = useReducer(formReducer, {});

  // Key the reducer on the active (schoolId, classId, sectionId, examId).
  useEffect(() => {
    dispatchForm({ type: 'CLEAR_ALL' });
  }, [user.schoolId, selectedClass, selectedSection, selectedExamId]);

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  const MOCK_RESULT_CLASSES: ClassData[] = [
    { id: '10A', name: '10', sections: ['A', 'B'], subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'] },
    { id: '10B', name: '10', sections: ['A', 'B'], subjects: ['Mathematics', 'Science', 'English', 'Social Studies'] },
    { id: '9A', name: '9', sections: ['A', 'B'], subjects: ['Mathematics', 'Science', 'English', 'Social Studies'] }
  ];

  const MOCK_RESULT_EXAMS: ExamOption[] = [
    { id: 'exam-1', name: 'Mid-Term Examination 2026' },
    { id: 'exam-2', name: 'Unit Test 2 2026' },
    { id: 'exam-3', name: 'Final Term Examination 2026' }
  ];

  useEffect(() => {
    const schoolId = user.schoolId;
    if (!schoolId || isMock) {
      setClasses(MOCK_RESULT_CLASSES);
      setExams(MOCK_RESULT_EXAMS);
      setSelectedClass('10A');
      setSelectedSection('A');
      setSelectedExamId('exam-1');
      setSelectedExamName('Mid-Term Examination 2026');
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setLoading(false);
      return;
    }
    
    const classesRef = collection(db, 'schools', schoolId, 'classes');
    const unsubClasses = onSnapshot(classesRef, (snap) => {
        const classData = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as ClassData[];
        const finalClasses = classData.length > 0 ? classData : MOCK_RESULT_CLASSES;
        setClasses(finalClasses);
        if (!selectedClass) {
          setSelectedClass(finalClasses[0]?.id || '10A');
          setSelectedSection(finalClasses[0]?.sections?.[0] || 'A');
        }
    }, () => {
        setClasses(MOCK_RESULT_CLASSES);
        setSelectedClass('10A');
        setSelectedSection('A');
    });

    let unsubStudents = () => {};
    if (selectedClass && selectedSection) {
        const studentsRef = collection(db, 'schools', schoolId, 'users');
        const qStudents = query(
            studentsRef,
            where('role', '==', UserRole.STUDENT)
        );
        unsubStudents = onSnapshot(qStudents, (snap) => {
            const studentData = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserType[];
            setStudents(studentData.length > 0 ? studentData : MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
        }, () => {
            setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
        });
    } else {
        setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
    }

    setExams(MOCK_RESULT_EXAMS);
    if (!selectedExamId) {
        setSelectedExamId('exam-1');
        setSelectedExamName('Mid-Term Examination 2026');
    }

    setLoading(false);
    return () => {
        unsubClasses();
        unsubStudents();
    };
  }, [user.schoolId, selectedClass, selectedSection]);

  // P0 fix: separate effect to scope results query to current classId
  useEffect(() => {
    if (!user.schoolId || !selectedClass || !selectedSection || isMock) return;
    const classId = `${selectedClass}-${selectedSection}`;
    const q = query(
      collection(db, 'schools', user.schoolId, 'results'),
      where('classId', '==', classId)
    );
    const unsub = onSnapshot(q, (snap) => {
        setExistingResults(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user.schoolId, selectedClass, selectedSection]);

  const handleLocalMarkChange = (studentId: string, subjectName: string, val: string) => {
    dispatchForm({ type: 'SET', studentId, subject: subjectName, value: val });
  };

  const saveAllResults = async () => {
    if (Object.keys(pendingMarks).length === 0) return toast.error("No changes to save");
    if (!selectedExamId) return toast.error("Select an exam first");
    
    setSaving(true);
    
    try {
      const resultsToSave = [];
      
      for (const [studentId, subjects] of Object.entries(pendingMarks)) {
          const student = students.find(s => s.id === studentId);
          if (!student) continue;

          const totalObtained = subjects.reduce((sum, m) => {
              const val = typeof m.marksObtained === 'number' ? m.marksObtained : 0;
              return sum + val;
          }, 0);
          const totalMax = subjects.reduce((sum, m) => sum + m.maxMarks, 0);
          const percentage = (totalObtained / totalMax) * 100;
          const grade = calculateGrade(totalObtained, totalMax).grade;

          const subjectsRecord: Record<string, any> = {};
          for (const s of subjects) {
            subjectsRecord[s.subjectName] = {
              marks: s.marksObtained,
              maxMarks: s.maxMarks,
              grade: s.grade,
            };
          }

          resultsToSave.push({
              studentId,
              studentName: student.name,
              rollNo: student.rollNo?.toString(),
              classId: `${selectedClass}-${selectedSection}`,
              section: selectedSection,
              examId: selectedExamId,
              examName: selectedExamName,
              subjects: subjectsRecord,
              totalMarks: totalObtained,
              maxTotalMarks: totalMax,
              percentage: parseFloat(percentage.toFixed(2)),
              overallGrade: grade,
              teacherName: user.name,
              teacherRemarks: '',
              isPublished: false,
              createdBy: user.id,
              academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
              schoolId: user.schoolId,
              showGraceFlag: false,
          });
      }

      await examService.saveResultsBatch(user.schoolId, resultsToSave);
      await examService.calculateAndSetRanks(user.schoolId, selectedExamId, `${selectedClass}-${selectedSection}`);
      
      dispatchForm({ type: 'CLEAR_ALL' });
      toast.success("All marks synchronized with institutional records!");
    } catch (err) {
        console.error(err);
        toast.error("Bulk sync failed");
    } finally {
        setSaving(false);
    }
  };

  const handlePublishAll = async () => {
    if (!selectedExamId || !selectedClass || !selectedSection) {
      return toast.error("Select class, section, and exam first");
    }
    const draftCount = existingResults.filter(r => r.examId === selectedExamId && r.classId === `${selectedClass}-${selectedSection}` && !r.isPublished).length;
    if (draftCount === 0) return toast.error("No draft results to publish");
    if (!confirm(`Publish ${draftCount} result(s) for ${selectedExamName}? Students and parents will be able to see them.`)) return;

    setPublishing(true);
    try {
      await examService.publishAllResults(user.schoolId, selectedExamId, `${selectedClass}-${selectedSection}`, user.id);
      toast.success(`${draftCount} result(s) published successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const handleTogglePublish = async (studentId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await examService.unpublishResult(user.schoolId, selectedExamId, studentId);
        toast.success("Result unpublished");
      } else {
        await examService.publishResult(user.schoolId, selectedExamId, studentId, user.id);
        toast.success("Result published");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update publish status");
    }
  };

  const generateReportCard = (student: UserType, result: any) => {
    const doc = new jsPDF() as any;
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile?.name || 'SMARTSCHOOL', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    const currentYear = new Date().getFullYear();
    const sessionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    doc.text(`OFFICIAL ACADEMIC TRANSCRIPT • ${sessionYear}`, 105, 35, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, 60, 190, 45, 5, 5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.text("STUDENT IDENTITY", 20, 72);
    doc.setFontSize(14);
    doc.text(student.name.toUpperCase(), 20, 82);
    doc.setFontSize(9);
    doc.text(`ID: ${student.uniqueId || student.id.substring(0,8)}`, 20, 92);
    
    doc.text("EXAMINATION", 100, 72);
    doc.setFontSize(12);
    doc.text(result.examName || 'Final Exam', 100, 82);
    
    doc.setFontSize(9);
    doc.text("GRADE", 160, 72);
    doc.setFontSize(24);
    doc.text(result.overallGrade, 160, 87);

    const subjects = result.subjects;
    const tableData = Object.entries(subjects).map(([name, data]: [string, any]) => 
      [name, data.maxMarks, data.marks, data.grade]
    );
    (doc as any).autoTable({
        startY: 115,
        head: [['Subject', 'Max', 'Obtained', 'Grade']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { halign: 'center', cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text(`RESULT STATUS: ${result.percentage >= 40 ? 'PASSED' : 'FAILED'}`, 105, finalY, { align: 'center' });
    
    doc.save(`${student.name}_Result.pdf`);
    toast.success("PDF Generated");
  };

  if (loading) return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-12 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
      {/* Filters skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  const filteredStudents = students.filter(s => {
      const classMatch = selectedClass && selectedSection
        ? s.classId === `${selectedClass}-${selectedSection}`
        : !selectedClass || s.classId?.startsWith(selectedClass);
      const searchMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      return classMatch && searchMatch;
  });

  return (
    <div className="space-y-10 pb-32 animate-fade-in-up">
      
       <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden border border-white/5 shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
           <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
               <BarChart3 size={20} /> Evaluation Core
             </div>
             <h1 className="text-5xl md:text-6xl font-black tracking-tighter">Performance Hub</h1>
             <p className="text-slate-400 max-w-xl font-medium leading-relaxed italic opacity-80">Institutional grade calculation and official transcript orchestration engine.</p>
           </div>
           <div className="flex flex-col gap-4">
              <div className="flex gap-2 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                <button onClick={() => setActiveTab('ENTRY')} className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ENTRY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-400'}`}>Entry Portal</button>
                <button onClick={() => setActiveTab('ARCHIVE')} className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ARCHIVE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-400'}`}>Archives</button>
                <button onClick={() => setActiveTab('ANALYTICS')} className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-400'}`}>Analytics</button>
              </div>
              {activeTab === 'ENTRY' && (
                <>
                  <button 
                    onClick={saveAllResults}
                    disabled={saving || Object.keys(pendingMarks).length === 0}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    Finalize All Marks
                  </button>
                  <button 
                    onClick={handlePublishAll}
                    disabled={publishing || existingResults.filter(r => r.examId === selectedExamId && r.classId === `${selectedClass}-${selectedSection}` && !r.isPublished).length === 0}
                    className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {publishing ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                    Publish All Drafts
                  </button>
                </>
              )}
           </div>
         </div>
       </div>

      {activeTab !== 'ANALYTICS' && (
        <>
       <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-wrap items-center gap-6">
           <div className="flex flex-wrap gap-4 items-center flex-1">
             <select 
               value={selectedClass} 
               onChange={e => setSelectedClass(e.target.value)} 
               disabled={user.role === UserRole.TEACHER && user.classId ? true : false}
               className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl text-xs font-black uppercase border-none outline-none dark:text-white w-full md:w-64"
             >
                <option value="">Select Class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
<select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl text-xs font-black uppercase border-none outline-none dark:text-white w-full md:w-40">
                <option value="">Select Section...</option>
                {selectedClass
                  ? (classes.find(c => c.id === selectedClass)?.sections || []).map((s: string) => (
                      <option key={s} value={s}>Sec {s}</option>
                    ))
                  : <option value="" disabled>Select Class First</option>
                }
              </select>
             <select value={selectedExamId} onChange={e => {
               setSelectedExamId(e.target.value);
               const exam = exams.find(ex => ex.id === e.target.value);
               if (exam) setSelectedExamName(exam.name);
             }} className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl text-xs font-black uppercase border-none outline-none dark:text-white w-full md:w-56">
                <option value="">Select Exam...</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
             </select>
             <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" placeholder="Find student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
             </div>
           </div>
       </div>

       <div className="space-y-6">
          {filteredStudents.length === 0 ? (
             <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found in this section</p>
             </div>
          ) : (
              filteredStudents.map(student => {
                 const result = existingResults.find(r => r.studentId === student.id && r.examId === selectedExamId);
                 const classObj = classes.find(c => c.id === selectedClass);
                 const subjects = classObj?.subjects || ['Maths', 'Science', 'English', 'History'];
                 const hasUnsavedChanges = !!pendingMarks[student.id];
                 const isPublished = result?.isPublished ?? false;

                 return (
                    <div key={student.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-10 group hover:shadow-2xl hover:border-indigo-500/30 transition-all">
                       <div className="flex items-center gap-6 min-w-[250px]">
                           <Avatar src={student.avatar} name={student.name} size="xl" className="rounded-[1.5rem] shadow-inner" />
                          <div>
                             <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-2">{student.name}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.uniqueId}</span>
                                {hasUnsavedChanges && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Unsaved Changes"></span>}
                                {result && (
                                  isPublished ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Published
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <Clock size={10} /> Draft
                                    </span>
                                  )
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
                          {subjects.map((sub: string) => {
                            const existingSubject = result?.subjects?.[sub];
                            const defaultValue = existingSubject?.marks ?? '';
                            return (
                              <div key={sub} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 text-center group/input hover:border-indigo-500/30 transition-all">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 truncate">{sub}</p>
                                 <input 
                                   type="number" 
                                   min="0"
                                   max="100"
                                   placeholder="00"
                                   defaultValue={defaultValue}
                                   onChange={(e) => handleLocalMarkChange(student.id, sub, e.target.value)}
                                   className="w-full bg-transparent text-center font-black text-lg text-slate-900 dark:text-white outline-none focus:text-indigo-600 transition-colors" 
                                 />
                              </div>
                            );
                          })}
                       </div>

                       <div className="flex items-center gap-8 min-w-[200px] justify-end w-full xl:w-auto">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                             <p className="text-2xl font-black text-emerald-500">
                                {result ? `${result.percentage}%` : '---'}
                             </p>
                          </div>
                          <div className="flex items-center gap-2">
                             {result && (
                               <button 
                                 onClick={() => handleTogglePublish(student.id, isPublished)}
                                 className={`p-5 rounded-2xl shadow-sm hover:scale-110 active:scale-90 transition-all ${
                                   isPublished 
                                     ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                     : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                 }`}
                                 title={isPublished ? 'Unpublish result' : 'Publish result'}
                               >
                                 {isPublished ? <EyeOff size={20}/> : <Eye size={20}/>}
                               </button>
                             )}
                             {result && (
                                <button onClick={() => generateReportCard(student, result)} className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm hover:bg-indigo-600 hover:scale-110 active:scale-90 transition-all">
                                   <Printer size={20}/>
                                </button>
                             )}
                          </div>
                       </div>
                    </div>
                 );
              })
          )}
       </div>
       </>
      )}

      {activeTab === 'ANALYTICS' && (() => {
        const examResults = existingResults.filter(r => r.examId === selectedExamId && r.classId === `${selectedClass}-${selectedSection}` && r.isPublished);
        const totalStudents = examResults.length;
        const passedCount = examResults.filter(r => r.percentage >= 40).length;
        const failedCount = totalStudents - passedCount;
        const passPercentage = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(1) : '0';
        const failPercentage = totalStudents > 0 ? ((failedCount / totalStudents) * 100).toFixed(1) : '0';
        const atRiskStudents = examResults.filter(r => r.percentage < 40).sort((a, b) => a.percentage - b.percentage);

        const allSubjectNames = new Set<string>();
        examResults.forEach(r => Object.keys(r.subjects || {}).forEach(s => allSubjectNames.add(s)));
        const subjectAverages = Array.from(allSubjectNames).map(subject => {
          const marksList = examResults.map(r => {
            const sd = r.subjects?.[subject];
            if (!sd) return 0;
            const m = typeof sd.marks === 'number' ? sd.marks : 0;
            return (m / sd.maxMarks) * 100;
          }).filter(m => m > 0);
          const avg = marksList.length > 0 ? (marksList.reduce((a, b) => a + b, 0) / marksList.length).toFixed(1) : '0';
          const below40 = examResults.filter(r => {
            const sd = r.subjects?.[subject];
            if (!sd) return false;
            const m = typeof sd.marks === 'number' ? sd.marks : 0;
            return (m / sd.maxMarks) * 100 < 40;
          }).length;
          return { subject, avg: parseFloat(avg), below40, total: examResults.length };
        }).sort((a, b) => b.avg - a.avg);

        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600"><PieChart size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Class Analytics</h3>
                  <p className="text-sm text-slate-500">{selectedExamName} • {selectedClass}-{selectedSection} • {totalStudents} results</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] p-8 text-center border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-3" />
                  <p className="text-5xl font-black text-emerald-600">{passPercentage}%</p>
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-2">Pass Rate</p>
                  <p className="text-sm text-emerald-600/70 font-bold mt-1">{passedCount} / {totalStudents} students</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] p-8 text-center border border-rose-100 dark:border-rose-800">
                  <XCircle size={32} className="mx-auto text-rose-600 mb-3" />
                  <p className="text-5xl font-black text-rose-600">{failPercentage}%</p>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest mt-2">Fail Rate</p>
                  <p className="text-sm text-rose-600/70 font-bold mt-1">{failedCount} / {totalStudents} students</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] p-8 text-center border border-amber-100 dark:border-amber-800">
                  <AlertTriangle size={32} className="mx-auto text-amber-600 mb-3" />
                  <p className="text-5xl font-black text-amber-600">{atRiskStudents.length}</p>
                  <p className="text-xs font-black text-amber-500 uppercase tracking-widest mt-2">At-Risk Students</p>
                  <p className="text-sm text-amber-600/70 font-bold mt-1">Below 40% overall</p>
                </div>
              </div>

              {subjectAverages.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-600" /> Subject-wise Class Average
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectAverages.map(({ subject, avg, below40, total }) => (
                      <div key={subject} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-black text-slate-900 dark:text-white text-sm">{subject}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${avg >= 60 ? 'bg-emerald-100 text-emerald-700' : avg >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {avg}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${avg >= 60 ? 'bg-emerald-500' : avg >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(avg, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">{below40} / {total} students below 40%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {atRiskStudents.length > 0 && (
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" /> At-Risk Students (Below 40%)
                  </h4>
                  <div className="space-y-3">
                    {atRiskStudents.map(r => (
                      <div key={r.studentId} className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center font-black">
                            {r.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{r.studentName}</p>
                            <p className="text-xs text-slate-500 font-bold">Roll: {r.rollNo || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-rose-600">{r.percentage}%</p>
                          <p className="text-xs font-black text-rose-500 uppercase">{r.overallGrade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalStudents === 0 && (
                <div className="py-16 text-center">
                  <BarChart3 size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold text-sm">No published results to analyze. Publish results first to see analytics.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ResultManagement;
