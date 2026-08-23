import { useState, useEffect, useRef } from 'react';
import { Plus, Archive } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User, Announcement, AnnouncementPriority } from '@/types';
import { onAllAnnouncementsByRole, archiveAnnouncement, restoreAnnouncement, markAsRead, pinAnnouncement } from '@/services/notices';
import NoticeCard from '@/components/shared/NoticeCard';
import CreateNoticeModal from '@/components/shared/CreateNoticeModal';
import {
  NoticeSkeletonCard,
  NoticeEmpty,
  NoticeNoResults,
  NoticeError,
} from '@/components/shared/NoticeStates';

import { MOCK_ANNOUNCEMENTS } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

export default function TeacherNotices({ user }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const unsubRef = useRef<(() => void) | null>(null);
  const markAsReadInFlightRef = useRef<Set<string>>(new Set());

  // ─── Real-time listener (single combined query — no race between active/archived) ─
  useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setAnnouncements(MOCK_ANNOUNCEMENTS || []);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const unsub = onAllAnnouncementsByRole(user.schoolId, 'teacher', (list) => {
      setAnnouncements(list && list.length > 0 ? list : MOCK_ANNOUNCEMENTS);
      setLoading(false);
    });

    unsubRef.current = unsub;

    return () => { unsub(); };
  }, [user.schoolId]);

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = announcements.filter(n => {
    const matchesSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = (() => {
      switch (filter) {
        case 'pinned': return n.isPinned;
        case 'archived': return n.isArchived;
        case 'my': return n.createdBy === user.id;
        default: return !n.isArchived;
      }
    })();
    return matchesSearch && matchesFilter;
  });

  // ─── Sort: pinned first, then by createdAt desc ───────────────────────────
  // Firestore Timestamp can be a string (ISO) or a Timestamp object with .toDate()
  const toMillis = (v: any): number => {
    if (!v) return 0;
    if (typeof v?.toDate === 'function') return v.toDate().getTime();
    const t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
  };
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: announcements.filter(a => !a.isArchived).length,
    pinned: announcements.filter(a => a.isPinned).length,
    archived: announcements.filter(a => a.isArchived).length,
    myNotices: announcements.filter(a => a.createdBy === user.id && !a.isArchived).length,
  };

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleArchive = async (id: string) => {
    try {
      await archiveAnnouncement(user.schoolId, id);
      toast.success('Notice archived');
    } catch {
      toast.error('Failed to archive notice');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAnnouncement(user.schoolId, id);
      toast.success('Notice restored');
    } catch {
      toast.error('Failed to restore notice');
    }
  };

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      await pinAnnouncement(user.schoolId, id, pinned);
      toast.success(pinned ? 'Notice pinned' : 'Notice unpinned');
    } catch {
      toast.error('Failed to update notice');
    }
  };

  const handleMarkRead = async (id: string) => {
    // Guard against rapid double-click: the underlying service uses
    // arrayUnion so writes are atomic on the server, but we still want
    // a local in-flight guard to avoid spamming the same write.
    if (markAsReadInFlightRef.current.has(id)) return;
    markAsReadInFlightRef.current.add(id);
    try {
      await markAsRead(user.schoolId, id, user.id);
    } catch (err) {
      console.warn('Mark as read failed:', err);
      toast.error('Could not mark as read');
    } finally {
      markAsReadInFlightRef.current.delete(id);
    }
  };

  const handleEdit = (notice: Announcement) => {
    setEditingNotice(notice);
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditingNotice(null);
  };

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return <NoticeError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-5 pb-32 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Notices</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Create and manage class notices</p>
        </div>
        <button
          onClick={() => { setEditingNotice(null); setCreateModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold min-h-[44px] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search notices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all' as const, label: 'Active', count: stats.total },
          { key: 'my' as const, label: 'My Notices', count: stats.myNotices },
          { key: 'pinned' as const, label: 'Pinned', count: stats.pinned },
          { key: 'archived' as const, label: 'Archived', count: stats.archived },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap min-h-[44px] transition-all flex items-center gap-2 ${
              filter === tab.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                filter === tab.key
                  ? 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <NoticeSkeletonCard key={i} />)}
        </div>
      ) : announcements.length === 0 ? (
        <NoticeEmpty
          title="No notices created"
          description="Create your first class notice to keep students and parents informed."
        />
      ) : sorted.length === 0 ? (
        searchQuery ? <NoticeNoResults /> : <NoticeEmpty />
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => (
            <NoticeCard
              key={notice.id}
              announcement={notice}
              currentUserId={user.id}
              currentRole="teacher"
              isOwn={notice.createdBy === user.id}
              onMarkRead={handleMarkRead}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onPin={handlePin}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {createModalOpen && (
        <CreateNoticeModal
          user={user}
          onClose={handleCloseModal}
          onSuccess={() => {}}
          editingNotice={editingNotice}
          restrictCritical
          restrictVisibleTo={['student', 'parent', 'teacher']}
        />
      )}
    </div>
  );
}
