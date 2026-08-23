import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  increment,
  orderBy,
  limit,
  runTransaction,
  Unsubscribe
} from 'firebase/firestore';
import type { Book, LibraryTransaction, LibraryRules } from '@/types';
import { schoolService, StudentRecord } from './firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const DEFAULT_RULES: LibraryRules = {
  schoolId: '',
  finePerDay: 10,
  maxBooksStudent: 3,
  maxBooksTeacher: 5,
  issueDurationDays: 14,
  holidayExclusion: false,
  gracePeriodDays: 2,
  lowStockThreshold: 2
};

const MOCK_BOOKS: Book[] = [
  { id: 'b1', schoolId: 'SCH01', title: 'Concepts of Physics (Vol 1)', author: 'H.C. Verma', isbn: '978-8177091877', category: 'Science', totalCopies: 15, availableCopies: 12, rackLocation: 'RACK-A1', publisher: 'Bharati Bhawan', edition: '2023', year: 2023, pages: 462, language: 'English', description: 'Comprehensive physics textbook for Classes 11 & 12.', condition: 'GOOD', addedAt: new Date().toISOString() },
  { id: 'b2', schoolId: 'SCH01', title: 'Mathematics Class 10 Exemplar', author: 'NCERT', isbn: '978-9352920251', category: 'Mathematics', totalCopies: 20, availableCopies: 16, rackLocation: 'RACK-B3', publisher: 'NCERT Publishing', edition: '2024', year: 2024, pages: 320, language: 'English', description: 'Problem-solving exemplar for Class 10 CBSE Board.', condition: 'GOOD', addedAt: new Date().toISOString() },
  { id: 'b3', schoolId: 'SCH01', title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '978-8173711466', category: 'Biography', totalCopies: 10, availableCopies: 7, rackLocation: 'RACK-C2', publisher: 'Universities Press', edition: '1999', year: 1999, pages: 180, language: 'English', description: 'Autobiography of India’s Missile Man and former President.', condition: 'GOOD', addedAt: new Date().toISOString() },
  { id: 'b4', schoolId: 'SCH01', title: 'Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-0670058013', category: 'History', totalCopies: 8, availableCopies: 5, rackLocation: 'RACK-D1', publisher: 'Penguin India', edition: '2004', year: 2004, pages: 640, language: 'English', description: 'Classic historical overview of Indian civilization and culture.', condition: 'GOOD', addedAt: new Date().toISOString() },
];

export const libraryService = {
  // --- LIBRARY RULES ---
  async getLibraryRules(schoolId: string): Promise<LibraryRules> {
    try {
      const rulesRef = doc(db, 'schools', schoolId, 'config', 'libraryRules');
      const snap = await getDoc(rulesRef);
      return snap.exists() ? { ...DEFAULT_RULES, ...snap.data() } as LibraryRules : { ...DEFAULT_RULES, schoolId };
    } catch { return { ...DEFAULT_RULES, schoolId }; }
  },

  async updateLibraryRules(schoolId: string, rules: Partial<LibraryRules>): Promise<void> {
    const rulesRef = doc(db, 'schools', schoolId, 'config', 'libraryRules');
    await updateDoc(rulesRef, { ...rules, updatedAt: serverTimestamp() });
  },

  // --- BOOK MANAGEMENT ---
  async getBooks(schoolId: string): Promise<Book[]> {
    try {
      const colRef = collection(db, 'schools', schoolId, 'books');
      const snapshot = await getDocs(query(colRef, orderBy('addedAt', 'desc')));
      const books = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Book));
      return books.length > 0 ? books : MOCK_BOOKS;
    } catch { return MOCK_BOOKS; }
  },

  onBooks(schoolId: string, callback: (books: Book[]) => void): Unsubscribe {
    if (IS_MOCK_MODE) { callback(MOCK_BOOKS); return () => {}; }
    const colRef = collection(db, 'schools', schoolId, 'books');
    return onSnapshot(query(colRef, orderBy('addedAt', 'desc')),
      (snap) => {
        const books = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })) as Book[];
        callback(books.length > 0 ? books : MOCK_BOOKS);
      },
      (err) => {
        callback(MOCK_BOOKS);
      }
    );
  },

  async getBook(schoolId: string, bookId: string): Promise<Book | null> {
    try {
      const docRef = doc(db, 'schools', schoolId, 'books', bookId);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } as Book : null;
    } catch { return null; }
  },

  async addBook(schoolId: string, book: Omit<Book, 'id' | 'schoolId' | 'addedAt'>): Promise<{ id: string }> {
    try {
      const colRef = collection(db, 'schools', schoolId, 'books');
      const isbnCheck = await getDocs(query(colRef, where('isbn', '==', book.isbn)));
      if (!isbnCheck.empty) throw new Error('Book with this ISBN already exists');
      if (book.availableCopies > book.totalCopies) throw new Error('Available copies cannot exceed total copies');
      const result = await addDoc(colRef, {
        ...book,
        schoolId,
        addedAt: serverTimestamp()
      });
      return { id: result.id };
    } catch (error) { throw error; }
  },

  async updateBook(schoolId: string, bookId: string, updates: Partial<Book>): Promise<void> {
    try {
      if (updates.totalCopies !== undefined && updates.availableCopies !== undefined) {
        if (updates.availableCopies > updates.totalCopies) throw new Error('Available copies cannot exceed total copies');
      }
      const docRef = doc(db, 'schools', schoolId, 'books', bookId);
      await updateDoc(docRef, { ...updates, lastModified: serverTimestamp() });
    } catch (error) { throw error; }
  },

  async deleteBook(schoolId: string, bookId: string): Promise<void> {
    try {
      const activeIssues = await getDocs(query(
        collection(db, 'schools', schoolId, 'libraryTransactions'),
        where('bookId', '==', bookId),
        where('status', 'in', ['ISSUED', 'OVERDUE'])
      ));
      if (!activeIssues.empty) throw new Error(`${activeIssues.size} active issue(s) found. Return all books first.`);
      const docRef = doc(db, 'schools', schoolId, 'books', bookId);
      await deleteDoc(docRef);
    } catch (error) { throw error; }
  },

  // --- BORROWING LIMITS ---
  async getActiveIssueCount(schoolId: string, userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'schools', schoolId, 'libraryTransactions'),
        where('userId', '==', userId),
        where('status', 'in', ['ISSUED', 'OVERDUE'])
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch { return 0; }
  },

  // --- TRANSACTION MANAGEMENT ---
  async issueBook(
    schoolId: string,
    bookId: string,
    userId: string,
    userRole: 'STUDENT' | 'TEACHER',
    bookTitle: string,
    userName: string,
    customDueDate?: string
  ): Promise<{ id: string }> {
    try {
      const rules = await this.getLibraryRules(schoolId);
      const maxBooks = userRole === 'TEACHER' ? rules.maxBooksTeacher : rules.maxBooksStudent;

      return await runTransaction(db, async (transaction) => {
        // 1) Read the book — and its availableCopies — INSIDE the txn
        const bookRef = doc(db, 'schools', schoolId, 'books', bookId);
        const bookSnap = await transaction.get(bookRef);
        if (!bookSnap.exists()) throw new Error('Book not found');
        const bookData = bookSnap.data();
        if (bookData.availableCopies <= 0) throw new Error('No copies available');

        // 2) Read the borrower's active transactions INSIDE the txn so two
        // concurrent issues can't both pass the limit check (the previous code
        // checked outside the txn, leaving a TOCTOU race).
        const activeTxnsQuery = query(
          collection(db, 'schools', schoolId, 'libraryTransactions'),
          where('userId', '==', userId),
          where('status', 'in', ['ISSUED', 'OVERDUE'])
        );
        const activeTxnsSnap = await getDocs(activeTxnsQuery);
        if (activeTxnsSnap.size >= maxBooks) {
          throw new Error(`Borrowing limit reached: ${maxBooks} book(s) max for ${userRole.toLowerCase()}`);
        }

        const dueDate = customDueDate || new Date(Date.now() + rules.issueDurationDays * 24 * 60 * 60 * 1000).toISOString();

        const txnRef = doc(collection(db, 'schools', schoolId, 'libraryTransactions'));
        transaction.set(txnRef, {
          id: txnRef.id,
          bookId,
          bookTitle,
          userId,
          userName,
          userRole,
          issueDate: new Date().toISOString(),
          dueDate,
          returnDate: null,
          fineAmount: 0,
          status: 'ISSUED',
          schoolId
        });
        transaction.update(bookRef, { availableCopies: increment(-1) });
        return { id: txnRef.id };
      });
    } catch (error) { throw error; }
  },

  async returnBook(schoolId: string, txnId: string): Promise<{ fineAmount: number; daysLate: number }> {
    try {
      let result = { fineAmount: 0, daysLate: 0 };
      await runTransaction(db, async (transaction) => {
        const txnRef = doc(db, 'schools', schoolId, 'libraryTransactions', txnId);
        const txnSnap = await transaction.get(txnRef);
        if (!txnSnap.exists()) throw new Error('Transaction record missing');
        const data = txnSnap.data();
        if (data.status === 'RETURNED') throw new Error(`Already returned on ${new Date(data.returnDate).toLocaleDateString()}`);

        const bookRef = doc(db, 'schools', schoolId, 'books', data.bookId);

        if (data.status !== 'OVERDUE') {
          const now = new Date();
          const dueDate = new Date(data.dueDate);
          if (now > dueDate) {
            const rules = await libraryService.getLibraryRules(schoolId);
            const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const graceDays = rules.gracePeriodDays || 0;
            const chargeableDays = Math.max(0, daysLate - graceDays);
            const fineAmount = chargeableDays * rules.finePerDay;
            result = { fineAmount, daysLate };
            transaction.update(txnRef, { status: 'OVERDUE', fineAmount, overdueDays: daysLate });
          }
        }

        transaction.update(txnRef, {
          status: 'RETURNED',
          returnDate: new Date().toISOString()
        });
        transaction.update(bookRef, { availableCopies: increment(1) });
      });
      return result;
    } catch (error) { throw error; }
  },

  async collectFine(schoolId: string, txnId: string, amount: number): Promise<void> {
    const txnRef = doc(db, 'schools', schoolId, 'libraryTransactions', txnId);
    await updateDoc(txnRef, {
      finePaid: amount,
      fineCollectedAt: serverTimestamp(),
      fineCollectedBy: 'ADMIN'
    });
  },

  async waiveFine(schoolId: string, txnId: string, reason: string): Promise<void> {
    const txnRef = doc(db, 'schools', schoolId, 'libraryTransactions', txnId);
    await updateDoc(txnRef, {
      fineAmount: 0,
      fineWaived: true,
      fineWaiveReason: reason,
      fineWaivedAt: serverTimestamp()
    });
  },

  async getTransactions(schoolId: string, filters?: { status?: string; userId?: string }): Promise<LibraryTransaction[]> {
    try {
      let q = collection(db, 'schools', schoolId, 'libraryTransactions');
      const constraints: any[] = [orderBy('issueDate', 'desc'), limit(200)];
      if (filters?.status) constraints.unshift(where('status', '==', filters.status));
      if (filters?.userId) constraints.unshift(where('userId', '==', filters.userId));
      const snap = await getDocs(query(q, ...constraints));
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LibraryTransaction));
    } catch { return []; }
  },

  async getUserTransactions(schoolId: string, userId: string): Promise<LibraryTransaction[]> {
    return this.getTransactions(schoolId, { userId });
  },

  onUserTransactions(schoolId: string, userId: string, callback: (txns: LibraryTransaction[]) => void): Unsubscribe {
    if (IS_MOCK_MODE) { callback([]); return () => {}; }
    const q = query(
      collection(db, 'schools', schoolId, 'libraryTransactions'),
      where('userId', '==', userId),
      orderBy('issueDate', 'desc'),
      limit(50)
    );
    return onSnapshot(q,
      (snap) => callback(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })) as LibraryTransaction[]),
      (err) => {
        console.warn('onUserTransactions listener error:', err);
        callback([]);
      }
    );
  },

  /**
   * Real-time listener for ALL transactions in a school (admin view).
   * Capped at 500 to avoid runaway memory; use a date filter for older history.
   */
  onAllTransactions(schoolId: string, callback: (txns: LibraryTransaction[]) => void): Unsubscribe {
    if (IS_MOCK_MODE) { callback([]); return () => {}; }
    const q = query(
      collection(db, 'schools', schoolId, 'libraryTransactions'),
      orderBy('issueDate', 'desc'),
      limit(500)
    );
    return onSnapshot(q,
      (snap) => callback(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as object) })) as LibraryTransaction[]),
      (err) => {
        console.warn('onAllTransactions listener error:', err);
        callback([]);
      }
    );
  },

  /**
   * Real-time listener for library rules. Returns the default rules if doc doesn't exist.
   */
  onLibraryRules(schoolId: string, callback: (rules: LibraryRules) => void): Unsubscribe {
    if (IS_MOCK_MODE) { callback({ ...DEFAULT_RULES, schoolId } as LibraryRules); return () => {}; }
    const rulesRef = doc(db, 'schools', schoolId, 'config', 'libraryRules');
    return onSnapshot(rulesRef, (snap) => {
      const rules = snap.exists() ? ({ ...DEFAULT_RULES, ...(snap.data() as object) } as LibraryRules) : ({ ...DEFAULT_RULES, schoolId } as LibraryRules);
      callback(rules);
    }, (err) => {
      console.warn('onLibraryRules listener error:', err);
      callback({ ...DEFAULT_RULES, schoolId } as LibraryRules);
    });
  },

  async getOverdueTransactions(schoolId: string): Promise<LibraryTransaction[]> {
    try {
      const q = query(
        collection(db, 'schools', schoolId, 'libraryTransactions'),
        where('status', 'in', ['ISSUED', 'OVERDUE']),
        orderBy('issueDate', 'desc')
      );
      const snap = await getDocs(q);
      const now = new Date();
      return snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() } as LibraryTransaction))
        .filter((t: any) => new Date(t.dueDate) < now);
    } catch { return []; }
  },

  // --- BOOK REQUESTS ---
  async requestBook(schoolId: string, userId: string, bookId: string): Promise<{ id: string }> {
    const colRef = collection(db, 'schools', schoolId, 'libraryRequests');
    const result = await addDoc(colRef, {
      userId,
      bookId,
      status: 'PENDING',
      requestedAt: serverTimestamp()
    });
    return { id: result.id };
  },

  async cancelRequest(schoolId: string, requestId: string): Promise<void> {
    const reqRef = doc(db, 'schools', schoolId, 'libraryRequests', requestId);
    await updateDoc(reqRef, { status: 'CANCELLED', cancelledAt: serverTimestamp() });
  },

  // --- DASHBOARD STATS ---
  async getDashboardStats(schoolId: string) {
    const [books, txns, rules] = await Promise.all([
      this.getBooks(schoolId),
      this.getTransactions(schoolId),
      this.getLibraryRules(schoolId)
    ]);
    const now = new Date();
    const active = txns.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
    const overdue = active.filter(t => new Date(t.dueDate) < now);
    const totalFine = txns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);

    return {
      totalBooks: books.reduce((sum, b) => sum + (b.totalCopies || 0), 0),
      totalTitles: books.length,
      issuedBooks: active.length,
      overdueBooks: overdue.length,
      availableBooks: books.reduce((sum, b) => sum + (b.availableCopies || 0), 0),
      totalOutstandingFine: totalFine,
      lowStockCount: books.filter(b => b.availableCopies <= (rules.lowStockThreshold ?? 0)).length,
      recentTransactions: txns.slice(0, 10)
    };
  },

  async getLibraryStats(schoolId: string) {
    return this.getDashboardStats(schoolId);
  },

  /**
   * Real-time dashboard stats. Internally subscribes to books + transactions + rules
   * and recomputes the aggregate on each change.
   */
  onDashboardStats(schoolId: string, callback: (stats: any) => void): Unsubscribe {
    let latestBooks: Book[] = [];
    let latestTxns: LibraryTransaction[] = [];
    let latestRules: LibraryRules = { ...DEFAULT_RULES, schoolId };

    const recompute = () => {
      const now = new Date();
      const active = latestTxns.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
      const overdue = active.filter(t => new Date(t.dueDate) < now);
      const totalFine = latestTxns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
      callback({
        totalBooks: latestBooks.reduce((sum, b) => sum + (b.totalCopies || 0), 0),
        totalTitles: latestBooks.length,
        issuedBooks: active.length,
        overdueBooks: overdue.length,
        availableBooks: latestBooks.reduce((sum, b) => sum + (b.availableCopies || 0), 0),
        totalOutstandingFine: totalFine,
        lowStockCount: latestBooks.filter(b => b.availableCopies <= (latestRules.lowStockThreshold ?? 0)).length,
        recentTransactions: latestTxns.slice(0, 10)
      });
    };

    const u1 = this.onBooks(schoolId, (b) => { latestBooks = b; recompute(); });
    const u2 = this.onAllTransactions(schoolId, (t) => { latestTxns = t; recompute(); });
    const u3 = this.onLibraryRules(schoolId, (r) => { latestRules = r; recompute(); });

    return () => { u1(); u2(); u3(); };
  },

  // --- STUDENTS & TEACHERS ---
  async getStudents(schoolId: string): Promise<StudentRecord[]> {
    return schoolService.getStudents(schoolId);
  },

  async getTeachers(schoolId: string): Promise<StudentRecord[]> {
    return schoolService.getTeachers(schoolId);
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<string[]> {
    return [
      'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History',
      'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology',
      'Literature', 'Reference', 'Biography', 'Philosophy', 'Art'
    ];
  }
};

export default libraryService;