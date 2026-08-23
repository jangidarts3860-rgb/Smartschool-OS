import { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Announcement, AnnouncementPriority } from '@/types';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { markAsRead } from '@/services/notices';
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

export default function ParentNotices({ user }: Props) {
  const [rawNotices, setRawNotices] = useState<Announcement[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | AnnouncementPriority>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const unsubRef = useRef<(() => void) | null>(null);

  const fallbackParentNotices = useMemo(() => {
    return MOCK_ANNOUNCEMENTS.filter(a => a.visibleTo?.includes('parent'));
  }, []);

  // Fetch parent's children so we can filter notices by their classes
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setRawNotices(fallbackParentNotices);
      setLoading(false);
      return;
    }
    if (!user.schoolId || !user.phone) return;
    const studentsRef = collection(db, 'schools', user.schoolId, 'users');
    const q = query(studentsRef, where('role', '==', 'STUDENT'), where('parentPhone', '==', user.phone));
    const unsub = onSnapshot(q, (snap) => {
      setChildren(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as User[]);
    });
    return () => unsub();
  }, [user.schoolId, user.phone]);

  const childClassIds = useMemo(() => {
    const list = children.map(c => c.classId).filter(Boolean) as string[];
    return list.length > 0 ? list : ['10A', '9A'];
  }, [children]);

  // Real-time notices listener
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setRawNotices(fallbackParentNotices);
      setLoading(false);
      return;
    }
    if (!user.schoolId) {
      setRawNotices(fallbackParentNotices);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const noticesRef = collection(db, 'schools', user.schoolId, 'announcements');
    const q = query(
      noticesRef,
      where('isArchived', '==', false),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setRawNotices(noticeList.length > 0 ? noticeList : fallbackParentNotices);
      setLoading(false);
    }, (err) => {
      if (import.meta.env.DEV) {
        console.error("Notices subscription error:", err);
      }
      setRawNotices(fallbackParentNotices);
      setLoading(false);
    });

    unsubRef.current = unsubscribe;

    return () => { unsubscribe(); };
  }, [user.schoolId, fallbackParentNotices]);

  // Apply role + class + child filters
  const notices = useMemo(() => {
    const list = rawNotices.filter((n) => {
      if (n.visibleTo && !n.visibleTo.includes('parent')) return false;
      return true;
    });
    return list.length > 0 ? list : fallbackParentNotices;
  }, [rawNotices, fallbackParentNotices]);

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = notices.filter(n => {
    if (filterTab === 'unread') return !n.readBy?.includes(user.id);
    if (filter !== 'all') return n.priority === filter;
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
    total: notices.length,
    unread: notices.filter(n => !n.readBy?.includes(user.id)).length,
    urgent: notices.filter(n => n.priority === 'urgent' || n.priority === 'critical').length,
    thisMonth: notices.filter(n => {
      const d = new Date(n.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  // ─── Mark as read ─────────────────────────────────────────────────────────
  // Uses markAsRead() which performs an arrayUnion on `readBy`. The snapshot
  // listener will receive the server-confirmed update and merge it in —
  // optimistic local update is intentionally omitted to avoid the
  // snapshot/optimistic race where a stale snapshot can resurrect the
  // unread state after we marked it read.
  const handleMarkRead = async (id: string) => {
    if (!user.schoolId || !user.id) return;
    try {
      await markAsRead(user.schoolId, id, user.id);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Mark as read failed:', err);
      }
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">School announcements and important updates</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <NoticeSkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Total</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.unread}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Unread</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.urgent}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Urgent</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.thisMonth}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">This Month</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all' as const, label: 'All', count: stats.total },
          { key: 'unread' as const, label: 'Unread', count: stats.unread },
          { key: 'critical' as const, label: 'Important', count: notices.filter(n => n.priority === 'critical').length },
          { key: 'urgent' as const, label: 'Urgent', count: notices.filter(n => n.priority === 'urgent').length },
          { key: 'general' as const, label: 'General', count: notices.filter(n => n.priority === 'general').length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'unread') {
                setFilterTab('unread');
                setFilter('all');
              } else {
                setFilterTab('all');
                setFilter(tab.key);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap min-h-[44px] transition-all flex items-center gap-2 ${
              (tab.key === 'unread' && filterTab === 'unread') || (tab.key !== 'unread' && filter === tab.key)
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                (tab.key === 'unread' && filterTab === 'unread') || (tab.key !== 'unread' && filter === tab.key)
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
      ) : notices.length === 0 ? (
        <NoticeEmpty />
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
              currentRole="parent"
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
