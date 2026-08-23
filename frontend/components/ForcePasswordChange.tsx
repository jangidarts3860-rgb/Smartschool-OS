import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { Shield, Lock, AlertCircle, Loader2, CheckCircle2, Key, Eye, EyeOff } from 'lucide-react';

interface Props {
    user: User;
    onComplete: (newCredential: string) => void;
    onLogout: () => void;
}

const ForcePasswordChange: React.FC<Props> = ({ user, onComplete, onLogout }) => {
    const [credential, setCredential] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const isPin = user.role === UserRole.STUDENT || user.role === UserRole.PARENT;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (credential !== confirm) {
            setError(isPin ? 'PINs do not match' : 'Passwords do not match');
            return;
        }
        if (isPin && (!/^\d{4}$/.test(credential))) {
            setError('PIN must be exactly 4 digits');
            return;
        }
        if (!isPin && credential.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            await authService.setFirstLoginComplete(user.id, user.schoolId, credential);
            setSuccess(true);
            setTimeout(() => onComplete(credential), 1500);
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-10 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Account Secured!</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Your {isPin ? 'PIN' : 'password'} has been set successfully.
                    </p>
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <Shield size={36} className="text-amber-400" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30">
                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-[0.3em]">🚀 First Login</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        {isPin ? 'Set Your PIN' : 'Create Your Password'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                        For security, please set a personal {isPin ? '4-digit PIN' : 'password'}. School admins cannot see your {isPin ? 'PIN' : 'password'}.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            {isPin ? 'New 4-Digit PIN' : 'New Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-4 text-slate-400" size={18} />
                            <input
                                type={isPin ? 'text' : showPassword ? 'text' : 'password'}
                                inputMode={isPin ? 'numeric' : 'text'}
                                maxLength={isPin ? 4 : undefined}
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder={isPin ? '••••' : 'Min 8 characters'}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-14 outline-none dark:text-white font-black text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                                autoFocus
                            />
                            {!isPin && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm{isPin ? ' PIN' : ''}</label>
                        <div className="relative">
                            <Key className="absolute left-5 top-4 text-slate-400" size={18} />
                            <input
                                type={isPin ? 'text' : showPassword ? 'text' : 'password'}
                                inputMode={isPin ? 'numeric' : 'text'}
                                maxLength={isPin ? 4 : undefined}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder={isPin ? '••••' : 'Re-enter password'}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-14 outline-none dark:text-white font-black text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                            />
                            {!isPin && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/30 flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                            <Shield size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 mb-1">🔒 Gold Trust Badge</p>
                            <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                Bank-Grade Encrypted: Your credentials are cryptographically protected using bcrypt (work factor 10). School Admins have zero visibility into your password — not even the system stores plaintext.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !credential || !confirm}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <><Shield size={16} /> Secure My Account</>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all"
                        >
                            Sign out & try later
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForcePasswordChange;
