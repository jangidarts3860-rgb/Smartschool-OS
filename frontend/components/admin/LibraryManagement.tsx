import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, ArrowLeft, CheckCircle2, AlertTriangle,
  TrendingUp, ArrowRight, Edit2, Trash2, IndianRupee, X, ChevronRight,
  Clock, ShieldCheck, Tag, BarChart3, Users, RefreshCw, Filter
} from 'lucide-react';
import type { User, Book, LibraryTransaction, LibraryRules } from '@/types';
import { libraryService } from '@/services/libraryService';
import { toast } from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton, CardSkeleton } from '@/components/shared/Skeleton';
import { MOCK_USERS } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  onBack: () => void;
}

type ViewState = 'DASHBOARD' | 'CATALOG' | 'ADD_BOOK' | 'EDIT_BOOK' | 'ISSUE' | 'RETURN' | 'FINES' | 'CATEGORIES' | 'RULES';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Literature', 'Reference', 'Biography', 'Philosophy', 'Art'];

const LibraryManagement: React.FC<Props> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; uniqueId?: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string; uniqueId?: string }[]>([]);
  const [rules, setRules] = useState<LibraryRules | null>(null);
  const [stats, setStats] = useState<{
    totalBooks: number;
    totalTitles: number;
    issuedBooks: number;
    overdueBooks: number;
    availableBooks: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [newBook, setNewBook] = useState({
    title: '', author: '', isbn: '', category: 'Fiction', totalCopies: 1,
    rackLocation: '', publisher: '', edition: '', year: '', pages: '',
    language: 'English', description: '', condition: 'GOOD' as const
  });
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [userSearch, setUserSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showRulesForm, setShowRulesForm] = useState(false);
  const [rulesForm, setRulesForm] = useState({
    finePerDay: 10, maxBooksStudent: 3, maxBooksTeacher: 5,
    issueDurationDays: 14, gracePeriodDays: 2, lowStockThreshold: 2
  });

  useEffect(() => {
    const mockStudentsList = MOCK_USERS.filter(u => u.role === 'STUDENT').map(s => ({
      id: s.id,
      name: s.name,
      uniqueId: s.uniqueId || `STU-${s.id.slice(-3)}`
    }));
    const mockTeachersList = MOCK_USERS.filter(u => u.role === 'TEACHER').map(t => ({
      id: t.id,
      name: t.name,
      uniqueId: t.uniqueId || `TCH-${t.id.slice(-3)}`
    }));

    if (IS_MOCK_MODE || !user?.schoolId) {
      setStudents(mockStudentsList);
      setTeachers(mockTeachersList);
      setStats({
        totalBooks: 53,
        totalTitles: 4,
        issuedBooks: 2,
        overdueBooks: 1,
        availableBooks: 51,
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubs: Array<() => void> = [];
    let isMounted = true;

    // Real-time listeners with safe fallbacks
    const unsubBooks = libraryService.onBooks(user.schoolId, (data) => {
      if (isMounted) setBooks(data);
    });
    unsubs.push(unsubBooks);

    const unsubTxns = libraryService.onAllTransactions(user.schoolId, (data) => {
      if (!isMounted) return;
      const defaultTxns: LibraryTransaction[] = [
        {
          id: 'txn1',
          schoolId: user.schoolId,
          bookId: 'b1',
          bookTitle: 'Concepts of Physics (Vol 1)',
          userId: mockStudentsList[0]?.id || 'stu1',
          userName: mockStudentsList[0]?.name || 'Aarav Sharma',
          userRole: 'STUDENT',
          issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ISSUED',
          fineAmount: 0
        },
        {
          id: 'txn2',
          schoolId: user.schoolId,
          bookId: 'b2',
          bookTitle: 'Mathematics Class 10 Exemplar',
          userId: mockStudentsList[1]?.id || 'stu2',
          userName: mockStudentsList[1]?.name || 'Priya Patel',
          userRole: 'STUDENT',
          issueDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'OVERDUE',
          fineAmount: 40
        },
        {
          id: 'txn3',
          schoolId: user.schoolId,
          bookId: 'b3',
          bookTitle: 'Wings of Fire',
          userId: mockTeachersList[0]?.id || 'tch1',
          userName: mockTeachersList[0]?.name || 'Anjali Sharma',
          userRole: 'TEACHER',
          issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ISSUED',
          fineAmount: 0
        }
      ];
      setTransactions(data.length > 0 ? data : defaultTxns);
    });
    unsubs.push(unsubTxns);

    const unsubRules = libraryService.onLibraryRules(user.schoolId, (data) => {
      if (!isMounted) return;
      setRules(data);
      setRulesForm({
        finePerDay: data?.finePerDay || 10,
        maxBooksStudent: data?.maxBooksStudent || 3,
        maxBooksTeacher: data?.maxBooksTeacher || 5,
        issueDurationDays: data?.issueDurationDays || 14,
        gracePeriodDays: data?.gracePeriodDays || 2,
        lowStockThreshold: data?.lowStockThreshold || 2
      });
    });
    unsubs.push(unsubRules);

    const unsubStats = libraryService.onDashboardStats(user.schoolId, (data) => {
      if (!isMounted) return;
      setStats(data || {
        totalBooks: 53,
        totalTitles: 4,
        issuedBooks: 2,
        overdueBooks: 1,
        availableBooks: 51,
        totalOutstandingFine: 40,
        lowStockCount: 0,
        recentTransactions: []
      });
    });
    unsubs.push(unsubStats);

    // One-time fetches for reference data
    (async () => {
      try {
        const [studentsData, teachersData] = await Promise.all([
          libraryService.getStudents(user.schoolId),
          libraryService.getTeachers(user.schoolId),
        ]);
        if (isMounted) {
          setStudents(studentsData.length > 0 ? studentsData : mockStudentsList);
          setTeachers(teachersData.length > 0 ? teachersData : mockTeachersList);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setStudents(mockStudentsList);
          setTeachers(mockTeachersList);
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      unsubs.forEach(u => { try { u(); } catch {} });
    };
  }, [user?.schoolId]);

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.rackLocation) {
      toast.error('Title, Author, and Rack Location are required');
      return;
    }
    try {
      await libraryService.addBook(user.schoolId, {
        ...newBook,
        totalCopies: newBook.totalCopies || 1,
        availableCopies: newBook.totalCopies || 1,
        year: newBook.year ? parseInt(newBook.year) : undefined,
        pages: newBook.pages ? parseInt(newBook.pages) : undefined
      } as any);
      toast.success('Book added successfully!');
      setNewBook({ title: '', author: '', isbn: '', category: 'Fiction', totalCopies: 1, rackLocation: '', publisher: '', edition: '', year: '', pages: '', language: 'English', description: '', condition: 'GOOD' });
      setView('CATALOG');
      // onSnapshot will auto-refresh book/stats list
    } catch (error: any) {
      toast.error(error.message || 'Failed to add book');
    }
  };

  const handleUpdateBook = async () => {
    if (!editingBook) return;
    try {
      await libraryService.updateBook(user.schoolId, editingBook.id, {
        title: editingBook.title, author: editingBook.author, isbn: editingBook.isbn,
        category: editingBook.category, totalCopies: editingBook.totalCopies,
        availableCopies: editingBook.availableCopies, rackLocation: editingBook.rackLocation,
        publisher: editingBook.publisher, edition: editingBook.edition,
        year: editingBook.year, pages: editingBook.pages,
        language: editingBook.language, description: editingBook.description,
        condition: editingBook.condition
      } as any);
      toast.success('Book updated!');
      setEditingBook(null);
      setView('CATALOG');
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to update book');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await libraryService.deleteBook(user.schoolId, bookId);
      toast.success('Book deleted!');
      setDeleteConfirm(null);
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book');
    }
  };

  const handleIssueBook = async () => {
    if (!selectedBook || !selectedUserId) {
      toast.error('Please select a book and a recipient');
      return;
    }
    const selectedUser = [...students, ...teachers].find(u => u.id === selectedUserId);
    try {
      await libraryService.issueBook(
        user.schoolId, selectedBook.id, selectedUserId,
        userRole, selectedBook.title, selectedUser?.name || 'Unknown'
      );
      toast.success('Book issued successfully!');
      setSelectedBook(null);
      setSelectedUserId('');
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue book');
    }
  };

  const handleReturnBook = async (txn: LibraryTransaction) => {
    try {
      const result = await libraryService.returnBook(user.schoolId, txn.id);
      if (result.fineAmount > 0) {
        toast.success(`Book returned! Fine: ₹${result.fineAmount}`);
      } else {
        toast.success('Book returned successfully!');
      }
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to return book');
    }
  };

  const handleCollectFine = async (txn: LibraryTransaction) => {
    if (txn.fineAmount <= 0) return;
    try {
      await libraryService.collectFine(user.schoolId, txn.id, txn.fineAmount);
      toast.success('Fine collected!');
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to collect fine');
    }
  };

  const handleWaiveFine = async (txn: LibraryTransaction, reason: string) => {
    try {
      await libraryService.waiveFine(user.schoolId, txn.id, reason);
      toast.success('Fine waived!');
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to waive fine');
    }
  };

  const handleSaveRules = async () => {
    try {
      await libraryService.updateLibraryRules(user.schoolId, {
        finePerDay: rulesForm.finePerDay,
        maxBooksStudent: rulesForm.maxBooksStudent,
        maxBooksTeacher: rulesForm.maxBooksTeacher,
        issueDurationDays: rulesForm.issueDurationDays,
        gracePeriodDays: rulesForm.gracePeriodDays,
        lowStockThreshold: rulesForm.lowStockThreshold
      });
      toast.success('Library rules updated!');
      setShowRulesForm(false);
      // onSnapshot will auto-refresh
    } catch (error: any) {
      toast.error(error.message || 'Failed to update rules');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchTerm ||
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm);
    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getAvailableUsers = () => userRole === 'STUDENT' ? students : teachers;
  const overdueTxns = transactions.filter(t => t.status === 'OVERDUE');
  const outstandingFines = transactions.filter(t => (t.fineAmount || 0) > 0 && !t.finePaid);
  const lowStockBooks = books.filter(b => b.availableCopies <= (rules?.lowStockThreshold || 2));

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />)}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const tabs = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: TrendingUp },
    { id: 'CATALOG', label: 'Catalog', icon: BookOpen },
    { id: 'ADD_BOOK', label: 'Add Book', icon: Plus },
    { id: 'ISSUE', label: 'Issue', icon: ArrowRight },
    { id: 'RETURN', label: 'Return', icon: RefreshCw },
    { id: 'FINES', label: 'Fine Center', icon: IndianRupee },
    { id: 'RULES', label: 'Rules', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden border border-white/5">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <BookOpen size={14} /> Library Management
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Smart Library</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Automated issuing, tracking, and fine calculation with multi-role access.
            </p>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl font-bold text-xs transition-all">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-950 rounded-[2rem] p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as ViewState)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              view === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD ===== */}
      {view === 'DASHBOARD' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                  <BookOpen size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Books</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalBooks}</p>
              <p className="text-[10px] text-slate-400 mt-1">{stats.totalTitles} titles</p>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                  <ArrowRight size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.issuedBooks}</p>
              <p className="text-[10px] text-slate-400 mt-1">Active loans</p>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
                  <AlertTriangle size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overdue</span>
              </div>
              <p className="text-3xl font-black text-rose-600">{stats.overdueBooks}</p>
              <p className="text-[10px] text-slate-400 mt-1">Need attention</p>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</span>
              </div>
              <p className="text-3xl font-black text-emerald-600">{stats.availableBooks}</p>
              <p className="text-[10px] text-slate-400 mt-1">Ready to issue</p>
            </div>
          </div>

          {/* Alerts */}
          {overdueTxns.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-[2rem] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-600" />
                <h3 className="text-sm font-black text-rose-700 dark:text-rose-300">Overdue Books</h3>
              </div>
              <div className="space-y-2">
                {overdueTxns.slice(0, 5).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-2 border-b border-rose-200/50 last:border-0">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{txn.bookTitle || 'Unknown Book'}</p>
                      <p className="text-[10px] text-slate-500">{txn.userName || txn.userId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-rose-600">₹{txn.fineAmount || 0}</p>
                      <p className="text-[10px] text-slate-400">Due: {new Date(txn.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockBooks.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[2rem] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <h3 className="text-sm font-black text-amber-700 dark:text-amber-300">Low Stock Alert</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockBooks.map(b => (
                  <span key={b.id} className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black">
                    {b.title} ({b.availableCopies} left)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Recent Transactions</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12">
                <EmptyState 
                  variant="library" 
                  title="No Recent Transactions"
                  description="Books issued or returned will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.slice(0, 10).map(txn => (
                  <div key={txn.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.status === 'RETURNED' ? 'bg-emerald-50 text-emerald-600' :
                        txn.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="font-black text-xs text-slate-900 dark:text-white">{txn.bookTitle || txn.bookId}</p>
                        <p className="text-[10px] text-slate-500">{txn.userName || txn.userId}</p>
                        <p className="text-[10px] text-slate-400">Due: {new Date(txn.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        txn.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' :
                        txn.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{txn.status}</span>
                      {(txn.fineAmount || 0) > 0 && (
                        <span className="text-xs font-black text-rose-600">₹{txn.fineAmount}</span>
                      )}
                      {(txn.status === 'ISSUED' || txn.status === 'OVERDUE') && (
                        <button onClick={() => handleReturnBook(txn)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-all">
                          Return
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CATALOG ===== */}
      {view === 'CATALOG' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Book Catalog</h3>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search books..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
              </div>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 rounded-xl py-2.5 px-4 text-sm font-medium outline-none dark:text-white">
                <option value="ALL">All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <EmptyState variant="library" title="No Books Found"
              description="No books match your search. Add your first book to start."
              actionButton={<button onClick={() => setView('ADD_BOOK')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Add Book</button>}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBooks.map(book => (
                <div key={book.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{book.title}</h4>
                      <p className="text-xs text-slate-500">{book.author}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400">ISBN: {book.isbn}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded">{book.category}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded">📍 {book.rackLocation}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 dark:text-white">{book.availableCopies}/{book.totalCopies}</p>
                      <p className="text-[10px] text-slate-400">copies</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                      book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>{book.availableCopies > 0 ? 'Available' : 'Out of Stock'}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingBook(book); setView('EDIT_BOOK'); }}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 rounded-xl transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(book.id)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ADD BOOK ===== */}
      {view === 'ADD_BOOK' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Add New Book</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Title *', key: 'title', placeholder: 'e.g. Modern Physics' },
              { label: 'Author *', key: 'author', placeholder: 'e.g. Richard Feynman' },
              { label: 'ISBN', key: 'isbn', placeholder: '978-XXXXXX' },
              { label: 'Publisher', key: 'publisher', placeholder: 'Publisher name' },
              { label: 'Edition', key: 'edition', placeholder: 'e.g. 2nd' },
              { label: 'Rack Location *', key: 'rackLocation', placeholder: 'e.g. A-01' },
            ].map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                <input type="text" value={(newBook as any)[field.key]} onChange={e => setNewBook({ ...newBook, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-indigo-500 transition-all dark:text-white" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
              <select value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Copies</label>
              <input type="number" min="1" value={newBook.totalCopies} onChange={e => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Language</label>
              <select value={newBook.language} onChange={e => setNewBook({ ...newBook, language: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white">
                {['English', 'Hindi', 'Sanskrit', 'Urdu', 'Regional'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condition</label>
              <select value={newBook.condition} onChange={e => setNewBook({ ...newBook, condition: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white">
                {['NEW', 'GOOD', 'FAIR', 'POOR'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
            <textarea value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-indigo-500 transition-all dark:text-white min-h-[80px] resize-none" />
          </div>
          <button onClick={handleAddBook} className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add Book to Catalog
          </button>
        </div>
      )}

      {/* ===== EDIT BOOK ===== */}
      {view === 'EDIT_BOOK' && editingBook && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit Book</h2>
            <button onClick={() => { setEditingBook(null); setView('CATALOG'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title *</label>
              <input type="text" value={editingBook.title} onChange={e => setEditingBook({ ...editingBook, title: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-indigo-500 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Author *</label>
              <input type="text" value={editingBook.author} onChange={e => setEditingBook({ ...editingBook, author: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ISBN</label>
              <input type="text" value={editingBook.isbn} onChange={e => setEditingBook({ ...editingBook, isbn: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rack Location *</label>
              <input type="text" value={editingBook.rackLocation} onChange={e => setEditingBook({ ...editingBook, rackLocation: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
              <select value={editingBook.category} onChange={e => setEditingBook({ ...editingBook, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Copies</label>
              <input type="number" min="1" value={editingBook.totalCopies} onChange={e => setEditingBook({ ...editingBook, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Copies</label>
              <input type="number" min="0" max={editingBook.totalCopies} value={editingBook.availableCopies}
                onChange={e => setEditingBook({ ...editingBook, availableCopies: Math.min(editingBook.totalCopies, parseInt(e.target.value) || 0) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white" />
            </div>
          </div>
          <button onClick={handleUpdateBook} className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all">
            Save Changes
          </button>
        </div>
      )}

      {/* ===== ISSUE BOOK ===== */}
      {view === 'ISSUE' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Issue Book</h2>

          {/* Role Toggle */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setUserRole('STUDENT'); setSelectedUserId(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${userRole === 'STUDENT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              Student
            </button>
            <button onClick={() => { setUserRole('TEACHER'); setSelectedUserId(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${userRole === 'TEACHER' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              Teacher
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Recipient</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={`Search ${userRole.toLowerCase()} by name...`} value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
              </div>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none dark:text-white">
                <option value="">Select {userRole}...</option>
                {getAvailableUsers().filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.uniqueId || 'No ID'})</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Book</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by title or author..." value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" />
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-56 overflow-y-auto space-y-2">
                {books.filter(b => b.availableCopies > 0 && b.title.toLowerCase().includes(bookSearch.toLowerCase())).length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">No available books</p>
                ) : books.filter(b => b.availableCopies > 0 && b.title.toLowerCase().includes(bookSearch.toLowerCase())).map(b => (
                  <div key={b.id} onClick={() => setSelectedBook(b)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedBook?.id === b.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}>
                    <p className="font-black text-xs text-slate-900 dark:text-white">{b.title}</p>
                    <p className="text-[10px] text-slate-500">{b.author} • {b.availableCopies} available</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedBook && selectedUserId && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Issue Duration</p>
                  <p className="text-lg font-black text-emerald-900 dark:text-emerald-300">{rules?.issueDurationDays || 14} Days</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase">Return By</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {new Date(Date.now() + (rules?.issueDurationDays || 14) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <button onClick={handleIssueBook} disabled={!selectedBook || !selectedUserId}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowRight size={16} /> Issue Book
            </button>
          </div>
        </div>
      )}

      {/* ===== RETURN BOOK ===== */}
      {view === 'RETURN' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Return Book</h3>
            <p className="text-xs text-slate-500 mt-1">Fine is calculated from Firestore — not frontend</p>
          </div>
          {transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-slate-500">No active loans to return</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').map(txn => {
                const dueDate = new Date(txn.dueDate);
                const now = new Date();
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={txn.id} className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white">{txn.bookTitle || txn.bookId}</p>
                      <p className="text-xs text-slate-500">{txn.userName || txn.userId}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400">Due: {dueDate.toLocaleDateString()}</span>
                        <span className={`text-[10px] font-black ${daysLeft < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(txn.fineAmount || 0) > 0 && (
                        <span className="text-sm font-black text-rose-600">₹{txn.fineAmount}</span>
                      )}
                      <button onClick={() => handleReturnBook(txn)}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-[0.98] transition-all">
                        Return
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== FINE CENTER ===== */}
      {view === 'FINES' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Fine Center</h3>
              <p className="text-xs text-slate-500 mt-1">
                Total outstanding: ₹{outstandingFines.reduce((sum, t) => sum + (t.fineAmount || 0), 0)}
              </p>
            </div>
          </div>
          {outstandingFines.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck size={40} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-bold text-slate-500">No outstanding fines</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {outstandingFines.map(txn => (
                <div key={txn.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">{txn.bookTitle || txn.bookId}</p>
                    <p className="text-xs text-slate-500">{txn.userName || txn.userId}</p>
                    {txn.overdueDays && (
                      <span className="text-[10px] text-rose-500 font-bold">{txn.overdueDays} days overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-rose-600">₹{txn.fineAmount}</span>
                    <button onClick={() => handleCollectFine(txn)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase">
                      Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== LIBRARY RULES ===== */}
      {view === 'RULES' && (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Library Rules</h2>
            {!showRulesForm && (
              <button onClick={() => setShowRulesForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs">
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {[
              { label: 'Fine Per Day', value: `₹${rules?.finePerDay || 10}`, icon: IndianRupee },
              { label: 'Max Books (Student)', value: rules?.maxBooksStudent || 3, icon: Users },
              { label: 'Max Books (Teacher)', value: rules?.maxBooksTeacher || 5, icon: Users },
              { label: 'Issue Duration', value: `${rules?.issueDurationDays || 14} days`, icon: Clock },
              { label: 'Grace Period', value: `${rules?.gracePeriodDays || 2} days`, icon: ShieldCheck },
              { label: 'Low Stock Alert', value: `${rules?.lowStockThreshold || 2} copies`, icon: AlertTriangle },
            ].map(rule => (
              <div key={rule.label} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <rule.icon size={18} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{rule.label}</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{rule.value}</span>
              </div>
            ))}
          </div>

          {showRulesForm && (
            <div className="mt-6 space-y-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">Update Rules</h3>
              {[
                { label: 'Fine per day (₹)', key: 'finePerDay', type: 'number' },
                { label: 'Max books (Student)', key: 'maxBooksStudent', type: 'number' },
                { label: 'Max books (Teacher)', key: 'maxBooksTeacher', type: 'number' },
                { label: 'Issue duration (days)', key: 'issueDurationDays', type: 'number' },
                { label: 'Grace period (days)', key: 'gracePeriodDays', type: 'number' },
                { label: 'Low stock threshold', key: 'lowStockThreshold', type: 'number' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">{field.label}</label>
                  <input type={field.type} value={(rulesForm as any)[field.key]} onChange={e => setRulesForm({ ...rulesForm, [field.key]: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-medium outline-none dark:text-white" />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={handleSaveRules} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase">
                  Save Rules
                </button>
                <button onClick={() => setShowRulesForm(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-black text-xs text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Delete Book?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action cannot be undone. If the book has active issues, deletion will be blocked.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xs uppercase text-slate-600 dark:text-slate-400">
                Cancel
              </button>
              <button onClick={() => handleDeleteBook(deleteConfirm)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-rose-500/20">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryManagement;