import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LucideProps } from 'lucide-react';
import { User, UserRole } from '../types';
import { MOCK_USERS, IS_DEMO_MODE, getDeterministicAvatar } from '../constants';
import Avatar from './shared/Avatar';
import { verifyPassword } from '../utils/crypto';
import { generateId } from '../lib/utils';
import {
    ShieldCheck,
    ArrowRight,
    AlertCircle,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Loader2,
    User as UserIcon,
    Sparkles,
    Users,
    GraduationCap,
    Phone,
    MapPin,
    Building2,
    Clock,
    HelpCircle,
    MessageCircle,
    Copy,
    CheckCircle,
    X,
    RefreshCw,
    Smartphone,
    Shield,
    Key,
    Send
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { userService } from '../services/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { generateWaMeLink, generateWaMeBroadcast, isWhatsAppEnabled, WhatsAppDisabledError } from '../utils/whatsapp';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../services/rateLimit';
import { authService, maskContact } from '../services/authService';

interface LoginProps {
    onLogin: (user: User) => void;
    onRegister: () => void;
}

type AuthTab = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
type ViewState = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';

interface TabConfig {
    id: AuthTab;
    label: string;
    icon: React.ComponentType<LucideProps>;
    identifierLabel: string;
    identifierPlaceholder: string;
    identifierType: 'text' | 'email';
    credentialLabel: string;
    credentialPlaceholder: string;
    credentialType: 'pin' | 'password';
    forgotMessage: string;
}

const TABS: TabConfig[] = [
    {
        id: 'STUDENT',
        label: 'Student',
        icon: GraduationCap,
        identifierLabel: 'Student Unique ID',
        identifierPlaceholder: 'STU001',
        identifierType: 'text',
        credentialLabel: '4-Digit PIN',
        credentialPlaceholder: '••••',
        credentialType: 'pin',
        forgotMessage: 'Forgot Student PIN?'
    },
    {
        id: 'PARENT',
        label: 'Parent',
        icon: Users,
        identifierLabel: 'Child ID',
        identifierPlaceholder: 'STU001',
        identifierType: 'text',
        credentialLabel: 'Phone Last 4 Digits',
        credentialPlaceholder: '••••',
        credentialType: 'pin',
        forgotMessage: 'Forgot Phone / PIN?'
    },
    {
        id: 'TEACHER',
        label: 'Teacher',
        icon: UserIcon,
        identifierLabel: 'Teacher Unique ID',
        identifierPlaceholder: 'TCH001',
        identifierType: 'text',
        credentialLabel: 'Password',
        credentialPlaceholder: '••••••••',
        credentialType: 'password',
        forgotMessage: 'Forgot Password?'
    },
    {
        id: 'ADMIN',
        label: 'Admin',
        icon: ShieldCheck,
        identifierLabel: 'Email Address',
        identifierPlaceholder: 'admin@school.com',
        identifierType: 'email',
        credentialLabel: 'Password',
        credentialPlaceholder: '••••••••',
        credentialType: 'password',
        forgotMessage: 'Forgot Password?'
    }
];

const IS_MOCK_MODE = IS_DEMO_MODE;

const PRODUCTION_DELAY_SECONDS = [0, 0, 30, 120, 300, 900];
const DEMO_MODE_DELAY_SECONDS = [0, 0, 10, 20, 30, 60];

function getDelayForAttempt(attempt: number): number {
    const delays = IS_MOCK_MODE ? DEMO_MODE_DELAY_SECONDS : PRODUCTION_DELAY_SECONDS;
    if (attempt < 2) return 0;
    if (attempt >= delays.length) return delays[delays.length - 1]!;
    return delays[attempt]!;
}

interface PinInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: () => void;
    disabled?: boolean;
    shakeKey?: number;
}

const PinInput: React.FC<PinInputProps> = ({ value, onChange, onComplete, disabled, shakeKey }) => {
    const digits = value.split('').concat(Array(4 - value.length).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = useCallback(
        (index: number, inputValue: string) => {
            if (!/^\d*$/.test(inputValue)) return;
            const newValue = value.slice(0, index) + inputValue + value.slice(index + 1);
            const trimmed = newValue.slice(0, 4);
            onChange(trimmed);

            if (inputValue && index < 3) {
                inputsRef.current[index + 1]?.focus();
            }

            if (trimmed.length === 4 && onComplete) {
                setTimeout(() => onComplete(), 100);
            }
        },
        [value, onChange, onComplete]
    );

    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && !value[index] && index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                onComplete?.();
            }
        },
        [value, onComplete]
    );

    return (
        <div
            key={shakeKey ?? 0}
            className={`flex gap-3 justify-center ${shakeKey ? 'animate-shake' : ''}`}
        >
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-14 h-16 text-center text-2xl font-black bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                />
            ))}
        </div>
    );
};

function isFirebaseError(err: unknown): err is { code: string; message: string } {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        'message' in err &&
        typeof (err as Record<string, unknown>).code === 'string' &&
        typeof (err as Record<string, unknown>).message === 'string'
    );
}

const CountdownHUD: React.FC<{ seconds: number }> = ({ seconds }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-sm w-full mx-4 text-center shadow-2xl shadow-black/50 animate-scale-in">
            <div className="w-20 h-20 bg-amber-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                <Clock size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mb-2">Too Many Attempts</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">Security lockout active</p>
            <div className="text-6xl font-black text-amber-400 mb-8 tabular-nums">
                {seconds}s
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(seconds / 900) * 100}%` }}
                ></div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6">
                Try again in {seconds} seconds
            </p>
        </div>
    </div>
);

const ForgotPasswordModal: React.FC<{
    activeTab: AuthTab;
    onClose: () => void;
    onResetSent: (message: string) => void;
    onError: (message: string) => void;
}> = ({ activeTab, onClose, onResetSent, onError }) => {
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [contactInfo, setContactInfo] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;
        setIsLoading(true);

        try {
            if (activeTab === 'ADMIN') {
                if (IS_MOCK_MODE) {
                    await new Promise(r => setTimeout(r, 1000));
                    onResetSent('✅ Password reset link sent to your registered email.');
                } else {
                    const success = await authService.adminForgotPassword(identifier);
                    if (success) {
                        onResetSent('✅ Password reset link sent to your registered email.');
                    } else {
                        onResetSent('ℹ️ If this email is registered, a reset link has been sent.');
                    }
                }
                onClose();
                return;
            }

            const contact = await authService.getRegisteredContact(identifier, activeTab as unknown as UserRole);
            if (contact) {
                const masked = contact.email ? maskContact(contact.email) : contact.phone ? maskContact(contact.phone) : 'registered contact';
                setContactInfo(masked);
            }

            if (activeTab === 'TEACHER') {
                onResetSent('🔐 Zero-Knowledge Reset: Admin has been notified. They will authorize a secure 15-minute reset link.');
            } else if (activeTab === 'STUDENT') {
                onResetSent('👨‍👩‍👧‍👦 Mummy/Papa Override: Parents can reset PIN from their Parent Portal Settings > Security tab.\n\nOr ask Class Teacher/Admin to trigger a reset WhatsApp link.');
            } else if (activeTab === 'PARENT') {
                onResetSent('📱 Please check your initial WhatsApp onboarding invite link.\n\nOr ask Admin to click "Resend Welcome Link" in Student Management.');
            }
            onClose();
        } catch {
            onError('Failed to process request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isPinTab = activeTab === 'STUDENT' || activeTab === 'PARENT';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                            <Key size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {activeTab === 'ADMIN' ? 'Reset Password' :
                                 activeTab === 'TEACHER' ? 'Reset Password' :
                                 activeTab === 'STUDENT' ? 'Reset PIN' :
                                 'Recover Access'}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeTab} Account</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {contactInfo ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                            {activeTab === 'ADMIN' ? 'Reset link sent' : 'Recovery contact found'}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {activeTab === 'ADMIN'
                                ? `Reset link sent to: ${contactInfo}`
                                : isPinTab
                                    ? 'Use Parent Portal or contact Admin'
                                    : `Registered: ${contactInfo}`
                            }
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                {isPinTab ? 'Student/Child Unique ID' : `${activeTab === 'ADMIN' ? 'Email' : 'Unique ID'}`}
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={isPinTab ? 'STU001' : activeTab === 'ADMIN' ? 'admin@school.com' : 'TCH001'}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                {activeTab === 'ADMIN' && 'A password reset link will be sent to your registered email address.'}
                                {activeTab === 'TEACHER' && 'Admin will authorize a zero-knowledge reset. You will receive a 15-minute secure link via WhatsApp/Email. Admin never sees your new password.'}
                                {activeTab === 'STUDENT' && 'Parents can reset your 4-digit PIN from their Parent Portal Settings → Security tab. Or request your Class Teacher to trigger a PIN reset.'}
                                {activeTab === 'PARENT' && 'Since Parents use phone-based login, recovery is via your WhatsApp onboarding invite. Ask Admin to resend the welcome link from Student Management.'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !identifier.trim()}
                            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> {activeTab === 'ADMIN' ? 'Send Reset Link' : 'Continue Recovery'}</>}
                        </button>
                    </form>
                )}

                {!contactInfo && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                            🔒 Bank-Grade Secure • Zero-Knowledge Protocol
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ForcePasswordChange: React.FC<{
    user: User;
    onComplete: (newCredential: string) => void;
    onLogout: () => void;
}> = ({ user, onComplete, onLogout }) => {
    const [credential, setCredential] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPin = user.role === UserRole.STUDENT || user.role === UserRole.PARENT;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (credential !== confirm) {
            setError(isPin ? 'PINs do not match' : 'Passwords do not match');
            return;
        }
        if (isPin && (credential.length !== 4 || !/^\d{4}$/.test(credential))) {
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
            onComplete(credential);
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <Shield size={36} className="text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Secure Your Account</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {user.role === UserRole.STUDENT ? 'Set your personal 4-digit PIN' :
                         user.role === UserRole.PARENT ? 'Set your personal phone PIN' :
                         'Create a new password'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-5 outline-none dark:text-white font-black text-sm focus:border-amber-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm{isPin ? ' PIN' : ''}</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-4 text-slate-400" size={18} />
                            <input
                                type={isPin ? 'text' : showPassword ? 'text' : 'password'}
                                inputMode={isPin ? 'numeric' : 'text'}
                                maxLength={isPin ? 4 : undefined}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder={isPin ? '••••' : 'Re-enter password'}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-5 outline-none dark:text-white font-black text-sm focus:border-amber-500 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {!isPin && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3">
                            <Shield size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                🔒 Bank-Grade Encrypted: Your credentials are cryptographically protected. School Admins have zero visibility into your password.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !credential || !confirm}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Shield size={16} /> Secure & Continue</>}
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={onLogout} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-all">
                            Sign out & try later
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
    const [view, setView] = useState<ViewState>('LOGIN');
    const [activeTab, setActiveTab] = useState<AuthTab>('STUDENT');

    const [identifier, setIdentifier] = useState('');
    const [credential, setCredential] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [attemptCount, setAttemptCount] = useState(0);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [showForgot, setShowForgot] = useState(false);

    const [signupData, setSignupData] = useState({
        schoolName: '',
        schoolAddress: '',
        schoolPhone: '',
        schoolCity: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        password: ''
    });

    const [signupSuccess, setSignupSuccess] = useState<{ magicLink: string; schoolName: string; adminName: string } | null>(null);
    const [signupThrottleUntil, setSignupThrottleUntil] = useState<number>(0);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [shakeKey, setShakeKey] = useState(0);

    const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0]!;

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (lockoutSeconds > 0) {
            lockoutTimerRef.current = setInterval(() => {
                setLockoutSeconds((prev) => {
                    if (prev <= 1) {
                        if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
        };
    }, [lockoutSeconds]);

    const getDemoCredentials = (tabId: AuthTab) => {
        switch (tabId) {
            case 'ADMIN': return { id: 'admin@school.com', pass: 'demo1234' };
            case 'TEACHER': return { id: 'TCH001', pass: 'demo1234' };
            case 'STUDENT': return { id: 'STU001', pass: '1234' };
            case 'PARENT': return { id: 'STU001', pass: '1234' };
        }
    };

    const switchTab = useCallback(
        (tabId: AuthTab) => {
            setActiveTab(tabId);
            if (IS_MOCK_MODE) {
                const creds = getDemoCredentials(tabId);
                setIdentifier(creds.id);
                setCredential(creds.pass);
            } else {
                setIdentifier('');
                setCredential('');
            }
            setError('');
            setShowForgot(false);
            setAttemptCount(0);
            setLockoutSeconds(0);
        },
        []
    );

    // Initial pre-fill on mount
    useEffect(() => {
        if (IS_MOCK_MODE) {
            const creds = getDemoCredentials(activeTab);
            setIdentifier(creds.id);
            setCredential(creds.pass);
        }
    }, []);

    const handleQuickDemoLogin = useCallback(
        (tabId: AuthTab) => {
            switchTab(tabId);
            setIsLoading(true);
            setError('');

            setTimeout(() => {
                let mockUser: User | undefined;
                if (tabId === 'ADMIN') {
                    mockUser = MOCK_USERS.find((u) => u.email === 'admin@school.com' && u.role === UserRole.ADMIN);
                } else if (tabId === 'TEACHER') {
                    mockUser = MOCK_USERS.find((u) => u.uniqueId === 'TCH001' && u.role === UserRole.TEACHER);
                } else if (tabId === 'STUDENT') {
                    mockUser = MOCK_USERS.find((u) => u.uniqueId === 'STU001' && u.role === UserRole.STUDENT);
                } else if (tabId === 'PARENT') {
                    mockUser = buildMockParent();
                }

                if (mockUser) {
                    authService.storeSession(mockUser);
                    onLogin(mockUser);
                } else {
                    setIsLoading(false);
                }
            }, 300);
        },
        [switchTab, onLogin]
    );

    const formatLockout = (sec: number): string => {
        if (sec < 60) return `${sec}s`;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    const triggerShake = () => setShakeKey((k) => k + 1);

    const findMockUser = (): User => {
        if (activeTab === 'ADMIN') {
            const matched = MOCK_USERS.find(
                (u) => (u.email?.toLowerCase() === identifier.toLowerCase() || u.uniqueId === identifier) && u.role === UserRole.ADMIN
            );
            if (matched) {
                return { ...matched, avatar: getDeterministicAvatar(matched.name, UserRole.ADMIN) };
            }
            const name = identifier ? identifier.split('@')[0]! : 'Admin User';
            const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
            return {
                id: `u-admin-${Date.now()}`,
                uniqueId: identifier || 'ADM001',
                schoolId: 'SCH01',
                name: cleanName,
                email: identifier && identifier.includes('@') ? identifier : 'admin@school.com',
                role: UserRole.ADMIN,
                avatar: getDeterministicAvatar(cleanName, UserRole.ADMIN),
                phone: '+91 98765 43210',
                isLinked: true,
                status: 'ACTIVE'
            };
        }
        if (activeTab === 'TEACHER') {
            const matched = MOCK_USERS.find(
                (u) => (u.uniqueId === identifier || u.email?.toLowerCase() === identifier.toLowerCase()) && u.role === UserRole.TEACHER
            );
            if (matched) {
                return { ...matched, avatar: getDeterministicAvatar(matched.name, UserRole.TEACHER) };
            }
            return {
                id: `u-tch-${Date.now()}`,
                uniqueId: identifier || 'TCH001',
                schoolId: 'SCH01',
                name: 'Anjali Sharma',
                email: 'anjali@school.com',
                role: UserRole.TEACHER,
                classId: '10A',
                avatar: getDeterministicAvatar('Anjali Sharma', UserRole.TEACHER),
                phone: '+91 98765 43210',
                isLinked: true,
                subjects: ['Mathematics', 'Science'],
                assignedClasses: ['10A', '9A'],
                status: 'ACTIVE'
            };
        }
        if (activeTab === 'STUDENT') {
            const matched = MOCK_USERS.find(
                (u) => (u.uniqueId === identifier || u.id === identifier || String(u.rollNo) === identifier) && u.role === UserRole.STUDENT
            );
            if (matched) {
                return { ...matched, classId: '12A', avatar: getDeterministicAvatar(matched.name, UserRole.STUDENT) };
            }
            return {
                id: `u-stu-${Date.now()}`,
                uniqueId: identifier || 'STU001',
                schoolId: 'SCH01',
                name: 'Aarav Sharma',
                email: 'aarav@student.school.com',
                role: UserRole.STUDENT,
                classId: '12A',
                avatar: getDeterministicAvatar('Aarav Sharma', UserRole.STUDENT),
                phone: '+91 98765 43210',
                parentPhone: '+91 98765 43210',
                isLinked: true,
                status: 'ACTIVE'
            };
        }
        const defaultUser = MOCK_USERS[0]!;
        return { ...defaultUser, avatar: getDeterministicAvatar(defaultUser.name, defaultUser.role) };
    };

    const buildMockParent = (): User => {
        const student = MOCK_USERS.find(
            (u) => (u.uniqueId === identifier || u.id === identifier || String(u.rollNo) === identifier) && u.role === UserRole.STUDENT
        );
        if (student) {
            const existingParent = MOCK_USERS.find(u => u.role === UserRole.PARENT && u.childrenIds?.includes(student.id));
            if (existingParent) {
                return { ...existingParent, avatar: getDeterministicAvatar(existingParent.name, UserRole.PARENT) };
            }

            const lastName = student.name.split(' ')[1] || 'Sharma';
            const parentName = `Rajesh ${lastName}`;
            return {
                id: `par-${student.id}`,
                uniqueId: `PAR-${student.id}`,
                name: parentName,
                email: `rajesh.${lastName.toLowerCase()}@parent.school.com`,
                role: UserRole.PARENT,
                schoolId: student.schoolId,
                phone: student.parentPhone || '+91 98765 43210',
                childrenIds: ['stu002', student.id],
                avatar: getDeterministicAvatar(parentName, UserRole.PARENT),
                status: 'ACTIVE'
            };
        }
        const defaultParent = MOCK_USERS.find(u => u.role === UserRole.PARENT);
        if (defaultParent) {
            return { ...defaultParent, childrenIds: ['stu002', 'stu001'], avatar: getDeterministicAvatar(defaultParent.name, UserRole.PARENT) };
        }
        return {
            id: `par-demo-${Date.now()}`,
            uniqueId: 'PAR001',
            name: 'Rajesh Sharma',
            email: 'rajesh.sharma@parent.school.com',
            role: UserRole.PARENT,
            schoolId: 'SCH01',
            phone: '+91 98765 43210',
            childrenIds: ['stu002', 'stu001'],
            avatar: getDeterministicAvatar('Rajesh Sharma', UserRole.PARENT),
            status: 'ACTIVE'
        };
    };

    const handleSmartLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (lockoutSeconds > 0) {
            setError(`⏳ Please wait ${formatLockout(lockoutSeconds)} before trying again.`);
            triggerShake();
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await new Promise((resolve) => setTimeout(resolve, 200));

            const mockUser = activeTab === 'PARENT' ? buildMockParent() : findMockUser();

            if (mockUser) {
                mockUser.avatar = getDeterministicAvatar(mockUser.name, mockUser.role);
                setAttemptCount(0);
                authService.storeSession(mockUser);
                onLogin(mockUser);
                return;
            }

            const defaultUser = findMockUser();
            defaultUser.avatar = getDeterministicAvatar(defaultUser.name, defaultUser.role);
            authService.storeSession(defaultUser);
            onLogin(defaultUser);
        } catch (err: any) {
            console.error('Login error:', err);
            const defaultUser = findMockUser();
            defaultUser.avatar = getDeterministicAvatar(defaultUser.name, defaultUser.role);
            authService.storeSession(defaultUser);
            onLogin(defaultUser);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFailedAttempt = () => {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        const delay = getDelayForAttempt(newCount);
        if (delay > 0) {
            setLockoutSeconds(delay);
        }
        setError('❌ Invalid credentials. Please check and try again.');
        triggerShake();
    };

    const handleForgot = () => {
        setShowForgot(true);
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const nowMs = Date.now();
        if (nowMs < signupThrottleUntil) {
            const wait = Math.ceil((signupThrottleUntil - nowMs) / 1000);
            setError(`⏳ Please wait ${wait}s before trying to sign up again.`);
            triggerShake();
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            if (IS_MOCK_MODE) {
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 800));
                
                const schoolId = `SCH-${generateId().slice(0, 6).toUpperCase()}`;
                const adminUniqueId = `ADM-${new Date().getFullYear()}-${generateId().slice(0, 6).toUpperCase()}-1234`;
                const magicLink = `${window.location.origin}/auth/magic?token=mock_token_${Date.now()}&schoolId=${schoolId}`;
                
                setSignupData((prev) => ({ ...prev, password: '' }));
                setSignupSuccess({ magicLink, schoolName: signupData.schoolName, adminName: signupData.adminName });
                setSignupThrottleUntil(Date.now() + 5_000);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                signupData.adminEmail,
                signupData.password
            );
            const schoolId = `SCH-${generateId().slice(0, 6).toUpperCase()}`;
            const now = new Date();

            await setDoc(doc(db, 'schools', schoolId), {
                id: schoolId,
                name: signupData.schoolName,
                address: signupData.schoolAddress,
                phone: signupData.schoolPhone,
                city: signupData.schoolCity,
                status: 'ACTIVE',
                createdAt: now,
                config: { primaryColor: '#4f46e5', secondaryColor: '#0f172a' },
                subscription: { plan: 'TRIAL', expiryDate: null }
            });

            const newUser: User = {
                id: userCredential.user.uid,
                uniqueId: `ADM-${now.getFullYear()}-${generateId().slice(0, 6).toUpperCase()}-${String(Math.floor(1000 + (crypto.getRandomValues(new Uint32Array(1))[0]! % 9000))).padStart(4, '0')}`,
                name: signupData.adminName,
                email: signupData.adminEmail,
                phone: signupData.adminPhone,
                role: UserRole.ADMIN,
                schoolId: schoolId,
                isFirstLogin: true,
                status: 'ACTIVE'
            };
            await userService.createUser(newUser);

            const magicLink = await authService.createMagicLink(
                newUser.id,
                schoolId,
                UserRole.ADMIN,
                'system-signup'
            );

            await firebaseSignOut(auth);
            authService.clearSession();

            let whatsappOpened = false;
            if (isWhatsAppEnabled()) {
                try {
                    const waLink = generateWaMeLink(signupData.adminPhone, 'SCHOOL_WELCOME', {
                        schoolName: signupData.schoolName,
                        name: signupData.adminName,
                        uniqueId: newUser.uniqueId,
                        credential: '',
                        magicLink,
                        loginUrl: window.location.origin
                    });
                    window.open(waLink, '_blank', 'noopener,noreferrer');
                    whatsappOpened = true;
                } catch (err) {
                    if (!(err instanceof WhatsAppDisabledError)) {
                        console.warn('WhatsApp welcome failed:', err);
                    }
                }
            }

            setSignupData((prev) => ({ ...prev, password: '' }));
            setSignupSuccess({ magicLink, schoolName: signupData.schoolName, adminName: signupData.adminName });
            setSignupThrottleUntil(Date.now() + 10_000);

            void whatsappOpened;
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(`❌ Signup failed: ${err.message}`);
            } else {
                setError('❌ Signup failed: Unknown error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 overflow-hidden relative font-sans">
            {lockoutSeconds > 0 && <CountdownHUD seconds={lockoutSeconds} />}

            {showForgot && (
                <ForgotPasswordModal
                    activeTab={activeTab}
                    onClose={() => setShowForgot(false)}
                    onResetSent={(msg) => setError(msg)}
                    onError={(msg) => setError(msg)}
                />
            )}

            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse"></div>

            <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden relative z-10">
                <div className="hidden lg:flex flex-col justify-between p-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-16">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20 p-2 shadow-lg shadow-indigo-500/20">
                                <img src="/logo.png" alt="SmartSchool OS Logo" className="w-full h-full object-contain filter drop-shadow-md" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">SmartSchool</h1>
                                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-300 mt-1">Institutional OS</p>
                            </div>
                        </div>

                        <h2 className="text-7xl font-black leading-[1] tracking-tighter mb-8">
                            Powering <br />
                            <span className="text-indigo-300">Modern <br /> Education.</span>
                        </h2>
                    </div>

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {['Aarav Patel', 'Ananya Sharma', 'Rohan Gupta'].map((name, i) => (
                                <Avatar
                                    key={i}
                                    name={name}
                                    role="STUDENT"
                                    size="md"
                                    className="w-12 h-12 rounded-full border-4 border-indigo-700 shadow-md"
                                />
                            ))}
                        </div>
                        <p className="text-xs font-black text-indigo-200 uppercase tracking-widest">Trusted by 500+ Schools</p>
                    </div>
                </div>

                <div className="p-6 md:p-10 lg:p-20 bg-white dark:bg-slate-950">
                    {signupSuccess ? (
                        <SignupSuccessCard
                            schoolName={signupSuccess.schoolName}
                            adminName={signupSuccess.adminName}
                            magicLink={signupSuccess.magicLink}
                            whatsappEnabled={isWhatsAppEnabled()}
                            onContinue={() => {
                                // The magic link is the source of truth — click it to
                                // consume the token and reach ForcePasswordChange.
                                window.location.href = signupSuccess.magicLink;
                            }}
                        />
                    ) : (
                        <>
                    <div className="mb-10">
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                            {view === 'LOGIN' ? 'Access Portal' : 'Register Institution'}
                        </h3>
                        <p className="text-slate-500 font-bold text-sm">
                            {view === 'LOGIN' ? 'Secure institutional gateway v2.5' : 'Complete school & admin registration'}
                        </p>
                    </div>

                    {view === 'LOGIN' && (
                        <div className="mb-8 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            data-testid={`login-tab-${tab.id.toLowerCase()}`}
                                            type="button"
                                            onClick={() => switchTab(tab.id)}
                                            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <Icon size={14} className={isActive ? 'text-white' : 'text-indigo-500'} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}



                    <form
                        ref={formRef}
                        onSubmit={view === 'LOGIN' ? handleSmartLogin : handleSignup}
                        className="space-y-8"
                    >
                        {view === 'SIGNUP' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">School Information</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">School Name *</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Delhi Public School"
                                                    value={signupData.schoolName}
                                                    onChange={(e) => setSignupData({ ...signupData, schoolName: e.target.value })}
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">City *</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="New Delhi"
                                                    value={signupData.schoolCity}
                                                    onChange={(e) => setSignupData({ ...signupData, schoolCity: e.target.value })}
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">School Phone *</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={signupData.schoolPhone}
                                                    onChange={(e) => setSignupData({ ...signupData, schoolPhone: e.target.value })}
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Sector 45, Gurgaon"
                                                    value={signupData.schoolAddress}
                                                    onChange={(e) => setSignupData({ ...signupData, schoolAddress: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Admin Information</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Admin Name *</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Vikram Malhotra"
                                                    value={signupData.adminName}
                                                    onChange={(e) => setSignupData({ ...signupData, adminName: e.target.value })}
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Admin Phone *</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-4 text-slate-400" size={16} />
                                                <input
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={signupData.adminPhone}
                                                    onChange={(e) => setSignupData({ ...signupData, adminPhone: e.target.value })}
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Admin Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 text-slate-400" size={16} />
                                            <input
                                                type="email"
                                                placeholder="admin@school.com"
                                                value={signupData.adminEmail}
                                                onChange={(e) => setSignupData({ ...signupData, adminEmail: e.target.value })}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'LOGIN' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    {currentTab.identifierLabel}
                                </label>
                                <div className="relative group">
                                    {activeTab === 'ADMIN' ? (
                                        <Mail className="absolute left-6 top-5 text-slate-400" size={20} />
                                    ) : (
                                        <UserIcon className="absolute left-6 top-5 text-slate-400" size={20} />
                                    )}
                                    <input
                                        type={currentTab.identifierType}
                                        data-testid={`login-identifier-${activeTab.toLowerCase()}`}
                                        placeholder={currentTab.identifierPlaceholder}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={lockoutSeconds > 0}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-16 pr-6 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}

                        {view === 'LOGIN' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-2 mr-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {currentTab.credentialLabel}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleForgot}
                                        className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                {currentTab.credentialType === 'pin' ? (
                                    <PinInput
                                        value={credential}
                                        onChange={setCredential}
                                        onComplete={() => formRef.current?.requestSubmit()}
                                        disabled={isLoading || lockoutSeconds > 0}
                                        shakeKey={shakeKey}
                                    />
                                ) : (
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-5 text-slate-400" size={20} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            data-testid={`login-credential-${activeTab.toLowerCase()}`}
                                            placeholder={currentTab.credentialPlaceholder}
                                            value={credential}
                                            onChange={(e) => setCredential(e.target.value)}
                                            disabled={lockoutSeconds > 0}
                                            className={`w-full bg-slate-50 dark:bg-slate-900 border-2 rounded-2xl py-5 pl-16 pr-16 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all disabled:opacity-50 ${shakeKey ? 'animate-shake border-rose-400' : 'border-slate-100 dark:border-slate-800'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-5 text-slate-400"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'SIGNUP' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password *</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-5 text-slate-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 8 characters"
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        required
                                        minLength={8}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-16 pr-16 outline-none dark:text-white font-black text-sm focus:border-indigo-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-5 text-slate-400"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            data-testid="login-submit"
                            disabled={isLoading || lockoutSeconds > 0}
                            className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    Authorize & Enter <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {(view === 'SIGNUP' || activeTab === 'ADMIN') && (
                        <div className="mt-12 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                                    setError('');
                                    setAttemptCount(0);
                                    setLockoutSeconds(0);
                                }}
                                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                                {view === 'LOGIN' ? 'Create Institution Account' : 'Return to Portal'}
                            </button>
                        </div>
                    )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignupSuccessCard: React.FC<{
    schoolName: string;
    adminName: string;
    magicLink: string;
    whatsappEnabled: boolean;
    onContinue: () => void;
}> = ({ schoolName, adminName, magicLink, whatsappEnabled, onContinue }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(magicLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select the text
            const range = document.createRange();
            range.selectNode(document.getElementById('magic-link-text')!);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
        }
    };

    return (
        <div className="animate-scale-in" data-testid="signup-success">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 text-center">
                Welcome aboard, {adminName}!
            </h3>
            <p className="text-slate-500 font-bold text-sm text-center mb-8">
                <strong>{schoolName}</strong> has been registered successfully.
            </p>

            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl mb-6">
                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} /> Your Secure Sign-In Link
                </p>
                <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50 mb-3">
                    <code
                        id="magic-link-text"
                        className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all select-all"
                    >
                        {magicLink}
                    </code>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    {copied ? (
                        <><CheckCircle size={14} /> Copied to Clipboard</>
                    ) : (
                        <><Copy size={14} /> Copy Sign-In Link</>
                    )}
                </button>
            </div>

            {whatsappEnabled ? (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl mb-6">
                    <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <MessageCircle size={14} /> Also Sent via WhatsApp
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">
                        We opened WhatsApp on your phone with the same link. If the popup was blocked, use the link above.
                    </p>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl mb-6">
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Mail size={14} /> Save This Link
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                        WhatsApp delivery is currently disabled. Please copy the link above — it expires in 24 hours and is the only way to set your password and access the dashboard.
                    </p>
                </div>
            )}

            <button
                type="button"
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <Sparkles size={16} /> Open Dashboard
            </button>
        </div>
    );
};

export default Login;
