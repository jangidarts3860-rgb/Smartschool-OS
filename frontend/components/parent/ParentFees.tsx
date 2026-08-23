import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, FeeRecord } from '@/types';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Users, IndianRupee, AlertTriangle, CheckCircle2, Clock, Download, ChevronRight, ShieldCheck, QrCode, CreditCard, X, CheckCircle, Loader2, FileText } from 'lucide-react';
import { runTransaction, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { logSecurityAction } from '@/services/audit';
import { generateId } from '@/lib/utils';

import { getParentChildren } from '@/constants';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const ParentFees: React.FC<Props> = ({ user }) => {
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allFees, setAllFees] = useState<Record<string, FeeRecord[]>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select_method' | 'upi_qr' | 'processing' | 'success'>('select_method');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const FALLBACK_CHILD: User = useMemo(() => ({
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
  }), [user.schoolId, user.phone]);

  const FALLBACK_FEES: FeeRecord[] = useMemo(() => [
    {
      id: 'fee-q1-2026',
      studentId: 'stu001',
      studentName: 'Aarav Sharma',
      classId: '10A',
      schoolId: user.schoolId || 'default',
      title: 'Term 1 Tuition & Transport Fee',
      invoiceNo: 'INV-2026-001',
      academicYear: '2026-27',
      month: 'August',
      totalAmount: 18500,
      amountPaid: 0,
      status: 'PENDING',
      dueDate: '2026-09-10',
      breakdown: [
        { name: 'Tuition Fee (Q1)', amount: 15000 },
        { name: 'Transport (Bus #4)', amount: 3500 }
      ]
    },
    {
      id: 'fee-annual-2026',
      studentId: 'stu001',
      studentName: 'Aarav Sharma',
      classId: '10A',
      schoolId: user.schoolId || 'default',
      title: 'Annual Activity & Lab Fee',
      invoiceNo: 'INV-2026-002',
      academicYear: '2026-27',
      month: 'July',
      totalAmount: 6500,
      amountPaid: 6500,
      status: 'PAID',
      dueDate: '2026-07-15',
      breakdown: [
        { name: 'Science & Computer Lab', amount: 4000 },
        { name: 'Sports & Cultural Fund', amount: 2500 }
      ]
    }
  ], [user.schoolId]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockChildren = getParentChildren(user);
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0] || null);
      const feesMap: Record<string, FeeRecord[]> = {};
      mockChildren.forEach(child => {
        feesMap[child.id] = [
          {
            id: `fee-q1-${child.id}`,
            studentId: child.id,
            studentName: child.name,
            classId: child.classId || '10A',
            schoolId: user.schoolId || 'default',
            title: 'Term 1 Tuition & Transport Fee',
            invoiceNo: `INV-2026-${child.id.slice(-3)}`,
            academicYear: '2026-27',
            month: 'August',
            totalAmount: 18500,
            amountPaid: 0,
            status: 'PENDING',
            dueDate: '2026-09-10',
            breakdown: [
              { name: 'Tuition Fee (Q1)', amount: 15000 },
              { name: 'Transport (Bus #4)', amount: 3500 }
            ]
          },
          {
            id: `fee-annual-${child.id}`,
            studentId: child.id,
            studentName: child.name,
            classId: child.classId || '10A',
            schoolId: user.schoolId || 'default',
            title: 'Annual Activity & Lab Fee',
            invoiceNo: `INV-2026-${child.id.slice(-3)}-2`,
            academicYear: '2026-27',
            month: 'July',
            totalAmount: 6500,
            amountPaid: 6500,
            status: 'PAID',
            dueDate: '2026-07-15',
            breakdown: [
              { name: 'Science & Computer Lab', amount: 4000 },
              { name: 'Sports & Cultural Fund', amount: 2500 }
            ]
          }
        ];
      });
      setAllFees(feesMap);
      setLoading(false);
      return;
    }
    if (!user.schoolId || !user.phone) {
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAllFees({ [FALLBACK_CHILD.id]: FALLBACK_FEES });
      setLoading(false);
      return;
    }

    const studentsRef = collection(db, 'schools', user.schoolId, 'users');
    const q = query(studentsRef, where('role', '==', 'STUDENT'), where('parentPhone', '==', user.phone));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as User[];
      const effectiveChildren = students.length > 0 ? students : [FALLBACK_CHILD];
      setChildren(effectiveChildren);
      if (!selectedChild) setSelectedChild(effectiveChildren[0]!);
      setLoading(false);
    }, (err) => {
      if (import.meta.env.DEV) { console.error("Children fetch error:", err); }
      setChildren([FALLBACK_CHILD]);
      setSelectedChild(FALLBACK_CHILD);
      setAllFees({ [FALLBACK_CHILD.id]: FALLBACK_FEES });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.schoolId, user.phone, FALLBACK_CHILD, FALLBACK_FEES]);

  useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (!user.schoolId || children.length === 0) return;

    const allChildIds = children.map(c => c.id);
    const isFallback = allChildIds.includes('stu001');
    if (isFallback) {
      setAllFees({ stu001: FALLBACK_FEES });
      return;
    }

    const CHILD_IDS_CAP = 30;
    const childIds = allChildIds.slice(0, CHILD_IDS_CAP);
    const feesRef = collection(db, 'schools', user.schoolId, 'fees');
    const q = query(feesRef, where('studentId', 'in', childIds), orderBy('dueDate', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const next: Record<string, FeeRecord[]> = {};
      children.forEach(c => { next[c.id] = []; });
      snap.docs.forEach((d: any) => {
        const data = d.data() as FeeRecord;
        const owner = data.studentId;
        if (owner && next[owner]) {
          next[owner]!.push({ ...data, id: d.id });
        }
      });
      // If snap is empty, provide fallback fees for display
      const hasAnyFees = Object.values(next).some(arr => arr.length > 0);
      if (!hasAnyFees && children[0]) {
        next[children[0].id] = FALLBACK_FEES;
      }
      setAllFees(next);
    }, (err) => {
      if (import.meta.env.DEV) {
        console.warn('Parent fees listener:', err.message);
      }
      if (children[0]) {
        setAllFees({ [children[0].id]: FALLBACK_FEES });
      }
    });

    return () => unsub();
  }, [user.schoolId, children, FALLBACK_FEES]);

  const consolidatedStats = useMemo(() => {
    let totalOutstanding = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let pendingCount = 0;

    Object.values(allFees).forEach(childFees => {
      childFees.forEach(fee => {
        const remaining = fee.totalAmount - (fee.amountPaid || 0);
        if (fee.status === 'PAID') {
          totalPaid += fee.amountPaid;
        } else {
          totalOutstanding += remaining;
          pendingCount++;
          if (fee.status === 'OVERDUE' || (fee.status === 'PENDING' && new Date(fee.dueDate) < new Date())) {
            totalOverdue += remaining;
          }
        }
      });
    });

    return { totalOutstanding, totalPaid, totalOverdue, pendingCount };
  }, [allFees]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handlePayClick = (fee: FeeRecord) => {
    if (isProcessing) return;
    setSelectedFee(fee);
    setShowPaymentModal(true);
    setPaymentStep('select_method');
  };

  const processPayment = async () => {
    if (isProcessing) { toast.error('Payment already processing.'); return; }
    const feeToPay = selectedFee;
    if (!feeToPay) return;
    const remainingBalance = feeToPay.totalAmount - (feeToPay.amountPaid || 0);
    if (remainingBalance <= 0) { toast.error('This fee is already fully paid'); return; }

    setIsProcessing(true);
    setPaymentStep('processing');

    const txnId = `TXN-PAR-${Date.now()}-${generateId().slice(0, 6).toUpperCase()}`;
    const receiptNo = `RCP-${Date.now()}-${generateId().slice(0, 4).toUpperCase()}`;
    const timeBucket = Math.floor(Date.now() / 60000);
    const idempotencyKey = `${user.schoolId}_${feeToPay.id}_${remainingBalance}_${timeBucket}`;

    try {
      const feeRef = doc(db, 'schools', user.schoolId, 'fees', feeToPay.id);
      await runTransaction(db, async (transaction) => {
        const feeDoc = await transaction.get(feeRef);
        if (!feeDoc.exists()) throw new Error('Fee record not found');
        const feeData = feeDoc.data() as FeeRecord;
        if (feeData.status === 'PAID') throw new Error('Fee already fully paid');
        const currentRemaining = feeData.totalAmount - (feeData.amountPaid || 0);
        if (remainingBalance > currentRemaining + 1) throw new Error('Payment amount exceeds remaining balance');
        const newAmountPaid = (feeData.amountPaid || 0) + remainingBalance;
        const newStatus: FeeRecord['status'] = newAmountPaid >= feeData.totalAmount ? 'PAID' : 'PARTIAL';
        const txnData = { txnId, amount: remainingBalance, mode: 'UPI', verified: true, timestamp: new Date().toISOString(), note: 'Parent payment via UPI', receiptNo, collectedBy: 'PARENT_SELF', idempotencyKey };
        transaction.update(feeRef, { amountPaid: newAmountPaid, status: newStatus, transactions: arrayUnion(txnData), lastModified: serverTimestamp(), receiptNo: newStatus === 'PAID' ? receiptNo : feeData.receiptNo, paidAt: newStatus === 'PAID' ? serverTimestamp() : feeData.paidAt });
        const receiptRef = doc(collection(db, 'schools', user.schoolId, 'receipts'));
        transaction.set(receiptRef, { receiptNo, idempotencyKey: `${feeRef.id}_${txnId}`, invoiceNo: feeData.invoiceNo, studentId: feeData.studentId, studentName: feeData.studentName, classId: feeData.classId, feeId: feeToPay.id, amount: remainingBalance, fine: 0, discount: 0, total: remainingBalance, mode: 'UPI', collectedBy: 'PARENT_SELF', createdAt: serverTimestamp(), schoolId: user.schoolId });
      });

      await logSecurityAction('FEE_PAYMENT', feeToPay.id, user.schoolId, { action: 'PARENT_PAYMENT', amount: remainingBalance, mode: 'UPI', txnId, receiptNo, studentId: feeToPay.studentId });
      setLastReceipt(receiptNo);
      setPaymentStep('success');
      toast.success('Payment processed successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('already fully paid')) { toast.error('This fee was already paid. Refreshing...'); } else { toast.error(`Payment failed. (${errorMessage})`); }
      setPaymentStep('upi_qr');
    } finally { setIsProcessing(false); }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentStep('select_method');
      setSelectedFee(null);
      closeTimeoutRef.current = null;
    }, 8000);
  };

  const handleClosePaymentModal = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowPaymentModal(false);
    setPaymentStep('select_method');
    setSelectedFee(null);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleDownloadReceipt = (fee: FeeRecord) => {
    if (!user.schoolId) return;
    const lastTxn = (fee.transactions || []).slice(-1)[0];
    const lines = [
      '═══════════════════════════════════════════',
      '         PAYMENT RECEIPT',
      '═══════════════════════════════════════════',
      '',
      `Receipt No:   ${lastTxn?.receiptNo || fee.receiptNo || fee.invoiceNo || 'N/A'}`,
      `Invoice No:   ${fee.invoiceNo || fee.id}`,
      `Student:      ${fee.studentName || 'Student'}`,
      `Date:         ${new Date().toLocaleString('en-IN')}`,
      '',
      '───────────────────────────────────────────',
      `Invoice:      ${fee.title || fee.month}`,
      `Total:        ₹${fee.totalAmount.toLocaleString('en-IN')}`,
      `Paid:         ₹${(fee.amountPaid || 0).toLocaleString('en-IN')}`,
      `Status:       ${fee.status}`,
      ...(lastTxn ? [
        '',
        'Last Transaction:',
        `  Txn ID:     ${lastTxn.txnId}`,
        `  Mode:       ${lastTxn.mode}`,
        `  Amount:     ₹${lastTxn.amount.toLocaleString('en-IN')}`,
        `  Date:       ${lastTxn.timestamp ? new Date(lastTxn.timestamp).toLocaleString('en-IN') : 'N/A'}`,
      ] : []),
      '',
      '═══════════════════════════════════════════',
      '   Thank you. This is a digital receipt.',
      '═══════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${fee.receiptNo || fee.invoiceNo || fee.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-6 animate-pulse">
          <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
          <div className="h-12 w-48 bg-zinc-800 rounded-xl mb-2" />
        </div>
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 animate-pulse"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" /></div>)}</div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <Users size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Children Found</h3>
        <p className="text-sm text-zinc-500">No student is linked to your account. Contact the school office.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Fees</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage payments for all your children</p>
        </div>
        {children.length > 1 && (
          <select value={selectedChild?.id || ''} onChange={(e) => { const child = children.find(c => c.id === e.target.value); if (child) setSelectedChild(child); }} className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white min-h-[44px]">
            {children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
          </select>
        )}
      </div>

      {/* CONSOLIDATED OVERVIEW */}
      <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 ${consolidatedStats.totalOutstanding > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {consolidatedStats.totalOutstanding > 0 ? <><AlertTriangle size={12} /> Payment Due</> : <><CheckCircle2 size={12} /> All Clear</>}
            </span>
          </div>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Outstanding (All Children)</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            <span className="text-indigo-400">₹</span> {consolidatedStats.totalOutstanding.toLocaleString('en-IN')}
          </h2>
          <p className="text-sm text-zinc-400">
            {consolidatedStats.pendingCount} pending invoice{consolidatedStats.pendingCount !== 1 ? 's' : ''} across {children.length} child{children.length !== 1 ? 'ren' : ''}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={14} /> Secured Transaction
        </div>
      </div>

      {/* MULTI-CHILD SUMMARY (if more than 1 child) */}
      {children.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Children Overview</h3>
          {children.map(child => {
            const childFees = allFees[child.id] || [];
            const childOutstanding = childFees.filter(f => f.status !== 'PAID').reduce((s, f) => s + (f.totalAmount - (f.amountPaid || 0)), 0);
            const childOverdue = childFees.filter(f => f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date(f.dueDate) < new Date())).length;
            const isSelected = selectedChild?.id === child.id;
            return (
              <button key={child.id} onClick={() => setSelectedChild(child)} className={`w-full text-left p-4 rounded-xl border transition-all min-h-[44px] ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${childOverdue > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{child.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{child.name}</p>
                      <p className="text-xs text-zinc-500">{childOverdue > 0 ? `${childOverdue} overdue` : 'Up to date'}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(childOutstanding)}</p>
                      <p className="text-[10px] text-zinc-500">Outstanding</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FEE LEDGER FOR SELECTED CHILD */}
      {selectedChild && (
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">{selectedChild.name}'s Fee Records</h3>
          {(allFees[selectedChild.id] || []).length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 py-12 text-center">
              <FileText size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm font-bold text-zinc-500">No fee records for {selectedChild.name}</p>
              <p className="text-xs text-zinc-400 mt-1">Fee records will appear once generated by the school</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {(allFees[selectedChild.id] || []).map(fee => {
                const remaining = fee.totalAmount - (fee.amountPaid || 0);
                const hasTransactions = fee.transactions && fee.transactions.length > 0;
                return (
                  <div key={fee.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                          fee.status === 'OVERDUE' ? 'bg-rose-600 text-white' :
                          fee.status === 'PARTIAL' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' :
                          'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                        }`}>
                          <IndianRupee size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{fee.title || `${fee.month} Fee`}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                              fee.status === 'PAID' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' :
                              fee.status === 'OVERDUE' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' :
                              fee.status === 'PARTIAL' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' :
                              'text-amber-600 bg-amber-50 dark:bg-amber-900/30'
                            }`}>{fee.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 flex-wrap">
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">{fee.invoiceNo}</span>
                            <span>Due: {fee.dueDate}</span>
                          </div>
                          {fee.status === 'PARTIAL' && <p className="text-[10px] text-indigo-600 font-bold mt-1">Paid: {formatCurrency(fee.amountPaid || 0)} · Remaining: {formatCurrency(remaining)}</p>}
                          {hasTransactions && (
                            <div className="mt-2 space-y-1">
                              {fee.transactions!.slice(-2).map((txn, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1">
                                  <span className="font-mono">{txn.receiptNo || txn.txnId}</span>
                                  <span>{txn.mode} · {formatCurrency(txn.amount)}</span>
                                  <span>{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN') : ''}</span>
                                </div>
                              ))}
                              {(fee.transactions!.length > 2) && <p className="text-[10px] text-zinc-400 text-center">+{fee.transactions!.length - 2} more</p>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(fee.totalAmount)}</p>
                        {fee.status !== 'PAID' && (
                          <button onClick={() => handlePayClick(fee)} disabled={isProcessing} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] disabled:opacity-50">Pay</button>
                        )}
                        {fee.status === 'PAID' && (
                          <button
                            onClick={() => handleDownloadReceipt(fee)}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Download receipt"
                          ><Download size={14} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
            {paymentStep !== 'success' && paymentStep !== 'processing' && (
              <button onClick={() => { setShowPaymentModal(false); setSelectedFee(null); }} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors z-20"><X size={18} /></button>
            )}
            <div className="p-5 pb-0">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Secure Checkout</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Paying {formatCurrency(selectedFee.totalAmount - (selectedFee.amountPaid || 0))} for {selectedFee.title || selectedFee.month}
              </p>
            </div>

            {paymentStep === 'select_method' && (
              <div className="p-5 space-y-3">
                <button onClick={() => setPaymentStep('upi_qr')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-800/50 transition-all group min-h-[44px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm text-indigo-600"><QrCode size={20} /></div>
                    <div className="text-left"><h4 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via UPI QR</h4><p className="text-xs text-zinc-500">GPay, PhonePe, Paytm</p></div>
                  </div>
                  <ChevronRight className="text-zinc-400 group-hover:text-indigo-600" size={16} />
                </button>
                {/* Card flow pending — see followup #6 */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed min-h-[44px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm text-zinc-600"><CreditCard size={20} /></div>
                    <div className="text-left"><h4 className="text-sm font-bold text-zinc-900 dark:text-white">Credit / Debit Card</h4><p className="text-xs text-zinc-500">Currently unavailable</p></div>
                  </div>
                </button>
              </div>
            )}

            {paymentStep === 'upi_qr' && (
              <div className="p-5 text-center">
                <div className="w-48 h-48 bg-white p-4 rounded-2xl mx-auto shadow-inner border-2 border-zinc-100 flex flex-col items-center justify-center mb-4"><QrCode size={140} className="text-zinc-900" /></div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Scan to Pay {formatCurrency(selectedFee.totalAmount - (selectedFee.amountPaid || 0))}</h4>
                <p className="text-sm text-zinc-500 mb-3">Open any UPI app and scan this code</p>
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-left">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">⚠ Mock UPI Sandbox</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">No real money is moved. This is a demo environment for testing the payment flow.</p>
                </div>
                <button onClick={processPayment} disabled={isProcessing} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all min-h-[54px] disabled:opacity-50 active:scale-[0.98]">I Have Paid</button>
                <button onClick={() => setPaymentStep('select_method')} className="mt-3 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wider min-h-[44px] flex items-center justify-center">Back to Methods</button>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-10 text-center">
                <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Processing Payment...</h3>
                <p className="text-sm text-zinc-500">Please wait while we verify your payment</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-white" /></div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Payment Successful!</h3>
                <p className="text-sm text-zinc-500 mb-6">Your digital receipt has been generated.</p>
                <button onClick={handleClosePaymentModal} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 min-h-[54px]">Done</button>
              </div>
            )}

            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 border-t border-zinc-100 dark:border-zinc-800 text-center flex justify-center items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider"><ShieldCheck size={14} /> Secure Transaction</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentFees;
