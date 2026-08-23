import { useState, useEffect } from 'react';
import { X, Eye, Users, Loader2, CheckCircle2 } from 'lucide-react';
import type { Announcement } from '@/types';
import { getReadStats } from '@/services/notices';
import { db } from '@/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Props {
  schoolId: string;
  announcement: Announcement;
  onClose: () => void;
}

export default function ReadStatsModal({ schoolId, announcement, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ readCount: number; totalCount: number; percentage: number } | null>(null);
  const [readUsers, setReadUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [unseenUsers, setUnseenUsers] = useState<{ id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const readStats = await getReadStats(schoolId, announcement.id, 0);

        const usersRef = collection(db, 'schools', schoolId, 'users');
        const targetRoles = announcement.visibleTo;
        const q = query(usersRef, where('role', 'in', targetRoles.map(r => r.toUpperCase())));
        const snap = await getDocs(q);
        const allUsers = snap.docs.map((d: any) => ({ id: d.id, name: d.data().name || 'Unknown', role: (d.data().role || '').toLowerCase() }));

        const read = allUsers.filter((u: any) => announcement.readBy?.includes(u.id));
        const unseen = allUsers.filter((u: any) => !announcement.readBy?.includes(u.id));

        setStats({
          readCount: read.length,
          totalCount: allUsers.length,
          percentage: allUsers.length > 0 ? Math.round((read.length / allUsers.length) * 100) : 0,
        });
        setReadUsers(read);
        setUnseenUsers(unseen);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, announcement]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-950 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Read Statistics</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Notice info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{announcement.title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Visible to: {announcement.visibleTo.join(', ')}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Big percentage */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-200 dark:text-zinc-800" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-indigo-600 dark:text-indigo-400" strokeDasharray={`${stats.percentage * 3.14} ${314 - stats.percentage * 3.14}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.percentage}%</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">read</span>
                  </div>
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.readCount}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Read</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Users className="w-5 h-5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{stats.totalCount}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total</p>
                  </div>
                </div>
              </div>

              {/* Read users list */}
              {readUsers.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Read by ({readUsers.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {readUsers.slice(0, 20).map(u => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate">{u.name}</span>
                        <span className="text-xs text-zinc-400 capitalize ml-2">{u.role}</span>
                      </div>
                    ))}
                    {readUsers.length > 20 && (
                      <p className="text-xs text-zinc-400 text-center py-1">+{readUsers.length - 20} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Unseen users list */}
              {unseenUsers.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Not yet read ({unseenUsers.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {unseenUsers.slice(0, 20).map(u => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400 truncate">{u.name}</span>
                        <span className="text-xs text-zinc-400 capitalize ml-2">{u.role}</span>
                      </div>
                    ))}
                    {unseenUsers.length > 20 && (
                      <p className="text-xs text-zinc-400 text-center py-1">+{unseenUsers.length - 20} more</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">Unable to load statistics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
