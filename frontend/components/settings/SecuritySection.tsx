import React from 'react';
import {
  Lock,
  Mail,
  Clock,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { User, UserRole } from '@/types';

interface PasswordState {
  current: string;
  new: string;
  confirm: string;
}

interface Props {
  user: User;
  passwordState: PasswordState;
  setPasswordState: React.Dispatch<React.SetStateAction<PasswordState>>;
  onUpdatePassword: () => Promise<void>;
  isSaving: boolean;
}

const SecuritySection: React.FC<Props> = ({ user, passwordState, setPasswordState, onUpdatePassword, isSaving }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl"><Lock size={24}/></div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Control</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Protect your digital identity</p>
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
            <Mail size={14} className="text-indigo-600" />
            <p className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Forgot Password? Use Registered Gmail for Zero-Cost Reset</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
            {user.password ? "Current Password" : "Current Password (Default: Your DOB YYYY-MM-DD)"}
          </label>
          <input 
            type="password" 
            value={passwordState.current}
            onChange={e => setPasswordState({...passwordState, current: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-black outline-none transition-all" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">New Password</label>
            <input 
              type="password" 
              value={passwordState.new}
              onChange={e => setPasswordState({...passwordState, new: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-black outline-none transition-all" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm New Password</label>
            <input 
              type="password" 
              value={passwordState.confirm}
              onChange={e => setPasswordState({...passwordState, confirm: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-red-500 rounded-2xl px-6 py-4 text-sm font-black outline-none transition-all" 
            />
          </div>
        </div>

        <button 
          onClick={onUpdatePassword}
          disabled={isSaving}
          className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2.5rem] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          {isSaving ? <Clock className="animate-spin" size={18} /> : <Shield size={18} />}
          Update Access Credentials
        </button>

        {user.role === UserRole.STUDENT && !user.password && (
          <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-200 dark:border-amber-900/30 flex gap-4">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Security Note:</strong> You are currently using your Date of Birth as a password. We highly recommend setting a custom password for better security.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySection;
