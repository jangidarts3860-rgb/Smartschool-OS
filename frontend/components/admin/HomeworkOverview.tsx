import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  X,
  ChevronRight,
  Users,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { onAllHomework, onSubmissions, getCompletionStats } from '@/services/homework';
import { toast } from 'react-hot-toast';
import { MOCK_USERS } from '@/constants';
import EmptyState from '@/components/ui/EmptyState';
import type { User, Homework, HomeworkSubmission } from '@/types';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  onBack?: () => void;
}

type SubmissionFilter = 'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED' | 'GRADED' | 'LATE';

const HomeworkOverview: React.FC<Props> = ({ user }) => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [completionStats, setCompletionStats] = useState<Record<string, { submitted: number; graded: number; pending: number; late: number }>>({});

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyHomework = useMemo(() => {
    return homework.filter((hw) => {
      const d = new Date(hw.assignedDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [homework, currentMonth, currentYear]);

  const aggregatedStats = useMemo(() => {
    let totalAssigned = monthlyHomework.length;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalGraded = 0;

    monthlyHomework.forEach((hw) => {
      const stats = completionStats[hw.id];
      if (stats) {
        totalPending += stats.pending;
        totalGraded += stats.graded;
        totalOverdue += stats.late;
      }
      const dueDate = new Date(hw.dueDate);
      if (dueDate < now && hw.status !== 'COMPLETED' && hw.status !== 'ARCHIVED') {
        totalOverdue++;
      }
    });

    return { totalAssigned, totalPending, totalOverdue, totalGraded };
  }, [monthlyHomework, completionStats, now]);

  const DEFAULT_MOCK_HOMEWORK: Homework[] = [
    {
      id: 'hw-1',
      title: 'Quadratic Equations & Roots Practice',
      description: 'Solve problems 1 to 20 from Chapter 4 Exercise 4.2 in your NCERT notebook.',
      subject: 'Mathematics',
      classId: '10A',
      teacherId: 't1',
      teacherName: 'Anjali Sharma',
      assignedDate: new Date().toISOString().split('T')[0]!,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]!,
      maxGrade: 50,
      academicYear: '2025-2026',
      status: 'ACTIVE',
      schoolId: user.schoolId || 'SCH01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'hw-2',
      title: 'Optics & Ray Diagram Lab File',
      description: 'Draw concave and convex lens focal point diagrams with proper labels.',
      subject: 'Science',
      classId: '10A',
      teacherId: 't2',
      teacherName: 'Rajesh Kumar',
      assignedDate: new Date().toISOString().split('T')[0]!,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]!,
      maxGrade: 30,
      academicYear: '2025-2026',
      status: 'ACTIVE',
      schoolId: user.schoolId || 'SCH01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'hw-3',
      title: 'Formal Letter to Municipal Commissioner',
      description: 'Write a formal letter highlighting poor drainage and sanitation issues in your locality.',
      subject: 'English',
      classId: '9A',
      teacherId: 't3',
      teacherName: 'Priya Iyer',
      assignedDate: new Date().toISOString().split('T')[0]!,
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0]!,
      maxGrade: 20,
      academicYear: '2025-2026',
      status: 'ACTIVE',
      schoolId: user.schoolId || 'SCH01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setHomework(DEFAULT_MOCK_HOMEWORK);
      setLoading(false);
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    setLoading(true);
    const unsub = onAllHomework(user.schoolId, (data) => {
      setHomework(data.length > 0 ? data : DEFAULT_MOCK_HOMEWORK);
      setLoading(false);
      setStatsLoading(false);
    });
    return () => unsub();
  }, [user.schoolId]);

  useEffect(() => {
    const fetchStats = async () => {
      const statsMap: Record<string, { submitted: number; graded: number; pending: number; late: number }> = {};
      const promises = monthlyHomework.map(async (hw) => {
        try {
          const totalStudents = (hw as any).totalStudents || 40;
      const stats = await getCompletionStats(user.schoolId, hw.id, totalStudents);
      stats.pending = Math.max(0, stats.pending);
      statsMap[hw.id] = stats;
        } catch {
          statsMap[hw.id] = { submitted: 0, graded: 0, pending: 40, late: 0 };
        }
      });
      await Promise.all(promises);
      setCompletionStats(statsMap);
    };

    if (monthlyHomework.length > 0) {
      fetchStats();
    }
  }, [monthlyHomework, user.schoolId]);

  const submissionsUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (submissionsUnsubRef.current) {
        try { submissionsUnsubRef.current(); } catch { /* noop */ }
        submissionsUnsubRef.current = null;
      }
    };
  }, []);

  const closeSubmissionsModal = useCallback(() => {
    if (submissionsUnsubRef.current) {
      try { submissionsUnsubRef.current(); } catch { /* noop */ }
      submissionsUnsubRef.current = null;
    }
    setShowSubmissionsModal(false);
    setSelectedHomework(null);
    setSubmissions([]);
    setSubmissionFilter('ALL');
  }, []);

  const handleViewSubmissions = useCallback((hw: Homework) => {
    if (submissionsUnsubRef.current) {
      try { submissionsUnsubRef.current(); } catch { /* noop */ }
      submissionsUnsubRef.current = null;
    }
    setSelectedHomework(hw);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    setSubmissions([]);
    setSubmissionFilter('ALL');

    submissionsUnsubRef.current = onSubmissions(user.schoolId, hw.id, (data) => {
      setSubmissions(data);
      setSubmissionsLoading(false);
    });
  }, [user.schoolId]);

  const filteredHomework = useMemo(() => {
    return monthlyHomework.filter((hw) => {
      const matchesSearch =
        !searchQuery ||
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hw.teacherName && hw.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClass = !classFilter || hw.classId === classFilter;
      const matchesTeacher = !teacherFilter || hw.teacherId === teacherFilter;
      const matchesStatus = !statusFilter || hw.status === statusFilter;
      return matchesSearch && matchesClass && matchesTeacher && matchesStatus;
    });
  }, [monthlyHomework, searchQuery, classFilter, teacherFilter, statusFilter]);

  const filteredSubmissions = useMemo(() => {
    if (submissionFilter === 'ALL') return submissions;
    if (submissionFilter === 'SUBMITTED') return submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'LATE_SUBMITTED');
    if (submissionFilter === 'GRADED') return submissions.filter((s) => s.status === 'GRADED');
    if (submissionFilter === 'LATE') return submissions.filter((s) => s.isLate);
    return submissions;
  }, [submissions, submissionFilter]);

  const uniqueClasses = useMemo(() => {
    const set = new Set(monthlyHomework.map((hw) => hw.classId));
    return Array.from(set);
  }, [monthlyHomework]);

  const uniqueTeachers = useMemo(() => {
    const map = new Map<string, string>();
    monthlyHomework.forEach((hw) => {
      if (hw.teacherName) {
        map.set(hw.teacherId, hw.teacherName);
      }
    });
    return map;
  }, [monthlyHomework]);

  const getHomeworkStatus = (hw: Homework): { label: string; color: string } => {
    const dueDate = new Date(hw.dueDate);
    if (hw.status === 'COMPLETED' || hw.status === 'ARCHIVED') {
      return { label: 'Closed', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
    }
    if (dueDate < now) {
      return { label: 'Overdue', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' };
    }
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' };
  };

  const getSubmissionStatusBadge = (sub: HomeworkSubmission): { label: string; color: string } => {
    switch (sub.status) {
      case 'GRADED':
        return { label: 'Graded', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' };
      case 'LATE_SUBMITTED':
        return { label: 'Late', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };
      case 'SUBMITTED':
        return { label: 'Submitted', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' };
      default:
        return { label: 'Not Started', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' };
    }
  };

  const StatSkeleton = () => (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
      </div>
      <div className="w-12 h-7 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-2" />
      <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
    </div>
  );

  const ListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1">
              <div className="w-48 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
              <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
            </div>
            <div className="w-16 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-2" />
          <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
        </div>
      ))}
    </div>
  );

  if (!loading && monthlyHomework.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Homework Overview</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Academic assignment monitoring</p>
          </div>
        </div>
        <EmptyState
          variant="homework"
          title="No homework assigned this month"
          description="Assignments created this month will appear here with completion tracking."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center">
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Homework Overview</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <TrendingUp size={16} className="text-zinc-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{aggregatedStats.totalAssigned}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total Assigned</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{aggregatedStats.totalPending}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pending</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{aggregatedStats.totalOverdue}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Overdue</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{aggregatedStats.totalGraded}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Graded</p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-indigo-500 min-h-[44px]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-indigo-500 min-h-[44px]"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="px-3 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-indigo-500 min-h-[44px]"
            >
              <option value="">All Teachers</option>
              {Array.from(uniqueTeachers.entries()).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-indigo-500 min-h-[44px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Homework List */}
      {loading ? (
        <ListSkeleton />
      ) : filteredHomework.length === 0 ? (
        <EmptyState
          variant="homework"
          title="No matching assignments"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div className="space-y-3">
          {/* Desktop table header - hidden on mobile */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <div className="col-span-3">Assignment</div>
            <div className="col-span-1">Subject</div>
            <div className="col-span-1">Class</div>
            <div className="col-span-2">Teacher</div>
            <div className="col-span-1">Due Date</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Actions</div>
          </div>

          {filteredHomework.map((hw) => {
            const stats = completionStats[hw.id] || { submitted: 0, graded: 0, pending: 40, late: 0 };
            const total = stats.submitted + stats.pending;
            const progress = total > 0 ? Math.round((stats.submitted / total) * 100) : 0;
            const statusInfo = getHomeworkStatus(hw);

            return (
              <div
                key={hw.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
              >
                {/* Mobile card layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{hw.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hw.subject}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hw.className || hw.classId}</span>
                        {hw.teacherName && (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-600">·</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{hw.teacherName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                    <span>{stats.submitted}/{total} submitted</span>
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleViewSubmissions(hw)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-medium transition-all min-h-[44px]"
                  >
                    <Eye size={16} />
                    View Submissions
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Desktop table row */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{hw.title}</p>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{hw.subject}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{hw.className || hw.classId}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{hw.teacherName || '—'}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{stats.submitted}/{total}</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => handleViewSubmissions(hw)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-medium transition-all min-h-[44px]"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedHomework && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
          onClick={closeSubmissionsModal}
        >
          <div
            className="bg-white dark:bg-zinc-950 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{selectedHomework.title}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedHomework.subject} · {selectedHomework.className || selectedHomework.classId}
                </p>
              </div>
              <button
                onClick={closeSubmissionsModal}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Submission Filter Tabs */}
            <div className="flex gap-1 p-3 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
              {(['ALL', 'SUBMITTED', 'NOT_SUBMITTED', 'GRADED', 'LATE'] as SubmissionFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSubmissionFilter(filter)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap min-h-[44px] transition-all ${
                    submissionFilter === filter
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {filter === 'ALL' ? 'All' :
                   filter === 'SUBMITTED' ? 'Submitted' :
                   filter === 'NOT_SUBMITTED' ? 'Not Submitted' :
                   filter === 'GRADED' ? 'Graded' : 'Late'}
                </button>
              ))}
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto p-4">
              {submissionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                          <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                        </div>
                        <div className="w-16 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No submissions found</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {submissionFilter !== 'ALL' ? 'Try a different filter' : 'Students have not submitted yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubmissions.map((sub) => {
                    const statusBadge = getSubmissionStatusBadge(sub);
                    return (
                      <div
                        key={sub.id}
                        className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {sub.studentName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{sub.studentName}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Not submitted'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {sub.grade !== undefined && sub.grade !== null && (
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {sub.grade}/{sub.maxGrade || '?'}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                            {sub.fileUrl && (
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </div>
                        </div>
                        {sub.feedback && (
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2">
                            {sub.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkOverview;
