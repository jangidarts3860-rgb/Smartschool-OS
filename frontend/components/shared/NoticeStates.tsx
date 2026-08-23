import { Megaphone, CheckCircle2, Search, Bell } from 'lucide-react';

// ─── Skeleton Card ───────────────────────────────────────────────────────────
export function NoticeSkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

// ─── Skeleton Stat ───────────────────────────────────────────────────────────
export function NoticeSkeletonStat() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
      <div className="h-7 w-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

// ─── Skeleton Grid (for admin) ───────────────────────────────────────────────
export function NoticeSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function NoticeEmpty({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Megaphone className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {title || 'No notices yet'}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
        {description || 'School announcements will appear here. Check back later.'}
      </p>
    </div>
  );
}

// ─── All Read State ──────────────────────────────────────────────────────────
export function NoticeAllRead() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">All caught up</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
        You have read all your notices. Great job staying informed.
      </p>
    </div>
  );
}

// ─── No Results (search/filter) ──────────────────────────────────────────────
export function NoticeNoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">No matching notices</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
        Try adjusting your search or filter criteria.
      </p>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────
export function NoticeError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Bell className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Something went wrong</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold min-h-[44px]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
