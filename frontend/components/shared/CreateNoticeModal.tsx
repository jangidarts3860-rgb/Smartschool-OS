import { useState } from 'react';
import { Plus, X, Send, Pin, Loader2, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User, Announcement, AnnouncementPriority, AnnouncementTargetRole } from '@/types';
import { UserRole } from '@/types';
import { createAnnouncement, updateAnnouncement } from '@/services/notices';
import { getPriorityConfig } from './NoticeCard';

// ─── Props ───────────────────────────────────────────────────────────────────
export interface CreateNoticeModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
  editingNotice?: Announcement | null;
  availableClasses?: string[];
  restrictCritical?: boolean; // teachers cannot create critical
  restrictVisibleTo?: AnnouncementTargetRole[]; // limit who teachers can target
}

const DEFAULT_VISIBLE_TO: AnnouncementTargetRole[] = ['student', 'parent', 'teacher'];

// ─── Component ───────────────────────────────────────────────────────────────
export default function CreateNoticeModal({
  user,
  onClose,
  onSuccess,
  editingNotice,
  availableClasses = ['9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'],
  restrictCritical = false,
  restrictVisibleTo,
}: CreateNoticeModalProps) {
  const [title, setTitle] = useState(editingNotice?.title || '');
  const [message, setMessage] = useState(editingNotice?.message || '');
  const [priority, setPriority] = useState<AnnouncementPriority>(editingNotice?.priority || 'general');
  const [targetClasses, setTargetClasses] = useState<string[]>(editingNotice?.targetClasses || []);
  const [visibleTo, setVisibleTo] = useState<string[]>(editingNotice?.visibleTo || DEFAULT_VISIBLE_TO);
  const [isPinned, setIsPinned] = useState(editingNotice?.isPinned || false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(!!editingNotice?.scheduledAt);
  const [scheduledAt, setScheduledAt] = useState(editingNotice?.scheduledAt || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }
    if (visibleTo.length === 0) {
      toast.error('Select at least one audience');
      return;
    }

    setSubmitting(true);
    try {
      const scheduleValue = scheduleEnabled && scheduledAt ? scheduledAt : null;
      if (editingNotice) {
        await updateAnnouncement(user.schoolId, editingNotice.id, {
          title: title.trim(),
          message: message.trim(),
          priority,
          visibleTo: visibleTo as AnnouncementTargetRole[],
          targetClasses,
          isPinned,
          scheduledAt: scheduleValue,
        });
        toast.success(scheduleValue ? 'Notice scheduled' : 'Notice updated');
      } else {
        await createAnnouncement(user.schoolId, {
          title: title.trim(),
          message: message.trim(),
          priority,
          visibleTo: visibleTo as AnnouncementTargetRole[],
          targetClasses,
          createdBy: user.id,
          createdByName: user.name,
          createdByRole: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN ? 'admin' : 'teacher',
          isPinned,
          scheduledAt: scheduleValue,
        });
        toast.success(scheduleValue ? 'Notice scheduled' : 'Notice published');
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(editingNotice ? 'Failed to update notice' : 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTargetClass = (cls: string) => {
    setTargetClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleVisibleTo = (role: string) => {
    setVisibleTo((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const visibleToOptions: AnnouncementTargetRole[] = restrictVisibleTo || ['student', 'parent', 'teacher', 'admin'];
  const priorityOptions: AnnouncementPriority[] = restrictCritical ? ['general', 'urgent'] : ['general', 'urgent', 'critical'];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-950 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {editingNotice ? 'Edit Notice' : 'Create Notice'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winter Vacation Schedule"
              maxLength={100}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Details about the notice..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map((p) => {
                const config = getPriorityConfig(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border min-h-[44px] transition-all ${
                      priority === p
                        ? `${config.bg} ${config.text} ${config.border}`
                        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
            {restrictCritical && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Contact admin for school-wide critical alerts.</p>
            )}
          </div>

          {/* Visible To */}
          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Visible To</label>
            <div className="flex flex-wrap gap-2">
              {visibleToOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleVisibleTo(role)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border min-h-[44px] transition-all capitalize ${
                    visibleTo.includes(role)
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {role}s
                </button>
              ))}
            </div>
          </div>

          {/* Target Classes */}
          <div>
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
              Target Classes {targetClasses.length === 0 && <span className="normal-case text-zinc-400">(All classes)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleTargetClass(cls)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold border min-h-[44px] transition-all ${
                    targetClasses.includes(cls)
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border min-h-[44px] transition-all ${
                isPinned
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Pin className="w-4 h-4" />
              Pin notice
            </button>
          </div>

          {/* Schedule toggle */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border min-h-[44px] transition-all ${
                scheduleEnabled
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {scheduleEnabled ? 'Scheduled' : 'Schedule for later'}
            </button>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !message.trim() || visibleTo.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold min-h-[54px] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Saving...' : editingNotice ? 'Update Notice' : 'Publish Notice'}
          </button>
        </form>
      </div>
    </div>
  );
}
