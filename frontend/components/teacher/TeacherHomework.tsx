import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  X,
  ChevronRight,
  Star,
  MessageSquare,
  Users,
  GraduationCap,
  ArrowLeft,
  Filter,
  Save,
  Paperclip,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { User, Homework, HomeworkSubmission, HomeworkStatus, UserRole, ClassData } from '@/types';
import {
  onHomeworkByTeacher,
  onSubmissions,
  gradeSubmission,
  deleteHomework,
  updateHomework,
  uploadAttachment,
  deleteAttachment,
} from '@/services/homework';
import { MOCK_HOMEWORK, MOCK_USERS } from '@/constants';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, getDocs, Unsubscribe, writeBatch } from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

type TabType = 'ACTIVE' | 'GRADED' | 'OVERDUE' | 'DRAFTS';
type SubFilter = 'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED' | 'GRADED' | 'LATE';

interface Props {
  user: User;
  onBack?: () => void;
  onCreate?: () => void;
  onEdit?: (hw: Homework) => void;
}

const TeacherHomework: React.FC<Props> = ({ user, onBack, onCreate, onEdit }) => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, HomeworkSubmission[]>>({});
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradingHomework, setGradingHomework] = useState<Homework | null>(null);
  const [subFilter, setSubFilter] = useState<SubFilter>('ALL');
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [gradingClassStudents, setGradingClassStudents] = useState<{ id: string; name: string; rollNo?: string }[]>([]);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const unsubSubsRef = useRef<Record<string, Unsubscribe>>({});
  const unsubClassesRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (IS_MOCK_MODE || !user?.schoolId || !user?.id) {
      setHomework(MOCK_HOMEWORK);
      setClasses([
        { id: '10A', name: '10A', section: 'A', studentCount: 32 },
        { id: '10B', name: '10B', section: 'B', studentCount: 30 },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = onHomeworkByTeacher(user.schoolId, user.id, (data) => {
      setHomework(data.length > 0 ? data : MOCK_HOMEWORK);
      setLoading(false);
    });

    unsubRef.current = unsub;

    return () => {
      unsub();
    };
  }, [user?.schoolId, user?.id]);

  useEffect(() => {
    if (!user?.schoolId || IS_MOCK_MODE) return;

    const classesRef = collection(db, 'schools', user.schoolId, 'classes');
    const unsub = onSnapshot(classesRef, (snap) => {
      const cls = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ClassData));
      setClasses(cls);
    });

    unsubClassesRef.current = unsub;

    return () => {
      unsub();
    };
  }, [user?.schoolId]);

  useEffect(() => {
    if (!user?.schoolId || IS_MOCK_MODE) return;

    const teacherClassIds = (user.assignedClasses && user.assignedClasses.length > 0)
      ? user.assignedClasses
      : user.classId
        ? [user.classId]
        : classes.map(c => c.id);

    if (teacherClassIds.length === 0) return;

    const relevantClasses = classes.filter(c => teacherClassIds.includes(c.id));
    const unsubscribes: Unsubscribe[] = [];

    // Reset stale counts from a previous class list before re-populating
    setClassStudentCounts({});

    relevantClasses.forEach((cls) => {
      const usersRef = collection(db, 'schools', user.schoolId, 'users');
      const q = query(usersRef, where('classId', '==', cls.id), where('role', '==', UserRole.STUDENT));
      const unsub = onSnapshot(q, (snap) => {
        setClassStudentCounts((prev) => ({ ...prev, [cls.id]: snap.docs.length }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [user?.schoolId, user?.classId, user?.assignedClasses, classes]);

  useEffect(() => {
    Object.entries(unsubSubsRef.current).forEach(([, unsub]) => unsub());
    unsubSubsRef.current = {};

    if (!gradingHomework || !user?.schoolId) return;

    const unsub = onSubmissions(user.schoolId, gradingHomework.id, (subs) => {
      setSubmissionsMap((prev) => ({ ...prev, [gradingHomework.id]: subs }));
    });

    unsubSubsRef.current[gradingHomework.id] = unsub;

    return () => {
      unsub();
    };
  }, [gradingHomework?.id, user?.schoolId]);

  const getDueDateRelative = useCallback((dueDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  }, []);

  const getSubmissionCount = useCallback(
    (hw: Homework) => {
      const subs = submissionsMap[hw.id] || [];
      const submitted = subs.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'GRADED' || s.status === 'LATE_SUBMITTED'
      ).length;
      const total = classStudentCounts[hw.classId] || 0;
      return { submitted, total };
    },
    [submissionsMap, classStudentCounts]
  );

  const filteredHomework = React.useMemo(() => {
    let filtered = homework;

    if (selectedClass !== 'ALL') {
      filtered = filtered.filter((hw) => hw.classId === selectedClass);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'ACTIVE':
        return filtered.filter(
          (hw) => hw.status === 'ACTIVE' && new Date(hw.dueDate) >= now
        );
      case 'GRADED':
        return filtered.filter((hw) => hw.status === 'COMPLETED');
      case 'OVERDUE':
        return filtered.filter(
          (hw) => hw.status === 'ACTIVE' && new Date(hw.dueDate) < now
        );
      case 'DRAFTS':
        return filtered.filter((hw) => hw.status === 'DRAFT');
      default:
        return filtered;
    }
  }, [homework, selectedClass, activeTab]);

  const handleDelete = async (hwId: string) => {
    if (!user?.schoolId) return;
    if (IS_MOCK_MODE) {
      setHomework(h => h.filter(x => x.id !== hwId));
      setConfirmDeleteId(null);
      toast.success('Homework deleted');
      return;
    }
    try {
      const subsRef = collection(db, 'schools', user.schoolId, 'homework', hwId, 'submissions');
      const subsSnap = await getDocs(subsRef);

      // Batched write: chunk into groups of 500 (Firestore writeBatch limit)
      const CHUNK = 500;
      for (let i = 0; i < subsSnap.docs.length; i += CHUNK) {
        const batch = writeBatch(db);
        subsSnap.docs.slice(i, i + CHUNK).forEach((d: any) => batch.delete(d.ref));
        await batch.commit();
      }

      const attachmentsToCleanup = (homework.find(h => h.id === hwId)?.attachments || []);
      let attachmentFailures = 0;
      await Promise.all(attachmentsToCleanup.map(async (att) => {
        if (!att.url) return;
        try {
          await deleteAttachment(att.url);
        } catch (attErr) {
          attachmentFailures += 1;
          console.warn('Attachment cleanup failed (orphan in Storage):', att.url, attErr);
        }
      }));

      await deleteHomework(user.schoolId, hwId);
      if (attachmentFailures > 0) {
        toast(`Homework deleted; ${attachmentFailures} attachment(s) left as orphan(s) in Storage`, { icon: '⚠️' });
      } else {
        toast.success('Homework and all submissions deleted');
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete homework');
    }
  };

  const handleToggleStatus = async (hw: Homework) => {
    if (!user?.schoolId) return;
    const newStatus: HomeworkStatus = hw.status === 'DRAFT' ? 'ACTIVE' : 'DRAFT';
    try {
      await updateHomework(user.schoolId, hw.id, { status: newStatus });
      toast.success(`Homework ${newStatus === 'ACTIVE' ? 'published' : 'saved as draft'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openGradeModal = async (hw: Homework) => {
    setGradingHomework(hw);
    setGradeModalOpen(true);
    setSubFilter('ALL');
    setGradingClassStudents([]);

    if (IS_MOCK_MODE) {
      setGradingClassStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.classId === hw.classId).map(u => ({ id: u.id, name: u.name, rollNo: String(u.rollNo ?? '') })));
      return;
    }

    try {
      const usersRef = collection(db, 'schools', user.schoolId, 'users');
      const q = query(usersRef, where('classId', '==', hw.classId), where('role', '==', UserRole.STUDENT));
      const snap = await getDocs(q);
      const list = snap.docs.map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unknown',
          rollNo: data.rollNo?.toString() || '',
        };
      });
      list.sort((a: any, b: any) => (parseInt(a.rollNo) || 0) - (parseInt(b.rollNo) || 0));
      setGradingClassStudents(list);
    } catch (err) {
      console.error('Failed to load class students for grading:', err);
    }
  };

  const closeGradeModal = () => {
    const id = gradingHomework?.id || '';
    setGradeModalOpen(false);
    setGradingHomework(null);
    if (id && unsubSubsRef.current[id]) {
      unsubSubsRef.current[id]();
      delete unsubSubsRef.current[id];
    }
  };

  const handleSaveGrade = async (submission: HomeworkSubmission, grade: number, feedback: string) => {
    if (!user?.schoolId || !gradingHomework) return;
    setSavingGrade(submission.id);
    try {
      await gradeSubmission(user.schoolId, gradingHomework.id, submission.id, {
        grade,
        maxGrade: gradingHomework.maxGrade || 100,
        feedback,
        gradedBy: user.id,
      });
      toast.success('Grade saved');
    } catch {
      toast.error('Failed to save grade');
    } finally {
      setSavingGrade(null);
    }
  };

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const statusBadgeColor = (status: HomeworkStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'COMPLETED':
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      case 'DRAFT':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'ARCHIVED':
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ACTIVE', label: 'Active' },
    { key: 'GRADED', label: 'Graded' },
    { key: 'OVERDUE', label: 'Overdue' },
    { key: 'DRAFTS', label: 'Drafts' },
  ];

  const emptyMessages: Record<TabType, string> = {
    ACTIVE: 'No active homework. Create your first!',
    GRADED: 'No graded homework yet',
    OVERDUE: 'No overdue homework',
    DRAFTS: 'No drafts saved',
  };

  const SkeletonCard = () => (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-1/3 bg-zinc-800 rounded-lg mt-2 animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-zinc-800 rounded-full animate-pulse" />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <div className="h-4 w-24 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-4 w-28 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <div className="h-4 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-10 w-20 bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  const SubmissionRow: React.FC<{ submission: HomeworkSubmission; hw: Homework }> = ({ submission, hw }) => {
    const [grade, setGrade] = useState(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');

    const maxGrade = hw.maxGrade || 100;
    const gradeNum = parseFloat(grade);
    const percentage = !isNaN(gradeNum) && gradeNum >= 0 ? Math.round((gradeNum / maxGrade) * 100) : null;

    return (
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <GraduationCap size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{submission.studentName}</p>
              {submission.submittedAt && (
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {submission.isLate && (
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle size={12} />
                Late
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-lg ${
                submission.status === 'GRADED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : submission.status === 'LATE_SUBMITTED'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : submission.status === 'SUBMITTED'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
              }`}
            >
              {submission.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Grade (0-{maxGrade})</label>
            <input
              type="number"
              min={0}
              max={maxGrade}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none transition-opacity"
              placeholder="0"
            />
            {percentage !== null && (
              <p className="text-xs text-zinc-500 mt-1">{percentage}%</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              className="w-full h-11 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none resize-none transition-opacity"
              placeholder="Optional feedback..."
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (grade === '' || isNaN(parseFloat(grade))) {
              toast.error('Enter a valid grade');
              return;
            }
            const g = parseFloat(grade);
            if (g < 0 || g > maxGrade) {
              toast.error(`Grade must be between 0 and ${maxGrade}`);
              return;
            }
            handleSaveGrade(submission, g, feedback);
          }}
          disabled={savingGrade === submission.id}
          className="w-full sm:w-auto h-11 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity"
        >
          {savingGrade === submission.id ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Grade
        </button>
      </div>
    );
  };

  const GradeModal = () => {
    if (!gradeModalOpen || !gradingHomework) return null;

    const subs = submissionsMap[gradingHomework.id] || [];
    // Build a Map<studentId, Submission> for O(1) lookups when filtering /
    // grading. Avoids the O(n*m) pattern of `subs.find(s => s.studentId === id)`
    // in any per-row render path.
    const submissionByStudentId = new Map<string, typeof subs[number]>();
    subs.forEach((s) => { if (s.studentId) submissionByStudentId.set(s.studentId, s); });
    const submittedStudentIds = new Set(submissionByStudentId.keys());

    const allRows = [
      ...subs.map(s => ({ kind: 'submission' as const, sub: s, student: { id: s.studentId, name: (s as any).studentName || 'Unknown', rollNo: '' } })),
      ...gradingClassStudents
        .filter(st => !submittedStudentIds.has(st.id))
        .map(st => ({ kind: 'missing' as const, sub: null, student: st })),
    ];

    const filteredSubs = allRows.filter((row) => {
      if (row.kind === 'missing') {
        return subFilter === 'ALL' || subFilter === 'NOT_SUBMITTED';
      }
      const s = row.sub!;
      switch (subFilter) {
        case 'SUBMITTED':
          return s.status === 'SUBMITTED';
        case 'NOT_SUBMITTED':
          return false;
        case 'GRADED':
          return s.status === 'GRADED';
        case 'LATE':
          return s.status === 'LATE_SUBMITTED' || s.isLate;
        default:
          return true;
      }
    });

    const subFilters: { key: SubFilter; label: string }[] = [
      { key: 'ALL', label: 'All' },
      { key: 'SUBMITTED', label: 'Submitted' },
      { key: 'NOT_SUBMITTED', label: 'Not Submitted' },
      { key: 'GRADED', label: 'Graded' },
      { key: 'LATE', label: 'Late' },
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
        onClick={closeGradeModal}
      >
        <div
          className="w-full sm:max-w-2xl max-h-[90vh] bg-zinc-950 sm:rounded-2xl rounded-t-2xl border border-zinc-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">{gradingHomework.title}</h2>
              <p className="text-xs text-zinc-500">{getClassName(gradingHomework.classId)}</p>
            </div>
            <button
              onClick={closeGradeModal}
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-zinc-800 text-zinc-400 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 pt-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {subFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSubFilter(f.key)}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity ${
                    subFilter === f.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSubs.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={40} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">No submissions match this filter</p>
              </div>
            ) : (
              filteredSubs.map((row) => (
                row.kind === 'submission' ? (
                  <SubmissionRow key={`sub-${row.sub!.id}`} submission={row.sub!} hw={gradingHomework} />
                ) : (
                  <div key={`missing-${row.student.id}`} className="bg-zinc-900/30 border border-zinc-800/30 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{row.student.name}</p>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Has Not Submitted</p>
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase">Roll {row.student.rollNo || '—'}</div>
                  </div>
                )
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-opacity"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Homework</h1>
            <p className="text-xs text-zinc-500">Manage assignments & grades</p>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="h-14 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 transition-opacity text-sm"
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {classes.length > 0 && (
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full h-11 px-4 pr-10 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 appearance-none focus:border-indigo-500 focus:outline-none transition-opacity"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronRight
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none"
          />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const count =
            activeTab === tab.key
              ? filteredHomework.length
              : homework.filter((hw) => {
                  if (selectedClass !== 'ALL' && hw.classId !== selectedClass) return false;
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  switch (tab.key) {
                    case 'ACTIVE':
                      return hw.status === 'ACTIVE' && new Date(hw.dueDate) >= now;
                    case 'GRADED':
                      return hw.status === 'COMPLETED';
                    case 'OVERDUE':
                      return hw.status === 'ACTIVE' && new Date(hw.dueDate) < now;
                    case 'DRAFTS':
                      return hw.status === 'DRAFT';
                    default:
                      return false;
                  }
                }).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 px-4 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-opacity ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.key ? 'bg-indigo-500/30' : 'bg-zinc-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-red-400 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredHomework.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900 rounded-2xl border border-zinc-800 border-dashed">
          <BookOpen size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-sm font-semibold text-zinc-400">{emptyMessages[activeTab]}</p>
          {activeTab === 'ACTIVE' && onCreate && (
            <button
              onClick={onCreate}
              className="mt-4 h-11 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 mx-auto transition-opacity"
            >
              <Plus size={16} />
              Create Homework
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((hw) => {
            const dueInfo = getDueDateRelative(hw.dueDate);
            const { submitted, total } = getSubmissionCount(hw);
            const progressPct = total > 0 ? Math.round((submitted / total) * 100) : 0;

            return (
              <div
                key={hw.id}
                className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 hover:border-zinc-700 transition-opacity"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">{hw.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-lg border border-indigo-500/20">
                        {hw.subject}
                      </span>
                      <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 text-xs font-medium rounded-lg border border-zinc-500/20">
                        {getClassName(hw.classId)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${statusBadgeColor(hw.status)}`}>
                        {hw.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                  <span className={`flex items-center gap-1 ${dueInfo.isOverdue ? 'text-amber-400' : ''}`}>
                    <Calendar size={14} />
                    {dueInfo.text}
                  </span>
                  {hw.attachments && hw.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip size={14} />
                      {hw.attachments.length}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-500">{submitted}/{total} submitted</span>
                    <span className="text-zinc-400">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-opacity"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => openGradeModal(hw)}
                    className="h-11 flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity"
                  >
                    <Edit size={16} />
                    Grade
                  </button>
                  {hw.status === 'DRAFT' && (
                    <button
                      onClick={() => handleToggleStatus(hw)}
                      className="h-11 px-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity"
                    >
                      <CheckCircle2 size={16} />
                      Publish
                    </button>
                  )}
                  {hw.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleToggleStatus(hw)}
                      className="h-11 px-4 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity"
                    >
                      <X size={16} />
                      Unpublish
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(hw)}
                      className="h-11 w-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl flex items-center justify-center transition-opacity"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {confirmDeleteId === hw.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(hw.id)}
                        className="h-11 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold rounded-xl transition-opacity"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-11 w-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl flex items-center justify-center transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(hw.id)}
                      className="h-11 w-11 bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 rounded-xl flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GradeModal />
    </div>
  );
};

export default TeacherHomework;
