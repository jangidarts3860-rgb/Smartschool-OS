import React from 'react';
import {
  MessageCircle,
  CheckCircle2,
  Send,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface WhatsAppState {
  phone: string;
  otp: string;
  isVerified: boolean;
  isSendingOtp: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  error: string;
}

interface Props {
  state: WhatsAppState;
  setState: React.Dispatch<React.SetStateAction<WhatsAppState>>;
  onSendOtp: () => Promise<void>;
  onVerifyOtp: () => Promise<void>;
  onReset: () => void;
}

const WhatsAppSection: React.FC<Props> = ({ state, setState, onSendOtp, onVerifyOtp, onReset }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <MessageCircle size={32} className="text-green-500" /> WhatsApp Verification
          </h3>
          {state.isVerified && (
            <span className="px-4 py-2 bg-green-100 text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} /> Linked & Active
            </span>
          )}
        </div>

        {!state.isVerified ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp Phone Number</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-slate-400 font-bold">+91</span>
                </div>
                <input
                  type="tel"
                  value={state.phone}
                  onChange={e => setState({ ...state, phone: e.target.value.replace(/\D/g, '').slice(0, 10), error: '' })}
                  placeholder="98765 43210"
                  disabled={state.otpSent}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 rounded-2xl pl-20 pr-6 py-5 text-base font-black outline-none transition-all shadow-sm"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-medium italic ml-2">Enter the WhatsApp number registered with your school</p>
            </div>

            {state.otpSent && (
              <div className="space-y-3 animate-in slide-in-from-top-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Enter OTP</label>
                <input
                  type="text"
                  value={state.otp}
                  onChange={e => setState({ ...state, otp: e.target.value.replace(/\D/g, '').slice(0, 6), error: '' })}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 rounded-2xl px-6 py-5 text-base font-black text-center tracking-[0.5em] outline-none transition-all shadow-sm"
                />
                {import.meta.env.DEV && (
                  <p className="text-[9px] text-green-600 mt-2 font-medium italic ml-2">
                    Dev mode: OTP must match <code className="font-mono">VITE_DEV_OTP</code> in your .env.local file.
                  </p>
                )}
              </div>
            )}

            {state.error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                <AlertCircle size={18} className="text-red-500" />
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{state.error}</p>
              </div>
            )}

            <div className="flex gap-4">
              {!state.otpSent ? (
                <button
                  onClick={onSendOtp}
                  disabled={state.isSendingOtp || state.phone.length < 10}
                  className="flex-1 py-5 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.isSendingOtp ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending OTP...</>
                  ) : (
                    <><Send size={18} /> Send OTP</>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setState({ ...state, otpSent: false, otp: '' })}
                    className="py-5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    Change Number
                  </button>
                  <button
                    onClick={onVerifyOtp}
                    disabled={state.isVerifying || state.otp.length < 6}
                    className="flex-1 py-5 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isVerifying ? (
                      <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                    ) : (
                      <><Check size={18} /> Verify OTP</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-[3rem] border-2 border-green-200 dark:border-green-800 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Check size={40} className="text-white" />
              </div>
              <h4 className="text-xl font-black text-green-700 dark:text-green-400">WhatsApp Connected!</h4>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2 font-medium">
                Messages will be sent to: <span className="font-black">+91 {state.phone}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Notification Status</p>
                  <p className="text-sm font-black text-green-600">Active & Ready</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                  <Send size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Auto Alerts</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Fee Reminders, Attendance, Results</p>
                </div>
              </div>
            </div>

            <button
              onClick={onReset}
              className="w-full py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-red-300 hover:text-red-500 active:scale-95 transition-all"
            >
              Disconnect & Re-verify
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <MessageCircle size={48} className="mb-6 opacity-30" />
          <h4 className="text-2xl font-black mb-4 tracking-tight">WhatsApp Business API</h4>
          <p className="text-green-100 text-sm font-medium leading-relaxed mb-6">
            Connect your school's WhatsApp Business account to send automated fee reminders, attendance alerts, and exam results directly to parents.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check size={16} className="text-green-300" />
              <span className="text-sm font-medium text-green-100">Automated fee collection reminders</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={16} className="text-green-300" />
              <span className="text-sm font-medium text-green-100">Instant attendance notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={16} className="text-green-300" />
              <span className="text-sm font-medium text-green-100">Exam result sharing</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={16} className="text-green-300" />
              <span className="text-sm font-medium text-green-100">Notice board updates</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[3rem] border border-amber-200 dark:border-amber-900/30">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-amber-500 shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-black text-amber-700 dark:text-amber-400">Demo Mode Active</h4>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-500 mt-2 leading-relaxed">
                In development, OTP verification is gated on <code className="font-mono">VITE_DEV_OTP</code>. In production, a real OTP is sent to your WhatsApp number via the WhatsApp Business API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSection;
