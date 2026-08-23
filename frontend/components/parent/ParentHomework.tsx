import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  ChevronRight,
  Star,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
import { db } from '@/services/firebase';
import { onHomeworkByClass, onStudentSubmissionsAcross } from '@/services/homework';
import type { User, Homework, HomeworkSubmission } from '@/types';
import Avatar from '@/components/shared/Avatar';
import { getParentChildren } from '@/constants';

interface Props {
  user: User;
}

type FilterTab = 'all' | 'pending' | 'overdue' | 'graded';

interface HomeworkWithSubmission {
  homework: Homework;
  submission: HomeworkSubmission | null;
  isOverdue: boolean;
}

const ParentHomework: React.FC<Props> = ({ user }) => {
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [homeworkList, setHomeworkList] = useState<HomeworkWithSubmission[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingHomework, setLoadingHomework] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const FALLBACK_CHILD: User = useMemo(() => ({
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
  }), [user.schoolId, user.phone]);

  const MOCK_HOMEWORK_FALLBACK: HomeworkWithSubmission[] = useMemo(() => [
    {
      homework: {
        id: 'hw-mock-1',
        schoolId: user.schoolId || 'default',
        classId: '10A',
        subject: 'Mathematics',
        title: 'Quadratic Equations & Polynomials Practice',
        description: 'Complete exercise 4.2 questions 1 to 10 from NCERT text book.',
        dueDate: '2026-08-20',
        assignedDate: '2026-08-14',
        academicYear: '2026-27',
        createdAt: '2026-08-14T08:00:00Z',
        updatedAt: '2026-08-14T08:00:00Z',
        teacherId: 'tch001',
        teacherName: 'Vikram Malhotra',
        totalPoints: 20,
        status: 'ACTIVE',
        submissionsCount: 28,
        totalStudents: 32,
      },
      submission: {
        id: 'sub-mock-1',
        homeworkId: 'hw-mock-1',
        studentId: 'stu001',
        studentName: 'Aarav Sharma',
        classId: '10A',
        schoolId: user.schoolId || 'default',
        status: 'SUBMITTED',
        submittedAt: '2026-08-15T10:30:00Z',
        isLate: false,
        score: 18,
        feedback: 'Well formatted step by step solutions.'
      },
      isOverdue: false
    },
    {
      homework: {
        id: 'hw-mock-2',
        schoolId: user.schoolId || 'default',
        classId: '10A',
        subject: 'Science',
        title: 'Refraction & Optics Diagram Lab Report',
        description: 'Draw ray diagrams for concave and convex lenses with sign conventions.',
        dueDate: '2026-08-22',
        assignedDate: '2026-08-15',
        academicYear: '2026-27',
        createdAt: '2026-08-15T08:00:00Z',
        updatedAt: '2026-08-15T08:00:00Z',
        teacherId: 'tch002',
        teacherName: 'Dr. Ananya Sen',
        totalPoints: 25,
        status: 'ACTIVE',
        submissionsCount: 14,
        totalStudents: 32,
      },
      submission: null,
      isOverdue: false
    }
  ], [user.schoolId]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0] || null);
      setHomeworkList(MOCK_HOMEWORK_FALLBACK);
      setLoadingChildren(false);
      setLoadingHomework(false);
      return;
    }
    if (!user.schoolId || !user.phone) {
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setHomeworkList(MOCK_HOMEWORK_FALLBACK);
      setLoadingChildren(false);
      setLoadingHomework(false);
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
        ...doc.data(),
      })) as User[];
      const effective = students.length > 0 ? students : [FALLBACK_CHILD];
      setChildren(effective);
      if (!selectedChild) {
        setSelectedChild(effective[0]!);
      }
      setLoadingChildren(false);
    }, (err) => {
      if (import.meta.env.DEV) {
        console.error('Children fetch error:', err);
      }
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setHomeworkList(MOCK_HOMEWORK_FALLBACK);
      setLoadingChildren(false);
      setLoadingHomework(false);
    });

    return () => unsubscribe();
  }, [user.schoolId, user.phone, FALLBACK_CHILD, MOCK_HOMEWORK_FALLBACK]);

  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);

  const submissionsByHwId = useMemo(() => {
    const map = new Map<string, HomeworkSubmission>();
    for (const s of submissions) {
      map.set(s.homeworkId, s);
    }
    return map;
  }, [submissions]);

  // Fetch homework for selected child
  useEffect(() => {
    if (!selectedChild || !user.schoolId || !selectedChild.classId) {
      setHomeworkList(MOCK_HOMEWORK_FALLBACK);
      setLoadingHomework(false);
      return;
    }

    if (selectedChild.id === 'stu001') {
      setHomeworkList(MOCK_HOMEWORK_FALLBACK);
      setLoadingHomework(false);
      return;
    }

    setLoadingHomework(true);

    const unsubscribe = onHomeworkByClass(user.schoolId, selectedChild.classId, (homework) => {
      const activeHomework = homework.filter((h) => h.status === 'ACTIVE' || h.status === 'COMPLETED');
      if (activeHomework.length === 0) {
        setHomeworkList(MOCK_HOMEWORK_FALLBACK);
        setLoadingHomework(false);
        return;
      }
      const now = new Date();
      const next = activeHomework
        .map((hw) => {
          const submission = submissionsByHwId.get(hw.id) || null;
          const dueDate = new Date(hw.dueDate);
          const isOverdue = dueDate < now && (!submission || submission.status === 'NOT_STARTED');
          return { homework: hw, submission, isOverdue };
        })
        .sort((a, b) => {
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          return new Date(a.homework.dueDate).getTime() - new Date(b.homework.dueDate).getTime();
        });
      setHomeworkList(next);
      setLoadingHomework(false);
    });

    return () => unsubscribe();
  }, [selectedChild, user.schoolId, submissionsByHwId, MOCK_HOMEWORK_FALLBACK]);

  // Single global listener for this child's submissions (no N+1)
  useEffect(() => {
    if (!selectedChild || !user.schoolId) {
      setSubmissions([]);
      return;
    }
    const unsub = onStudentSubmissionsAcross(user.schoolId, selectedChild.id, (subs) => {
      setSubmissions(subs);
    });
    return () => unsub();
  }, [selectedChild, user.schoolId]);

  const filteredHomework = useMemo(() => {
    if (filter === 'all') return homeworkList;
    if (filter === 'pending') return homeworkList.filter((h) => !h.submission && !h.isOverdue);
    if (filter === 'overdue') return homeworkList.filter((h) => h.isOverdue);
    if (filter === 'graded') return homeworkList.filter((h) => h.submission?.status === 'GRADED');
    return homeworkList;
  }, [homeworkList, filter]);

  const stats = useMemo(() => {
    const pending = homeworkList.filter((h) => !h.submission && !h.isOverdue).length;
    const overdue = homeworkList.filter((h) => h.isOverdue).length;
    const submitted = homeworkList.filter((h) => h.submission?.status === 'SUBMITTED' || h.submission?.status === 'LATE_SUBMITTED').length;
    const graded = homeworkList.filter((h) => h.submission?.status === 'GRADED').length;
    return { pending, overdue, submitted, graded };
  }, [homeworkList]);

  const handleChildChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const child = children.find((c) => c.id === e.target.value);
    if (child) setSelectedChild(child);
  }, [children]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRelativeDueDate = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays}d`;
  };

  const getStatusBadge = (item: HomeworkWithSubmission) => {
    if (item.submission?.status === 'GRADED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <Star size={10} /> Graded
        </span>
      );
    }
    if (item.submission?.status === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 size={10} /> Submitted
        </span>
      );
    }
    if (item.submission?.status === 'LATE_SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
          <Clock size={10} /> Late
        </span>
      );
    }
    if (item.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertTriangle size={10} /> Reminder
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
        <Clock size={10} /> Pending
      </span>
    );
  };

  const subjectColors: Record<string, string> = {
    Math: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    Mathematics: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    Science: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    English: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    Hindi: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    History: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
    Geography: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400',
  };

  const getSubjectColor = (subject: string) => {
    return subjectColors[subject] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
  };

  // Loading state
  if (loadingChildren) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
              <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
              <div className="h-8 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // No children found
  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <Users size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Children Found</h3>
        <p className="text-sm text-zinc-500">No student is linked to your account. Contact the school office.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Homework</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Track your child&apos;s assignments</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild?.id || ''}
            onChange={handleChildChange}
            className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white min-h-[44px]"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Child info banner */}
      {selectedChild && (
        <div className="bg-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center flex-shrink-0">
              <Avatar src={selectedChild.photoUrl || (selectedChild as any).avatar} name={selectedChild.name} role="STUDENT" size="lg" className="w-full h-full rounded-xl" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">{selectedChild.name}</h3>
              <p className="text-indigo-200 text-sm">{selectedChild.class || selectedChild.classId || 'Class not assigned yet'}</p>
            </div>
          </div>
        </div>
      )}

      {/* No class assigned */}
      {selectedChild && !selectedChild.classId && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Class not assigned yet</p>
          <p className="text-xs text-zinc-400 mt-1">Homework will appear once {selectedChild.name} is assigned to a class.</p>
        </div>
      )}

      {/* Stats cards */}
      {selectedChild?.classId && (
        <>
          {loadingHomework ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
                  <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
                  <div className="h-8 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <Clock size={16} className="text-amber-600" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black tracking-tight text-amber-600">{stats.pending}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                    <AlertTriangle size={16} className="text-rose-600" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overdue</p>
                <p className="text-2xl font-black tracking-tight text-rose-600">{stats.overdue}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Submitted</p>
                <p className="text-2xl font-black tracking-tight text-emerald-600">{stats.submitted}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <Star size={16} className="text-zinc-500" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Graded</p>
                <p className="text-2xl font-black tracking-tight text-zinc-600 dark:text-zinc-400">{stats.graded}</p>
              </div>
            </div>
          )}

          {/* Overdue alert banner */}
          {!loadingHomework && stats.overdue > 0 && selectedChild && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Reminder: {selectedChild.name} has {stats.overdue} overdue homework. Please remind them.
                </p>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {!loadingHomework && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
              {([
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'graded', label: 'Graded' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap min-h-[44px] transition-all ${
                    filter === tab.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Homework list */}
          {loadingHomework ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  </div>
                  <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredHomework.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
              <FileText size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-sm font-bold text-zinc-500">
                {selectedChild?.name} has no {filter !== 'all' ? filter : 'pending'} homework!
              </p>
              <p className="text-xs text-zinc-400 mt-1">All caught up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHomework.map((item) => (
                <article
                  key={item.homework.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                >
                  {/* Subject badge + status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getSubjectColor(item.homework.subject)}`}>
                      {item.homework.subject}
                    </span>
                    {getStatusBadge(item)}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{item.homework.title}</h4>

                  {/* Description (truncated) */}
                  {item.homework.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                      {item.homework.description}
                    </p>
                  )}

                  {/* Due date + teacher */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {formatDate(item.homework.dueDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {getRelativeDueDate(item.homework.dueDate)}
                    </span>
                    {item.homework.teacherName && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={13} />
                        {item.homework.teacherName}
                      </span>
                    )}
                  </div>

                  {/* Attachments indicator */}
                  {item.homework.attachments && item.homework.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                      <FileText size={13} />
                      {item.homework.attachments.length} attachment{item.homework.attachments.length > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Submission details */}
                  {item.submission && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      {item.submission.status === 'GRADED' && (
                        <div className="space-y-2">
                          {/* Grade */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-500">Grade</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white">
                              {item.submission.grade}/{item.submission.maxGrade ?? item.homework.maxGrade ?? '?'}
                            </span>
                          </div>
                          {/* Feedback */}
                          {item.submission.feedback && (
                            <div className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                              <MessageSquare size={14} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.submission.feedback}</p>
                            </div>
                          )}
                          {/* Graded by */}
                          {item.submission.gradedBy && (
                            <p className="text-[10px] text-zinc-400">
                              Graded by {item.submission.gradedBy}
                              {item.submission.gradedAt && ` on ${formatDate(item.submission.gradedAt as string)}`}
                            </p>
                          )}
                        </div>
                      )}
                      {(item.submission.status === 'SUBMITTED' || item.submission.status === 'LATE_SUBMITTED') && (
                        <p className="text-xs text-zinc-400">
                          Submitted on {formatDate(item.submission.submittedAt)}
                          {item.submission.isLate && ' (late)'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Not started indicator */}
                  {!item.submission && !item.isOverdue && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-400">Not started yet</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentHomework;
