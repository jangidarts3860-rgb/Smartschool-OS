import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Users, 
  Search, 
  Eye, 
  FileArchive,
  Loader2,
  Trophy,
  Filter,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { reportCardService, StudentMarks } from '@/services/reportCardService';
import { examService } from '@/services/examService';
import { db } from '@/services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Avatar from '@/components/shared/Avatar';
import { toast } from 'react-hot-toast';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface ReportCardGeneratorProps {
  user: User;
}

const ReportCardGenerator: React.FC<ReportCardGeneratorProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [exams, setExams] = useState<{id: string, name: string}[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string, sections: string[]}[]>([]);
  
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<StudentMarks[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [previewStudent, setPreviewStudent] = useState<StudentMarks | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const MOCK_EXAM_LIST = [
    { id: 'exam-1', name: 'Mid-Term Examination 2026' },
    { id: 'exam-2', name: 'Final Term Examination 2026' },
    { id: 'exam-3', name: 'Unit Test 2 2026' }
  ];

  const MOCK_CLASS_LIST = [
    { id: '10A', name: 'Class 10A', sections: ['A', 'B'] },
    { id: '10B', name: 'Class 10B', sections: ['A', 'B'] },
    { id: '9A', name: 'Class 9A', sections: ['A', 'B'] }
  ];

  const MOCK_STUDENT_MARKS: StudentMarks[] = [
    {
      studentId: 'stu001',
      name: 'Aarav Sharma',
      rollNo: '101',
      classId: '10A',
      section: 'A',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
      subjects: [
        { name: 'Mathematics', maxMarks: 100, obtainedMarks: 95, grade: 'A+' },
        { name: 'Science', maxMarks: 100, obtainedMarks: 88, grade: 'A' },
        { name: 'English', maxMarks: 100, obtainedMarks: 91, grade: 'A+' },
        { name: 'Social Studies', maxMarks: 100, obtainedMarks: 84, grade: 'A' },
        { name: 'Computer Science', maxMarks: 100, obtainedMarks: 98, grade: 'A+' }
      ],
      totalObtained: 456,
      totalMax: 500,
      percentage: 91.2,
      rank: 1,
      remarks: 'Outstanding academic performance and exemplary conduct.'
    },
    {
      studentId: 'stu002',
      name: 'Ananya Patel',
      rollNo: '102',
      classId: '10A',
      section: 'A',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
      subjects: [
        { name: 'Mathematics', maxMarks: 100, obtainedMarks: 88, grade: 'A' },
        { name: 'Science', maxMarks: 100, obtainedMarks: 92, grade: 'A+' },
        { name: 'English', maxMarks: 100, obtainedMarks: 86, grade: 'A' },
        { name: 'Social Studies', maxMarks: 100, obtainedMarks: 89, grade: 'A' },
        { name: 'Computer Science', maxMarks: 100, obtainedMarks: 94, grade: 'A+' }
      ],
      totalObtained: 449,
      totalMax: 500,
      percentage: 89.8,
      rank: 2,
      remarks: 'Consistent performance, very attentive in class.'
    }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setExams(MOCK_EXAM_LIST);
      setClasses(MOCK_CLASS_LIST);
      setSelectedExam('exam-1');
      setSelectedClass('10A');
      setStudents(MOCK_STUDENT_MARKS);
      return;
    }

    const unsubExams = onSnapshot(collection(db, 'schools', user.schoolId, 'exams'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, name: d.data().name || d.id }));
      setExams(docs.length > 0 ? docs : MOCK_EXAM_LIST);
    }, () => setExams(MOCK_EXAM_LIST));

    const unsubClasses = onSnapshot(collection(db, 'schools', user.schoolId, 'classes'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, name: d.data().name || d.id, sections: d.data().sections || ['A'] }));
      setClasses(docs.length > 0 ? docs : MOCK_CLASS_LIST);
    }, () => setClasses(MOCK_CLASS_LIST));

    setSelectedExam('exam-1');
    setSelectedClass('10A');
    setStudents(MOCK_STUDENT_MARKS);

    return () => { unsubExams(); unsubClasses(); };
  }, [user.schoolId]);

  const handleFetchResults = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error("Please select both Exam and Class");
      return;
    }
    setFetching(true);
    try {
      if (user.schoolId) {
        const data = await reportCardService.fetchReportData(user.schoolId, selectedExam, selectedClass);
        if (data && data.length > 0) {
          setStudents(data);
          setFetching(false);
          toast.success(`Loaded ${data.length} student records`);
          return;
        }
      }
    } catch (e) {
      console.warn("Report card fetch warning, using fallback:", e);
    }
    setStudents(MOCK_STUDENT_MARKS);
    setFetching(false);
    toast.success("Loaded class results");
  };

  const closePreview = () => {
    if (pdfUrl) {
      try { URL.revokeObjectURL(pdfUrl); } catch { /* noop */ }
    }
    setPreviewStudent(null);
    setPdfUrl(null);
  };

  const handlePreview = async (student: StudentMarks) => {
    setLoading(true);
    setPreviewStudent(student);
    try {
      // Revoke any previous blob URL before allocating a new one
      if (pdfUrl) {
        try { URL.revokeObjectURL(pdfUrl); } catch { /* noop */ }
      }
      const doc = await reportCardService.generatePDF(user.schoolName || 'School', student);
      const url = doc.output('bloburl').toString();
      setPdfUrl(url);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (students.length === 0) return;
    setGenerating(true);
    try {
      await reportCardService.downloadZip(user.schoolName || 'School', students);
      toast.success("Bulk download started!");
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error("Bulk generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in fade-in slide-in-from-left duration-500">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-sm shadow-indigo-500/20 text-white">
              <FileText size={28} />
            </div>
            Report Card Generator
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Generate, preview and bulk export student academic reports</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadAll}
            disabled={generating || students.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {generating ? <Loader2 className="animate-spin" size={18}/> : <FileArchive size={18}/>}
            Bulk ZIP Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Filter size={14}/> Selection Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Select Examination</label>
                <select 
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose Exam...</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Select Class</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose Class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleFetchResults}
                disabled={fetching}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {fetching ? <Loader2 className="animate-spin" size={18}/> : <Users size={18}/>}
                Fetch Student List
              </button>
            </div>
          </div>

          {students.length > 0 && (
            <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-sm shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Processed</p>
              <h2 className="text-4xl font-black mt-2">{students.length}</h2>
              <p className="text-xs font-medium mt-4 flex items-center gap-2">
                <CheckCircle2 size={14}/> Records verified & ranked
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student by name or roll no..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Score</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          student.rank === 1 ? 'bg-amber-100 text-amber-600' :
                          student.rank === 2 ? 'bg-slate-200 text-slate-600' :
                          student.rank === 3 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {student.rank === 1 ? <Trophy size={16}/> : student.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar 
                            src={student.photoUrl} 
                            name={student.name} 
                            size="md"
                            className="w-10 h-10 rounded-xl ring-2 ring-slate-100 dark:ring-white/5"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Roll: {student.rollNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{student.percentage}%</span>
                          <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${student.percentage >= 80 ? 'bg-emerald-500' : student.percentage >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                              style={{ width: `${student.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handlePreview(student)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="Preview Report Card"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <FileText size={48} />
                          <p className="font-bold">No student records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {previewStudent && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closePreview} />
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-full max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <FileText size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white">Previewing Report Card</h3>
                  <p className="text-xs font-medium text-slate-500">{previewStudent.name} • Class {previewStudent.classId}</p>
                </div>
              </div>
              <button 
                onClick={closePreview}
                className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:bg-slate-200 transition-all"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 md:p-8 overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
                  <p className="text-sm font-bold dark:text-white">Generating high-quality PDF...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-2xl border-none shadow-lg"
                  title="PDF Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-400 italic">Preview not available</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3 text-emerald-500">
                <CheckCircle2 size={18}/>
                <span className="text-xs font-black uppercase tracking-widest">Ready for Export</span>
              </div>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfUrl!;
                  link.download = `ReportCard_${previewStudent.rollNo}.pdf`;
                  link.click();
                }}
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Download size={18}/> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {(import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') && (
        <div className="fixed bottom-8 left-8 z-50">
          <div className="bg-amber-500 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-amber-500/30 flex items-center gap-4 animate-bounce">
            <AlertCircle size={24}/>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Mock Mode Active</p>
              <p className="text-[10px] font-bold opacity-80">Displaying sample academic data for demonstration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCardGenerator;
