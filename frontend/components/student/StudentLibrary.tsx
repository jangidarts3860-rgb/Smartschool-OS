import React, { useState, useEffect } from 'react';
import { Library, BookOpen, Search, Clock, CheckCircle2, AlertCircle, Plus, X, ChevronRight } from 'lucide-react';
import type { User, Book, LibraryTransaction } from '@/types';
import { libraryService } from '@/services/libraryService';
import { toast } from 'react-hot-toast';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const StudentLibrary: React.FC<Props> = ({ user }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<LibraryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'mybooks'>('browse');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requesting, setRequesting] = useState(false);

  const DEFAULT_STUDENT_BOOKS: Book[] = [
    {
      id: 'bk-1',
      schoolId: user.schoolId || 'SCH01',
      title: 'Advanced Mathematics (NCERT)',
      author: 'R.D. Sharma',
      isbn: '978-81-7456-123-4',
      category: 'Mathematics',
      totalCopies: 15,
      availableCopies: 12,
      rackLocation: 'Rack M-4',
      condition: 'NEW',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
      addedAt: new Date().toISOString()
    },
    {
      id: 'bk-2',
      schoolId: user.schoolId || 'SCH01',
      title: 'Concepts of Physics (Vol 1 & 2)',
      author: 'H.C. Verma',
      isbn: '978-81-7709-187-7',
      category: 'Physics',
      totalCopies: 20,
      availableCopies: 16,
      rackLocation: 'Rack P-2',
      condition: 'GOOD',
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=300&q=80',
      addedAt: new Date().toISOString()
    },
    {
      id: 'bk-3',
      schoolId: user.schoolId || 'SCH01',
      title: 'Wings of Fire: An Autobiography',
      author: 'Dr. A.P.J. Abdul Kalam',
      isbn: '978-81-7371-146-6',
      category: 'Biography',
      totalCopies: 8,
      availableCopies: 5,
      rackLocation: 'Rack B-1',
      condition: 'NEW',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
      addedAt: new Date().toISOString()
    }
  ];

  const DEFAULT_TXNS: LibraryTransaction[] = [
    {
      id: 'txn-01',
      schoolId: user.schoolId || 'SCH01',
      bookId: 'bk-3',
      bookTitle: 'Wings of Fire: An Autobiography',
      userId: user.id,
      userName: user.name,
      userRole: 'STUDENT',
      issueDate: '2026-08-05T10:00:00Z',
      dueDate: '2026-08-25T10:00:00Z',
      status: 'ISSUED',
      fineAmount: 0
    }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setBooks(DEFAULT_STUDENT_BOOKS);
      setMyBooks(DEFAULT_TXNS);
      setLoading(false);
      return;
    }
    if (!user.schoolId) {
      setBooks(DEFAULT_STUDENT_BOOKS);
      setMyBooks(DEFAULT_TXNS);
      setLoading(false);
      return;
    }
    const unsubBooks = libraryService.onBooks(user.schoolId, (list) => {
      setBooks(list.length > 0 ? list : DEFAULT_STUDENT_BOOKS);
      setLoading(false);
    });
    const unsubTxns = libraryService.onUserTransactions(user.schoolId, user.id, (list) => {
      setMyBooks(list.length > 0 ? list : DEFAULT_TXNS);
      setLoading(false);
    });
    return () => {
      unsubBooks();
      unsubTxns();
    };
  }, [user.schoolId, user.id]);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeBooks = myBooks.filter(b => b.status === 'ISSUED' || b.status === 'OVERDUE');
  const returnedBooks = myBooks.filter(b => b.status === 'RETURNED');
  const overdueCount = myBooks.filter(b => b.status === 'OVERDUE').length;
  const totalFine = myBooks.reduce((sum, b) => sum + (b.fineAmount || 0), 0);

  const handleRequestBook = async (bookId: string) => {
    if (requesting) return;
    const activeCount = myBooks.filter((b) => b.status === 'ISSUED' || b.status === 'OVERDUE').length;
    if (activeCount >= 3) {
      toast.error('You already have the maximum 3 active book issues. Return one before requesting another.');
      return;
    }
    try {
      setRequesting(true);
      await libraryService.requestBook(user.schoolId, user.id, bookId);
      toast.success('Request sent! Librarian will issue the book shortly.');
      setSelectedBook(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to request book');
    } finally {
      setRequesting(false);
    }
  };

  const getDueStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)} days overdue`, color: 'text-rose-600 bg-rose-50' };
    if (diff <= 3) return { text: `Due in ${diff} days`, color: 'text-amber-600 bg-amber-50' };
    return { text: `Due in ${diff} days`, color: 'text-slate-500 bg-slate-50' };
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Library</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Browse and manage your books</p>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
              {overdueCount} overdue book{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              Fine: ₹{totalFine} — Please return immediately.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Issued</p>
          <p className="text-2xl font-black text-indigo-600">{activeBooks.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Returned</p>
          <p className="text-2xl font-black text-emerald-600">{returnedBooks.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fine</p>
          <p className={`text-2xl font-black ${totalFine > 0 ? 'text-rose-600' : 'text-slate-400'}`}>₹{totalFine}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('browse')}
          className={`px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
            activeTab === 'browse' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}>
          Browse
        </button>
        <button onClick={() => setActiveTab('mybooks')}
          className={`px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
            activeTab === 'mybooks' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}>
          My Books
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by title, author, or category..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white min-h-[44px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map(book => (
              <div key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    book.availableCopies > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                  }`}>
                    {book.availableCopies > 0 ? `Available (${book.availableCopies})` : 'All Issued'}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mb-1">{book.title}</h4>
                <p className="text-xs text-slate-500 mb-3">by {book.author}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold uppercase">{book.category}</span>
                  <span className="font-bold">📍 {book.rackLocation}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No books found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search</p>
            </div>
          )}
        </>
      )}

      {/* My Books Tab */}
      {activeTab === 'mybooks' && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Books</h3>
          </div>
          {myBooks.length === 0 ? (
            <div className="py-12 text-center">
              <Library size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No books issued</p>
              <p className="text-xs text-slate-400 mt-1">Browse the library to find books</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myBooks.map(txn => {
                const dueStatus = getDueStatus(txn.dueDate);
                return (
                  <div key={txn.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.status === 'RETURNED' ? 'bg-emerald-50 text-emerald-600' :
                        txn.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {txn.status === 'RETURNED' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{txn.bookTitle}</p>
                        <p className="text-[10px] text-slate-500">
                          Issued: {new Date(txn.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' • '}Due: {new Date(txn.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        {txn.status !== 'RETURNED' && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${dueStatus.color}`}>
                            {dueStatus.text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        txn.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' :
                        txn.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>{txn.status}</span>
                      {(txn.fineAmount || 0) > 0 && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">Fine: ₹{txn.fineAmount}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Book Detail Drawer */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-t-[2.5rem] p-6 pb-10 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedBook.title}</h3>
                <p className="text-sm text-slate-500 mt-1">by {selectedBook.author}</p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-20">Category</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedBook.category}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-20">ISBN</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedBook.isbn}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-20">Location</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">📍 {selectedBook.rackLocation}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-20">Available</span>
                <span className={`text-sm font-black ${selectedBook.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedBook.availableCopies} of {selectedBook.totalCopies} copies
                </span>
              </div>
              {selectedBook.language && (
                <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase w-20">Language</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedBook.language}</span>
                </div>
              )}
              {selectedBook.description && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedBook.description}</p>
                </div>
              )}
            </div>

            {selectedBook.availableCopies > 0 ? (
              <button onClick={() => handleRequestBook(selectedBook.id)} disabled={requesting}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {requesting ? 'Sending...' : <><Plus size={16} /> Request This Book</>}
              </button>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 text-center">
                  All copies of this book are currently issued. Browse other titles or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLibrary;