import React, { useState, useEffect } from 'react';
import { Table, Clock, BookOpen, CalendarDays, User } from 'lucide-react';
import { User as UserType, ClassRoom, TimeTablePeriod } from '@/types';
import { db } from '@/services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { timetableService } from '@/services/timetableService';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: UserType;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_TIMETABLE_MAP: { [key: string]: TimeTablePeriod[] } = {
  Monday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: 'Suresh Verma' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'English', teacher: 'Priya Iyer' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Computer Science', teacher: 'Neha Gupta' },
    { period: 5, time: '11:50 AM - 12:35 PM', subject: 'Social Studies', teacher: 'Rajesh Kumar' },
  ],
  Tuesday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Science', teacher: 'Suresh Verma' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'Hindi', teacher: 'Meenakshi Sharma' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Physical Education', teacher: 'Coach Vikram' },
    { period: 5, time: '11:50 AM - 12:35 PM', subject: 'English', teacher: 'Priya Iyer' },
  ],
  Wednesday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'English', teacher: 'Priya Iyer' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'Science', teacher: 'Suresh Verma' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Social Studies', teacher: 'Rajesh Kumar' },
    { period: 5, time: '11:50 AM - 12:35 PM', subject: 'Library', teacher: 'Sunita Rao' },
  ],
  Thursday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Science', teacher: 'Suresh Verma' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'Computer Science', teacher: 'Neha Gupta' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Hindi', teacher: 'Meenakshi Sharma' },
    { period: 5, time: '11:50 AM - 12:35 PM', subject: 'Art & Craft', teacher: 'Ramesh Sen' },
  ],
  Friday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'Science', teacher: 'Suresh Verma' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'English', teacher: 'Priya Iyer' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Social Studies', teacher: 'Rajesh Kumar' },
    { period: 5, time: '11:50 AM - 12:35 PM', subject: 'Music', teacher: 'Pandit Ravi' },
  ],
  Saturday: [
    { period: 1, time: '08:00 AM - 08:45 AM', subject: 'Yoga & Wellness', teacher: 'Coach Vikram' },
    { period: 2, time: '08:50 AM - 09:35 AM', subject: 'Mathematics Revision', teacher: 'Anjali Sharma' },
    { period: 3, time: '09:40 AM - 10:25 AM', subject: 'Science Practical', teacher: 'Suresh Verma' },
    { period: 4, time: '11:00 AM - 11:45 AM', subject: 'Quiz & Debate', teacher: 'Priya Iyer' },
  ],
};

const StudentTimetable: React.FC<Props> = ({ user }) => {
  const [timetable, setTimetable] = useState<{ [key: string]: TimeTablePeriod[] }>(DEFAULT_TIMETABLE_MAP);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]!);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setTimetable(DEFAULT_TIMETABLE_MAP);
      setLoading(false);
      return;
    }
    if (!user?.schoolId || !user?.classId) {
      setTimetable(DEFAULT_TIMETABLE_MAP);
      setLoading(false);
      return;
    }

    const classRef = doc(db, 'schools', user.schoolId, 'timetables', user.classId);
    const unsubscribe = onSnapshot(classRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const entries = rawData.entries || [];
        const mapped = timetableService.transformEntriesToMap(entries);
        const hasAny = Object.values(mapped).some(arr => arr.length > 0);
        setTimetable(hasAny ? mapped : DEFAULT_TIMETABLE_MAP);
      } else {
        setTimetable(DEFAULT_TIMETABLE_MAP);
      }
      setLoading(false);
    }, (err) => {
      console.error("Timetable subscription error:", err);
      setTimetable(DEFAULT_TIMETABLE_MAP);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.schoolId, user?.classId]);

  const todaySchedule = timetable[selectedDay] || [];

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse flex-shrink-0" />)}
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Timetable</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Your weekly class schedule</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap min-h-[44px] ${
              selectedDay === day
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {todaySchedule.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Classes</h3>
          <p className="text-sm text-slate-500">No schedule found for {selectedDay}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600"><Table size={18} /></div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedDay}'s Schedule</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{todaySchedule.length} periods</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todaySchedule.map((period: TimeTablePeriod, index: any) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <BookOpen size={14} className="text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{period.subject}</h4>
                    </div>
                    {period.teacher && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <User size={12} />
                        {period.teacher}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={14} />
                  <span className="text-xs font-bold">{period.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
