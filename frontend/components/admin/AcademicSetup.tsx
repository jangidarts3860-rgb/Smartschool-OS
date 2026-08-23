import React, { useState, useEffect } from 'react';
import { Book, Clock, Plus, Trash2, Save, X, AlertTriangle, Layers } from 'lucide-react';
import { Subject, TimeSlot } from '@/types';
import toast from 'react-hot-toast';
import { db } from '@/services/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const AcademicSetup: React.FC<{ onBack?: () => void; schoolId?: string }> = ({ onBack, schoolId }) => {
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'TIMING'>('SUBJECTS');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  const MOCK_DEFAULT_SUBJECTS: Subject[] = [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH101' },
    { id: 'sub-2', name: 'Science', code: 'SCI101' },
    { id: 'sub-3', name: 'English Literature', code: 'ENG101' },
    { id: 'sub-4', name: 'Social Studies', code: 'SST101' },
    { id: 'sub-5', name: 'Computer Science', code: 'CS101' },
    { id: 'sub-6', name: 'Hindi Sahitya', code: 'HIN101' }
  ];

  const MOCK_DEFAULT_SLOTS: TimeSlot[] = [
    { id: 'slot-1', label: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'ACADEMIC' },
    { id: 'slot-2', label: 'Period 2', startTime: '08:45', endTime: '09:30', type: 'ACADEMIC' },
    { id: 'slot-3', label: 'Recess Break', startTime: '09:30', endTime: '10:00', type: 'BREAK' },
    { id: 'slot-4', label: 'Period 3', startTime: '10:00', endTime: '10:45', type: 'ACADEMIC' },
    { id: 'slot-5', label: 'Period 4', startTime: '10:45', endTime: '11:30', type: 'ACADEMIC' },
    { id: 'slot-6', label: 'Lunch Break', startTime: '11:30', endTime: '12:15', type: 'BREAK' },
    { id: 'slot-7', label: 'Period 5', startTime: '12:15', endTime: '13:00', type: 'ACADEMIC' },
    { id: 'slot-8', label: 'Period 6', startTime: '13:00', endTime: '13:45', type: 'ACADEMIC' },
  ];

  useEffect(() => {
    if (IS_MOCK_MODE || !schoolId) {
      setSubjects(MOCK_DEFAULT_SUBJECTS);
      setTimeSlots(MOCK_DEFAULT_SLOTS);
      return;
    }

    const unsubSubjects = onSnapshot(collection(db, 'schools', schoolId, 'subjects'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Subject));
      setSubjects(docs.length > 0 ? docs : MOCK_DEFAULT_SUBJECTS);
    }, () => setSubjects(MOCK_DEFAULT_SUBJECTS));

    const unsubTimeSlots = onSnapshot(collection(db, 'schools', schoolId, 'timeSlots'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TimeSlot));
      setTimeSlots(docs.length > 0 ? docs : MOCK_DEFAULT_SLOTS);
    }, () => setTimeSlots(MOCK_DEFAULT_SLOTS));

    return () => { unsubSubjects(); unsubTimeSlots(); };
  }, [schoolId]);

  // Edit buffer for time slots
  const [editingSlots, setEditingSlots] = useState<Record<string, Partial<TimeSlot>>>({});
  const [isSavingSlots, setIsSavingSlots] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{type: 'SUBJECT' | 'SLOT', id: string} | null>(null);

  const handleAddSubject = async () => {
    if (!newSubName.trim() || !newSubCode.trim()) {
      return toast.error("Both Subject Name and Code are required");
    }

    const normalizedCode = newSubCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (subjects.some(s => s.code === normalizedCode)) {
      return toast.error(`Subject code ${normalizedCode} already exists!`);
    }

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      code: normalizedCode,
    };

    if (schoolId) {
      try {
        await addDoc(collection(db, 'schools', schoolId, 'subjects'), newSub);
      } catch {
        // fallback to local state
      }
    }

    setSubjects(prev => [...prev, newSub]);
    setNewSubName('');
    setNewSubCode('');
    toast.success("Subject added successfully");
  };

  const handleSlotFieldChange = (slotId: string, field: keyof TimeSlot, value: any) => {
    setEditingSlots(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], [field]: value }
    }));
  };

  const handleSaveSlots = async () => {
    const updates = Object.entries(editingSlots);
    if (updates.length === 0) {
      return toast.success('No changes to save');
    }

    setIsSavingSlots(true);
    if (schoolId) {
      try {
        for (const [slotId, patch] of updates) {
          await updateDoc(doc(db, 'schools', schoolId, 'timeSlots', slotId), patch);
        }
      } catch {
        // local update fallback
      }
    }

    setTimeSlots(prev => prev.map(s => editingSlots[s.id] ? { ...s, ...editingSlots[s.id] } : s));
    setEditingSlots({});
    setIsSavingSlots(false);
    toast.success('Time slots updated');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'SUBJECT') {
      if (schoolId) {
        try { await deleteDoc(doc(db, 'schools', schoolId, 'subjects', deleteTarget.id)); } catch {}
      }
      setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast.success("Subject deleted");
    } else {
      if (schoolId) {
        try { await deleteDoc(doc(db, 'schools', schoolId, 'timeSlots', deleteTarget.id)); } catch {}
      }
      setTimeSlots(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast.success("Time slot deleted");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg w-fit mb-2">
            <Layers size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Academic Architecture</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Academic Setup</h1>
          <p className="text-slate-500 font-medium text-sm">Configure subjects, department codes, and master class timetables</p>
        </div>

        {/* TABS SWITCHER */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'SUBJECTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Book size={16} /> Subjects
          </button>
          <button
            onClick={() => setActiveTab('TIMING')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'TIMING' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Clock size={16} /> Time Slots
          </button>
        </div>
      </div>

      {/* TAB 1: SUBJECTS */}
      {activeTab === 'SUBJECTS' && (
        <div className="space-y-8">
          {/* Add Subject Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Add New Subject</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Subject Name (e.g. Mathematics)"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-sm"
              />
              <input
                type="text"
                placeholder="Subject Code (e.g. MATH101)"
                value={newSubCode}
                onChange={e => setNewSubCode(e.target.value)}
                className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-sm"
              />
              <button
                onClick={handleAddSubject}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus size={16} /> Add Subject
              </button>
            </div>
          </div>

          {/* Subject List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => (
              <div key={sub.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                    <Book size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">{sub.name}</h4>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{sub.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget({ type: 'SUBJECT', id: sub.id })}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TIME SLOTS */}
      {activeTab === 'TIMING' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Master Period Schedule</h3>
              <p className="text-xs font-medium text-slate-400">Configure period start and end timings across the school</p>
            </div>
            <button
              onClick={handleSaveSlots}
              disabled={isSavingSlots}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save size={16} /> Save Timings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeSlots.map(slot => (
              <div key={slot.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">{slot.label}</span>
                  <button
                    onClick={() => setDeleteTarget({ type: 'SLOT', id: slot.id })}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start</label>
                    <input
                      type="time"
                      value={editingSlots[slot.id]?.startTime ?? slot.startTime}
                      onChange={e => handleSlotFieldChange(slot.id, 'startTime', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End</label>
                    <input
                      type="time"
                      value={editingSlots[slot.id]?.endTime ?? slot.endTime}
                      onChange={e => handleSlotFieldChange(slot.id, 'endTime', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirm Delete</h3>
            <p className="text-xs text-slate-500 font-medium">Are you sure you want to delete this {deleteTarget.type === 'SUBJECT' ? 'subject' : 'time slot'}?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicSetup;
