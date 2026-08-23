import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface MonthlyCalendarGridProps {
  records: AttendanceRecord[];
  month: number;
  year: number;
  onDayTap?: (date: string, record: AttendanceRecord | undefined) => void;
  onMonthChange?: (month: number, year: number) => void;
  showContactButton?: boolean;
  onContactSchool?: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  records,
  month,
  year,
  onDayTap,
  onMonthChange,
  showContactButton,
  onContactSchool,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]!;
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach(r => {
      if (r.date) map.set(r.date, r);
    });
    return map;
  }, [records]);

  const prevMonth = () => {
    if (month === 0) return;
    if (onMonthChange) {
      onMonthChange(month - 1, year);
    } else {
      onDayTap?.('__nav__', undefined);
    }
  };

  const nextMonth = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return;
    if (onMonthChange) {
      onMonthChange(month + 1, year);
    } else {
      onDayTap?.('__nav__', undefined);
    }
  };

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[40px] md:min-h-[52px]" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = recordMap.get(dateStr);
    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;

    let cellClass = 'min-h-[40px] md:min-h-[52px] rounded-xl flex flex-col items-center justify-center text-xs md:text-sm font-bold transition-all cursor-pointer ';

    if (record) {
      switch (record.status) {
        case 'PRESENT':
          cellClass += 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ';
          break;
        case 'ABSENT':
          cellClass += 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ';
          break;
        case 'LATE':
          cellClass += 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ';
          break;
        default:
          cellClass += 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 ';
      }
    } else if (isFuture) {
      cellClass += 'bg-transparent text-zinc-300 dark:text-zinc-700 cursor-default ';
    } else {
      cellClass += 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 ';
    }

    if (isToday) {
      cellClass += 'ring-2 ring-indigo-500 dark:ring-indigo-400 ';
    }

    cells.push(
      <div
        key={dateStr}
        className={cellClass}
        onClick={() => !isFuture && onDayTap?.(dateStr, record)}
        role="button"
        tabIndex={isFuture ? -1 : 0}
        aria-label={`${dateStr}: ${record?.status || 'No record'}`}
      >
        <span className="text-[10px] md:text-xs font-bold">{day}</span>
        {record && (
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider mt-0.5">
            {record.status === 'PRESENT' ? 'P' : record.status === 'ABSENT' ? 'A' : 'L'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={month === 0}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base md:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          disabled={year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth())}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 py-2">
            {d}
          </div>
        ))}
        {cells}
      </div>

      {showContactButton && onContactSchool && (
        <button
          onClick={onContactSchool}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
        >
          Contact School
        </button>
      )}
    </div>
  );
};

export default MonthlyCalendarGrid;
