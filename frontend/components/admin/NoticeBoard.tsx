import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Filter,
  Archive,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Announcement, AnnouncementPriority, User } from '@/types';
import { UserRole } from '@/types';
import { MOCK_ANNOUNCEMENTS } from '@/constants';
import { db } from '@/services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { archiveAnnouncement, restoreAnnouncement, deleteAnnouncement, shareNoticeWhatsApp } from '@/services/notices';
import ReadStatsModal from '@/components/shared/ReadStatsModal';
import NoticeCard from '@/components/shared/NoticeCard';
import CreateNoticeModal from '@/components/shared/CreateNoticeModal';
import {
  NoticeSkeletonGrid,
  NoticeEmpty,
  NoticeNoResults,
} from '@/components/shared/NoticeStates';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface NoticeBoardProps {
  user: User;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ user }) => {
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<AnnouncementPriority | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [statsNotice, setStatsNotice] = useState<Announcement | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setNotices(MOCK_ANNOUNCEMENTS);
      setClasses(['Class 10-A', 'Class 9-A', 'Class 8-A', 'Class 7-A']);
      setLoading(false);
      return;
    }
    const unsubNotices = onSnapshot(
      collection(db, 'schools', user.schoolId, 'announcements'),
      (snap) => {
        const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Announcement));
        setNotices(data.length > 0 ? data : MOCK_ANNOUNCEMENTS);
        setLoading(false);
      },
      (err) => {
        setNotices(MOCK_ANNOUNCEMENTS);
        setLoading(false);
      }
    );

    const unsubClasses = onSnapshot(collection(db, 'schools', user.schoolId, 'classes'), (snap) => {
      const cls = snap.docs.map((d: any) => d.data().name || d.id).filter(Boolean);
      setClasses(cls.length > 0 ? cls : ['Class 10-A', 'Class 9-A', 'Class 8-A']);
    }, () => {
      setClasses(['Class 10-A', 'Class 9-A', 'Class 8-A']);
    });

    return () => { unsubNotices(); unsubClasses(); };
  }, [user.schoolId]);

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || n.priority === selectedPriority;
    const matchesArchive = showArchived ? n.isArchived : !n.isArchived;
    return matchesSearch && matchesPriority && matchesArchive;
  });

  // ─── Sort: pinned first, then by createdAt desc ───────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const parseDate = (d: any) => d?.toDate ? d.toDate().getTime() : new Date(d || 0).getTime();
    return parseDate(b.createdAt) - parseDate(a.createdAt);
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const activeNotices = notices.filter(n => !n.isArchived);
  const stats = {
    total: activeNotices.length,
    pinned: activeNotices.filter(n => n.isPinned).length,
    archived: notices.filter(n => n.isArchived).length,
    critical: activeNotices.filter(n => n.priority === 'critical').length,
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

  const doDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteAnnouncement(user.schoolId, id);
      toast.success('Notice deleted');
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAnnouncement(user.schoolId, id);
      toast.success('Notice restored');
    } catch {
      toast.error('Failed to restore notice');
    }
  };

  const handleEdit = (notice: Announcement) => {
    setEditingNotice(notice);
    setShowCreateModal(true);
  };

  const handleShare = (notice: Announcement) => {
    shareNoticeWhatsApp(notice);
  };

  const handleViewStats = (notice: Announcement) => {
    setStatsNotice(notice);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingNotice(null);
  };

  // CreateNoticeModal handles its own success internally; this callback is for analytics only
  const handleSuccess = () => {
    setEditingNotice(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-indigo-600" /> Notices
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage school announcements and alerts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
              showArchived
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived ({stats.archived})
          </button>
          {isAdmin && (
            <button
              onClick={() => { setEditingNotice(null); setShowCreateModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all min-h-[44px]"
            >
              <Plus size={20} /> Create
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {!showArchived && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Active</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.pinned}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Pinned</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.critical}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Important</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-500 dark:text-zinc-400">{stats.archived}</p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Archived</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <Filter size={16} className="text-zinc-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="bg-transparent border-none text-sm w-full focus:ring-0 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="critical">Important</option>
            <option value="urgent">Urgent</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Notice Grid */}
      {loading ? (
        <NoticeSkeletonGrid count={6} />
      ) : sorted.length === 0 ? (
        searchQuery || selectedPriority !== 'All' ? <NoticeNoResults /> : <NoticeEmpty />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((notice) => (
            <NoticeCard
              key={notice.id}
              variant="grid"
              announcement={notice}
              currentUserId={user.id}
              currentRole="admin"
              isOwn={notice.createdBy === user.id}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onShare={handleShare}
              onStats={handleViewStats}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateNoticeModal
          user={user}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          editingNotice={editingNotice}
          availableClasses={classes.length > 0 ? classes : undefined}
        />
      )}

      {/* Read Stats Modal */}
      {statsNotice && (
        <ReadStatsModal
          schoolId={user.schoolId}
          announcement={statsNotice}
          onClose={() => setStatsNotice(null)}
        />
      )}

      {/* Custom Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-white/5 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Delete notice?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                This permanently removes the notice and its read receipts. This cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3 border-t border-zinc-100 dark:border-white/5">
              <button onClick={() => setConfirmDeleteId(null)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-all">
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDeleteId)}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
