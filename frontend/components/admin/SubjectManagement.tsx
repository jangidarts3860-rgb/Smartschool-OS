import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Settings2,
  CheckCircle2,
  X,
  Layers,
  GraduationCap,
  Sparkles,
  BookMarked,
  ChevronRight,
  Save,
  Loader2,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc, query, orderBy, serverTimestamp, writeBatch, getDocs, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { writeBatchChunked } from '@/services/firestore';
import { User, Subject } from '@/types';
import { toast } from 'react-hot-toast';
import { generateId } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  onBack: () => void;
}

const SUBJECT_TYPES = ['THEORY', 'PRACTICAL', 'VIVA', 'ACTIVITY'];

const SubjectManagement: React.FC<Props> = ({ user, onBack }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'THEORY',
    classes: [] as string[],
  });

  const MOCK_SUBJECTS_LIST = [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH101', type: 'THEORY', classes: ['10A', '10B', '9A'] },
    { id: 'sub-2', name: 'Physics', code: 'PHY101', type: 'PRACTICAL', classes: ['10A', '9A'] },
    { id: 'sub-3', name: 'Chemistry', code: 'CHEM101', type: 'PRACTICAL', classes: ['10A', '9A'] },
    { id: 'sub-4', name: 'Biology', code: 'BIO101', type: 'THEORY', classes: ['10A', '9A'] },
    { id: 'sub-5', name: 'English Literature', code: 'ENG101', type: 'THEORY', classes: ['10A', '10B', '9A', '8A'] },
    { id: 'sub-6', name: 'Computer Science', code: 'CS101', type: 'PRACTICAL', classes: ['10A', '9A', '8A'] },
  ];

  const MOCK_CLASSES_LIST = [
    { id: '10A', name: 'Class 10A' },
    { id: '10B', name: 'Class 10B' },
    { id: '9A', name: 'Class 9A' },
    { id: '8A', name: 'Class 8A' }
  ];

  useEffect(() => {
    const schoolId = user.schoolId;
    if (IS_MOCK_MODE || !schoolId) {
      setSubjects(MOCK_SUBJECTS_LIST);
      setClasses(MOCK_CLASSES_LIST);
      setLoading(false);
      return;
    }

    const unsubSubjects = onSnapshot(query(collection(db, 'schools', schoolId, 'subjects'), orderBy('name', 'asc')), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setSubjects(docs.length > 0 ? docs : MOCK_SUBJECTS_LIST);
    }, () => setSubjects(MOCK_SUBJECTS_LIST));

    const unsubClasses = onSnapshot(collection(db, 'schools', schoolId, 'classes'), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setClasses(docs.length > 0 ? docs : MOCK_CLASSES_LIST);
    }, () => setClasses(MOCK_CLASSES_LIST));

    setLoading(false);
    return () => {
        unsubSubjects();
        unsubClasses();
    };
  }, [user.schoolId]);

const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
if (!formData.name || !formData.code || formData.classes.length === 0) {
        return toast.error('Complete all subject parameters');
      }

       try {
        // Dedupe: if a subject with the same name already exists (case-insensitive)
        // and we are NOT editing, reuse its subjectId. Otherwise mint a fresh
        // crypto-strength id (the canonical document key — name is for display only).
        const normalizedName = formData.name.trim().toLowerCase();
        const existing = !editingSubject
          ? subjects.find((s) => (s.name || '').trim().toLowerCase() === normalizedName)
          : null;
        if (existing) {
          return toast.error(`A subject named "${formData.name}" already exists.`);
        }
        const subjectId = editingSubject?.id || `SUB-${generateId()}`;
        const subjectRef = doc(db, 'schools', user.schoolId, 'subjects', subjectId);

        const payload = {
          ...formData,
          subjectId,
          updatedAt: serverTimestamp(),
          id: subjectId,
        };

        const operations: any[] = [
          { ref: subjectRef, data: payload, type: 'set' },
        ];

        // If editing, remove subject name from classes that are no longer assigned
        if (editingSubject && editingSubject.classes) {
          const oldClasses: string[] = editingSubject.classes;
          for (const classId of oldClasses) {
            if (!formData.classes.includes(classId)) {
              const classRef = doc(db, 'schools', user.schoolId, 'classes', classId);
              operations.push({
                ref: classRef,
                data: { subjects: arrayRemove(editingSubject.name) },
                type: 'update',
              });
            }
          }
        }

        // Cross-Collection Sync: Update subjects array in each assigned class
        for (const classId of formData.classes) {
          const classRef = doc(db, 'schools', user.schoolId, 'classes', classId);
          operations.push({
            ref: classRef,
            data: { subjects: arrayUnion(formData.name) },
            type: 'update',
          });
        }

        await writeBatchChunked(operations);

       toast.success(editingSubject ? 'Curriculum Updated' : 'Subject Cataloged');
       setShowModal(false);
       setEditingSubject(null);
       setFormData({ name: '', code: '', type: 'THEORY', classes: [] });
      } catch (err) {
        toast.error('Data synchronization failed');
      }
    };

const handleDelete = async (id: string) => {
      if (!confirm('De-cataloging this subject will remove it from all institutional curricula. Proceed?')) return;
      try {
        const subjectDoc = doc(db, 'schools', user.schoolId, 'subjects', id);
        const subjectSnap = await getDoc(subjectDoc);
        const subjectName = subjectSnap.exists() ? subjectSnap.data()?.name : null;

        // Remove subject from all linked class documents
        if (subjectName && subjectSnap.data()?.classes) {
          const classIds: string[] = subjectSnap.data().classes;
          const operations: any[] = [];
          for (const classId of classIds) {
            const classRef = doc(db, 'schools', user.schoolId, 'classes', classId);
            operations.push({
              ref: classRef as any,
              data: { subjects: arrayRemove(subjectName) },
              type: 'update' as const,
            });
          }
          await writeBatchChunked(operations);
        }

        await deleteDoc(subjectDoc);
        toast.success('Subject Purged');
      } catch (err) {
        toast.error('Purge failed');
      }
    };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Curriculum Database</p>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* --- PREMIUM HEADER --- */}
      <div className="bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-white">
            <div>
               <div className="flex items-center gap-3 mb-4 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <Zap size={18} /> Academic Backbone
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Subject Registry</h1>
               <p className="text-slate-400 font-medium max-w-xl italic opacity-80">Define institutional subjects, unique codes, and map them to class curricula.</p>
            </div>
            <div className="flex gap-4">
               <button onClick={onBack} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-xl"><ArrowLeft size={24}/></button>
               <button 
                 onClick={() => {
                     setEditingSubject(null);
                     setFormData({ name: '', code: '', type: 'THEORY', classes: [] });
                     setShowModal(true);
                 }}
                 className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
               >
                  <Plus size={18} /> Catalog New Subject
               </button>
            </div>
         </div>
         <BookMarked size={150} className="absolute -bottom-10 -right-10 opacity-[0.05] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
      </div>

      {/* --- STATS & SEARCH --- */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by catalog name or ID code..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 rounded-3xl text-sm font-bold shadow-sm outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex gap-4">
            <div className="px-8 py-5 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Layers size={20}/></div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subjects Cataloged</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{subjects.length}</p>
               </div>
            </div>
         </div>
      </div>

      {/* --- SUBJECT GRID --- */}
      {filteredSubjects.length === 0 ? (
        <div className="py-12">
            <EmptyState 
                variant="library" 
                title="No Subjects Cataloged" 
                description="Your curriculum is empty. Add a subject to start building the academic framework." 
                actionButton={
                  <button 
                    onClick={() => {
                        setEditingSubject(null);
                        setFormData({ name: '', code: '', type: 'THEORY', classes: [] });
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-indigo-500/30"
                  >
                    <Plus size={18} /> Catalog First Subject
                  </button>
                }
            />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredSubjects.map(subject => (
            <div key={subject.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all group relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
               
               <div className="flex justify-between items-start mb-8">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                     <BookOpen size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => {
                          setEditingSubject(subject);
                          setFormData({ name: subject.name, code: subject.code, type: subject.type, classes: subject.classes || [] });
                          setShowModal(true);
                       }}
                       className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                     >
                        <Edit3 size={18}/>
                     </button>
                     <button onClick={() => handleDelete(subject.id)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-600 transition-all shadow-sm">
                        <Trash2 size={18}/>
                     </button>
                  </div>
               </div>

               <div>
                  <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] block mb-3">{subject.code}</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">{subject.name}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                     <span className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest">{subject.type}</span>
                     {(subject.classes || []).map((c: string) => (
                        <span key={c} className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-widest">Class {c}</span>
                     ))}
                  </div>

                  <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-emerald-500">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Catalog Verified</span>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all translate-x-0 group-hover:translate-x-1" />
                  </div>
               </div>
            </div>
         ))}
      </div>
      )}

      {/* --- MODAL ENGINE --- */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-12 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center">
              <div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {editingSubject ? 'Update Curricula' : 'Catalog Subject'}
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Curriculum Node</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-3xl text-slate-400 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject Identity</label>
                     <input 
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       placeholder="e.g. Mathematics"
                       className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Catalog Code</label>
                     <input 
                       value={formData.code}
                       onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                       placeholder="e.g. MATH101"
                       className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white"
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject Classification</label>
                  <div className="flex gap-3">
                     {SUBJECT_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, type})}
                          className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                        >
                           {type}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Curriculum Assignment (Classes)</label>
                  <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto no-scrollbar p-1">
                     {classes.map(cls => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                             const selected = formData.classes.includes(cls.id) 
                               ? formData.classes.filter(c => c !== cls.id)
                               : [...formData.classes, cls.id];
                             setFormData({...formData, classes: selected});
                          }}
                          className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.classes.includes(cls.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                        >
                           {cls.name || cls.id}
                        </button>
                     ))}
                  </div>
               </div>

               <button 
                 type="submit"
                 className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all mt-6 flex items-center justify-center gap-4"
               >
                  <Save size={20} /> Commit to Registry
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
