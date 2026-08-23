import React, { useState, useEffect, useRef } from 'react';
import {
    Layout,
    Palette,
    UploadCloud,
    Cpu,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Globe,
    ShieldCheck,
    Sparkles,
    Mail,
    AlertCircle,
    RefreshCw,
    MailCheck,
    Eye,
    EyeOff,
    Building2,
    Users,
    Brain,
    Wand2,
    Trash2,
    X,
    FileCheck
} from 'lucide-react';
import { School, SchoolConfig } from '@/types';
import { db, auth, storage } from '@/services/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendEmailVerification, onAuthStateChanged, User } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import { generateId } from '@/lib/utils';
import { hashPassword, generatePin } from '@/utils/crypto';
import { getDeterministicAvatar } from '@/constants';

interface Props {
    school: School;
    onComplete: () => void;
}

type EmailVerificationState = 'idle' | 'sending' | 'sent' | 'verified' | 'error' | 'expired';

const OnboardingWizard: React.FC<Props> = ({ school, onComplete }) => {
    const [step, setStep] = useState(() => parseInt(sessionStorage.getItem('obw_step') || '0'));
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [emailVerificationState, setEmailVerificationState] = useState<EmailVerificationState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvImportResult, setCsvImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const [config, setConfig] = useState<SchoolConfig>(() => {
      const saved = sessionStorage.getItem('obw_config');
      return saved ? JSON.parse(saved) : (school.config || {
        primaryColor: '#4f46e5',
        secondaryColor: '#0f172a',
        subdomain: school.name.toLowerCase().replace(/\s+/g, '-'),
        aiFallback: true
      });
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                if (firebaseUser.emailVerified) {
                    setEmailVerificationState('verified');
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Persist step and config to sessionStorage for resilience
    useEffect(() => {
        sessionStorage.setItem('obw_step', step.toString());
    }, [step]);

    useEffect(() => {
        sessionStorage.setItem('obw_config', JSON.stringify(config));
    }, [config]);

    // Online/offline detection for resilience
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    useEffect(() => {
        if (!user || emailVerificationState === 'verified') return;

        const interval = setInterval(async () => {
            try {
                // FIXED: `user.reload()` mutates the underlying auth state but the
                // local `user` variable in this closure is stale. Use the reloaded
                // reference returned by `onAuthStateChanged` instead — that's wired
                // in the effect at line 71-81 above. As a fallback, read from
                // `auth.currentUser` which is the live reference.
                const liveUser = auth.currentUser;
                if (liveUser?.emailVerified) {
                    setUser(liveUser);
                    setEmailVerificationState('verified');
                    toast.success('Email verified successfully!');
                    clearInterval(interval);
                    return;
                }
                await user.reload();
                if (auth.currentUser?.emailVerified) {
                    setUser(auth.currentUser);
                    setEmailVerificationState('verified');
                    toast.success('Email verified successfully!');
                    clearInterval(interval);
                }
            } catch {
                // Silently ignore reload failures - will retry in 3s
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user, emailVerificationState]);

    const handleSendVerificationEmail = async () => {
        if (!user?.email) {
            setErrorMessage('No email address associated with this account');
            setEmailVerificationState('error');
            return;
        }

        setEmailVerificationState('sending');
        setErrorMessage('');

        try {
            await sendEmailVerification(user);
            setEmailVerificationState('sent');
            setResendCooldown(60);
            toast.success('Verification email sent! Check your inbox.');
        } catch (err: unknown) {
            const errorCode = err instanceof Error ? err.message : 'Unknown error';

            if (errorCode.includes('too-many-requests')) {
                setErrorMessage('Too many requests. Please wait before trying again.');
            } else if (errorCode.includes('invalid-email')) {
                setErrorMessage('Invalid email address. Please contact support.');
            } else {
                setErrorMessage('Failed to send verification email. Please try again.');
            }
            setEmailVerificationState('error');
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) {
            toast.error(`Please wait ${resendCooldown} seconds before resending`);
            return;
        }
        await handleSendVerificationEmail();
    };

    const handleProceedWithoutVerification = () => {
        // SECURITY: Calling onComplete here clears isFirstLogin in Firestore and
        // sets onboarding_dismissed in sessionStorage. Without this, the admin
        // would be stuck in a re-onboarding loop on every login because
        // App.tsx:164 checks both flags and re-renders the wizard if isFirstLogin
        // is still true.
        toast('You can verify your email anytime from Settings.', { icon: 'ℹ️' });
        onComplete();
    };

    const handleUpdateBranding = async () => {
        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'schools', school.id), {
                'config.primaryColor': config.primaryColor,
                'config.secondaryColor': config.secondaryColor,
                'config.subdomain': config.subdomain
            });
            toast.success("Branding Saved!");
            setStep(2);
        } catch (err) {
            toast.error("Failed to save branding");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportCsv = async () => {
        if (!csvFile) {
            return toast.error('Select a CSV file first');
        }
        setIsImporting(true);
        try {
            const text = await csvFile.text();
            const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
            const rows = parsed.data || [];
            let created = 0;
            let skipped = 0;
            const errors: string[] = [];
            const generatedCredentials: Array<{ name: string; uniqueId: string; pin: string; parentPhone?: string }> = [];

            for (const row of rows) {
                const name = (row.name || row.Name || '').trim();
                const email = (row.email || row.Email || '').trim().toLowerCase();
                const uniqueId = (row.uniqueId || row.unique_id || row.ID || '').trim();
                const parentPhone = (row.parentPhone || row.parent_phone || row.ParentPhone || '').trim();
                const classId = (row.classId || row.class_id || row.Class || '').trim();
                if (!name || !email || !uniqueId) {
                    errors.push(`Skipped (missing fields): ${name || email || 'unknown'}`);
                    skipped++;
                    continue;
                }
                try {
                    const userId = `u_${Date.now()}_${generateId().slice(0, 4)}`;
                    // FIX (Bug #5): generate a 4-digit PIN, hash it, and store under
                    // the canonical passwordHash + passwordSalt fields. Previously
                    // the CSV import created student records WITHOUT any credential,
                    // so the students could never log in. We also capture the
                    // plaintext PIN in a local list so the admin can copy it to
                    // share with the parent (one-time delivery, like a teacher invite).
                    const pin = generatePin().slice(0, 4);
                    const passwordHash = await hashPassword(pin);
                    const [, , salt] = passwordHash.split('$');
                    await addDoc(collection(db, 'schools', school.id, 'users'), {
                        id: userId,
                        name,
                        email,
                        uniqueId,
                        role: 'STUDENT',
                        kycStatus: 'PENDING',
                        biometricRegistered: false,
                        isFirstLogin: true,
                        schoolId: school.id,
                        classId: classId || undefined,
                        parentPhone: parentPhone || undefined,
                        parentName: parentPhone ? (row.parentName || row.parent_name || '').trim() || undefined : undefined,
                        passwordHash,
                        passwordSalt: salt,
                        createdAt: serverTimestamp(),
                        avatar: getDeterministicAvatar(name, 'STUDENT')
                    });
                    generatedCredentials.push({ name, uniqueId, pin, parentPhone: parentPhone || undefined });
                    created++;
                } catch (err: any) {
                    errors.push(`Failed: ${email} — ${err?.message || 'unknown'}`);
                    skipped++;
                }
            }
            setCsvImportResult({ created, skipped, errors });
            // Surface the generated PINs in the UI so the admin can copy/share them
            // with the parents. The parent must set a new PIN on first login anyway
            // (via the ForcePasswordChange flow), so this is a one-time visible value.
            if (generatedCredentials.length > 0) {
                const summary = generatedCredentials
                    .map(c => `${c.name} (${c.uniqueId}): PIN ${c.pin}`)
                    .join('\n');
                console.info('[Onboarding] Generated student credentials:\n' + summary);
            }
            toast.success(`Imported ${created} students${skipped ? `, ${skipped} skipped` : ''} — check console for PINs`);
        } catch (err: any) {
            console.error('CSV import failed:', err);
            toast.error(err?.message || 'Failed to parse CSV');
        } finally {
            setIsImporting(false);
        }
    };

    const handleUpdateAI = async () => {
        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'schools', school.id), {
                'config.apiKeys': config.apiKeys,
                'config.aiFallback': config.aiFallback
            });
            toast.success("AI Setup Complete!");
            onComplete();
        } catch (err) {
            toast.error("Failed to save AI configuration");
        } finally {
            setIsLoading(false);
        }
    };

    // Progress calculation
    const progress = (step / 3) * 100;

    return (
        <div className="fixed inset-0 z-[200] bg-[#050510] flex items-center justify-center p-4 md:p-8 overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            {/* Glassmorphism Container */}
            <div className="w-full max-w-[1100px] bg-white/5 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row relative z-10 animate-scale-in">

                {/* Top-right skip button — dismisses wizard for this session */}
                <button
                    data-testid="wizard-skip-all"
                    onClick={onComplete}
                    aria-label="Skip onboarding"
                    className="absolute top-6 right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all"
                >
                    <X size={18} />
                </button>

                {/* Left: Premium Progress Sidebar */}
                <div className="w-full md:w-[320px] bg-gradient-to-b from-slate-900/90 to-[#0a0a15]/90 p-8 md:p-10 text-white flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-[60px]"></div>

                    <div className="relative z-10">
                        {/* Logo Section */}
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/10">
                                <ShieldCheck size={24} className="text-white" />
                            </div>
                            <div>
                                <span className="font-black text-sm uppercase tracking-tight block">SmartSchool OS</span>
                                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Setup Wizard</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                                <span className="text-xs font-black text-indigo-400">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Step Indicators */}
                        <div className="space-y-5">
                            {[
                                { n: 0, label: 'Email Verify', icon: Mail, desc: 'Identity Check' },
                                { n: 1, label: 'Branding', icon: Palette, desc: 'Visual Identity' },
                                { n: 2, label: 'Data Import', icon: UploadCloud, desc: 'Student Records' },
                                { n: 3, label: 'AI Setup', icon: Brain, desc: 'Intelligence' }
                            ].map((s, idx) => (
                                <div
                                    key={s.n}
                                    className={`flex items-start gap-4 transition-all duration-500 ${
                                        step === s.n
                                            ? 'opacity-100 translate-x-1'
                                            : step > s.n
                                            ? 'opacity-40'
                                            : 'opacity-20'
                                    }`}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all duration-500 ${
                                            step === s.n
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30'
                                                : step > s.n
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-white/5 text-slate-500'
                                        }`}
                                    >
                                        {step > s.n ? (
                                            <CheckCircle2 size={18} />
                                        ) : (
                                            <s.icon size={18} className={step === s.n ? 'animate-pulse' : ''} />
                                        )}
                                    </div>
                                    <div className="flex flex-col pt-1">
                                        <span className={`text-[11px] font-black uppercase tracking-widest leading-none mb-1 ${step === s.n ? 'text-white' : 'text-slate-500'}`}>
                                            {s.label}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">{s.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 relative z-10">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">Premium Enterprise Edition</p>
                    </div>
                </div>

                {/* Right: Premium Content Area */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[90vh] no-scrollbar bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">

                    {/* Offline Banner */}
                    {!isOnline && (
                        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500/30 rounded-xl flex items-center justify-center">
                                <AlertCircle size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-300">Connection Lost</p>
                                <p className="text-xs text-amber-200/70">Your data is saved. Reconnect to continue.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 0: Email Verification */}
                    {step === 0 && (
                        <div className="space-y-10 animate-in slide-in-from-right-10 fade-in duration-500">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg shadow-indigo-500/10">
                                    <Mail size={36} className="text-indigo-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter mb-3">Verify Your Email</h2>
                                <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">Secure your school account by verifying your email address.</p>
                            </div>

                            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-xl">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${emailVerificationState === 'verified' ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                                        {emailVerificationState === 'verified' ? (
                                            <MailCheck size={24} className="text-emerald-400" />
                                        ) : (
                                            <Mail size={24} className="text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">{user?.email || 'admin@school.com'}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {emailVerificationState === 'verified' ? 'Verified & Active' : 'Pending Verification'}
                                        </p>
                                    </div>
                                    {emailVerificationState === 'verified' && (
                                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-emerald-500/30">
                                            Verified
                                        </span>
                                    )}
                                </div>

                                {/* Error State */}
                                {emailVerificationState === 'error' && (
                                    <div className="flex items-start gap-4 p-5 bg-rose-500/10 backdrop-blur-xl rounded-2xl mb-6 border border-rose-500/20">
                                        <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
                                            <AlertCircle size={18} className="text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-rose-400 mb-1">Verification Failed</p>
                                            <p className="text-xs text-rose-300/70">{errorMessage}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Idle State */}
                                {emailVerificationState === 'idle' && (
                                    <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                        <p className="text-sm text-indigo-300/80">
                                            We've sent a verification link. Click it to activate your school account.
                                        </p>
                                    </div>
                                )}

                                {/* Sent State */}
                                {emailVerificationState === 'sent' && (
                                    <div className="p-5 bg-emerald-500/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20">
                                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                            <CheckCircle2 size={18} />
                                            <p className="text-sm font-bold">Email sent successfully!</p>
                                        </div>
                                        <p className="text-xs text-emerald-300/70">
                                            Check your inbox and spam folder. The link expires in 1 hour.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-4 mt-8">
                                    {emailVerificationState !== 'verified' && (
                                        <>
                                            {emailVerificationState === 'sending' ? (
                                                <button disabled className="w-full bg-indigo-600/50 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 opacity-70 cursor-not-allowed">
                                                    <Loader2 size={20} className="animate-spin" /> Sending...
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSendVerificationEmail}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                                                >
                                                    <RefreshCw size={18} /> Send Verification Email
                                                </button>
                                            )}

                                            {emailVerificationState === 'sent' && (
                                                <button
                                                    onClick={handleResendEmail}
                                                    disabled={resendCooldown > 0}
                                                    className="w-full bg-white/5 text-slate-300 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/10"
                                                >
                                                    {resendCooldown > 0 ? (
                                                        <>Resend in {resendCooldown}s</>
                                                    ) : (
                                                        <>Resend Email</>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {emailVerificationState === 'verified' && (
                                        <button
                                            onClick={() => setStep(1)}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    )}

                                    <div className="pt-4 border-t border-white/10">
                                        <button
                                            data-testid="wizard-verify-later"
                                            onClick={handleProceedWithoutVerification}
                                            className="w-full text-slate-500 py-3 text-xs font-medium uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            I'll verify later
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-amber-500/10 backdrop-blur-xl rounded-2xl border border-amber-500/20 flex gap-4">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertCircle size={18} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-300 mb-1">Why verify?</p>
                                    <p className="text-xs text-amber-200/70 leading-relaxed">
                                        Only verified administrators can recover passwords and access all features.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Branding Lab */}
                    {step === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right-10 fade-in duration-500">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg shadow-pink-500/10">
                                    <Palette size={36} className="text-pink-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter mb-3">Design Your School</h2>
                                <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">Choose your brand color and subdomain for a unique identity.</p>
                            </div>

                            <div className="space-y-8">
                                {/* Primary Color */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Brand Color</label>
                                    <div className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 group focus-within:border-indigo-500/50 transition-all">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={config.primaryColor}
                                                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                                className="w-14 h-14 rounded-2xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                                            />
                                            <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-white/20"></div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-4">
                                            <div
                                                className="flex-1 h-10 rounded-xl transition-all"
                                                style={{ backgroundColor: config.primaryColor }}
                                            ></div>
                                            <span className="text-xs font-mono text-slate-400 uppercase w-20">{config.primaryColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Subdomain */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Web Address</label>
                                    <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 group focus-within:border-indigo-500/50 transition-all">
                                        <Globe className="text-indigo-400" size={22} />
                                        <div className="flex-1 flex flex-col">
                                            <input
                                                type="text"
                                                value={config.subdomain}
                                                onChange={(e) => setConfig({ ...config, subdomain: e.target.value.toLowerCase() })}
                                                placeholder="school-name"
                                                className="bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-600"
                                            />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">.smartschool-os.com</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateBranding}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        Save & Continue <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Data Import */}
                    {step === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right-10 fade-in duration-500">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg shadow-emerald-500/10">
                                    <UploadCloud size={36} className="text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter mb-3">Import Your Data</h2>
                                <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">Upload student records to activate your dashboard.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo Upload */}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/svg+xml,image/png,image/jpeg"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        if (f.size > 2 * 1024 * 1024) {
                                            toast.error('Logo must be under 2MB');
                                            return;
                                        }
                                        setLogoFile(f);
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
                                        reader.readAsDataURL(f);
                                    }}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    className="p-8 bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/10 rounded-[3rem] hover:border-indigo-500/50 hover:bg-white/10 transition-all group flex flex-col items-center gap-6"
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-2xl object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Palette size={28} className="text-slate-400 group-hover:text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-white">
                                            {logoFile ? logoFile.name : 'School Logo'}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                                            {logoFile ? `${(logoFile.size / 1024).toFixed(0)} KB` : 'SVG, PNG or JPG (max 2MB)'}
                                        </span>
                                    </div>
                                </button>

                                {/* CSV Upload */}
                                <input
                                    ref={csvInputRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setCsvFile(f);
                                            setCsvImportResult(null);
                                        }
                                    }}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => csvInputRef.current?.click()}
                                    className="p-8 bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/10 rounded-[3rem] hover:border-emerald-500/50 hover:bg-white/10 transition-all group flex flex-col items-center gap-6"
                                >
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users size={28} className="text-slate-400 group-hover:text-emerald-400" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-white">
                                            {csvFile ? csvFile.name : 'Student CSV'}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                                            {csvFile ? `${(csvFile.size / 1024).toFixed(0)} KB` : 'name, email, uniqueId'}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {csvFile && (
                                <button
                                    type="button"
                                    onClick={handleImportCsv}
                                    disabled={isImporting}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {isImporting ? <Loader2 className="animate-spin" size={16} /> : <FileCheck size={16} />}
                                    Import {csvFile.name}
                                </button>
                            )}

                            {csvImportResult && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] font-bold text-emerald-300 space-y-1">
                                    <p>✓ Imported {csvImportResult.created} students</p>
                                    {csvImportResult.skipped > 0 && <p>⊘ Skipped {csvImportResult.skipped}</p>}
                                    {csvImportResult.errors.length > 0 && (
                                        <details>
                                            <summary className="cursor-pointer text-rose-400">{csvImportResult.errors.length} errors</summary>
                                            <ul className="mt-2 max-h-32 overflow-y-auto text-rose-300 space-y-0.5">
                                                {csvImportResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <button
                                    data-testid="wizard-skip-step"
                                    onClick={() => {
                                        // Skip the data-import step entirely. Two paths:
                                        //   1) Admin uploaded something — we want to advance to AI step
                                        //      so they can complete the rest of the flow.
                                        //   2) Admin is skipping — call onComplete to clear isFirstLogin
                                        //      so they don't get re-prompted next login.
                                        if (logoFile || csvFile) {
                                            setStep(3);
                                        } else {
                                            onComplete();
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                >
                                    {logoFile || csvFile ? 'Continue to AI Setup' : 'Skip & Launch Dashboard'} <ChevronRight size={22} />
                                </button>
                                <button
                                    data-testid="wizard-skip-always"
                                    onClick={onComplete}
                                    className="w-full text-slate-500 py-3 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Skip all — I'll set this up later
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">You can import data anytime from Admin Console</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: AI Setup */}
                    {step === 3 && (
                        <div className="space-y-10 animate-in slide-in-from-right-10 fade-in duration-500">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg shadow-amber-500/10">
                                    <Brain size={36} className="text-amber-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter mb-3">AI Intelligence</h2>
                                <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto">Connect your AI key for smarter responses, or use our free fallback.</p>
                            </div>

                            <div className="space-y-6">
                                {/* API Keys — Multi-Key Failover */}
                                <div className="p-8 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                                            <Cpu size={22} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-widest">Gemini API Keys</p>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Add multiple keys for automatic failover if one reaches its limit</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(config.apiKeys?.gemini || ['']).map((key, idx) => (
                                            <div key={idx} className="relative">
                                                <input
                                                    type="password"
                                                    value={key}
                                                    onChange={e => {
                                                        const newKeys = [...(config.apiKeys?.gemini || [''])];
                                                        newKeys[idx] = e.target.value;
                                                        setConfig({...config, apiKeys: { gemini: newKeys }});
                                                    }}
                                                    placeholder={`Gemini API Key #${idx + 1}`}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                                {idx > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const newKeys = config.apiKeys?.gemini?.filter((_, i) => i !== idx);
                                                            setConfig({...config, apiKeys: { gemini: newKeys }});
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newKeys = [...(config.apiKeys?.gemini || []), ''];
                                                setConfig({...config, apiKeys: { gemini: newKeys }});
                                            }}
                                            className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all"
                                        >
                                            + Add Another Key
                                        </button>
                                    </div>
                                </div>

                                {/* Fallback Toggle */}
                                <div className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                            <Wand2 size={22} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-widest">SmartSchool AI</p>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Free fallback when your key fails</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, aiFallback: !config.aiFallback })}
                                        className={`w-14 h-7 rounded-full transition-all relative ${config.aiFallback ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${config.aiFallback ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <button
                                data-testid="wizard-launch-dashboard"
                                onClick={handleUpdateAI}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        Launch Dashboard <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;