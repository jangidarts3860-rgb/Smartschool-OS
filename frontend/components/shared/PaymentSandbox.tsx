import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Loader2, Smartphone, 
  CreditCard, Wallet, ShieldCheck, Download, ChevronRight,
  IndianRupee, ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateId } from '@/lib/utils';

interface Props {
  amount: number;
  studentName: string;
  feeType: string;
  onSuccess: (txnId: string, mode: string) => void;
  onClose: () => void;
}

const PaymentSandbox: React.FC<Props> = ({ 
  amount, 
  studentName, 
  feeType, 
  onSuccess, 
  onClose 
}) => {
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'WALLET'>('UPI');
  const [txnId, setTxnId] = useState('');

  const handlePay = () => {
    setStep('PROCESSING');
    
    // Simulate Payment Gateway Handshake
    setTimeout(() => {
      const newTxnId = `TXN-${generateId().slice(0, 9).toUpperCase()}`;
      setTxnId(newTxnId);
      setStep('SUCCESS');
      toast.success("Payment Captured Successfully!");
    }, 3000);
  };

  useEffect(() => {
    // Audit log can go here
  }, [step, txnId]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
        
        {/* Header - Revolut Minimal Style */}
        <div className="px-8 py-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-900">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">Safe Checkout</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PCI-DSS 256-bit Encrypted</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={20}/></button>
        </div>

        <div className="p-8 space-y-8">
           
           {step === 'SELECT' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                {/* Amount Display */}
                <div className="text-center py-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Amount Due</p>
                   <h2 className="text-6xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <span className="text-2xl text-slate-400">₹</span>{amount.toLocaleString('en-IN')}
                   </h2>
                </div>

                {/* Details Bar */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-6 flex justify-between items-center border border-slate-100 dark:border-slate-800">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee for {feeType}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{studentName}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Pending</p>
                   </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Choose Method</p>
                   <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'UPI', label: 'UPI (GPay, PhonePe)', icon: Smartphone },
                        { id: 'CARD', label: 'Debit / Credit Card', icon: CreditCard },
                        { id: 'WALLET', label: 'Revolut Wallet / Netbank', icon: Wallet },
                      ].map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setMethod(m.id as any)}
                          className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${method === m.id ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${method === m.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                 <m.icon size={20} />
                              </div>
                              <span className="text-sm font-black text-slate-900 dark:text-white">{m.label}</span>
                           </div>
                           {method === m.id && <div className="w-5 h-5 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center"><CheckCircle2 size={14} className="text-white dark:text-slate-900"/></div>}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Pay Button - Revolut Style Pill */}
                <button 
                   onClick={handlePay}
                   className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                   Complete Transaction <ArrowRight size={18} />
                </button>
             </div>
           )}

           {step === 'PROCESSING' && (
             <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                   <div className="w-32 h-32 border-8 border-slate-100 dark:border-slate-900 rounded-full"></div>
                   <div className="w-32 h-32 border-8 border-slate-900 dark:border-white rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Securing Funds...</h3>
                   <p className="text-slate-500 font-medium text-sm">Please do not close or refresh this window.</p>
                </div>
                <div className="flex gap-2">
                   <span className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full animate-bounce"></span>
                </div>
             </div>
           )}

           {step === 'SUCCESS' && (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                   <CheckCircle2 size={48} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Transaction Complete</h3>
                   <p className="text-slate-500 font-medium text-sm mb-4">Funds have been settled in the school treasury.</p>
                   <div className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {txnId}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                   <button 
                     onClick={() => onSuccess(txnId, method)}
                     className="py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                   >
                      <Download size={16} /> Receipt
                   </button>
                   <button 
                     onClick={onClose}
                     className="py-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                   >
                      Done <ChevronRight size={16} />
                   </button>
                </div>

                <div className="text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Audit Trail Linked to {studentName}</p>
                </div>
             </div>
           )}

        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex items-center justify-center gap-3">
           <ShieldCheck size={14} className="text-slate-400" />
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Encrypted via SmartSchool Bridge</p>
        </div>

      </div>
    </div>
  );
};

export default PaymentSandbox;
