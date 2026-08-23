import React, { useState } from 'react';
import { Plus, Users, Edit, Trash2, Clock, User as UserIcon, X, Save, AlertTriangle, Layers } from 'lucide-react';
import { User as UserType, UserRole } from '@/types';
import { db } from '@/services/firebase';
import { collection, doc, setDoc, query, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useSchoolData } from '@/hooks/useFirestore';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface TimeTablePeriod {
  time: string;
  subject: string;
  teacher: string;
}

interface ClassRoom {
  id: string;
  name: string;
  section: string;
  schoolId: string;
  capacity: number;
  studentCount: number;
  classTeacherId: string;
  classTeacherName: string;
  timeTable?: Record<string, TimeTablePeriod[]>;
}

interface Props {
  user: UserType;
}

const ClassManagement: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useSchoolData(user.schoolId);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newCapacity, setNewCapacity] = useState(50);
  const [newTeacher, setNewTeacher] = useState('');

  const MOCK_CLASSROOMS: ClassRoom[] = [
    { id: 'c1', name: '10', section: 'A', schoolId: 'SCH01', capacity: 45, studentCount: 42, classTeacherId: 't1', classTeacherName: 'Anjali Sharma' },
    { id: 'c2', name: '10', section: 'B', schoolId: 'SCH01', capacity: 45, studentCount: 40, classTeacherId: 't4', classTeacherName: 'Suresh Verma' },
    { id: 'c3', name: '9', section: 'A', schoolId: 'SCH01', capacity: 45, studentCount: 44, classTeacherId: 't3', classTeacherName: 'Priya Iyer' },
    { id: 'c4', name: '8', section: 'A', schoolId: 'SCH01', capacity: 50, studentCount: 48, classTeacherId: 't2', classTeacherName: 'Rajesh Kumar' },
    { id: 'c5', name: '7', section: 'A', schoolId: 'SCH01', capacity: 50, studentCount: 46, classTeacherId: 't5', classTeacherName: 'Neha Gupta' },
  ];

  // Fetch Classes from Firestore
  React.useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setClasses(MOCK_CLASSROOMS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const q = query(collection(db, 'schools', user.schoolId, 'classes'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setClasses(items.length > 0 ? (items as any) : MOCK_CLASSROOMS);
      setIsLoading(false);
    }, () => {
      setClasses(MOCK_CLASSROOMS);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user.schoolId]);

  const resetForm = () => {
    setNewClassName('');
    setNewSection('');
    setNewCapacity(50);
    setNewTeacher('');
    setEditingClass(null);
  };

  const availableTeachers = users.filter(u => u.role === UserRole.TEACHER);

  const handleAddClass = async () => {
    if (!newClassName || !newSection || !newTeacher) {
      return toast.error("Please select Class, Section and Teacher");
    }

    const classId = `${newClassName}${newSection}`;
    const teacherName = users.find(u => u.id === newTeacher)?.name || 'Teacher';

    const newCls: ClassRoom = {
      id: editingClass ? editingClass.id : classId,
      name: newClassName,
      section: newSection,
      capacity: newCapacity,
      studentCount: editingClass ? editingClass.studentCount : 40,
      classTeacherId: newTeacher,
      classTeacherName: teacherName,
      schoolId: user.schoolId || 'SCH01'
    };

    if (user.schoolId) {
      try {
        await setDoc(doc(db, 'schools', user.schoolId, 'classes', newCls.id), newCls, { merge: true });
      } catch {}
    }

    setClasses(prev => {
      const exists = prev.some(c => c.id === newCls.id);
      if (exists) return prev.map(c => c.id === newCls.id ? newCls : c);
      return [...prev, newCls];
    });

    toast.success(`Class ${classId} saved successfully!`);
    setShowModal(false);
    resetForm();
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    if (user.schoolId) {
      try { await deleteDoc(doc(db, 'schools', user.schoolId, 'classes', classToDelete.id)); } catch {}
    }
    setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
    toast.success(`Class ${classToDelete.name}-${classToDelete.section} deleted`);
    setClassToDelete(null);
  };

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full transform translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
         
         <div className="relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 text-indigo-100 rounded-full w-fit mb-3 backdrop-blur-md">
            <Layers size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Class Architecture</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Classes & Sections</h1>
          <p className="text-indigo-200 font-medium text-sm max-w-xl">Manage class rosters, assigned class teachers, and capacity limits.</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="relative z-10 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus size={16} /> Create New Class
        </button>
      </div>

      {/* CLASS GRID */}
      {classes.length === 0 ? (
        <div className="py-12">
            <EmptyState 
                variant="generic" 
                title="No Classes Configured" 
                description="Create your first class to start managing sections and students." 
                actionButton={
                  <button 
                    onClick={() => {
                      setEditingClass(null);
                      setNewClassName('');
                      setNewSection('');
                      setNewCapacity(40);
                      setNewTeacher('');
                      setShowModal(true);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-indigo-500/30"
                  >
                    <Plus size={18} /> Create First Class
                  </button>
                }
            />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                {cls.name}{cls.section}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingClass(cls);
                    setNewClassName(cls.name);
                    setNewSection(cls.section);
                    setNewCapacity(cls.capacity);
                    setNewTeacher(cls.classTeacherId);
                    setShowModal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setClassToDelete(cls)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Class {cls.name}-{cls.section}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                <UserIcon size={14} className="text-indigo-500" />
                Teacher: <span className="text-slate-700 dark:text-slate-300">{cls.classTeacherName || 'Unassigned'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Enrolled</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{cls.studentCount} Students</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Capacity</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{cls.capacity} Seats</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingClass ? 'Edit Class' : 'Create Class'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class Grade</label>
                <select
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm"
                >
                  <option value="">Select Grade</option>
                  {['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Section</label>
                <select
                  value={newSection}
                  onChange={e => setNewSection(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm"
                >
                  <option value="">Select Section</option>
                  {['A', 'B', 'C', 'D'].map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class Teacher</label>
                <select
                  value={newTeacher}
                  onChange={e => setNewTeacher(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm"
                >
                  <option value="">Assign Teacher</option>
                  {availableTeachers.length > 0 ? (
                    availableTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  ) : (
                    ['Anjali Sharma', 'Suresh Verma', 'Priya Iyer', 'Rajesh Kumar'].map((tName, i) => (
                      <option key={i} value={`t${i + 1}`}>{tName}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddClass}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20"
            >
              Save Class
            </button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {classToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete Class {classToDelete.name}-{classToDelete.section}?</h3>
            <div className="flex gap-4">
              <button onClick={() => setClassToDelete(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase rounded-xl">Cancel</button>
              <button onClick={handleDeleteClass} className="flex-1 py-3 bg-red-600 text-white font-bold text-xs uppercase rounded-xl shadow-lg shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassManagement;
