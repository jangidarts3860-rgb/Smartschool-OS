import React, { useState, useEffect } from 'react';
import { IndianRupee, Download, CheckCircle2, AlertTriangle, Clock, CreditCard, ChevronRight, X, ShieldCheck, QrCode, FileText, Loader2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { User, FeeRecord } from '@/types';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { logSecurityAction } from '@/services/audit';
import { generateId } from '@/lib/utils';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  childId?: string | null;
}

const StudentFees: React.FC<Props> = ({ user, childId }) => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [payAllMode, setPayAllMode] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select_method' | 'upi_qr' | 'processing' | 'success'>('select_method');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFeeId, setExpandedFeeId] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{ count: number; total: number; receiptNo: string } | null>(null);

  const targetStudentId = childId || user.id;

  const DEFAULT_FEES: FeeRecord[] = [
    {
      id: 'fee-term1-2026',
      studentId: targetStudentId,
      studentName: user.name,
      classId: user.classId || '10A',
      schoolId: user.schoolId || 'default',
      title: 'Term 1 Tuition & Computer Lab Fee',
      invoiceNo: 'INV-2026-001',
      academicYear: '2026-27',
      month: 'August',
      totalAmount: 14500,
      amountPaid: 0,
      status: 'PENDING',
      dueDate: '2026-09-15',
      breakdown: [
        { name: 'Tuition Fee (Q1)', amount: 12000 },
        { name: 'Computer & AI Lab', amount: 2500 }
      ]
    },
    {
      id: 'fee-admission-2026',
      studentId: targetStudentId,
      studentName: user.name,
      classId: user.classId || '10A',
      schoolId: user.schoolId || 'default',
      title: 'Annual Registration & Library Kit',
      invoiceNo: 'INV-2026-002',
      academicYear: '2026-27',
      month: 'July',
      totalAmount: 5000,
      amountPaid: 5000,
      status: 'PAID',
      dueDate: '2026-07-10',
      breakdown: [
        { name: 'Library & Activity Kit', amount: 3000 },
        { name: 'Sports Fund', amount: 2000 }
      ]
    }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE || !user.schoolId) {
      setFees(DEFAULT_FEES);
      setLoading(false);
      return;
    }

    const feesRef = collection(db, 'schools', user.schoolId, 'fees');
    const q = query(
        feesRef,
        where('studentId', '==', targetStudentId),
        orderBy('dueDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const feeList = snapshot.docs.map((docSnap: any) => ({
            id: docSnap.id,
            ...docSnap.data()
        })) as FeeRecord[];
        setFees(feeList.length > 0 ? feeList : DEFAULT_FEES);
        setLoading(false);
    }, (err) => {
        console.error("Fees subscription error:", err);
        setFees(DEFAULT_FEES);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user.schoolId, targetStudentId]);

  const pendingFees = fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE');
  const totalOutstanding = pendingFees.reduce((acc, curr) => acc + (curr.totalAmount - (curr.amountPaid || 0)), 0);

  const handlePayClick = (fee?: FeeRecord) => {
      if (isProcessing) return;
      if (fee) {
        setSelectedFee(fee);
        setPayAllMode(false);
      } else {
        setSelectedFee(null);
        setPayAllMode(true);
      }
      setShowPaymentModal(true);
      setPaymentStep('select_method');
  };

  const processPayment = async () => {
      if (isProcessing) {
          toast.error('Payment already processing. Please wait.');
          return;
      }

      let feesToProcess: FeeRecord[] = [];
      if (payAllMode) {
        feesToProcess = pendingFees.filter(f => (f.totalAmount - (f.amountPaid || 0)) > 0);
        if (feesToProcess.length === 0) {
          toast.error('No outstanding fees to pay');
          return;
        }
      } else {
        if (!selectedFee) {
          toast.error('Please select a fee to pay');
          return;
        }
        feesToProcess = [selectedFee];
      }

      setIsProcessing(true);
      setPaymentStep('processing');

      const baseTxnId = `TXN-STU-${Date.now()}-${generateId().slice(0, 4).toUpperCase()}`;
      const baseReceiptNo = `RCP-${Date.now()}-${generateId().slice(0, 2).toUpperCase()}`;

      let processedCount = 0;
      let totalProcessed = 0;
      let lastReceipt = baseReceiptNo;

      try {
        for (let i = 0; i < feesToProcess.length; i++) {
          const feeToPay = feesToProcess[i]!;
          const remainingBalance = feeToPay.totalAmount - (feeToPay.amountPaid || 0);
          if (remainingBalance <= 0) continue;

          const txnId = `${baseTxnId}-${i}`;
          const receiptNo = `${baseReceiptNo}-${i}`;
          const timeBucket = Math.floor(Date.now() / 60000);
          const idempotencyKey = `${user.schoolId}_${feeToPay.id}_${remainingBalance}_${timeBucket}`;

          const feeRef = doc(db, 'schools', user.schoolId, 'fees', feeToPay.id);

          await runTransaction(db, async (transaction) => {
              const feeDoc = await transaction.get(feeRef);
              if (!feeDoc.exists()) {
                  throw new Error('Fee record not found');
              }

              const feeData = feeDoc.data() as FeeRecord;

              if (feeData.status === 'PAID') {
                  throw new Error('Fee already fully paid');
              }

              const currentRemaining = feeData.totalAmount - (feeData.amountPaid || 0);
              if (remainingBalance > currentRemaining + 1) {
                  throw new Error('Payment amount exceeds remaining balance');
              }

              const newAmountPaid = (feeData.amountPaid || 0) + remainingBalance;
              const newStatus: FeeRecord['status'] = newAmountPaid >= feeData.totalAmount ? 'PAID' : 'PARTIAL';

              const txnData = {
                  txnId,
                  amount: remainingBalance,
                  mode: 'UPI',
                  verified: true,
                  timestamp: new Date().toISOString(),
                  note: payAllMode ? 'Student self-payment (bulk) via UPI' : 'Student self-payment via UPI',
                  receiptNo,
                  collectedBy: 'STUDENT_SELF',
                  idempotencyKey,
              };

              transaction.update(feeRef, {
                  amountPaid: newAmountPaid,
                  status: newStatus,
                  transactions: arrayUnion(txnData),
                  lastModified: serverTimestamp(),
                  receiptNo: newStatus === 'PAID' ? receiptNo : feeData.receiptNo,
                  paidAt: newStatus === 'PAID' ? serverTimestamp() : feeData.paidAt,
              });

              const receiptRef = doc(collection(db, 'schools', user.schoolId, 'receipts'));
              transaction.set(receiptRef, {
                  receiptNo,
                  idempotencyKey: `${feeRef.id}_${txnId}`,
                  invoiceNo: feeData.invoiceNo || feeData.invoiceNumber || 'N/A',
                  studentId: feeData.studentId,
                  studentName: feeData.studentName,
                  classId: feeData.classId,
                  feeId: feeToPay.id,
                  amount: remainingBalance,
                  fine: 0,
                  discount: 0,
                  total: remainingBalance,
                  mode: 'UPI',
                  collectedBy: 'STUDENT_SELF',
                  createdAt: serverTimestamp(),
                  schoolId: user.schoolId,
              });
          });

          processedCount++;
          totalProcessed += remainingBalance;
          lastReceipt = receiptNo;
        }

        await logSecurityAction('FEE_PAYMENT', payAllMode ? 'BULK' : (selectedFee?.id || ''), user.schoolId, {
            action: payAllMode ? 'STUDENT_BULK_SELF_PAYMENT' : 'STUDENT_SELF_PAYMENT',
            amount: totalProcessed,
            mode: 'UPI',
            txnId: baseTxnId,
            receiptNo: lastReceipt,
            studentId: targetStudentId,
            feeCount: processedCount,
        });

        setPaymentSummary({ count: processedCount, total: totalProcessed, receiptNo: lastReceipt });
        setPaymentStep('success');
        toast.success(payAllMode
          ? `Paid ${processedCount} fee(s) totaling ${formatCurrency(totalProcessed)}!`
          : 'Payment processed successfully!');
      } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('Payment transaction failed:', err);

          if (errorMessage.includes('already fully paid')) {
              toast.error('Some fees were already paid. Refreshing...');
          } else {
              toast.error(`Payment failed: ${processedCount} of ${feesToProcess.length} processed. ${errorMessage}`);
          }

          setPaymentStep('upi_qr');
      } finally {
          setIsProcessing(false);
      }

      setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentStep('select_method');
          setSelectedFee(null);
          setPayAllMode(false);
          setPaymentSummary(null);
      }, 6000);
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
      }).format(amount);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleDownloadAll = () => {
    if (fees.length === 0) {
      toast.error('No fee records to download');
      return;
    }
    const headers = ['Invoice', 'Title', 'Total', 'Paid', 'Status', 'Due Date', 'Month'];
    const rows = fees.map(f => [
      f.invoiceNo || f.invoiceNumber || '-',
      f.title || f.month || 'Fee',
      (f.totalAmount || 0).toString(),
      (f.amountPaid || 0).toString(),
      f.status || 'PENDING',
      f.dueDate || '-',
      f.month || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(csv, `fees_${targetStudentId}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Fee history downloaded');
  };

  const handleDownloadFee = (fee: FeeRecord) => {
    const lines = [
      `Fee Receipt`,
      `===========`,
      `Invoice: ${fee.invoiceNo || fee.invoiceNumber || fee.id}`,
      `Title: ${fee.title || fee.month || 'Fee'}`,
      `Status: ${fee.status || 'PENDING'}`,
      `Total Amount: ${formatCurrency(fee.totalAmount || 0)}`,
      `Amount Paid: ${formatCurrency(fee.amountPaid || 0)}`,
      `Balance: ${formatCurrency((fee.totalAmount || 0) - (fee.amountPaid || 0))}`,
      `Due Date: ${fee.dueDate || '-'}`,
      `Receipt: ${fee.receiptNo || '-'}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
    ];
    const txt = lines.join('\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_${fee.invoiceNo || fee.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success('Receipt downloaded');
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-32 px-4 md:px-8">
        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-6 animate-pulse">
          <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
          <div className="h-12 w-48 bg-zinc-800 rounded-xl mb-2" />
          <div className="h-4 w-64 bg-zinc-800 rounded" />
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 px-4 md:px-8 animate-fade-in-up">

       <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 ${
                      totalOutstanding > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                      {totalOutstanding > 0 ? <><AlertTriangle size={12} /> Payment Due</> : <><CheckCircle2 size={12} /> All Clear</>}
                  </span>
              </div>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Outstanding Due</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                  <span className="text-indigo-400">₹</span> {totalOutstanding.toLocaleString('en-IN')}
              </h2>
              <p className="text-sm text-zinc-400 max-w-sm">
                  {totalOutstanding > 0
                    ? "Please clear the pending dues to avoid late fees."
                    : "Your account is up to date. Thank you for timely payments!"
                  }
              </p>
          </div>

          {totalOutstanding > 0 && (
              <button
                  onClick={() => handlePayClick()}
                  className="mt-4 w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 min-h-[54px] active:scale-[0.98]"
              >
                  Pay All Dues <ChevronRight size={16} />
              </button>
          )}
          <div className="mt-3 flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> Secured Transaction
          </div>
       </div>

       <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
             <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Fee History</h3>
             <button onClick={handleDownloadAll} className="text-xs font-bold text-indigo-600 flex items-center gap-1 min-h-[44px] p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">Download All <Download size={14}/></button>
          </div>

          {fees.length === 0 ? (
              <div className="py-8 md:py-12 text-center">
                  <FileText size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-500 font-medium">No fee records found</p>
                  <p className="text-xs text-zinc-400 mt-1">Fee records will appear once generated by the school</p>
              </div>
          ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {fees.map(fee => {
                    const remaining = fee.totalAmount - (fee.amountPaid || 0);
                    return (
                      <React.Fragment key={fee.id}>
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-start gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                             fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                             fee.status === 'PARTIAL' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' :
                             fee.status === 'OVERDUE' ? 'bg-rose-600 text-white' :
                             'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                           }`}>
                              <IndianRupee size={18} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{fee.title || fee.month + ' Installment'}</h4>
                                 {fee.status === 'OVERDUE' && (
                                   <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Overdue</span>
                                 )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">#{fee.invoiceNumber || fee.invoiceNo || 'INV-001'}</span>
                                  <span className="flex items-center gap-1"><Clock size={12}/> Due: {fee.dueDate}</span>
                              </div>
                               {fee.status === 'PARTIAL' && (
                                   <p className="text-[10px] text-indigo-600 font-bold mt-1">
                                       Paid: {formatCurrency(fee.amountPaid || 0)} · Remaining: {formatCurrency(remaining)}
                                   </p>
                               )}
                               {fee.transactions && fee.transactions.length > 0 && (
                                   <button onClick={() => setExpandedFeeId(expandedFeeId === fee.id ? null : fee.id)} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-600 mt-1 min-h-[24px]">
                                       {expandedFeeId === fee.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                       {fee.transactions.length} payment{fee.transactions.length !== 1 ? 's' : ''} recorded
                                   </button>
                               )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                           <div className="text-right">
                              <p className="text-lg font-black text-zinc-900 dark:text-white">₹ {fee.totalAmount.toLocaleString('en-IN')}</p>
                              <div className={`text-[10px] font-bold uppercase tracking-wider ${
                                fee.status === 'PAID' ? 'text-emerald-600' :
                                fee.status === 'PARTIAL' ? 'text-indigo-600' :
                                fee.status === 'OVERDUE' ? 'text-rose-600' :
                                'text-amber-600'
                              }`}>
                                 {fee.status === 'PAID' ? <><CheckCircle2 size={12} className="inline mr-1" />{fee.status}</> :
                                  fee.status === 'PARTIAL' ? <><Clock size={12} className="inline mr-1" />{fee.status}</> :
                                  <><AlertTriangle size={12} className="inline mr-1" />{fee.status}</>}
                              </div>
                           </div>
                            {fee.status !== 'PAID' && (
                                <button
                                  onClick={() => handlePayClick(fee)}
                                  disabled={isProcessing}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-700 transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Pay
                                </button>
                            )}
                            <button onClick={() => handleDownloadFee(fee)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Download fee receipt">
                               <Download size={16} />
                            </button>
                         </div>
                      </div>
                      {expandedFeeId === fee.id && fee.transactions && fee.transactions.length > 0 && (
                          <div className="ml-4 sm:ml-14 mr-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-2">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Transaction History</p>
                              {fee.transactions.map((txn, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${txn.mode === 'REFUND' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                              <Receipt size={12} />
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold text-zinc-900 dark:text-white">{txn.mode}</p>
                                              <p className="text-[10px] text-zinc-500">{txn.timestamp ? new Date(txn.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className={`text-xs font-bold ${txn.mode === 'REFUND' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                              {txn.mode === 'REFUND' ? '-' : '+'}{formatCurrency(txn.amount)}
                                          </p>
                                          {txn.receiptNo && <p className="text-[10px] font-mono text-zinc-400">{txn.receiptNo}</p>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      </React.Fragment>
                     );
                 })}
              </div>
          )}
       </div>

       {showPaymentModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
               <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">

                   {paymentStep !== 'success' && paymentStep !== 'processing' && (
                       <button onClick={() => { setShowPaymentModal(false); setSelectedFee(null); }} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors z-20">
                           <X size={18} />
                       </button>
                   )}

                    <div className="p-5 pb-0">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Secure Checkout</h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            {payAllMode
                              ? `Paying all ${pendingFees.filter(f => (f.totalAmount - (f.amountPaid || 0)) > 0).length} pending fee(s) — ${formatCurrency(totalOutstanding)}`
                              : `Paying ${formatCurrency(selectedFee ? (selectedFee.totalAmount - (selectedFee.amountPaid || 0)) : 0)}`}
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                            <ShieldCheck size={12} />
                            Mock UPI Sandbox — no real money is moved. This is a demo environment.
                        </p>
                    </div>

                   {paymentStep === 'select_method' && (
                       <div className="p-5 space-y-3">
                           <button onClick={() => setPaymentStep('upi_qr')} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-800/50 transition-all group min-h-[44px]">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
                                       <QrCode size={20} />
                                   </div>
                                   <div className="text-left">
                                       <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via UPI QR</h4>
                                       <p className="text-xs text-zinc-500">GPay, PhonePe, Paytm</p>
                                   </div>
                               </div>
                               <ChevronRight className="text-zinc-400 group-hover:text-indigo-600" size={16} />
                           </button>

                           <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed min-h-[44px]">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm text-zinc-600">
                                       <CreditCard size={20} />
                                   </div>
                                   <div className="text-left">
                                       <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Credit / Debit Card</h4>
                                       <p className="text-xs text-zinc-500">Currently unavailable</p>
                                   </div>
                               </div>
                           </button>
                       </div>
                   )}

                   {paymentStep === 'upi_qr' && (
                       <div className="p-5 text-center">
                           <div className="w-48 h-48 bg-white p-4 rounded-2xl mx-auto shadow-inner border-2 border-zinc-100 flex flex-col items-center justify-center mb-4">
                               <QrCode size={140} className="text-zinc-900" />
                           </div>
                           <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Scan to Pay {formatCurrency(selectedFee ? (selectedFee.totalAmount - (selectedFee.amountPaid || 0)) : totalOutstanding)}</h4>
                           <p className="text-sm text-zinc-500 mb-6">Open any UPI app and scan this code</p>

                           <button
                               onClick={processPayment}
                               disabled={isProcessing}
                               className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all min-h-[54px] disabled:opacity-50 active:scale-[0.98]"
                           >
                               I Have Paid
                           </button>
                           <button onClick={() => setPaymentStep('select_method')} className="mt-3 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wider min-h-[44px] flex items-center justify-center">
                               Back to Methods
                           </button>
                       </div>
                   )}

                   {paymentStep === 'processing' && (
                       <div className="p-6 md:p-10 text-center">
                           <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
                           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Processing Payment...</h3>
                           <p className="text-sm text-zinc-500">Please wait while we verify your payment</p>
                       </div>
                   )}

                   {paymentStep === 'success' && (
                       <div className="p-6 md:p-10 text-center">
                           <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                               <CheckCircle2 size={40} className="text-white" />
                           </div>
                           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Payment Successful!</h3>
                           {paymentSummary && paymentSummary.count > 1 ? (
                             <>
                               <p className="text-sm text-zinc-500">{paymentSummary.count} fees paid</p>
                               <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(paymentSummary.total)}</p>
                             </>
                           ) : (
                             <p className="text-sm text-zinc-500">Your digital receipt is being generated...</p>
                           )}
                           <p className="text-[10px] text-zinc-400 mt-3 font-mono">Receipt: {paymentSummary?.receiptNo || 'N/A'}</p>
                       </div>
                   )}

                   <div className="bg-zinc-50 dark:bg-zinc-950 p-3 border-t border-zinc-100 dark:border-zinc-800 text-center flex justify-center items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                       <ShieldCheck size={14} /> Secure Transaction
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

export default StudentFees;
