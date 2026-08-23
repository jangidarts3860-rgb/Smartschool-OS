
import React, { useState, useEffect } from 'react';
import { Save, Search, TrendingUp, AlertCircle, FileText, CheckCircle2, Loader2, Send, Eye, EyeOff, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { calculateGrade, getGradeColor, getGradeColorBg } from '@/utils/gradeCalculator';
import { examService } from '@/services/examService';
import { UserRole } from '@/types';

interface MarksEntry {
  internals: string;
  externals: string;
}

import { User } from '@/types';
import type { Subject, ResultRecord } from '@/types';
import { MOCK_USERS, MOCK_SUBJECTS } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const TeacherGrades: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'REPORT'>('ENTRY');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamName, setSelectedExamName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [marks, setMarks] = useState<{ [key: string]: MarksEntry }>({});
  const [selectedResults, setSelectedResults] = useState<ResultRecord[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [confirmPublish, setConfirmPublish] = useState(false);

  React.useEffect(() => {
    if (IS_MOCK_MODE) {
      const list = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
      setStudents(list);
      setSubjects(MOCK_SUBJECTS as any[]);
      setExams([{ id: 'ex-mid', name: 'Mid-Term Exam 2025' }, { id: 'ex-final', name: 'Final Board Exam 2025' }]);
      setSelectedSubject('Mathematics');
      setSelectedExamId('ex-mid');
      setSelectedExamName('Mid-Term Exam 2025');
      if (list.length > 0) setSelectedStudentId(list[0].id);
      setIsLoading(false);
      setResultsLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      try {
        if (!user.schoolId) {
          const list = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
          setStudents(list);
          setSubjects(MOCK_SUBJECTS as any[]);
          setExams([{ id: 'ex-mid', name: 'Mid-Term Exam 2025' }, { id: 'ex-final', name: 'Final Board Exam 2025' }]);
          setSelectedSubject('Mathematics');
          setSelectedExamId('ex-mid');
          setSelectedExamName('Mid-Term Exam 2025');
          if (list.length > 0) setSelectedStudentId(list[0].id);
          setIsLoading(false);
          return;
        }

        const subSnap = await getDocs(collection(db, 'schools', user.schoolId, 'subjects'));
        const rawSubs = subSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        const subList = rawSubs.length > 0 ? rawSubs : MOCK_SUBJECTS;
        setSubjects(subList as unknown as Subject[]);
        if (!selectedSubject) setSelectedSubject((subList[0] as any).name || 'Mathematics');

        const examSnap = await getDocs(collection(db, 'schools', user.schoolId, 'exams'));
        const rawExams = examSnap.docs.map((d: any) => ({ id: d.id, name: (d.data() as any).name || d.id }));
        const examList = rawExams.length > 0 ? rawExams : [{ id: 'ex-mid', name: 'Mid-Term Exam 2025' }, { id: 'ex-final', name: 'Final Board Exam 2025' }];
        setExams(examList);
        if (!selectedExamId) {
          setSelectedExamId(examList[0].id);
          setSelectedExamName(examList[0].name);
        }

        const q = query(
          collection(db, 'schools', user.schoolId, 'users'),
          where('role', '==', 'STUDENT')
        );

        const unsub = onSnapshot(q, (snapshot) => {
          const rawList = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as User));
          const list = rawList.length > 0 ? rawList : MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
          setStudents(list);
          if (!selectedStudentId && list.length > 0) setSelectedStudentId(list[0].id);
          setIsLoading(false);
        }, (err) => {
          const list = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
          setStudents(list);
          if (!selectedStudentId && list.length > 0) setSelectedStudentId(list[0].id);
          setIsLoading(false);
        });

        return () => unsub();
      } catch {
        const list = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
        setStudents(list);
        setSubjects(MOCK_SUBJECTS as any[]);
        setExams([{ id: 'ex-mid', name: 'Mid-Term Exam 2025' }]);
        setSelectedSubject('Mathematics');
        setSelectedExamId('ex-mid');
        setSelectedExamName('Mid-Term Exam 2025');
        if (list.length > 0) setSelectedStudentId(list[0].id);
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user.schoolId, user.classId]);

  React.useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (!selectedExamId || !user.schoolId) return;
    const resultsRef = collection(db, 'schools', user.schoolId, 'results');
    const q = query(resultsRef, where('examId', '==', selectedExamId));
    const unsub = onSnapshot(q, (snap) => {
      setAllResults(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedExamId, user.schoolId]);

  React.useEffect(() => {
    if (IS_MOCK_MODE) {
      setResultsLoading(false);
      return;
    }
    if (activeTab === 'REPORT' && selectedStudentId) {
      setResultsLoading(true);
      const unsub = examService.onResultsByStudent(user.schoolId, selectedStudentId, (results) => {
        const mapped = results.map(r => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.studentName,
          examId: r.examId,
          examName: r.examName,
          classId: r.classId,
          schoolId: r.schoolId || user.schoolId,
          subjects: Object.entries(r.subjects).map(([subjectId, data]: [string, any]) => ({
            subjectId,
            marksObtained: data.marks,
            maxMarks: data.maxMarks,
            grade: data.grade,
          })),
          totalMarks: r.totalMarks,
          maxTotalMarks: r.maxTotalMarks,
          percentage: r.percentage,
          overallGrade: r.overallGrade,
          rank: r.rank,
          isPublished: r.isPublished,
          teacherName: r.teacherName,
          teacherRemarks: r.teacherRemarks,
          createdBy: r.createdBy || '',
          createdAt: r.createdAt?.toDate() || new Date(),
        })) as unknown as ResultRecord[];
        setSelectedResults(mapped);
        setResultsLoading(false);
      });
      return () => unsub();
    }
  }, [user.schoolId, selectedStudentId, activeTab]);

  const handleMarkChange = (studentId: string, field: 'internals' | 'externals', value: string) => {
    const { internal: maxInternal, external: maxExternal } = getSubjectMaxMarks(selectedSubject);
    const limit = field === 'internals' ? maxInternal : maxExternal;
    const numValue = parseInt(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= limit)) {
      setMarks(prev => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] ?? { internals: '', externals: '' }),
          [field]: value
        }
      }));
    }
  };

  const handleSaveMarks = async () => {
    if (!user.classId) {
      return toast.error("You are not assigned to a class. Contact admin.");
    }
    const { internal: maxInternal, external: maxExternal, total: maxTotal } = getSubjectMaxMarks(selectedSubject);
    const hasInvalidMarks = Object.entries(marks).some(([_, mark]) => {
      const internal = parseInt(mark.internals || '0');
      const external = parseInt(mark.externals || '0');
      return isNaN(internal) || isNaN(external) || internal < 0 || internal > maxInternal || external < 0 || external > maxExternal;
    });

    if (hasInvalidMarks) {
      toast.error(`Please enter valid marks (Internals: 0-${maxInternal}, Externals: 0-${maxExternal})`);
      return;
    }

    if (!selectedExamId) {
      toast.error('Please select an exam');
      return;
    }

    setIsSaving(true);
    try {
      const resultsToSave = [];
      const currentYear = new Date().getFullYear();
      const sessionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

      for (const [studentId, studentMarks] of Object.entries(marks)) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        const total = Number(studentMarks.internals || 0) + Number(studentMarks.externals || 0);
        const grade = calculateGrade(total, maxTotal).grade;

        const subjectsRecord: Record<string, any> = {};
        subjectsRecord[selectedSubject] = {
          marks: total,
          maxMarks: maxTotal,
          grade,
        };

        resultsToSave.push({
          studentId,
          studentName: student.name,
          rollNo: student.rollNo?.toString(),
          classId: user.classId,
          section: user.classId.split('-')[1] || 'A',
          examId: selectedExamId,
          examName: selectedExamName,
          subjects: subjectsRecord,
          totalMarks: total,
          maxTotalMarks: maxTotal,
          percentage: maxTotal > 0 ? Math.round((total / maxTotal) * 100 * 10) / 10 : 0,
          overallGrade: grade,
          teacherName: user.name,
          teacherRemarks: '',
          isPublished: false,
          createdBy: user.id,
          academicYear: sessionYear,
          schoolId: user.schoolId,
          showGraceFlag: false,
        });
      }

      await examService.saveResultsBatch(user.schoolId, resultsToSave);
      toast.success("Marks saved as draft!");
      setMarks({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to save marks");
    } finally {
      setIsSaving(false);
    }
  };

  // P1 fix: useMemo to memoize filtered draft count
  const draftCount = React.useMemo(() => {
    if (!selectedExamId || !user.classId) return 0;
    return allResults.filter(r =>
      r.examId === selectedExamId && r.classId === user.classId && !r.isPublished
    ).length;
  }, [allResults, selectedExamId, user.classId]);

  const doPublishAll = async () => {
    if (!selectedExamId) return toast.error("Select an exam first");
    if (!user.classId) return toast.error("You are not assigned to a class.");
    if (draftCount === 0) return toast.error("No draft results to publish");
    setConfirmPublish(false);
    setIsPublishing(true);
    try {
      await examService.publishAllResults(user.schoolId, selectedExamId, user.classId, user.id);
      toast.success(`${draftCount} result(s) published!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish results");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishAll = () => {
    if (!selectedExamId) return toast.error("Select an exam first");
    if (!user.classId) return toast.error("You are not assigned to a class.");
    if (draftCount === 0) return toast.error("No draft results to publish");
    setConfirmPublish(true);
  };

  // P1 fix: per-subject max marks config (fallback 100)
  const getSubjectMaxMarks = (subjectName: string): { internal: number; external: number; total: number } => {
    const sub = subjects.find(s => s.name === subjectName) as any;
    const total = (sub?.maxMarks as number) || (sub?.maxTotalMarks as number) || 100;
    // Default 20% internals / 80% externals split
    const internal = Math.round(total * 0.2);
    const external = total - internal;
    return { internal, external, total };
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

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // P1 fix: per-subject max marks (computed once per render)
  const { internal: maxInternal, external: maxExternal, total: maxTotal } = getSubjectMaxMarks(selectedSubject);

  if (isLoading) return <div className="p-10 md:p-20 text-center animate-pulse font-black text-slate-400">Loading gradebook...</div>;

  return (
    <div className="space-y-6 pb-28 md:pb-6 animate-fade-in-up">
      
    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 flex shadow-sm w-full sm:w-auto">
        <button 
          onClick={() => setActiveTab('ENTRY')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ENTRY' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <FileText size={16} /> Marks Entry
        </button>
        <button 
          onClick={() => setActiveTab('REPORT')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'REPORT' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <TrendingUp size={16} /> Report
        </button>
      </div>

      {activeTab === 'ENTRY' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col gap-3 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex flex-wrap gap-3">
                <select 
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    const exam = exams.find(ex => ex.id === e.target.value);
                    if (exam) setSelectedExamName(exam.name);
                  }}
                  className="flex-1 min-w-[140px] px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                >
                  <option value="">Select Exam...</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="flex-1 min-w-[120px] px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                >
                  {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePublishAll}
                  disabled={isPublishing || draftCount === 0}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />} Publish All
                </button>
                <button 
                  onClick={handleSaveMarks}
                  disabled={isSaving || Object.keys(marks).length === 0}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} Save Marks
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Internals ({maxInternal})</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Externals ({maxExternal})</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total ({maxTotal})</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {students.map((student, idx) => {
                    const internal = Number(marks[student.id]?.internals || 0);
                    const external = Number(marks[student.id]?.externals || 0);
                    const total = (isNaN(internal) ? 0 : internal) + (isNaN(external) ? 0 : external);
                    const grade = calculateGrade(total, maxTotal).grade;
                    const existingResult = allResults.find(r => r.studentId === student.id && r.examId === selectedExamId);
                    const isPublished = existingResult?.isPublished ?? false;
                    const displayRollNo = student.rollNo || (student.uniqueId ? student.uniqueId.replace(/^STU0*/i, '') : `${idx + 1}`);
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">#{displayRollNo}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {student.name}
                            {existingResult && (
                              isPublished ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 size={8} /> Published
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Clock size={8} /> Draft
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max={maxInternal}
                            value={marks[student.id]?.internals || ''}
                            onChange={(e) => handleMarkChange(student.id, 'internals', e.target.value)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold"
                            placeholder={`0-${maxInternal}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max={maxExternal}
                            value={marks[student.id]?.externals || ''}
                            onChange={(e) => handleMarkChange(student.id, 'externals', e.target.value)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold"
                            placeholder={`0-${maxExternal}`}
                          />
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">{total}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${total >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {existingResult ? (
                            <button 
                              onClick={() => handleTogglePublish(student.id, isPublished)}
                              className={`p-2 rounded-lg transition-all ${
                                isPublished 
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                              title={isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {isPublished ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {activeTab === 'REPORT' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4 mb-6">
            <select 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{selectedStudent.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Roll No: {selectedStudent.rollNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {resultsLoading ? (
                    <div className="col-span-3 p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching results...</div>
                  ) : selectedResults.length === 0 ? (
                    <div className="col-span-3 p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No results found for this student</div>
                  ) : (
                    selectedResults.map((res: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border ${
                        res.isPublished 
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{res.examName || res.examId}</p>
                          {res.isPublished ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 size={8} /> Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Clock size={8} /> Draft
                            </span>
                          )}
                        </div>
                        <p className={`text-2xl font-black ${res.percentage >= 40 ? 'text-emerald-600' : 'text-rose-600'}`}>{res.percentage.toFixed(1)}%</p>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getGradeColorBg(res.overallGrade)}`}>
                          {res.overallGrade}
                        </span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{res.subjects?.length || 0} subjects</p>
                        {res.isPublished && res.publishedAt && (
                          <p className="text-[8px] text-slate-400 mt-1">Published: {res.publishedAt.toDate?.().toLocaleDateString() || 'N/A'}</p>
                        )}
                      </div>
                    ))
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Publish Confirm Modal */}
      {confirmPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setConfirmPublish(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                <Send size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Publish {draftCount} result(s)?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Publishing makes results visible to <strong>{selectedExamName}</strong> students and parents immediately. This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => setConfirmPublish(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all">
                Cancel
              </button>
              <button
                onClick={doPublishAll}
                disabled={isPublishing}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGrades;
