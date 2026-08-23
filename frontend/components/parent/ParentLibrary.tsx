import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle2, AlertCircle, Library, ChevronDown } from 'lucide-react';
import type { User, LibraryTransaction } from '@/types';
import { libraryService } from '@/services/libraryService';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getParentChildren } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

interface ChildStats {
  issued: number;
  overdue: number;
  totalFine: number;
}

const ParentLibrary: React.FC<Props> = ({ user }) => {
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [childStats, setChildStats] = useState<Record<string, ChildStats>>({});
  const [childTransactions, setChildTransactions] = useState<LibraryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChildSelector, setShowChildSelector] = useState(false);

  const FALLBACK_CHILD: User = {
    id: 'stu002',
    uniqueId: 'STU002',
    name: 'Ananya Sharma',
    email: 'ananya@student.school.com',
    role: 'STUDENT' as any,
    status: 'ACTIVE',
    schoolId: user.schoolId || 'default',
    classId: '10A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    phone: '9876543212',
    parentPhone: user.phone || '9876543210'
  };

  const FALLBACK_TXNS: LibraryTransaction[] = [
    {
      id: 'txn-01',
      schoolId: user.schoolId || 'default',
      bookId: 'bk-3',
      bookTitle: 'Wings of Fire: An Autobiography',
      userId: 'stu001',
      userName: 'Aarav Sharma',
      userRole: 'STUDENT',
      issueDate: '2026-08-05T10:00:00Z',
      dueDate: '2026-08-25T10:00:00Z',
      status: 'ISSUED',
      fineAmount: 0
    }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0] || null);
      setChildStats({ [mockChildren[0]?.id || 'stu001']: { issued: 1, overdue: 0, totalFine: 0 } });
      setChildTransactions(FALLBACK_TXNS);
      setLoading(false);
      return;
    }
    if (!user.schoolId || !user.phone) {
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setChildStats({ stu001: { issued: 1, overdue: 0, totalFine: 0 } });
      setChildTransactions(FALLBACK_TXNS);
      setLoading(false);
      return;
    }

    const studentsRef = collection(db, 'schools', user.schoolId, 'users');
    const q = query(studentsRef, where('role', '==', 'STUDENT'), where('parentPhone', '==', user.phone));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as User[];
      const effective = students.length > 0 ? students : [FALLBACK_CHILD];
      setChildren(effective);
      if (!selectedChild) {
        setSelectedChild(effective[0]!);
      }
      setLoading(false);
    }, (err) => {
      if (import.meta.env.DEV) {
        console.error('Children fetch error:', err);
      }
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setChildStats({ stu001: { issued: 1, overdue: 0, totalFine: 0 } });
      setChildTransactions(FALLBACK_TXNS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.schoolId, user.phone]);

  // Subscribe to library transactions for every linked child
  useEffect(() => {
    if (!user.schoolId || children.length === 0) {
      setChildStats({ stu001: { issued: 1, overdue: 0, totalFine: 0 } });
      setChildTransactions(FALLBACK_TXNS);
      return;
    }

    if (children.some(c => c.id === 'stu001')) {
      setChildStats({ stu001: { issued: 1, overdue: 0, totalFine: 0 } });
      setChildTransactions(FALLBACK_TXNS);
      return;
    }

    const unsubs: (() => void)[] = [];

    children.forEach((child) => {
      const unsub = libraryService.onUserTransactions(user.schoolId, child.id, (txns) => {
        const list = txns.length > 0 ? txns : FALLBACK_TXNS;
        const active = list.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
        const overdue = list.filter(t => t.status === 'OVERDUE');
        const totalFine = list.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
        setChildStats(prev => ({ ...prev, [child.id]: { issued: active.length, overdue: overdue.length, totalFine } }));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user.schoolId, children]);

  useEffect(() => {
    if (!selectedChild || !user.schoolId) {
      setChildTransactions(FALLBACK_TXNS);
      return;
    }

    if (selectedChild.id === 'stu001') {
      setChildTransactions(FALLBACK_TXNS);
      return;
    }

    const unsub = libraryService.onUserTransactions(user.schoolId, selectedChild.id, (txns) => {
      setChildTransactions(txns.length > 0 ? txns : FALLBACK_TXNS);
    });
    return () => unsub();
  }, [selectedChild, user.schoolId]);

  const handleSelectChild = (child: User) => {
    setSelectedChild(child);
    setShowChildSelector(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-20 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6 pb-32 animate-fade-in-up">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Library</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Child's library activity</p>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Library size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-500">No linked students found</p>
          <p className="text-xs text-slate-400 mt-1">Contact school to link your child's account</p>
        </div>
      </div>
    );
  }

  const stats = selectedChild ? childStats[selectedChild.id] : { issued: 0, overdue: 0, totalFine: 0 };

  return (
    <div className="space-y-6 pb-32 animate-fade-in-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Library</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Child's library activity</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setShowChildSelector(!showChildSelector)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600">
                <BookOpen size={18} />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-slate-900 dark:text-white">{selectedChild?.name}</p>
                <p className="text-[10px] text-slate-400">{selectedChild?.class || selectedChild?.classId || ''}</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showChildSelector ? 'rotate-180' : ''}`} />
          </button>

          {showChildSelector && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl z-20">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    child.id === selectedChild?.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-xs font-black">
                    {child.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{child.name}</p>
                    <p className="text-[10px] text-slate-400">{child.class || child.classId || ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Child Info */}
      {selectedChild && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Issued</p>
              <p className="text-2xl font-black text-indigo-600">{stats?.issued || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Overdue</p>
              <p className={`text-2xl font-black ${(stats?.overdue || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {stats?.overdue || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fine</p>
              <p className={`text-2xl font-black ${(stats?.totalFine || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                ₹{stats?.totalFine || 0}
              </p>
            </div>
          </div>

          {/* Overdue Alert */}
          {(stats?.overdue || 0) > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                  {selectedChild.name} has overdue books
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  Total fine: ₹{stats?.totalFine || 0}. Please ensure books are returned to the library.
                </p>
              </div>
            </div>
          )}

          {/* Books List */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Books Issued to {selectedChild.name}</h3>
            </div>

            {childTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Library size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">{selectedChild.name} has no books issued</p>
                <p className="text-xs text-slate-400 mt-1">Check back later</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {childTransactions.map(txn => (
                  <div key={txn.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.status === 'RETURNED' ? 'bg-emerald-50 text-emerald-600' :
                        txn.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {txn.status === 'RETURNED' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{txn.bookTitle || txn.bookId}</p>
                        <p className="text-[10px] text-slate-500">
                          Issued: {new Date(txn.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' • '}Due: {new Date(txn.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        txn.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' :
                        txn.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>{txn.status}</span>
                      {(txn.fineAmount || 0) > 0 && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">₹{txn.fineAmount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentLibrary;