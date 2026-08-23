import React, { useState, useCallback, useRef } from 'react';
import Avatar from './Avatar';

export interface FaceGridStudent {
  id: string;
  name: string;
  avatar?: string;
  rollNo?: string;
}

interface FaceGridProps {
  students: FaceGridStudent[];
  attendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | null>;
  onStatusChange: (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => void;
  isOffline: boolean;
}

const FaceGrid: React.FC<FaceGridProps> = ({
  students,
  attendance,
  onStatusChange,
  isOffline,
}) => {
  const [lastTap, setLastTap] = useState<Record<string, number>>({});
  const [longPressTimers, setLongPressTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [pressingId, setPressingId] = useState<string | null>(null);

  const handleTap = useCallback((studentId: string) => {
    const now = Date.now();
    const lastTapTime = lastTap[studentId] || 0;
    const isDoubleTap = (now - lastTapTime) < 300;

    if (isDoubleTap) {
      onStatusChange(studentId, 'ABSENT');
      setLastTap(prev => ({ ...prev, [studentId]: 0 }));
    } else {
      onStatusChange(studentId, 'PRESENT');
      setLastTap(prev => ({ ...prev, [studentId]: now }));
    }
  }, [lastTap, onStatusChange]);

  const handleTouchStart = useCallback((studentId: string) => {
    setPressingId(studentId);
    const timer = setTimeout(() => {
      onStatusChange(studentId, 'LATE');
      setPressingId(null);
    }, 500);
    setLongPressTimers(prev => ({ ...prev, [studentId]: timer }));
  }, [onStatusChange]);

  const handleTouchEnd = useCallback((studentId: string) => {
    const timer = longPressTimers[studentId];
    if (timer) {
      clearTimeout(timer);
      setLongPressTimers(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
    setPressingId(null);
  }, [longPressTimers]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusRing = (studentId: string) => {
    const status = attendance[studentId];
    switch (status) {
      case 'PRESENT': return 'ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'ABSENT': return 'ring-rose-500 bg-rose-50 dark:bg-rose-900/20';
      case 'LATE': return 'ring-amber-500 bg-amber-50 dark:bg-amber-900/20';
      default: return 'ring-slate-200 dark:ring-white/10 bg-slate-50 dark:bg-zinc-900';
    }
  };

  const getStatusLabel = (studentId: string) => {
    const status = attendance[studentId];
    if (!status) return '';
    return status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : 'L';
  };

  const markedCount = students.filter(s => attendance[s.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {markedCount}/{students.length} Marked
            </span>
          </div>
          <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <span>Gesture UX:</span>
            <span>Tap 1x = Present</span>
            <span>•</span>
            <span>Tap 2x = Absent</span>
            <span>•</span>
            <span>Hold = Late</span>
          </div>
        </div>
        {isOffline && (
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-widest self-start sm:self-auto">
            Offline
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {students.map(student => {
          const status = attendance[student.id];
          const isPressed = pressingId === student.id;

          return (
            <button
              key={student.id}
              onClick={() => handleTap(student.id)}
              onTouchStart={() => handleTouchStart(student.id)}
              onTouchEnd={() => handleTouchEnd(student.id)}
              onMouseDown={() => handleTouchStart(student.id)}
              onMouseUp={() => handleTouchEnd(student.id)}
              onMouseLeave={() => handleTouchEnd(student.id)}
              className={`
                relative flex flex-col items-center gap-1.5 p-2 rounded-2xl
                ring-2 transition-all duration-150
                ${getStatusRing(student.id)}
                ${isPressed ? 'scale-[0.95]' : 'hover:scale-[1.03] active:scale-[0.95]'}
              `}
              aria-label={`${student.name}: ${status || 'Not marked'}`}
            >
              <Avatar src={student.avatar} name={student.name} size="lg" />
              <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 truncate w-full text-center leading-tight">
                {student.name.split(' ')[0]}
              </span>
              {status && (
                <span className={`
                  absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center
                  text-[8px] font-black text-white
                  ${status === 'PRESENT' ? 'bg-emerald-500' : status === 'ABSENT' ? 'bg-rose-500' : 'bg-amber-500'}
                `}>
                  {getStatusLabel(student.id)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-sm font-bold text-zinc-500">No students in this class</p>
          <p className="text-xs text-zinc-400 mt-1">Add students to begin marking attendance</p>
        </div>
      )}
    </div>
  );
};

export default FaceGrid;
