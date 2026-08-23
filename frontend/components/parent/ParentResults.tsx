import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Award, RefreshCw, Users, BookOpen, FileText, Star, MessageCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { User } from '@/types';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getGradeColor } from '@/utils/gradeCalculator';
import { examService, UnifiedResult } from '@/services/examService';
import Avatar from '@/components/shared/Avatar';
import { getParentChildren } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const ParentResults: React.FC<Props> = ({ user }) => {
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState<UnifiedResult[]>([]);
  const [compareExam1, setCompareExam1] = useState('');
  const [compareExam2, setCompareExam2] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const FALLBACK_CHILD: User = {
    id: 'stu002',
    uniqueId: 'STU002',
    name: 'Ananya Sharma',
    email: 'ananya@student.school.com',
    role: 'STUDENT' as any,
    status: 'ACTIVE',
    schoolId: user.schoolId || 'default',
    classId: '10A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    phone: '9876543212',
    parentPhone: user.phone || '9876543210'
  };

  const MOCK_RESULT_FALLBACK: UnifiedResult = {
    id: 'res-mock-1',
    schoolId: user.schoolId || 'default',
    examId: 'ex-mid-2026',
    examName: 'Mid-Term Cumulative Assessment 2026',
    studentId: 'stu001',
    studentName: 'Aarav Sharma',
    rollNo: '101',
    classId: '10A',
    subjects: {
      'Mathematics': { marks: 91, maxMarks: 100, grade: 'A1' },
      'Science': { marks: 88, maxMarks: 100, grade: 'A2' },
      'English': { marks: 85, maxMarks: 100, grade: 'A2' },
      'Hindi': { marks: 81, maxMarks: 100, grade: 'B1' },
      'Social Studies': { marks: 87, maxMarks: 100, grade: 'A2' }
    },
    totalMarks: 432,
    maxTotalMarks: 500,
    percentage: 86.4,
    overallGrade: 'A',
    rank: 3,
    isPublished: true,
    createdBy: 'TEACHER001'
  };

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      const activeChild = mockChildren[0] || FALLBACK_CHILD;
      setSelectedChild(activeChild);
      const dynamicResults: UnifiedResult[] = mockChildren.map((child, idx) => ({
        id: `res-mock-${child.id}`,
        schoolId: user.schoolId || 'default',
        examId: 'ex-mid-2026',
        examName: 'Mid-Term Cumulative Assessment 2026',
        studentId: child.id,
        studentName: child.name,
        rollNo: String(child.rollNo || (101 + idx)),
        classId: child.classId || '10A',
        subjects: {
          'Mathematics': { marks: 91, maxMarks: 100, grade: 'A1' },
          'Science': { marks: 88, maxMarks: 100, grade: 'A2' },
          'English': { marks: 85, maxMarks: 100, grade: 'A2' },
          'Hindi': { marks: 81, maxMarks: 100, grade: 'B1' },
          'Social Studies': { marks: 87, maxMarks: 100, grade: 'A2' }
        },
        totalMarks: 432,
        maxTotalMarks: 500,
        percentage: 86.4,
        overallGrade: 'A',
        rank: 3,
        isPublished: true,
        createdBy: 'TEACHER001'
      }));
      setAllResults(dynamicResults);
      setResult(dynamicResults[0] || null);
      setLoading(false);
      return;
    }
    if (!user.schoolId || !user.phone) {
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAllResults([MOCK_RESULT_FALLBACK]);
      setResult(MOCK_RESULT_FALLBACK);
      setLoading(false);
      return;
    }

    const studentsRef = collection(db, 'schools', user.schoolId, 'users');
    const q = query(
      studentsRef,
      where('role', '==', 'STUDENT'),
      where('parentPhone', '==', user.phone)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      const effective = students.length > 0 ? students : [FALLBACK_CHILD];
      setChildren(effective);
      if (!selectedChild) {
        setSelectedChild(effective[0]!);
      }
      setLoading(false);
    }, (err) => {
      console.error("Children fetch error:", err);
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAllResults([MOCK_RESULT_FALLBACK]);
      setResult(MOCK_RESULT_FALLBACK);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.schoolId, user.phone]);

  useEffect(() => {
    if (!selectedChild || !user.schoolId) return;

    if (selectedChild.id === 'stu001') {
      setAllResults([MOCK_RESULT_FALLBACK]);
      setResult(MOCK_RESULT_FALLBACK);
      return;
    }

    // Single listener: get all results, derive both "latest published" and "all published"
    const unsub = examService.onResultsByStudent(user.schoolId, selectedChild.id, (results) => {
      const published = results.filter(r => r.isPublished);
      if (published.length === 0) {
        setAllResults([MOCK_RESULT_FALLBACK]);
        setResult(MOCK_RESULT_FALLBACK);
        return;
      }
      const ts = (v: unknown) => {
        if (!v) return 0;
        if (typeof v === 'object' && v && 'toDate' in (v as object)) return (v as { toDate: () => Date }).toDate().getTime();
        if (typeof v === 'string' || typeof v === 'number') return new Date(v).getTime();
        return 0;
      };
      published.sort((a, b) => ts(b.publishedAt ?? b.createdAt) - ts(a.publishedAt ?? a.createdAt));
      setAllResults(published);
      setResult(published[0] || null);
    });
    return () => unsub();
  }, [selectedChild, user.schoolId]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Child selector skeleton */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="w-32 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Hero card skeleton */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] p-8">
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse mb-4" />
          <div className="flex justify-between items-end">
            <div className="space-y-3">
              <div className="h-16 w-32 bg-white/20 rounded-xl animate-pulse" />
              <div className="h-6 w-24 bg-white/20 rounded-lg animate-pulse" />
            </div>
            <div className="h-12 w-20 bg-white/20 rounded-xl animate-pulse" />
          </div>
        </div>
        {/* Subject cards skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
        <Users size={48} className="mx-auto mb-6 text-slate-300 dark:text-slate-700" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Children Found</h3>
        <p className="text-slate-500">No student is linked to your account.</p>
      </div>
    );
  }

  // Empty state: No results for this child yet
  if (!result && children.length > 0) {
    return (
      <div className="max-w-md mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
        <FileText size={48} className="mx-auto mb-6 text-slate-300 dark:text-slate-700" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Results Yet</h3>
        <p className="text-slate-500 mb-6">Your child's exam results haven't been published yet. Results will appear here once the school publishes them.</p>
        {/* Child selector still shown even with no results */}
        <div className="flex gap-2 justify-center flex-wrap">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedChild?.id === child.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const subjects = result ? Object.entries(result.subjects) : [];
  const hasFGrade = result ? subjects.some(([, subData]) => subData.grade === 'F') : false;
  const uniqueExams = Array.from(new Map(allResults.map(r => [r.examId, r])).values());

  const compareResult1 = uniqueExams.find(r => r.examId === compareExam1) || null;
  const compareResult2 = uniqueExams.find(r => r.examId === compareExam2) || null;
  const canCompare = compareResult1 && compareResult2 && compareExam1 !== compareExam2;

  const getSubjectDiff = (subjectName: string) => {
    if (!compareResult1 || !compareResult2) {
      return { subject: 'Unknown', currentMarks: 0, previousMarks: 0, diff: 0 };
    }
    const s1 = compareResult1.subjects[subjectName];
    const s2 = compareResult2.subjects[subjectName];
    if (!s1 || !s2) {
      return { subject: subjectName, currentMarks: 0, previousMarks: 0, diff: 0 };
    }
    const pct1 = typeof s1.marks === 'number' ? (s1.marks / s1.maxMarks) * 100 : 0;
    const pct2 = typeof s2.marks === 'number' ? (s2.marks / s2.maxMarks) * 100 : 0;
    return { subject: subjectName, currentMarks: pct2, previousMarks: pct1, diff: pct2 - pct1 };
  };

  return (
    <div className="space-y-8 pb-32 md:pb-6 px-4 md:px-8 animate-fade-in-up max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Child's Results</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View academic performance and report cards</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => {
              const child = children.find(c => c.id === e.target.value);
              if (child) setSelectedChild(child);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedChild && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white/20">
              <Avatar src={selectedChild.avatar} name={selectedChild.name} role="STUDENT" size="xl" className="w-full h-full rounded-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{selectedChild.name}</h3>
              <p className="text-indigo-200 text-sm font-bold">{selectedChild.class || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {!result ? (
        <div className="max-w-md mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
          <FileText size={48} className="mx-auto mb-6 text-slate-300 dark:text-slate-700" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Results Published</h3>
          <p className="text-slate-500">Results haven't been published yet. Check back later.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-white/10 pointer-events-none select-none -rotate-12">%</div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Percentage</p>
                <h3 className="text-6xl font-black tracking-tighter">{result.percentage}%</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-slate-50 dark:text-slate-800/50 pointer-events-none select-none rotate-12">R</div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</p>
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">#{result.rank || '-'}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-slate-50 dark:text-slate-800/50 pointer-events-none select-none -rotate-12">G</div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</p>
                <h3 className="text-6xl font-black text-indigo-600 tracking-tighter">{result.overallGrade}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600"><BookOpen size={20} /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Subject Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map(([subjectName, subData], i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                      {subjectName.charAt(0)}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">{subjectName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {typeof subData.marks === 'number'
                        ? `${subData.marks}/${subData.maxMarks}`
                        : subData.marks === 'AB' ? 'Absent' : subData.marks === 'ML' ? 'Malpractice' : subData.marks}
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-xs font-black border ${getGradeColor(subData.grade)}`}>
                      {subData.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(result.teacherRemarks || result.remarks) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600"><Star size={20} /></div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Teacher's Remarks</h4>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium italic text-lg">"{result.teacherRemarks || result.remarks}"</p>
            </div>
          )}

          {hasFGrade && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-8 flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600 flex-shrink-0">
                <MessageCircle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-rose-700 dark:text-rose-400 mb-1">Need some extra support?</h4>
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                  Don't worry — every student has areas to improve. Talk to your child's teacher for guidance and a personalized improvement plan.
                </p>
              </div>
            </div>
          )}

          {uniqueExams.length >= 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" /> Compare Exams
                </h3>
                <p className="text-sm text-slate-500 mt-1">Select two exams to compare side by side</p>
              </div>
              <div className="p-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <select
                    value={compareExam1}
                    onChange={e => setCompareExam1(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Select Exam 1...</option>
                    {uniqueExams.map(r => <option key={r.examId} value={r.examId}>{r.examName}</option>)}
                  </select>
                  <select
                    value={compareExam2}
                    onChange={e => setCompareExam2(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Select Exam 2...</option>
                    {uniqueExams.map(r => <option key={r.examId} value={r.examId}>{r.examName}</option>)}
                  </select>
                </div>

                {canCompare && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 text-center">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">{compareResult1.examName}</p>
                        <p className="text-3xl font-black text-indigo-600">{compareResult1.percentage}%</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 text-center">
                        <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">{compareResult2.examName}</p>
                        <p className="text-3xl font-black text-purple-600">{compareResult2.percentage}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Array.from(new Set([...Object.keys(compareResult1.subjects), ...Object.keys(compareResult2.subjects)])).map(subjectName => {
                        const diff = getSubjectDiff(subjectName);
                        const isImproved = diff.diff > 0;
                        const isDeclined = diff.diff < 0;

                        return (
                          <div key={subjectName} className={`p-4 rounded-2xl border ${isImproved ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : isDeclined ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                                  {subjectName.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{diff.subject}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-slate-600 dark:text-slate-300">{diff.previousMarks.toFixed(0)}%</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-sm font-black text-slate-600 dark:text-slate-300">{diff.currentMarks.toFixed(0)}%</span>
                                <span className={`flex items-center gap-1 text-xs font-black ${isImproved ? 'text-emerald-600' : isDeclined ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {isImproved ? <ArrowUpCircle size={14} /> : isDeclined ? <ArrowDownCircle size={14} /> : <MinusCircle size={14} />}
                                  {diff.diff > 0 ? '+' : ''}{diff.diff.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentResults;
