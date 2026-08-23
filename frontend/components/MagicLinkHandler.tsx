import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Shield, RefreshCw, Lock, Key, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface Props {
    onLogin: (user: User) => void;
}

type LinkState =
    | 'verifying'
    | 'success'
    | 'expired'
    | 'used'
    | 'error'
    | 'reset-form'
    | 'reset-success'
    | 'reset-failed';

const MagicLinkHandler: React.FC<Props> = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [state, setState] = useState<LinkState>('verifying');
    const [user, setUser] = useState<User | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // Reset-form state
    const [newCredential, setNewCredential] = useState('');
    const [confirmCredential, setConfirmCredential] = useState('');
    const [showCredential, setShowCredential] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isResetRoute = location.pathname.startsWith('/auth/reset');

    useEffect(() => {
        const token = searchParams.get('token');
        const schoolId = searchParams.get('schoolId');

        if (!token || !schoolId) {
            setState('error');
            return;
        }

        const verify = async () => {
            try {
                const result = await authService.useMagicLink(token, schoolId);
                if ('expired' in result) {
                    if (result.used) {
                        setState('used');
                    } else {
                        setState('expired');
                    }
                    return;
                }
                if ('user' in result) {
                    setUser(result.user);
                    if (isResetRoute) {
                        setState('reset-form');
                    } else {
                        setState('success');
                        authService.storeSession(result.user);
                        setTimeout(() => onLogin(result.user), 2000);
                    }
                }
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
                setState('error');
            }
        };

        verify();
    }, [searchParams, onLogin, isResetRoute]);

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (newCredential !== confirmCredential) {
            setErrorMsg(isPinUser(user) ? 'PINs do not match' : 'Passwords do not match');
            return;
        }
        if (isPinUser(user)) {
            if (!/^\d{4}$/.test(newCredential)) {
                setErrorMsg('PIN must be exactly 4 digits');
                return;
            }
        } else if (newCredential.length < 8) {
            setErrorMsg('Password must be at least 8 characters');
            return;
        }

        const token = searchParams.get('token');
        const schoolId = searchParams.get('schoolId');
        if (!token || !schoolId) {
            setState('error');
            return;
        }

        setIsSubmitting(true);
        try {
            const ok = await authService.verifyAndUseResetToken(token, schoolId, newCredential);
            if (ok && user) {
                setState('reset-success');
                authService.storeSession({ ...user, isFirstLogin: false });
                setTimeout(() => onLogin({ ...user, isFirstLogin: false }), 2000);
            } else {
                setErrorMsg('Reset link is invalid or already used.');
                setState('reset-failed');
            }
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : 'Failed to reset credential');
            setState('reset-failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const expiredView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl">
                <div className="w-24 h-24 bg-amber-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                    <AlertCircle size={48} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Link Expired</h2>
                <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                    This {isResetRoute ? 'reset' : 'invitation'} link has expired. {isResetRoute ? 'Reset' : 'Invitation'} links are valid for {isResetRoute ? '15 minutes' : '24 hours'} for security.
                </p>
                <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-8">
                    <p className="text-amber-300 text-sm font-bold mb-2">🔐 What to do:</p>
                    <p className="text-amber-200/80 text-xs leading-relaxed">
                        Please request a new {isResetRoute ? 'reset' : 'invite'} link from your school administrator.
                    </p>
                </div>
                <a
                    href="/"
                    className="inline-flex items-center gap-3 bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                >
                    <RefreshCw size={16} /> Return to Login
                </a>
            </div>
        </div>
    );

    const usedView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl">
                <div className="w-24 h-24 bg-orange-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
                    <Shield size={48} className="text-orange-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Already Used</h2>
                <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                    This link has already been used. Each magic link can only be used once for security.
                </p>
                <p className="text-slate-500 text-xs mb-8">
                    If you need another invitation, please contact your school administrator.
                </p>
                <a
                    href="/"
                    className="inline-flex items-center gap-3 bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    Go to Login
                </a>
            </div>
        </div>
    );

    const successView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl animate-scale-in">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Welcome!</h2>
                <p className="text-slate-400 text-sm font-medium mb-2">You've been securely authenticated</p>
                <p className="text-emerald-400 font-black text-lg mb-8">{user?.name}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting to your dashboard...
                </div>
            </div>
        </div>
    );

    const resetFormView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <Key size={36} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                        Set New {isPinUser(user) ? 'PIN' : 'Password'}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">
                        Hello {user?.name}, please set a new {isPinUser(user) ? '4-digit PIN' : 'password'} to continue.
                    </p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            New {isPinUser(user) ? '4-Digit PIN' : 'Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                            <input
                                type={isPinUser(user) ? 'text' : showCredential ? 'text' : 'password'}
                                inputMode={isPinUser(user) ? 'numeric' : 'text'}
                                maxLength={isPinUser(user) ? 4 : undefined}
                                value={newCredential}
                                onChange={(e) => setNewCredential(e.target.value)}
                                placeholder={isPinUser(user) ? '••••' : 'Min 8 characters'}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-12 outline-none text-white font-black text-sm focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                            {!isPinUser(user) && (
                                <button
                                    type="button"
                                    onClick={() => setShowCredential((s) => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showCredential ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            Confirm {isPinUser(user) ? 'PIN' : 'Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                            <input
                                type={isPinUser(user) ? 'text' : showCredential ? 'text' : 'password'}
                                inputMode={isPinUser(user) ? 'numeric' : 'text'}
                                maxLength={isPinUser(user) ? 4 : undefined}
                                value={confirmCredential}
                                onChange={(e) => setConfirmCredential(e.target.value)}
                                placeholder="Re-enter"
                                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-12 outline-none text-white font-black text-sm focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    {errorMsg && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !newCredential || !confirmCredential}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                            <>Set & Continue <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );

    const resetSuccessView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl animate-scale-in">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                    {isPinUser(user) ? 'PIN' : 'Password'} Updated!
                </h2>
                <p className="text-slate-400 text-sm font-medium mb-8">
                    You're being signed in with your new {isPinUser(user) ? 'PIN' : 'password'}.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting to your dashboard...
                </div>
            </div>
        </div>
    );

    const resetFailedView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl">
                <div className="w-24 h-24 bg-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                    <AlertCircle size={48} className="text-rose-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Reset Failed</h2>
                <p className="text-slate-400 text-sm mb-8">{errorMsg || 'The reset link is no longer valid.'}</p>
                <a
                    href="/"
                    className="inline-flex items-center gap-3 bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    Return to Login
                </a>
            </div>
        </div>
    );

    const errorView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl">
                <div className="w-24 h-24 bg-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                    <AlertCircle size={48} className="text-rose-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Invalid Link</h2>
                <p className="text-slate-400 text-sm mb-8">{errorMsg || 'This link is invalid or malformed.'}</p>
                <a
                    href="/"
                    className="inline-flex items-center gap-3 bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    Return to Login
                </a>
            </div>
        </div>
    );

    const verifyingView = (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 text-center shadow-2xl">
                <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                    <Sparkles size={48} className="text-indigo-400 animate-pulse" />
                </div>
                <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto mb-6" />
                <h2 className="text-xl font-black text-white tracking-tight mb-2">Verifying Link</h2>
                <p className="text-slate-400 text-sm">Please wait while we authenticate your secure link...</p>
            </div>
        </div>
    );

    switch (state) {
        case 'verifying': return verifyingView;
        case 'success': return successView;
        case 'expired': return expiredView;
        case 'used': return usedView;
        case 'reset-form': return resetFormView;
        case 'reset-success': return resetSuccessView;
        case 'reset-failed': return resetFailedView;
        case 'error': return errorView;
        default: return errorView;
    }
};

function isPinUser(user: User | null): boolean {
    return user?.role === UserRole.STUDENT || user?.role === UserRole.PARENT;
}

export default MagicLinkHandler;
