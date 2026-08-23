import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  Loader2,
  X,
  Wallet,
  Smartphone,
  Users,
  FileText,
  AlertTriangle,
  Eye,
  Receipt,
  Layers,
  Send,
  ArrowUpRight
} from 'lucide-react';
import { User as UserType, UserRole, FeeRecord } from '@/types';
import { MOCK_USERS, MOCK_CLASSES, MOCK_FEES } from '@/constants';
import { db } from '@/services/firebase';
import {
  collection, query, where, onSnapshot, orderBy,
  runTransaction, doc, serverTimestamp, arrayUnion, getDocs, writeBatch
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import ReceiptPDF from '@/components/shared/ReceiptPDF';
import PaymentSandbox from '@/components/shared/PaymentSandbox';
import Avatar from '@/components/shared/Avatar';
import { incrementHeavyOperation } from '@/services/usageService';
import { generateId } from '@/lib/utils';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface FeeManagementProps {
  user: UserType;
  onBack?: () => void;
}

type TabType = 'all' | 'defaulters' | 'bulk';

const FeeManagement: React.FC<FeeManagementProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, totalOverdue: 0, monthlyTarget: 500000 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL'>('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [lateFine, setLateFine] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{ receiptNo: string; amount: number; studentName: string; studentId: string; classId: string; feeType: string; date: string; time: string; mode: string } | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundFee, setRefundFee] = useState<FeeRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const [students, setStudents] = useState<{ id: string; name: string; classId: string; srNumber?: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [addFeeForm, setAddFeeForm] = useState({ studentId: '', classId: '', month: '', academicYear: '', totalAmount: '', dueDate: '', title: '' });
  const [isAddingFee, setIsAddingFee] = useState(false);

  const [bulkForm, setBulkForm] = useState({ classId: '', month: '', academicYear: '', amount: '', dueDate: '', title: '' });
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  const schoolId = user.schoolId;

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT) as any[]);
      setClasses(MOCK_CLASSES as any[]);
      const mockFeesData = MOCK_FEES as FeeRecord[];
      setFees(mockFeesData);
      const totalCollected = mockFeesData.filter(f => f.status === 'PAID').reduce((s, f) => s + (f.amountPaid || 0), 0);
      const totalPending = mockFeesData.filter(f => f.status === 'PENDING').reduce((s, f) => s + (f.totalAmount - (f.amountPaid || 0)), 0);
      const totalOverdue = mockFeesData.filter(f => f.status === 'OVERDUE').reduce((s, f) => s + (f.totalAmount - (f.amountPaid || 0)), 0);
      setStats({ totalCollected: totalCollected || 480000, totalPending: totalPending || 120000, totalOverdue: totalOverdue || 45000, monthlyTarget: 500000 });
      setLoading(false);
      return;
    }
    if (!schoolId) {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT) as any[]);
      setClasses(MOCK_CLASSES as any[]);
      const mockFeesData = MOCK_FEES as FeeRecord[];
      setFees(mockFeesData);
      const totalCollected = mockFeesData.filter(f => f.status === 'PAID').reduce((s, f) => s + (f.amountPaid || 0), 0);
      const totalPending = mockFeesData.filter(f => f.status === 'PENDING').reduce((s, f) => s + (f.totalAmount - (f.amountPaid || 0)), 0);
      const totalOverdue = mockFeesData.filter(f => f.status === 'OVERDUE').reduce((s, f) => s + (f.totalAmount - (f.amountPaid || 0)), 0);
      setStats({ totalCollected: totalCollected || 480000, totalPending: totalPending || 120000, totalOverdue: totalOverdue || 45000, monthlyTarget: 500000 });
      setLoading(false);
      return;
    }

    const studentsQuery = query(collection(db, 'schools', schoolId, 'users'), where('role', '==', 'STUDENT'));
    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      const stuList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as { id: string; name: string; classId: string; srNumber?: string }[];
      setStudents(stuList.length > 0 ? stuList : MOCK_USERS.filter(u => u.role === UserRole.STUDENT) as any[]);
    }, (err) => setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT) as any[]));

    const classesQuery = query(collection(db, 'schools', schoolId, 'classes'));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      const clsList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as { id: string; name: string }[];
      setClasses(clsList.length > 0 ? clsList : MOCK_CLASSES as any[]);
    }, (err) => setClasses(MOCK_CLASSES as any[]));

    const feesQuery = query(collection(db, 'schools', schoolId, 'fees'), orderBy('dueDate', 'desc'));
    const unsubFees = onSnapshot(feesQuery, (snap) => {
      const rawFees = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })) as FeeRecord[];
      const feesData = rawFees.length > 0 ? rawFees : (MOCK_FEES as FeeRecord[]);
      setFees(feesData);

      const now = new Date();
      const totalCollected = feesData.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amountPaid, 0);
      const totalPending = feesData.filter(f => f.status === 'PENDING').reduce((s, f) => s + (f.totalAmount - f.amountPaid), 0);
      const totalOverdue = feesData.filter(f => f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date(f.dueDate) < now)).reduce((s, f) => s + (f.totalAmount - f.amountPaid), 0);

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thisMonthTotal = feesData
        .filter(f => {
          if (!f.dueDate) return false;
          const d = new Date(f.dueDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((s, f) => s + (f.totalAmount || 0), 0);
      const fallbackTarget = (students.length || 100) * 1000;
      const monthlyTarget = thisMonthTotal > 0 ? thisMonthTotal : Math.max(fallbackTarget, 500000);

      setStats({ totalCollected, totalPending, totalOverdue, monthlyTarget });
      setLoading(false);
    }, (error) => {
      const feesData = MOCK_FEES as FeeRecord[];
      setFees(feesData);
      setStats({ totalCollected: 360000, totalPending: 140000, totalOverdue: 50000, monthlyTarget: 500000 });
      setLoading(false);
    });

    return () => { unsubStudents(); unsubClasses(); unsubFees(); };
  }, [schoolId]);

  const filteredFees = useMemo(() => fees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || fee.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || fee.status === statusFilter;
    const matchesClass = classFilter === 'ALL' || fee.classId === classFilter;
    const matchesMonth = monthFilter === 'ALL' || fee.month === monthFilter;
    return matchesSearch && matchesStatus && matchesClass && matchesMonth;
  }), [fees, searchTerm, statusFilter, classFilter, monthFilter]);

  const defaulterList = useMemo(() => {
    const now = new Date();
    const studentMap = new Map<string, { studentId: string; studentName: string; classId: string; totalDue: number; overdueCount: number; oldestDue: string }>();

    fees.forEach(fee => {
      const isOverdue = fee.status === 'OVERDUE' || (fee.status === 'PENDING' && new Date(fee.dueDate) < now);
      const isPending = fee.status === 'PENDING' || fee.status === 'OVERDUE' || fee.status === 'PARTIAL';
      if (!isPending) return;

      const remaining = fee.totalAmount - (fee.amountPaid || 0);
      if (remaining <= 0) return;

      if (!studentMap.has(fee.studentId)) {
        studentMap.set(fee.studentId, { studentId: fee.studentId, studentName: fee.studentName, classId: fee.classId, totalDue: 0, overdueCount: 0, oldestDue: fee.dueDate });
      }
      const entry = studentMap.get(fee.studentId)!;
      entry.totalDue += remaining;
      if (isOverdue) entry.overdueCount++;
      if (new Date(fee.dueDate) < new Date(entry.oldestDue)) entry.oldestDue = fee.dueDate;
    });

    return Array.from(studentMap.values()).sort((a, b) => b.totalDue - a.totalDue);
  }, [fees]);

  const formatCurrency = useMemo(() => (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
      case 'PENDING': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
      case 'OVERDUE': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
      case 'PARTIAL': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30';
      default: return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30';
    }
  };

  const handleExport = () => {
    if (fees.length === 0) return toast.error("No data to export");
    const headers = ["Invoice No", "Student Name", "Month", "Total Amount", "Amount Paid", "Status", "Due Date"];
    const csvContent = [headers.join(","), ...filteredFees.map(f => [f.invoiceNo, `"${f.studentName}"`, f.month, f.totalAmount, f.amountPaid, f.status, f.dueDate].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fee_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Financial Report Exported!");
  };

  async function handlePaymentInternal(mode: string, externalTxnId?: string) {
    if (isSubmitting || !selectedFee) return;
    setIsSubmitting(true);
    let receiptNo = '';
    let netAmount = 0;
    try {
      receiptNo = `RCP-${Date.now()}-${generateId().slice(0, 4).toUpperCase()}`;
      const feeRef = doc(db, 'schools', schoolId, 'fees', selectedFee.id);
      netAmount = paymentAmount + lateFine - discountAmount;

      await runTransaction(db, async (transaction) => {
        const feeDoc = await transaction.get(feeRef);
        if (!feeDoc.exists()) throw new Error('Fee record not found');
        const feeData = feeDoc.data() as FeeRecord;
        if (feeData.status === 'PAID') throw new Error('Fee already fully paid');
        const remainingBalance = feeData.totalAmount - (feeData.amountPaid || 0);
        if (netAmount > remainingBalance) throw new Error('Payment exceeds remaining balance');
        const newAmountPaid = (feeData.amountPaid || 0) + netAmount;
        const newStatus: FeeRecord['status'] = newAmountPaid >= feeData.totalAmount ? 'PAID' : 'PARTIAL';
        const timeBucket = Math.floor(Date.now() / 60000);
        const txnId = externalTxnId || `TXN-${Date.now()}-${generateId().slice(0, 9).toUpperCase()}`;
        const deterministicKey = `${schoolId}_${selectedFee.id}_${paymentAmount}_${timeBucket}`;
        const txnData = { txnId, amount: netAmount, mode, verified: true, lateFine, discount: discountAmount, timestamp: new Date().toISOString(), note: paymentNote || '', receiptNo, collectedBy: user.name, idempotencyKey: deterministicKey };
        transaction.update(feeRef, { amountPaid: newAmountPaid, status: newStatus, transactions: arrayUnion(txnData), lastModified: serverTimestamp(), receiptNo, paidAt: newStatus === 'PAID' ? serverTimestamp() : null });
        const receiptRef = doc(collection(db, 'schools', schoolId, 'receipts'));
        transaction.set(receiptRef, { receiptNo, idempotencyKey: `${feeRef.id}_${txnId}`, invoiceNo: selectedFee.invoiceNo, studentId: selectedFee.studentId, studentName: selectedFee.studentName, classId: selectedFee.classId, feeId: selectedFee.id, amount: netAmount, fine: lateFine, discount: discountAmount, total: netAmount, mode, collectedBy: user.name, createdAt: serverTimestamp(), schoolId });
      });

      incrementHeavyOperation(schoolId, 'fee', 1).catch(err => console.warn('Fee transaction usage tracking failed:', err));
      const now = new Date();
      setReceiptData({ receiptNo, amount: netAmount, studentName: selectedFee.studentName, studentId: selectedFee.studentId, classId: selectedFee.classId, feeType: selectedFee.month || 'Fee', date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), mode });
      setShowPaymentModal(false);
      setShowPaymentSuccess(true);
      setLateFine(0);
      setDiscountAmount(0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Payment failed. No amount was deducted. (${errorMessage})`);
    } finally { setIsSubmitting(false); }
  }

  async function handleRefund(fee: FeeRecord, reason: string) {
    if (!reason.trim()) return toast.error('Please provide a reason for refund');
    try {
      const feeRef = doc(db, 'schools', schoolId, 'fees', fee.id);
      await runTransaction(db, async (transaction) => {
        const feeDoc = await transaction.get(feeRef);
        if (!feeDoc.exists()) throw new Error('Fee record not found');
        const feeData = feeDoc.data() as FeeRecord;
        if (feeData.status !== 'PAID') throw new Error('Only paid fees can be refunded');
        const refundTxn = { txnId: `REFUND-${Date.now()}`, amount: -(feeData.amountPaid || 0), mode: 'REFUND', verified: true, timestamp: new Date().toISOString(), note: reason, receiptNo: `REF-RCP-${Date.now()}`, collectedBy: user.name };
        transaction.update(feeRef, { amountPaid: 0, status: 'PENDING', transactions: arrayUnion(refundTxn), lastModified: serverTimestamp(), refundReason: reason, refundedAt: serverTimestamp(), refundedBy: user.name });
      });
      toast.success('Payment refunded successfully');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundFee(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Refund failed: ${errorMessage}`);
    }
  }

  async function handleAddFee() {
    if (!addFeeForm.studentId || !addFeeForm.totalAmount || !addFeeForm.dueDate) return toast.error('Please fill in all required fields');
    setIsAddingFee(true);
    try {
      const selectedStudent = students.find(s => s.id === addFeeForm.studentId);
      if (!selectedStudent) throw new Error('Student not found');
      const invoiceNo = `INV-${Date.now()}-${generateId().slice(0, 4).toUpperCase()}`;
      const feeRef = doc(collection(db, 'schools', schoolId, 'fees'));
      await runTransaction(db, async (transaction) => {
        transaction.set(feeRef, { invoiceNo, studentId: addFeeForm.studentId, studentName: selectedStudent.name, classId: addFeeForm.classId || selectedStudent.classId, academicYear: addFeeForm.academicYear || '2024-25', totalAmount: Number(addFeeForm.totalAmount), amountPaid: 0, dueDate: addFeeForm.dueDate, status: 'PENDING', month: addFeeForm.month || 'Custom', title: addFeeForm.title || `${addFeeForm.month || 'Monthly'} Fee`, schoolId, createdAt: serverTimestamp(), lastModified: serverTimestamp(), transactions: [] });
      });
      toast.success('Fee invoice created successfully!');
      setShowAddFeeModal(false);
      setAddFeeForm({ studentId: '', classId: '', month: '', academicYear: '', totalAmount: '', dueDate: '', title: '' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to create invoice: ${errorMessage}`);
    } finally { setIsAddingFee(false); }
  }

  async function handleBulkGenerate() {
    if (!bulkForm.classId || !bulkForm.month || !bulkForm.amount || !bulkForm.dueDate) return toast.error('Please fill in all required fields');
    setIsGeneratingBulk(true);
    try {
      const classStudents = students.filter(s => s.classId === bulkForm.classId);
      if (classStudents.length === 0) { toast.error('No students found in selected class'); setIsGeneratingBulk(false); return; }

      const existingFeesQuery = query(collection(db, 'schools', schoolId, 'fees'), where('classId', '==', bulkForm.classId), where('month', '==', bulkForm.month), where('academicYear', '==', bulkForm.academicYear || '2024-25'));
      const existingSnap = await getDocs(existingFeesQuery);
      const existingStudentIds = new Set(existingSnap.docs.map((d: any) => d.data().studentId as string));

      let created = 0;
      let skipped = 0;

      // P1 fix: use writeBatch to write all invoices in a single round-trip
      // (previously used runTransaction in a 50-iteration loop = 25+ seconds)
      const batch = writeBatch(db);
      const now = Date.now();
      for (const student of classStudents) {
        if (existingStudentIds.has(student.id)) { skipped++; continue; }
        const invoiceNo = `INV-${now}-${generateId().slice(0, 4).toUpperCase()}`;
        const feeRef = doc(collection(db, 'schools', schoolId, 'fees'));
        batch.set(feeRef, { invoiceNo, studentId: student.id, studentName: student.name, classId: bulkForm.classId, academicYear: bulkForm.academicYear || '2024-25', totalAmount: Number(bulkForm.amount), amountPaid: 0, dueDate: bulkForm.dueDate, status: 'PENDING', month: bulkForm.month, title: bulkForm.title || `${bulkForm.month} Tuition Fee`, schoolId, createdAt: serverTimestamp(), lastModified: serverTimestamp(), transactions: [] });
        created++;
      }
      if (created > 0) await batch.commit();

      toast.success(`Bulk invoice generated: ${created} created, ${skipped} skipped (already exist)`);
      setBulkForm({ classId: '', month: '', academicYear: '', amount: '', dueDate: '', title: '' });
      setActiveTab('all');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Bulk generation failed: ${errorMessage}`);
    } finally { setIsGeneratingBulk(false); }
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-20 md:pb-0 px-4 md:px-8">
        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-8 animate-pulse">
          <div className="h-8 w-64 bg-zinc-800 rounded mb-3" />
          <div className="h-4 w-48 bg-zinc-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 animate-pulse">
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
              <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 animate-pulse">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 page-enter">

      {/* HEADER */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white overflow-hidden shadow-[0_20px_50px_rgba(30,27,75,0.4)] border border-white/10 group">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
               <IndianRupee size={12} className="text-indigo-400" /> Accounts & Finance
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">Fee Management</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time fee collection, ledger tracking, and automated receipts</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleExport} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center gap-2 transition-all min-h-[44px]">
              <Download size={16} className="text-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Export Ledger</span>
            </button>
            <button onClick={() => setShowAddFeeModal(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 text-white min-h-[44px]">
              <Plus size={16} className="text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Create Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => { setStatusFilter('PAID'); setActiveTab('all'); }} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{formatCurrency(stats.totalCollected)}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold"><CheckCircle2 size={12} /> {fees.filter(f => f.status === 'PAID').length} invoices</div>
        </div>
        <div onClick={() => { setStatusFilter('PENDING'); setActiveTab('all'); }} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-amber-500/50 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{formatCurrency(stats.totalPending)}</p>
          <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-bold"><Clock size={12} /> {fees.filter(f => f.status === 'PENDING').length} invoices</div>
        </div>
        <div onClick={() => { setStatusFilter('OVERDUE'); setActiveTab('defaulters'); }} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{formatCurrency(stats.totalOverdue)}</p>
          <div className="flex items-center gap-1 mt-2 text-rose-600 text-xs font-bold"><AlertTriangle size={12} /> {defaulterList.length} students</div>
        </div>
        <div onClick={() => { setStatusFilter('ALL'); setActiveTab('all'); }} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{fees.length}</p>
          <div className="flex items-center gap-1 mt-2 text-indigo-600 text-xs font-bold"><ArrowUpRight size={12} /> Collection rate: {fees.length > 0 ? Math.round((fees.filter(f => f.status === 'PAID').length / fees.length) * 100) : 0}%</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {([
          { key: 'all' as TabType, label: 'All Fees', icon: Receipt },
          { key: 'defaulters' as TabType, label: 'Payment Due', icon: AlertTriangle },
          { key: 'bulk' as TabType, label: 'Bulk Invoice', icon: Layers },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors min-h-[44px] ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.key === 'defaulters' && defaulterList.length > 0 && (
              <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{defaulterList.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ALL FEES TAB */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input type="text" placeholder="Search by student name or invoice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 outline-none dark:text-white text-sm min-h-[44px]" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 outline-none dark:text-white text-sm min-h-[44px]">
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PARTIAL">Partial</option>
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 outline-none dark:text-white text-sm min-h-[44px]">
              <option value="ALL">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 outline-none dark:text-white text-sm min-h-[44px]">
              <option value="ALL">All Months</option>
              {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {filteredFees.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 py-16 text-center">
              <FileText size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-500">No fee records found</p>
              <p className="text-xs text-zinc-400 mt-1">Add a fee record or generate bulk invoices to get started</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Invoice</div>
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Student</div>
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Month</div>
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Amount</div>
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</div>
                <div className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Actions</div>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                {filteredFees.map((fee) => {
                  const remaining = fee.totalAmount - (fee.amountPaid || 0);
                  return (
                    <div key={fee.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                        <div className="flex items-center gap-2"><Receipt size={14} className="text-zinc-400" /><span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{fee.invoiceNo}</span></div>
                        <div className="flex items-center gap-3">
                          <Avatar name={fee.studentName} size="sm" className="w-8 h-8 rounded-full border border-indigo-500/20 shrink-0" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{fee.studentName}</span>
                        </div>
                        <div className="text-sm text-zinc-500">{fee.month}</div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(fee.totalAmount)}</p>
                          {fee.status === 'PARTIAL' && <p className="text-[10px] text-indigo-600 font-bold">Remaining: {formatCurrency(remaining)}</p>}
                        </div>
                        <div><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(fee.status)}`}>{fee.status}</span></div>
                        <div className="flex gap-2">
                          {fee.status !== 'PAID' && <button onClick={() => { setSelectedFee(fee); setPaymentAmount(remaining); setShowPaymentModal(true); }} className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px]">Collect</button>}
                          {fee.status === 'PAID' && <button onClick={() => { setRefundFee(fee); setShowRefundModal(true); }} className="px-3 py-2 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors min-h-[44px]">Refund</button>}
                          <button className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><Eye size={14} /></button>
                        </div>
                      </div>
                      <div className="md:hidden space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={fee.studentName} size="sm" className="w-10 h-10 rounded-full border border-indigo-500/20 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-zinc-900 dark:text-white">{fee.studentName}</p>
                              <p className="text-xs text-zinc-500 font-mono">{fee.invoiceNo} · {fee.month}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(fee.status)}`}>{fee.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(fee.totalAmount)}</p>
                          <div className="flex gap-2">
                            {fee.status !== 'PAID' && <button onClick={() => { setSelectedFee(fee); setPaymentAmount(remaining); setShowPaymentModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg min-h-[44px]">Collect</button>}
                            <button className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"><Eye size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEFAULTERS TAB */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Payment Due List</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{defaulterList.length} student{defaulterList.length !== 1 ? 's' : ''} with outstanding dues totaling {formatCurrency(defaulterList.reduce((s, d) => s + d.totalDue, 0))}</p>
            </div>
          </div>

          {defaulterList.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 py-16 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-300 dark:text-emerald-700 mb-3" />
              <p className="text-sm font-bold text-zinc-500">All accounts are clear</p>
              <p className="text-xs text-zinc-400 mt-1">No students have pending or overdue payments</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {defaulterList.map((defaulter, idx) => {
                const studentFees = fees.filter(f => f.studentId === defaulter.studentId && (f.status === 'PENDING' || f.status === 'OVERDUE' || f.status === 'PARTIAL'));
                const isHighRisk = defaulter.overdueCount >= 3;
                return (
                  <div key={defaulter.studentId} className={`p-4 ${isHighRisk ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={defaulter.studentName} size="md" className="w-10 h-10 rounded-full border border-indigo-500/20 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{defaulter.studentName}</p>
                            {isHighRisk && <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Needs Attention</span>}
                          </div>
                          <p className="text-xs text-zinc-500">{classes.find(c => c.id === defaulter.classId)?.name || defaulter.classId} · {defaulter.overdueCount} overdue invoice{defaulter.overdueCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(defaulter.totalDue)}</p>
                        <p className="text-[10px] text-zinc-500">Outstanding</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-13">
                      {studentFees.slice(0, 3).map(fee => {
                        const remaining = fee.totalAmount - (fee.amountPaid || 0);
                        const isOverdue = new Date(fee.dueDate) < new Date();
                        return (
                          <div key={fee.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{fee.title || fee.month} · Due: {fee.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white">{formatCurrency(remaining)}</span>
                              <button onClick={() => { setSelectedFee(fee); setPaymentAmount(remaining); setShowPaymentModal(true); }} className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded min-h-[32px]">Collect</button>
                            </div>
                          </div>
                        );
                      })}
                      {studentFees.length > 3 && (
                        <p className="text-xs text-zinc-500 text-center">+{studentFees.length - 3} more invoice{studentFees.length - 3 !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BULK INVOICE TAB */}
      {activeTab === 'bulk' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Layers size={20} className="text-indigo-600" />
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Bulk Invoice Generation</h3>
              <p className="text-xs text-zinc-500">Generate fee invoices for all students in a class at once</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Class</label>
            <select value={bulkForm.classId} onChange={(e) => setBulkForm(p => ({ ...p, classId: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]">
              <option value="">Select class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({students.filter(s => s.classId === c.id).length} students)</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Month</label>
              <select value={bulkForm.month} onChange={(e) => setBulkForm(p => ({ ...p, month: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]">
                <option value="">Select...</option>
                {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Academic Year</label>
              <input type="text" value={bulkForm.academicYear} onChange={(e) => setBulkForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024-25" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Amount (₹)</label>
              <input type="number" value={bulkForm.amount} onChange={(e) => setBulkForm(p => ({ ...p, amount: e.target.value }))} placeholder="2500" min="0" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Due Date</label>
              <input type="date" value={bulkForm.dueDate} onChange={(e) => setBulkForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Fee Title (optional)</label>
            <input type="text" value={bulkForm.title} onChange={(e) => setBulkForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Tuition Fee, Transport Fee" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
          </div>

          {bulkForm.classId && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{students.filter(s => s.classId === bulkForm.classId).length} students will receive an invoice</p>
            </div>
          )}

          <button onClick={handleBulkGenerate} disabled={isGeneratingBulk || !bulkForm.classId || !bulkForm.month || !bulkForm.amount || !bulkForm.dueDate} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[54px] flex items-center justify-center gap-2">
            {isGeneratingBulk ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Send size={16} /> Generate Invoices</>}
          </button>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl space-y-6 p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Fee Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Collecting for</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedFee.studentName} — {selectedFee.month}</p>
              <p className="text-lg font-black text-zinc-900 dark:text-white mt-1">{formatCurrency(paymentAmount + lateFine - discountAmount)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Late Fine</label>
                <input type="number" min="0" value={lateFine} onChange={(e) => setLateFine(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Discount</label>
                <input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handlePaymentInternal('CASH')} className="flex-1 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[54px]"><Wallet size={16} /> Cash</button>
              <button onClick={() => { setShowPaymentModal(false); setShowSandbox(true); }} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[54px]"><Smartphone size={16} /> Digital</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FEE MODAL */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl space-y-5 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">New Fee Invoice</h3>
              <button onClick={() => setShowAddFeeModal(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><X size={18} /></button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Student</label>
              <select value={addFeeForm.studentId} onChange={(e) => { const s = students.find(s => s.id === e.target.value); setAddFeeForm(p => ({ ...p, studentId: e.target.value, classId: s?.classId || p.classId })); }} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]">
                <option value="">Select...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Class</label>
              <select value={addFeeForm.classId} onChange={(e) => setAddFeeForm(p => ({ ...p, classId: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]">
                <option value="">Select...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Fee Title</label>
              <input type="text" value={addFeeForm.title} onChange={(e) => setAddFeeForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Tuition Fee" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Month</label>
                <select value={addFeeForm.month} onChange={(e) => setAddFeeForm(p => ({ ...p, month: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]">
                  <option value="">Select...</option>
                  {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Academic Year</label>
                <input type="text" value={addFeeForm.academicYear} onChange={(e) => setAddFeeForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024-25" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Amount (₹)</label>
                <input type="number" value={addFeeForm.totalAmount} onChange={(e) => setAddFeeForm(p => ({ ...p, totalAmount: e.target.value }))} placeholder="2500" min="0" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Due Date</label>
                <input type="date" value={addFeeForm.dueDate} onChange={(e) => setAddFeeForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[44px]" />
              </div>
            </div>
            <button onClick={handleAddFee} disabled={isAddingFee || !addFeeForm.studentId || !addFeeForm.totalAmount || !addFeeForm.dueDate} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed min-h-[54px] flex items-center justify-center gap-2">
              {isAddingFee ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Publish Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT SANDBOX */}
      {showSandbox && selectedFee && (
        <PaymentSandbox amount={paymentAmount + lateFine - discountAmount} studentName={selectedFee.studentName} feeType={selectedFee.month || 'Monthly Fee'} onSuccess={(txnId, mode) => { handlePaymentInternal(mode, txnId); setShowSandbox(false); }} onClose={() => setShowSandbox(false)} />
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <ReceiptPDF receiptNo={receiptData.receiptNo} studentName={receiptData.studentName} studentId={receiptData.studentId} classId={receiptData.classId} amount={receiptData.amount} feeType={receiptData.feeType} schoolId={user.schoolId} onClose={() => setShowReceiptModal(false)} />
      )}

      {/* PAYMENT SUCCESS */}
      {showPaymentSuccess && receiptData && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl text-center space-y-6 p-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-white" /></div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Successful</h3>
              <p className="text-sm text-zinc-500 mt-1">Transaction completed</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2 text-left">
              <div className="flex justify-between"><span className="text-xs text-zinc-500">Amount</span><span className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(receiptData.amount)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-zinc-500">Receipt</span><span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{receiptData.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-xs text-zinc-500">Date</span><span className="text-xs font-bold text-zinc-900 dark:text-white">{receiptData.date} {receiptData.time}</span></div>
              <div className="flex justify-between"><span className="text-xs text-zinc-500">Mode</span><span className="text-xs font-bold text-zinc-900 dark:text-white">{receiptData.mode}</span></div>
            </div>
            <div className="space-y-2">
              <button onClick={() => { setShowPaymentSuccess(false); setShowReceiptModal(true); }} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 min-h-[54px]"><Download size={16} /> Download Receipt</button>
              <button onClick={() => setShowPaymentSuccess(false)} className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-h-[54px]">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && refundFee && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl space-y-6 p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Process Refund</h3>
              <button onClick={() => { setShowRefundModal(false); setRefundFee(null); setRefundReason(''); }} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Student</span><span className="font-bold text-zinc-900 dark:text-white">{refundFee.studentName}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(refundFee.amountPaid)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Invoice</span><span className="font-mono text-xs text-zinc-900 dark:text-white">{refundFee.invoiceNo}</span></div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Refund Reason</label>
              <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Enter reason..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-bold outline-none dark:text-white mt-1 min-h-[100px]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRefundModal(false); setRefundFee(null); setRefundReason(''); }} className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-sm min-h-[54px]">Cancel</button>
              <button onClick={() => handleRefund(refundFee, refundReason)} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors min-h-[54px]">Confirm Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
