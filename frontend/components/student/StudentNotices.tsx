import { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Announcement } from '@/types';
import { onAnnouncementsByRole, markAsRead } from '@/services/notices';
import NoticeCard from '@/components/shared/NoticeCard';
import {
  NoticeSkeletonCard,
  NoticeSkeletonStat,
  NoticeEmpty,
  NoticeAllRead,
  NoticeError,
} from '@/components/shared/NoticeStates';

import { MOCK_ANNOUNCEMENTS } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

export default function StudentNotices({ user }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const unreadCount = useMemo(
    () => announcements.filter((a) => !a.readBy?.includes(user.id)).length,
    [announcements, user.id]
  );

  const studentFallbackNotices = useMemo(() => {
    return MOCK_ANNOUNCEMENTS.filter(a => a.visibleTo?.includes('student'));
  }, []);

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setAnnouncements(studentFallbackNotices);
      setLoading(false);
      return;
    }
    if (!user.schoolId) {
      setAnnouncements(studentFallbackNotices);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const unsub = onAnnouncementsByRole(user.schoolId, 'student', (list) => {
      const visible = list.filter((a) => {
        if (!a.targetClasses || a.targetClasses.length === 0) return true;
        if (!user.classId) return false;
        return a.targetClasses.includes(user.classId);
      });
      setAnnouncements(visible.length > 0 ? visible : studentFallbackNotices);
      setLoading(false);
    });

    unsubRef.current = unsub;

    return () => { unsub(); };
  }, [user.schoolId, user.classId, studentFallbackNotices]);

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = announcements.filter((a) => {
    if (filterTab === 'unread') return !a.readBy?.includes(user.id);
    return true;
  });

  // ─── Sort: pinned first, then by createdAt desc ───────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: announcements.length,
    unread: unreadCount,
  };

  // ─── Mark as read ─────────────────────────────────────────────────────────
  // `markAsRead` writes via `arrayUnion`, so the onSnapshot listener will
  // deliver the updated `readBy` array on its own. Doing an optimistic local
  // mutation as well as awaiting the snapshot races with the listener and
  // can leave the badge stuck on "unread" if the snapshot arrives before
  // our setState. The cleanest path is to call the service and let the
  // listener reconcile.
  const handleMarkRead = async (announcementId: string) => {
    if (markingRead || !user.schoolId || !user.id) return;
    setMarkingRead(announcementId);
    try {
      await markAsRead(user.schoolId, announcementId, user.id);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Mark as read failed:', err);
      }
    } finally {
      setMarkingRead(null);
    }
  };

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return <NoticeError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-5 pb-32 px-4 md:px-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Notices</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">School announcements and updates</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <NoticeSkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Total</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.unread}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Unread</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all' as const, label: 'All', count: stats.total },
          { key: 'unread' as const, label: 'Unread', count: stats.unread },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap min-h-[44px] transition-all flex items-center gap-2 ${
              filterTab === tab.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                filterTab === tab.key
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
          title="No notices for you yet"
          description={user.classId ? 'Notices for your class will appear here. Check back later.' : 'Notices for your role will appear here. Check back later.'}
        />
      ) : filterTab === 'unread' && stats.unread === 0 ? (
        <NoticeAllRead />
      ) : sorted.length === 0 ? (
        <NoticeEmpty />
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => (
            <NoticeCard
              key={notice.id}
              announcement={notice}
              currentUserId={user.id}
              currentRole="student"
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
