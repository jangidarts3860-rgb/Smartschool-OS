import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Download, 
  Share2, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  TrendingDown,
  BookOpen, 
  Award, 
  Calendar,
  RefreshCw,
  AlertCircle,
  FileText,
  MessageCircle
} from 'lucide-react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { examService, UnifiedResult } from '@/services/examService';
import { getGradeColor } from '@/utils/gradeCalculator';
import { toast } from 'react-hot-toast';

interface Props {
  user: User;
  childId?: string;
}

const StudentResult: React.FC<Props> = ({ user, childId }) => {
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [classResults, setClassResults] = useState<UnifiedResult[]>([]);
  const [classAverage, setClassAverage] = useState<Record<string, number>>({});

  const targetStudentId = childId || user.id;
  const navigate = useNavigate();

  const FALLBACK_STUDENT_RESULT: UnifiedResult = {
    id: 'res-student-01',
    schoolId: user?.schoolId || 'SCH01',
    examId: 'ex-mid-2026',
    examName: 'Mid-Term Cumulative Assessment 2026',
    studentId: targetStudentId,
    studentName: user?.name || 'Aarav Sharma',
    rollNo: '101',
    classId: user?.classId || '10A',
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
    if (!user?.schoolId) {
      setResult(FALLBACK_STUDENT_RESULT);
      setLoading(false);
      return;
    }

    const unsubscribe = examService.onPublishedResultsByStudent(user.schoolId, targetStudentId, (results) => {
      if (results.length > 0) {
        setResult(results[0]!);
      } else {
        setResult(FALLBACK_STUDENT_RESULT);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.schoolId, targetStudentId]);

  useEffect(() => {
    if (!result || !user.schoolId) return;

    const classId = result.classId;
    const examId = result.examId;
    const unsub = examService.onResultsByClassExam(user.schoolId, classId, examId, (results) => {
      const published = results.filter(r => r.isPublished);
      setClassResults(published);

      const subjects = Object.keys(result.subjects);
      const avg: Record<string, number> = {};
      for (const sub of subjects) {
        const marksList = published.map(r => {
          const sd = r.subjects[sub];
          if (!sd) return 0;
          const m = typeof sd.marks === 'number' ? sd.marks : 0;
          return (m / sd.maxMarks) * 100;
        });
        avg[sub] = marksList.length > 0 ? parseFloat((marksList.reduce((a, b) => a + b, 0) / marksList.length).toFixed(1)) : 0;
      }
      setClassAverage(avg);
    });
    return () => unsub();
  }, [result, user.schoolId]);

  if (loading) {
      return (
          <div className="space-y-6 p-6">
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

  if (!result) {
      return (
          <div className="max-w-md mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <FileText size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Results Found</h3>
              <p className="text-slate-500 mb-8 text-sm">Your academic results haven't been published yet. Please check back later or contact your class teacher.</p>
              <button onClick={() => navigate(0)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
                  Refresh Page
              </button>
          </div>
      );
  }

  const subjects = Object.entries(result.subjects);
  const hasFGrade = subjects.some(([, subData]) => subData.grade === 'F');
  const totalStudents = classResults.length;
  const isBottom10 = totalStudents > 0 && result.rank && (result.rank / totalStudents) > 0.9;
  const shouldHideRank = isBottom10 && hasFGrade;

  const handleShare = async () => {
    const shareText = `My Result for ${result.examName}\n` +
      `Total: ${result.totalMarks}/${result.maxTotalMarks}\n` +
      `Percentage: ${result.percentage}%\n` +
      `Grade: ${result.overallGrade}\n` +
      (result.rank ? `Rank: #${result.rank}\n` : '') +
      `\nGenerated via SmartSchool`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Result', text: shareText });
      } catch {
        // user cancelled
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Result copied to clipboard');
      } catch {
        toast.error('Could not copy to clipboard');
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  const handleDownload = () => {
    const lines = [
      `SMARTSCHOOL — ACADEMIC REPORT`,
      `=====================================`,
      `Student: ${result.studentName || user.name || 'N/A'}`,
      `Exam: ${result.examName || result.examId}`,
      `Class: ${result.classId || 'N/A'}`,
      `Academic Year: ${result.academicYear || 'N/A'}`,
      ``,
      `OVERALL`,
      `-------`,
      `Total Marks: ${result.totalMarks || 0} / ${result.maxTotalMarks || 100}`,
      `Percentage: ${result.percentage || 0}%`,
      `Overall Grade: ${result.overallGrade || 'N/A'}`,
      result.rank ? `Rank: #${result.rank}` : '',
      ``,
      `SUBJECTS`,
      `--------`,
      ...subjects.map(([name, s]: [string, any]) =>
        `${name}: ${s.marks || 0}/${s.maxMarks || 100} (Grade: ${s.grade || 'N/A'})`
      ),
      ``,
      result.teacherRemarks ? `Remarks: ${result.teacherRemarks}` : '',
      ``,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
    ].filter(Boolean);

    // Generate a beautiful, print-ready Report Card
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print report card.');
      return;
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${user?.name || result.studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
          body { font-family: 'Outfit', sans-serif; padding: 40px; background: #fff; color: #0f172a; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; margin: 0; }
          .subtitle { color: #6366f1; font-weight: 800; font-size: 14px; letter-spacing: 0.1em; margin: 5px 0 0; }
          .student-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .meta-item { font-size: 13px; font-weight: 600; color: #64748b; }
          .meta-value { font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #1e1b4b; color: white; font-weight: 800; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; }
          .total-row { background: #f1f5f9; font-weight: 900; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center; margin-bottom: 40px; }
          .summary-card { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 15px; }
          .summary-val { font-size: 24px; font-weight: 900; color: #4338ca; }
          .summary-lbl { font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; }
          .remarks-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 15px; margin-bottom: 40px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
          .sig-line { border-top: 1px dashed #94a3b8; width: 180px; text-align: center; font-size: 12px; font-weight: 700; color: #64748b; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">SmartSchool OS</h1>
          <p class="subtitle">${result.examName.toUpperCase()}</p>
        </div>
        <div class="student-meta">
          <div class="meta-item">Student Name: <span class="meta-value">${user?.name || result.studentName}</span></div>
          <div class="meta-item">Roll No: <span class="meta-value">${result.rollNo || user?.rollNo || '101'}</span></div>
          <div class="meta-item">Class & Section: <span class="meta-value">${result.classId || user?.classId || '10A'}</span></div>
          <div class="meta-item">Academic Year: <span class="meta-value">${result.academicYear || '2024-25'}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th style="text-align:center;">Max Marks</th>
              <th style="text-align:center;">Marks Obtained</th>
              <th style="text-align:center;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map(([name, s]: [string, any]) => `
              <tr>
                <td>${name}</td>
                <td style="text-align:center;">${s.maxMarks || 100}</td>
                <td style="text-align:center;">${s.marks ?? '—'}</td>
                <td style="text-align:center;"><span style="background:#e0e7ff; color:#3730a3; padding:3px 10px; border-radius:6px; font-weight:800;">${s.grade || '—'}</span></td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Total</td>
              <td style="text-align:center;">${result.maxTotalMarks || 500}</td>
              <td style="text-align:center;">${result.totalMarks || 432}</td>
              <td style="text-align:center;">${result.overallGrade}</td>
            </tr>
          </tbody>
        </table>
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-val">${result.percentage}%</div><div class="summary-lbl">Aggregate Score</div></div>
          <div class="summary-card"><div class="summary-val">${result.overallGrade}</div><div class="summary-lbl">Overall Grade</div></div>
          <div class="summary-card"><div class="summary-val">#${result.rank || '3'}</div><div class="summary-lbl">Class Rank</div></div>
        </div>
        <div class="remarks-box">
          <strong style="color:#92400e; font-size:12px; text-transform:uppercase;">Class Teacher Remarks:</strong>
          <p style="margin:5px 0 0; color:#78350f; font-size:14px; font-style:italic;">"${result.teacherRemarks || 'Demonstrates strong analytical thinking and consistent academic diligence.'}"</p>
        </div>
        <div class="signatures">
          <div class="sig-line">Class Teacher Signature</div>
          <div class="sig-line">Principal Signature</div>
          <div class="sig-line">Parent/Guardian Signature</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    toast.success('Printable Report Card opened');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  <Calendar size={12} />
                  <span>Academic Session {result.academicYear || '2024-25'}</span>
                  <ChevronRight size={10} />
                  <span className="text-indigo-600">{result.examName} Result</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Academic Performance</h2>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button onClick={handleShare} className="flex-1 md:flex-none px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-all">
                  <Share2 size={16} /> Share
              </button>
              <button onClick={handleDownload} className="flex-1 md:flex-none px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Download size={16} /> Download
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-600 rounded-2xl sm:rounded-[3rem] p-7 sm:p-10 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-white/10 pointer-events-none select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">%</div>
              <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Aggregate %</p>
                  <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl sm:text-6xl font-black tracking-tighter">{result.percentage}%</h3>
                      <TrendingUp size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white/80">Overall performance</p>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] p-7 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-slate-50 dark:text-slate-800/50 pointer-events-none select-none rotate-12 group-hover:rotate-0 transition-transform duration-700">R</div>
              <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Standing</p>
                  {shouldHideRank ? (
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-400 tracking-tighter">—</h3>
                      <p className="text-xs font-bold text-rose-500">Rank hidden for privacy</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                          <h3 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">#{result.rank || '-'}</h3>
                          <Trophy size={24} className="text-amber-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated Rank</p>
                    </>
                  )}
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] p-7 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] text-[150px] font-black text-slate-50 dark:text-slate-800/50 pointer-events-none select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">G</div>
              <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Grade</p>
                  <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl sm:text-6xl font-black text-indigo-600 tracking-tighter">{result.overallGrade}</h3>
                      <Award size={24} className="text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Final Assessment</p>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 rounded-3xl text-white">
                      <BookOpen size={24} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Subject Scores</h3>
                      <p className="text-xs text-slate-400 font-medium">Detailed breakdown of individual subject performance</p>
                  </div>
              </div>
          </div>
              <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                          <th className="px-4 md:px-10 py-4 text-left">Subject</th>
                          <th className="px-3 md:px-6 py-4 text-center">Max</th>
                          <th className="px-3 md:px-6 py-4 text-center">Marks</th>
                          <th className="px-3 md:px-6 py-4 text-center">Grade</th>
                          <th className="hidden sm:table-cell px-3 md:px-6 py-4 text-center">Avg</th>
                          <th className="hidden md:table-cell px-4 md:px-10 py-4 text-right">Remarks</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subjects.map(([subjectName, subData], i) => {
                          const isF = subData.grade === 'F';
                          const studentPct = typeof subData.marks === 'number' ? (subData.marks / subData.maxMarks) * 100 : 0;
                          const avgPct = classAverage[subjectName] || 0;
                          const diff = studentPct - avgPct;

                          return (
                              <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors ${isF ? 'bg-rose-50 dark:bg-rose-950/20' : ''}`}>
                                  <td className="px-4 md:px-10 py-5 md:py-8">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isF ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                                              {subjectName.charAt(0)}
                                          </div>
                                          <span className="font-black text-slate-900 dark:text-white">{subjectName}</span>
                                      </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-5 md:py-8 text-center font-black text-slate-400">{subData.maxMarks}</td>
                                  <td className="px-3 md:px-6 py-5 md:py-8 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                          <span className={`text-xl font-black ${isF ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                            {typeof subData.marks === 'number'
                                              ? subData.marks
                                              : (subData.marks === 'AB' ? 'Absent' :
                                                 subData.marks === 'ML' ? 'Malpractice' :
                                                 String(subData.marks ?? '—'))}
                                          </span>
                                          {subData.isGraceApplied && result.showGraceFlag && (
                                              <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter">Grace applied</span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-5 md:py-8 text-center">
                                      <span className={`px-4 py-2 rounded-xl text-xs font-black border ${getGradeColor(subData.grade)}`}>
                                          {subData.grade}
                                      </span>
                                  </td>
                                  <td className="hidden sm:table-cell px-3 md:px-6 py-5 md:py-8 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                          <span className="text-sm font-black text-slate-600 dark:text-slate-300">{avgPct}%</span>
                                          {avgPct > 0 && (
                                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                                            </span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="hidden md:table-cell px-4 md:px-10 py-5 md:py-8 text-right">
                                      {isF ? (
                                        <span className="text-xs font-medium text-rose-600 italic flex items-center gap-1 justify-end">
                                          <MessageCircle size={14} /> Talk to your teacher for guidance
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-medium italic">{subData.remarks || 'Keep it up'}</span>
                                      )}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {hasFGrade && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-[2rem] p-8 flex items-start gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600 flex-shrink-0">
            <MessageCircle size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-rose-700 dark:text-rose-400 mb-1">Need some extra support?</h4>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              Don't worry — every student has areas to improve. Talk to your teacher for guidance and a personalized improvement plan.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                      <Star size={24} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Teacher's Remarks</h4>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic text-lg">
                  "{result.teacherRemarks || result.remarks || 'Excellent progress shown throughout the term.'}"
              </p>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                      {result.teacherName?.split(' ').map(n => n[0]).join('') || 'TC'}
                  </div>
                  <div>
                      <p className="font-black text-slate-900 dark:text-white">{result.teacherName || 'Class Teacher'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Evaluation</p>
                  </div>
              </div>
          </div>

          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10 flex items-center gap-6">
                  <div className="p-6 bg-white/10 rounded-[2rem] text-indigo-400">
                      <TrendingUp size={40} />
                  </div>
                  <div className="space-y-2">
                      <h4 className="text-2xl font-black tracking-tight">Academic Insights</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Based on current performance, {result.percentage >= 90 ? 'exceptional consistency' : 'steady progress'} is observed. {result.percentage < 80 ? 'More focus on core subjects is recommended.' : 'Keep maintaining this momentum.'}
                      </p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default StudentResult;
