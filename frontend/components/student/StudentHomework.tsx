import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  X,
  ChevronRight,
  Star,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User, Homework, HomeworkSubmission, HomeworkAttachment } from '@/types';
import {
  onHomeworkByClass,
  submitHomework,
  getSubmissionByStudent,
  uploadAttachment,
  deleteAttachment,
  onStudentSubmissionsAcross,
} from '@/services/homework';
import { MOCK_HOMEWORK } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mathematics: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  Science: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  English: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  Hindi: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  History: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  Geography: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  Physics: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  Chemistry: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  Biology: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  'Computer Science': { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  'Physical Education': { bg: 'bg-lime-50 dark:bg-lime-950/30', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
  Art: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
};

function getSubjectColors(subject: string) {
  return SUBJECT_COLORS[subject] || { bg: 'bg-zinc-50 dark:bg-zinc-900', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-zinc-700' };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

function getRelativeDueDate(dueDate: string): { text: string; urgency: number; isOverdue: boolean } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, urgency: 0, isOverdue: true };
  if (diffDays === 0) return { text: 'Due today', urgency: 1, isOverdue: false };
  if (diffDays === 1) return { text: 'Due tomorrow', urgency: 2, isOverdue: false };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, urgency: 3, isOverdue: false };
  return { text: `Due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, urgency: 4, isOverdue: false };
}

function getGradeLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'A+', color: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 80) return { label: 'A', color: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 70) return { label: 'B+', color: 'text-indigo-600 dark:text-indigo-400' };
  if (pct >= 60) return { label: 'B', color: 'text-indigo-600 dark:text-indigo-400' };
  if (pct >= 50) return { label: 'C', color: 'text-amber-600 dark:text-amber-400' };
  if (pct >= 40) return { label: 'D', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'F', color: 'text-rose-600 dark:text-rose-400' };
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterTab = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';
type ModalStep = 'details' | 'submit' | 'confirmation';

interface StudentUser {
  id: string;
  name: string;
  role: string;
  schoolId: string;
  classId: string;
}

interface EnrichedHomework extends Homework {
  submission: HomeworkSubmission | null;
  relativeDue: ReturnType<typeof getRelativeDueDate>;
  filterStatus: FilterTab;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="flex justify-end">
        <div className="h-12 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
      <div className="h-7 w-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

// ─── Empty States ────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, { title: string; desc: string }> = {
    all: { title: 'No assignments yet', desc: 'Your teacher has not assigned any homework. Check back later.' },
    pending: { title: 'All caught up', desc: 'You have no pending homework. Great job staying on track.' },
    submitted: { title: 'Nothing submitted yet', desc: 'You have not submitted any homework. Start with your pending assignments.' },
    graded: { title: 'No grades yet', desc: 'Your teacher has not graded any submissions. They will appear here.' },
    overdue: { title: 'No overdue homework', desc: 'You are on top of your deadlines. Keep it up.' },
  };
  const m = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{m.title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">{m.desc}</p>
    </div>
  );
}

function AllDoneState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Great job!</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">All homework is complete. You are all caught up.</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StudentHomework({ user }: { user: User }) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('details');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [gradeViewOpen, setGradeViewOpen] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const unsubHomeworkRef = useRef<(() => void) | null>(null);
  const unsubSubmissionsRef = useRef<Map<string, () => void>>(new Map());

  // ─── Real-time listeners ───────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setHomework(MOCK_HOMEWORK);
      setLoading(false);
      return;
    }
    if (!user?.schoolId || !user?.classId) {
      setHomework(MOCK_HOMEWORK);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const unsubHw = onHomeworkByClass(user.schoolId, user.classId, (hwList) => {
      setHomework(hwList.length > 0 ? hwList : MOCK_HOMEWORK);
      setLoading(false);
    });

    unsubHomeworkRef.current = unsubHw;

    return () => {
      unsubHw();
    };
  }, [user?.schoolId, user?.classId]);

  // Listen to submissions for each active homework
  useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (!user.schoolId) return;

    unsubSubmissionsRef.current.forEach((unsub) => unsub());
    unsubSubmissionsRef.current.clear();

    if (homework.length === 0) {
      setSubmissions([]);
      return;
    }

    const unsub = onStudentSubmissionsAcross(user.schoolId, user.id, (subs) => {
      setSubmissions(subs);
    });
    unsubSubmissionsRef.current.set('student-all', unsub);

    return () => {
      unsubSubmissionsRef.current.forEach((u) => u());
      unsubSubmissionsRef.current.clear();
    };
  }, [user.schoolId, user.id, homework.length > 0]);

  // ─── Fetch existing submission when modal opens ────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (modalOpen && selectedHomework && modalStep === 'details') {
      getSubmissionByStudent(user.schoolId, selectedHomework.id, user.id).then((sub) => {
        setSelectedSubmission(sub);
      }).catch(() => {
        // silently fail
      });
    }
  }, [modalOpen, selectedHomework, modalStep, user.schoolId, user.id]);

  // ─── Enrich homework with submission data and sorting ──────────────────────
  const enrichedHomework = useCallback((): EnrichedHomework[] => {
    const now = new Date();

    return homework
      .filter((hw) => hw.status === 'ACTIVE' || hw.status === 'COMPLETED')
      .map((hw) => {
        const sub = submissions.find((s) => s.homeworkId === hw.id && s.studentId === user.id) || null;
        const relativeDue = getRelativeDueDate(hw.dueDate);

        let filterStatus: FilterTab = 'pending';
        if (sub?.status === 'GRADED') filterStatus = 'graded';
        else if (sub?.status === 'SUBMITTED' || sub?.status === 'LATE_SUBMITTED') filterStatus = 'submitted';
        else if (relativeDue.isOverdue) filterStatus = 'overdue';

        return { ...hw, submission: sub, relativeDue, filterStatus };
      })
      .sort((a, b) => {
        // Urgency sort: overdue first, then due today, this week, later
        if (a.relativeDue.urgency !== b.relativeDue.urgency) return a.relativeDue.urgency - b.relativeDue.urgency;
        // Within same urgency, sort by due date ascending
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [homework, submissions, user.id]);

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filtered = enrichedHomework().filter((hw) => {
    if (activeTab === 'all') return true;
    return hw.filterStatus === activeTab;
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = (() => {
    const all = enrichedHomework();
    return {
      pending: all.filter((h) => h.filterStatus === 'pending').length,
      submitted: all.filter((h) => h.filterStatus === 'submitted').length,
      graded: all.filter((h) => h.filterStatus === 'graded').length,
      overdue: all.filter((h) => h.filterStatus === 'overdue').length,
    };
  })();

  const allDone = enrichedHomework().length > 0 && stats.pending === 0 && stats.overdue === 0;

  // ─── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (file.size === 0) {
      setFileError('This file is empty. Please pick a non-empty file.');
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only PDF, DOC, JPG, and PNG files are accepted');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds 10MB limit');
      return;
    }

    setSelectedFile(file);
  };

  // ─── Submission flow ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedHomework) return;

    if (selectedFile && selectedFile.size === 0) {
      toast.error('Selected file is empty. Please pick a non-empty file.');
      return;
    }

    const trimmedText = textContent.trim();
    if (!trimmedText && !selectedFile) {
      toast.error('Write something or upload a file before submitting.');
      return;
    }

    const existing = submissions.find(
      (s) => s.homeworkId === selectedHomework.id && s.studentId === user.id
    );
    if (existing) {
      toast.error('You have already submitted this homework. Contact your teacher to resubmit.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(true);

    let uploadedUrl: string | undefined;
    let uploadedName: string | undefined;
    let uploadedSize: number | undefined;

    try {
      if (selectedFile) {
        const uploaded = await uploadAttachment(user.schoolId, selectedHomework.id, selectedFile, true);
        uploadedUrl = uploaded.url;
        uploadedName = uploaded.name;
        uploadedSize = uploaded.size;
      }

      const isLate = new Date(selectedHomework.dueDate) < new Date();

      await submitHomework(user.schoolId, selectedHomework.id, {
        studentId: user.id,
        studentName: user.name,
        fileUrl: uploadedUrl,
        fileName: uploadedName,
        fileSize: uploadedSize,
        textContent: trimmedText || undefined,
        isLate,
      });

      toast.success('Submitted successfully');
      setModalStep('confirmation');
      setUploadProgress(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Try again.';
      toast.error(message);
      if (uploadedUrl) {
        try {
          await deleteAttachment(uploadedUrl);
        } catch (cleanupErr) {
          console.warn('Orphan upload cleanup failed:', cleanupErr);
        }
      }
      setUploadProgress(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (hw: Homework) => {
    setSelectedHomework(hw);
    setSelectedSubmission(null);
    setTextContent('');
    setSelectedFile(null);
    setFileError(null);
    setModalStep('details');
    setModalOpen(true);
  };

  const openGradeView = (hwId: string) => {
    setGradeViewOpen(gradeViewOpen === hwId ? null : hwId);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedHomework(null);
    setSelectedSubmission(null);
    setTextContent('');
    setSelectedFile(null);
    setFileError(null);
    setModalStep('details');
  };

  // ─── Download helper ───────────────────────────────────────────────────────
  const handleDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Something went wrong</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold min-h-[44px]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32 px-4 md:px-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Homework</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">View and submit your assignments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'graded', label: 'Graded' },
          { key: 'overdue', label: 'Overdue' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap min-h-[44px] transition-all ${
              activeTab === tab.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.pending}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Pending</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.submitted}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Submitted</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.graded}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Graded</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.overdue}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Overdue</p>
          </div>
        </div>
      )}

      {/* Homework list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : enrichedHomework().length === 0 ? (
        <EmptyState tab="all" />
      ) : allDone && activeTab === 'all' ? (
        <AllDoneState />
      ) : filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((hw) => {
            const subjectColors = getSubjectColors(hw.subject);
            const isOverdue = hw.filterStatus === 'overdue';
            const isSubmitted = hw.filterStatus === 'submitted';
            const isGraded = hw.filterStatus === 'graded';
            const showGradeView = gradeViewOpen === hw.id;

            return (
              <div
                key={hw.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 transition-all ${
                  isOverdue
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Subject badge + status */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${subjectColors.bg} ${subjectColors.text} ${subjectColors.border}`}>
                    {hw.subject}
                  </span>
                  {isOverdue && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Overdue
                    </span>
                  )}
                  {isSubmitted && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Submitted
                    </span>
                  )}
                  {isGraded && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Graded
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{hw.title}</h3>

                {/* Description (truncated) */}
                {hw.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">{hw.description}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {hw.relativeDue.text}
                  </span>
                  {hw.teacherName && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {hw.teacherName}
                    </span>
                  )}
                  {hw.attachments && hw.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      {hw.attachments.length} file{hw.attachments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Grade view (inline expandable) */}
                {isGraded && hw.submission && (
                  <div className="mb-3">
                    <button
                      onClick={() => openGradeView(hw.id)}
                      className="w-full flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {hw.submission.grade !== undefined ? `${formatIndianNumber(hw.submission.grade)}/${formatIndianNumber(hw.submission.maxGrade || 100)}` : 'Graded'}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform ${showGradeView ? 'rotate-90' : ''}`} />
                    </button>

                    {showGradeView && (
                      <div className="mt-2 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                        {/* Big grade */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                              {hw.submission.grade !== undefined ? formatIndianNumber(hw.submission.grade) : '--'}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              / {formatIndianNumber(hw.submission.maxGrade || 100)}
                            </p>
                          </div>
                          {hw.submission.grade !== undefined && hw.submission.maxGrade && (
                            <div className="text-center">
                              {(() => {
                                const pct = Math.round((hw.submission.grade / hw.submission.maxGrade) * 100);
                                const gradeInfo = getGradeLabel(pct);
                                return (
                                  <>
                                    <p className={`text-2xl font-bold ${gradeInfo.color}`}>{gradeInfo.label}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{pct}%</p>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Feedback */}
                        {hw.submission.feedback && (
                          <div className="flex gap-2">
                            <MessageSquare className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">{hw.submission.feedback}</p>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex flex-col gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                          <span>Submitted: {formatTimestamp(hw.submission.submittedAt)}</span>
                          {hw.submission.gradedAt && <span>Graded: {formatTimestamp(hw.submission.gradedAt)}</span>}
                        </div>

                        {hw.submission.grade !== undefined && hw.submission.maxGrade && (
                          (() => {
                            const pct = Math.round((hw.submission.grade / hw.submission.maxGrade) * 100);
                            if (pct < 50) {
                              return (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                  Talk to your teacher if you have questions about this grade.
                                </p>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                {isOverdue && !hw.submission && (
                  <button
                    onClick={() => openSubmitModal(hw)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Late
                  </button>
                )}

                {!isOverdue && !isSubmitted && !isGraded && (
                  <button
                    onClick={() => openSubmitModal(hw)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Submit
                  </button>
                )}

                {isSubmitted && hw.submission && (
                  <button
                    onClick={() => openSubmitModal(hw)}
                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Submission
                  </button>
                )}

                {isGraded && !showGradeView && (
                  <button
                    onClick={() => openGradeView(hw.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    View Grade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Submission Modal ─────────────────────────────────────────────── */}
      {modalOpen && selectedHomework && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-zinc-950 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {modalStep === 'details' && 'Assignment Details'}
                {modalStep === 'submit' && 'Submit Work'}
                {modalStep === 'confirmation' && 'Submission Complete'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Step 1: Details */}
            {modalStep === 'details' && (
              <div className="p-4 space-y-4">
                {/* Title + subject */}
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border mb-2 ${getSubjectColors(selectedHomework.subject).bg} ${getSubjectColors(selectedHomework.subject).text} ${getSubjectColors(selectedHomework.subject).border}`}>
                    {selectedHomework.subject}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{selectedHomework.title}</h3>
                </div>

                {/* Description */}
                {selectedHomework.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{selectedHomework.description}</p>
                )}

                {/* Meta */}
                <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due: {new Date(selectedHomework.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {selectedHomework.teacherName && (
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {selectedHomework.teacherName}
                    </span>
                  )}
                  {selectedHomework.maxGrade && (
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Max grade: {formatIndianNumber(selectedHomework.maxGrade)}
                    </span>
                  )}
                </div>

                {/* Attachments */}
                {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Attachments</p>
                    <div className="space-y-2">
                      {selectedHomework.attachments.map((att, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownload(att.url, att.name)}
                          className="w-full flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[44px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        >
                          <Paperclip className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1 text-left">{att.name}</span>
                          <Download className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previous submission info */}
                {selectedSubmission && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">Previous submission</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Submitted on {formatTimestamp(selectedSubmission.submittedAt)}
                    </p>
                    {selectedSubmission.textContent && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{selectedSubmission.textContent}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  {selectedSubmission ? (
                    <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-bold min-h-[54px] flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      Submitted — awaiting grade
                    </div>
                  ) : (
                    <button
                      onClick={() => setModalStep('submit')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Submit Work
                    </button>
                  )}
                  {selectedSubmission && selectedSubmission.status === 'GRADED' && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                      Your teacher has graded this submission.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Submit */}
            {modalStep === 'submit' && (
              <div className="p-4 space-y-4">
                {/* Homework reminder */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Submitting for</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedHomework.title}</p>
                </div>

                {/* Text area */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                    Your Answer
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Write your answer or notes here..."
                    rows={5}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* File upload */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                    Upload File (optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl min-h-[54px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <Upload className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {selectedFile ? selectedFile.name : 'Tap to upload'}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {selectedFile
                          ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                          : 'PDF, DOC, JPG, PNG up to 10MB'}
                      </p>
                    </div>
                    {selectedFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFileError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </button>
                    )}
                  </button>
                  {fileError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {fileError}
                    </p>
                  )}
                </div>

                {/* Late warning */}
                {new Date(selectedHomework.dueDate) < new Date() && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      This homework is past due. You can still submit.
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    uploadProgress ||
                    !!selectedSubmission ||
                    (!textContent.trim() && !selectedFile)
                  }
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
                >
                  {uploadProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : selectedSubmission ? (
                    <>Already Submitted</>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </button>

                {/* Back button */}
                <button
                  onClick={() => setModalStep('details')}
                  className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold min-h-[44px] transition-all"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {modalStep === 'confirmation' && (
              <div className="p-4 space-y-4">
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Submitted successfully</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    Your work has been submitted and will be reviewed by your teacher.
                  </p>
                </div>

                {/* Submission details */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4" />
                    {formatTimestamp(new Date().toISOString())}
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Paperclip className="w-4 h-4" />
                      {selectedFile.name}
                    </div>
                  )}
                  {new Date(selectedHomework.dueDate) < new Date() && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      Late submission
                    </div>
                  )}
                </div>

                {/* Resubmit option (only if before due date) */}
                {new Date(selectedHomework.dueDate) >= new Date() && (
                  <button
                    onClick={() => {
                      setTextContent('');
                      setSelectedFile(null);
                      setFileError(null);
                      setModalStep('submit');
                    }}
                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold min-h-[44px] transition-all"
                  >
                    Resubmit
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold min-h-[54px] transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
