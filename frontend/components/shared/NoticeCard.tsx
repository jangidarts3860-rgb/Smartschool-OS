import {
  Bell,
  AlertTriangle,
  Clock,
  Pin,
  Eye,
  Trash2,
  Archive,
  Share2,
  Edit3,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type { Announcement, AnnouncementPriority } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────
// Beast Mode palette: 80% Zinc, 15% Indigo, 5% Emerald
// Critical → Indigo (high emphasis), Urgent → Indigo (medium), General → Zinc
const PRIORITY_CONFIG: Record<AnnouncementPriority, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: typeof Bell;
  ring: string;
  borderFull: string;
}> = {
  critical: {
    label: 'Important',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: AlertTriangle,
    ring: 'ring-indigo-500/20',
    borderFull: 'border-indigo-500/20',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
    icon: Clock,
    ring: 'ring-zinc-500/20',
    borderFull: 'border-zinc-500/20',
  },
  general: {
    label: 'General',
    bg: 'bg-zinc-50 dark:bg-zinc-900',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-800',
    icon: Bell,
    ring: 'ring-zinc-500/20',
    borderFull: 'border-zinc-500/20',
  },
};

export function getPriorityConfig(priority: AnnouncementPriority) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.general;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface NoticeCardProps {
  announcement: Announcement;
  currentUserId: string;
  currentRole: 'admin' | 'teacher' | 'student' | 'parent';
  isOwn?: boolean;
  onMarkRead?: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onPin?: (id: string, pinned: boolean) => Promise<void>;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (id: string) => Promise<void>;
  onShare?: (announcement: Announcement) => void;
  onStats?: (announcement: Announcement) => void;
  variant?: 'list' | 'grid';
  showActions?: boolean;
}

// ─── List View (default for mobile) ──────────────────────────────────────────
function NoticeCardList({
  announcement,
  currentUserId,
  currentRole,
  isOwn,
  onMarkRead,
  onArchive,
  onRestore,
  onPin,
  onEdit,
  onDelete,
  onShare,
  showActions = true,
}: NoticeCardProps) {
  const config = getPriorityConfig(announcement.priority);
  const Icon = config.icon;
  const isRead = announcement.readBy?.includes(currentUserId);
  const isAdmin = currentRole === 'admin';

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 transition-all ${
        announcement.isPinned
          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10'
          : announcement.isArchived
          ? 'border-zinc-200 dark:border-zinc-800 opacity-60'
          : isRead
          ? 'border-zinc-200 dark:border-zinc-800'
          : `${config.border} ring-1 ${config.ring}`
      }`}
    >
      {/* Priority badge + pinned + unread dot */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        {announcement.isPinned && (
          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
            <Pin className="w-3 h-3" />
            Pinned
          </span>
        )}
        {announcement.isArchived && (
          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Archived
          </span>
        )}
        {!isOwn && isAdmin && (
          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            School-wide
          </span>
        )}
        {!isRead && !announcement.isArchived && (
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{announcement.title}</h3>

      {/* Message */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{announcement.message}</p>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTimestamp(announcement.createdAt)}
          </span>
          <span>by {announcement.createdByName}</span>
          {announcement.targetClasses && announcement.targetClasses.length > 0 && (
            <span>Classes: {announcement.targetClasses.join(', ')}</span>
          )}
          {announcement.readBy && announcement.readBy.length > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {announcement.readBy.length} read
            </span>
          )}
        </div>

        {/* Actions — all 44px+ touch targets */}
        {showActions && (
          <div className="flex items-center gap-1">
            {!isAdmin && !isRead && !announcement.isArchived && onMarkRead && (
              <button
                onClick={() => onMarkRead(announcement.id)}
                className="flex items-center gap-1 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold min-h-[44px] transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Mark read
              </button>
            )}

            {isOwn && !announcement.isArchived && (
              <>
                {onPin && (
                  <button
                    onClick={() => onPin(announcement.id, !announcement.isPinned)}
                    className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                    title={announcement.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-4 h-4 ${announcement.isPinned ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`} />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(announcement)}
                    className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={() => onArchive(announcement.id)}
                    className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(announcement.id)}
                    className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                  </button>
                )}
              </>
            )}

            {isOwn && announcement.isArchived && onRestore && (
              <button
                onClick={() => onRestore(announcement.id)}
                className="p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                title="Restore"
              >
                <RotateCcw className="w-4 h-4 text-emerald-500" />
              </button>
            )}

            {isAdmin && !isOwn && !announcement.isArchived && onShare && (
              <button
                onClick={() => onShare(announcement)}
                className="p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                title="Share on WhatsApp"
              >
                <Share2 className="w-4 h-4 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Grid View (desktop admin) ───────────────────────────────────────────────
function NoticeCardGrid({
  announcement,
  currentUserId,
  currentRole,
  isOwn,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
  onShare,
  onStats,
}: NoticeCardProps) {
  const config = getPriorityConfig(announcement.priority);
  const Icon = config.icon;
  const isRead = announcement.readBy?.includes(currentUserId);
  const isAdmin = currentRole === 'admin';

  return (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-zinc-900/40 backdrop-blur-2xl rounded-3xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
        announcement.isPinned
          ? 'border-indigo-500 shadow-indigo-500/10'
          : config.borderFull
      }`}
    >
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-zinc-500/5 blur-[80px] rounded-full group-hover:bg-zinc-500/10 transition-all" />

      <div className="p-6 space-y-4 relative z-10">
        {/* Icon + actions */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl ${config.bg} ${config.text}`}>
            <Icon size={24} />
          </div>
          <div className="flex items-center gap-2">
            {announcement.isPinned && <Pin size={16} className="text-indigo-500 fill-indigo-500" />}
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {announcement.isArchived && onRestore ? (
                  <button
                    onClick={() => onRestore(announcement.id)}
                    className="p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : (
                  <>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(announcement)}
                        className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {onArchive && (
                      <button
                        onClick={() => onArchive(announcement.id)}
                        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(announcement.id)}
                        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${config.text} mb-1 block`}>
            {config.label}
          </span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight">
            {announcement.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
            {announcement.message}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium">by {announcement.createdByName}</span>
            <span className="text-[10px] text-zinc-500">{formatDate(announcement.createdAt)}</span>
          </div>
          <div className="flex gap-2">
            {onStats && (
              <button
                onClick={() => onStats(announcement)}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="View read statistics"
              >
                <Eye size={18} />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(announcement)}
                className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Share2 size={18} />
              </button>
            )}
            {!isAdmin && !isRead && (
              <span className="flex items-center gap-1 px-3 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold min-h-[44px]">
                <Eye size={14} />
                Unread
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function NoticeCard(props: NoticeCardProps) {
  const { variant = 'list' } = props;
  return variant === 'grid' ? <NoticeCardGrid {...props} /> : <NoticeCardList {...props} />;
}
