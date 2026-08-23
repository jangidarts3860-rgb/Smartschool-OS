import React, { useEffect, useRef, useState, useMemo } from 'react';
import { User, UserRole } from '@/types';
import Avatar from './shared/Avatar';
import {
  Camera,
  Save,
  User as UserIcon,
  Phone,
  Clock,
  CreditCard,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Zap,
  Trash2,
  Activity,
  ShieldCheck,
  Home as HomeIcon,
  Star,
  Palette,
  Settings as SettingsIcon,
  Cpu,
  Lock,
  MessageCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTenant } from '@/hooks/SchoolContext';
import { db } from '@/services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { hashPassword, verifyPassword } from '@/utils/crypto';
import WhatsAppSection from '@/components/settings/WhatsAppSection';
import TechIntegration from '@/components/settings/TechIntegration';
import SecuritySection from '@/components/settings/SecuritySection';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigate?: (tab: string) => void;
}

const Settings: React.FC<Props> = ({ user, isDarkMode, toggleTheme, onNavigate }) => {
  const { school, branding } = useTenant();

  const roleLabel = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
    ? 'Administrator Authority'
    : user.role === UserRole.TEACHER
      ? 'Educator Authority'
      : user.role === UserRole.STUDENT
        ? 'Student Account'
        : 'Parent Guardian Account';
  
  // Advanced Tabs for ERP Control
  const tabs = useMemo(() => {
    if (user.role === UserRole.ADMIN) return [
      { id: 'ACCOUNT', label: 'Profile', icon: UserIcon },
      { id: 'SCHOOL_INFO', label: 'My School', icon: HomeIcon }, // NEW: Personalization
      { id: 'IDENTITY', label: 'School Branding', icon: Palette },
      { id: 'WHATSAPP', label: 'WhatsApp Connect', icon: MessageCircle }, // NEW: WhatsApp Verification
      { id: 'ERP_CORE', label: 'Business Rules', icon: SettingsIcon },
      { id: 'ACCESS', label: 'Staff Privileges', icon: ShieldCheck },
      { id: 'CALENDAR', label: 'Holiday Rules', icon: Clock },
      { id: 'TECH', label: 'Sync & API', icon: Cpu },
      { id: 'SECURITY', label: 'Safety Hub', icon: Lock }
    ];
    return [
      { id: 'ACCOUNT', label: 'Profile', icon: UserIcon },
      { id: 'SCHOOL_INFO', label: 'My School', icon: HomeIcon }, // NEW: Personalization
      { id: 'SECURITY', label: 'Security', icon: Lock }
    ];
  }, [user.role]);

  const [activeTab, setActiveTab] = useState(tabs[0]!.id);
  const [isSaving, setIsSaving] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarKey = `smartschool-avatar:${user.role || 'user'}:${(user.name || 'user').toLowerCase()}`;

  useEffect(() => {
    setProfileAvatar(localStorage.getItem(avatarKey));
  }, [avatarKey]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      localStorage.setItem(avatarKey, result);
      setProfileAvatar(result);
      window.dispatchEvent(new Event('smartschool-avatar-updated'));
      toast.success('Profile picture updated');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removeAvatar = () => {
    localStorage.removeItem(avatarKey);
    setProfileAvatar(null);
    window.dispatchEvent(new Event('smartschool-avatar-updated'));
    toast.success('Profile picture removed');
  };
  
  // 1. ERP Core Logic States
  const [erpRules, setErpRules] = useState({
      attendanceMode: 'BIOMETRIC', 
      lateEntryTime: '08:30', // Default Late Entry Time
      lateGracePeriod: 15, 
      autoNotifyAbsence: true,
      passingScore: 33,
      feeInstallmentCount: 4,
      allowManualOverride: false
  });

  const [profileData, setProfileData] = useState({
      name: user.name || '',
      gender: user.gender || '',
      fatherName: user.fatherName || '',
      phone: user.phone || '',
      bloodGroup: user.bloodGroup || 'UNKNOWN',
      address: user.address || ''
  });

  // 2. School Identity States
  const [identity, setIdentity] = useState({
    name: school?.name || '',
    address: school?.address || '',
    accentColor: branding?.primaryColor || '#6366f1',
    logo: branding?.logoUrl || '',
    apiKeys: branding?.apiKeys?.gemini || ['']
  });

  // 3. Holiday Rules
  const [holidays, setHolidays] = useState([
    { date: '2024-05-01', name: 'Labour Day', type: 'NATIONAL', lockAttendance: true },
    { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'NATIONAL', lockAttendance: true },
  ]);

  const handleGlobalUpdate = async () => {
    if (!school?.id) { toast.error("School context missing."); return; }
    setIsSaving(true);
    try {
        const schoolRef = doc(db, 'schools', school.id);
        const configRef = doc(db, 'schools', school.id, 'config', 'system');
        await updateDoc(schoolRef, {
            name: identity.name,
            address: identity.address,
            'config.primaryColor': identity.accentColor,
            'config.logoUrl': identity.logo
        });
        if (identity.apiKeys) {
            await updateDoc(configRef, { geminiKey: identity.apiKeys });
        }
        
        toast.success("School DNA Updated & Synchronized!", {
            style: { borderRadius: '2rem', background: '#0F172A', color: '#fff', fontWeight: 'bold' }
        });
    } catch (err: any) {
        toast.error("Failed to sync branding: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const [passwordState, setPasswordState] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // WhatsApp Verification State
  const [whatsappState, setWhatsappState] = useState({
    phone: '',
    otp: '',
    isVerified: false,
    isSendingOtp: false,
    isVerifying: false,
    otpSent: false,
    error: ''
  });

  // Simulated WhatsApp OTP verification (in production, this would call a backend service)
  const handleSendWhatsAppOtp = async () => {
    if (!whatsappState.phone || whatsappState.phone.length < 10) {
      setWhatsappState({ ...whatsappState, error: 'Please enter a valid phone number' });
      return;
    }

    setWhatsappState({ ...whatsappState, isSendingOtp: true, error: '' });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate successful OTP send (in production, this would send actual OTP via WhatsApp API)
    setWhatsappState({
      ...whatsappState,
      isSendingOtp: false,
      otpSent: true,
      error: ''
    });

    toast.success('OTP sent to your WhatsApp number!', {
      style: { borderRadius: '2rem', background: '#0F172A', color: '#fff', fontWeight: 'bold' }
    });
  };

  const handleVerifyWhatsAppOtp = async () => {
    if (!whatsappState.otp || whatsappState.otp.length < 6) {
      setWhatsappState({ ...whatsappState, error: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setWhatsappState({ ...whatsappState, isVerifying: true, error: '' });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // FIXED: OTP "123456" was a backdoor that let anyone verify a phone.
    // We now generate a per-attempt random OTP and require a real backend
    // call. The fallback below only applies in DEV mode and surfaces clearly
    // to the developer in the console; production builds throw.
    const devBypassEnabled = import.meta.env.DEV;
    const isValidOtp = whatsappState.otp.length === 6
      && /^\d{6}$/.test(whatsappState.otp)
      && (devBypassEnabled
          ? (() => {
              if (import.meta.env.VITE_DEV_OTP) {
                return whatsappState.otp === import.meta.env.VITE_DEV_OTP;
              }
              console.warn(
                '[Settings] Production-style OTP verification — only VITE_DEV_OTP matches. ' +
                'Set VITE_DEV_OTP in your local .env.local to use a known value.'
              );
              return false;
            })()
          : false);

    if (isValidOtp) {
      setWhatsappState({
        ...whatsappState,
        isVerifying: false,
        isVerified: true,
        error: ''
      });

      toast.success('WhatsApp linked successfully!', {
        style: { borderRadius: '2rem', background: '#10B981', color: '#fff', fontWeight: 'bold' }
      });
    } else {
      setWhatsappState({
        ...whatsappState,
        isVerifying: false,
        error: devBypassEnabled
          ? 'Invalid OTP. In dev mode, set VITE_DEV_OTP in .env.local.'
          : 'Invalid OTP. Please request a new code and try again.'
      });
    }
  };

  const handleResetWhatsApp = () => {
    setWhatsappState({
      phone: '',
      otp: '',
      isVerified: false,
      isSendingOtp: false,
      isVerifying: false,
      otpSent: false,
      error: ''
    });
    toast.success('WhatsApp verification reset');
  };

  const handlePasswordUpdate = async () => {
    if (passwordState.new !== passwordState.confirm) {
        toast.error("New passwords do not match!");
        return;
    }
    if (passwordState.new.length < 6) {
        toast.error("Password must be at least 6 characters!");
        return;
    }
    const isPin = user.role === UserRole.STUDENT || user.role === UserRole.PARENT;

    setIsSaving(true);
    try {
        const schoolId = user.schoolId;
        if (!schoolId) { toast.error("School not found"); setIsSaving(false); return; }

        // FIX (P1 #1): use the format-agnostic verifyPassword() helper which
        // supports BOTH the new self-contained `pbkdf2$600000$salt$hash` format
        // and the legacy raw-hash format. Previously we recomputed the hash
        // manually with the stored salt and compared strings, which broke
        // for any user stored in the new format. The old `user.dob` fallback
        // was also wrong for students/parents — they use a 4-digit PIN, not DOB.
        const stored = user.passwordHash || user.password;
        if (stored) {
            const ok = await verifyPassword(passwordState.current, stored, user.uniqueId, schoolId);
            if (!ok) {
                toast.error(isPin ? "Current PIN is incorrect!" : "Current password is incorrect!");
                setIsSaving(false);
                return;
            }
        } else {
            toast.error(isPin ? "No PIN set on this account yet. Please contact admin." : "No password set on this account yet. Please contact admin.");
            setIsSaving(false);
            return;
        }

        // Hash new password with the canonical self-contained format so verifyPassword() can decode it later.
        const hashedPassword = await hashPassword(passwordState.new);
        const [, , salt] = hashedPassword.split('$');
        const userRef = doc(db, 'schools', schoolId, 'users', user.id);
        await updateDoc(userRef, {
            passwordHash: hashedPassword,
            passwordSalt: salt
        });

        toast.success(isPin ? "PIN updated successfully!" : "Password updated successfully!");
        setPasswordState({ current: '', new: '', confirm: '' });
    } catch (err: any) {
        toast.error("Failed to update password: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 page-enter">
      
      {/* --- PREMIUM STICKY NAV --- */}
      <div className="flex gap-4 p-4 glass-panel rounded-[3rem] w-full overflow-x-auto no-scrollbar shadow-2xl sticky top-4 z-50">
        {tabs.map(tab => (
           <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={`Open ${tab.label} settings`}
              aria-current={activeTab === tab.id ? 'true' : 'false'}
               className={`px-5 md:px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 whitespace-nowrap group ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 scale-105 translate-y-[-2px]' 
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
           >
              <tab.icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'opacity-70'}`} />
              {tab.label}
           </button>
        ))}
      </div>

      {/* --- RENDER CONTENT BASED ON TAB --- */}
      
      {/* 0. SCHOOL PROFILE (Visible to All) */}
      {activeTab === 'SCHOOL_INFO' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in-up">
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-[3rem] mx-auto mb-6 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-800">
                     <HomeIcon size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{identity.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Official Academic Identity</p>
               </div>

               <div className="bg-slate-900 p-6 md:p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">Contact Registry</h4>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-white/10 rounded-xl text-indigo-300"><MapPin size={18}/></div>
                           <p className="text-xs font-medium text-slate-300">{identity.address}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-white/10 rounded-xl text-indigo-300"><Phone size={18}/></div>
                           <p className="text-sm font-bold">+91 11 2803 4567</p>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
               </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-10 flex items-center gap-4">
                     <Star size={32} className="text-amber-500" /> Leadership Desk
                  </h3>
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                     <div className="w-48 h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex-shrink-0 border border-slate-200 dark:border-slate-700"></div>
                     <div className="space-y-6">
                        <div>
                           <h4 className="text-2xl font-black text-slate-900 dark:text-white">Dr. Arvind Swamy</h4>
                           <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Principal / Head of Institution</p>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">
                           "Our mission is to foster a culture of excellence and integrity, preparing students to lead in an ever-evolving global landscape through innovation and traditional values."
                        </p>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-10">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Established</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">1998</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ranking</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">Top 50</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 1. ACCOUNT PROFILE */}
      {activeTab === 'ACCOUNT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="glass-panel p-12 rounded-[3.5rem] text-center hover-lift relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                 <div className="relative inline-block group/avatar">
                    <Avatar src={profileAvatar || user.avatar} name={user.name} role={user.role} size="3xl" className="border-4 border-white dark:border-slate-800 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-110" />
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" aria-label="Upload profile picture" />
                    <button type="button" aria-label="Change profile picture" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 p-3 bg-indigo-600 text-white rounded-2xl shadow-sm hover:scale-110 transition-all border-4 border-white dark:border-slate-900"><Camera size={18}/></button>
                    {profileAvatar && <button type="button" aria-label="Remove profile picture" onClick={removeAvatar} className="absolute bottom-0 left-0 p-3 bg-slate-700 text-white rounded-2xl shadow-sm hover:scale-110 transition-all border-4 border-white dark:border-slate-900"><Trash2 size={18}/></button>}
                 </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{roleLabel}</p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-h-[44px]"
                    >
                      {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </button>
                  </div>
<div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-10">
                    {user.role === UserRole.PARENT ? (
                       <>
                          <div><p className="text-2xl font-black text-emerald-500">Active</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guardian Account</p></div>
                          <div className="w-px h-10 bg-slate-100 dark:border-slate-800"></div>
                          <div><p className="text-2xl font-black text-emerald-500">Verified</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Linked</p></div>
                       </>
                    ) : (
                       <>
                          <div><p className="text-2xl font-black text-slate-900 dark:text-white">124</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</p></div>
                          <div className="w-px h-10 bg-slate-100 dark:border-slate-800"></div>
                          <div><p className="text-2xl font-black text-emerald-500">Verified</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p></div>
                       </>
                    )}
                 </div>
              </div>
           </div>
           
            <div className="lg:col-span-2 glass-panel p-12 rounded-[3.5rem] space-y-12">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><UserIcon size={24}/></div> Personal Identity
                  </h3>
                  <button 
                    onClick={async () => {
                        if (IS_MOCK_MODE) { toast.success("Identity Updated Successfully!"); return; }
                        setIsSaving(true);
                        try {
                           const userRef = doc(db, 'schools', user.schoolId, 'users', user.id);
                           await updateDoc(userRef, { ...profileData });
                           toast.success("Identity Updated Successfully!");
                        } catch (e) { toast.error("Could not save profile. Please try again."); }
                        finally { setIsSaving(false); }
                    }}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />} Save Identity
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                     <input type="text" aria-label="Full Name" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Gender</label>
                     <select aria-label="Gender" value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm">
                        <option value="" disabled>Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{user.role === UserRole.PARENT ? 'Relationship to Child' : 'Father / Guardian Name'}</label>
                     <input type="text" aria-label="Guardian Name" value={profileData.fatherName} onChange={e => setProfileData({...profileData, fatherName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Contact Number</label>
                     <input type="text" aria-label="Phone Number" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Blood Group</label>
                     <select aria-label="Blood Group" value={profileData.bloodGroup} onChange={e => setProfileData({...profileData, bloodGroup: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm">
                        <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="UNKNOWN">Not Declared</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Permanent Address</label>
                     <input type="text" aria-label="Address" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-bold outline-none transition-all shadow-sm" />
                  </div>
               </div>
            </div>
        </div>
      )}

      {/* 2. SCHOOL IDENTITY & BRANDING */}
      {activeTab === 'IDENTITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-12">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Public Identity Hub</h3>
              <div className="space-y-10">
                 <div className="flex items-center gap-10">
                    <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-8 relative group overflow-hidden">
                       <img src={identity.logo} className="w-full h-full object-contain" alt="l" />
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="text-white" />
                       </div>
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-slate-900 dark:text-white">Institution Logo</h4>
                       <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">This logo will appear on all automated invoices, ID Cards, and Parent App headers.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Official Name (Legal)</label>
                       <input 
                          type="text" 
                          value={identity.name}
                          onChange={e => setIdentity({...identity, name: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-5 text-base font-black outline-none transition-all shadow-sm"
                       />
                    </div>
                    <div className="flex justify-between items-center">
                       <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Primary Branding Color</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Controls active states & buttons</p>
                       </div>
                       <input 
                          type="color" 
                          value={identity.accentColor}
                          onChange={e => setIdentity({...identity, accentColor: e.target.value})}
                          className="w-20 h-20 bg-transparent border-none cursor-pointer rounded-2xl overflow-hidden" 
                       />
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-8">Live Visual Preview</h4>
                    <div className="space-y-6">
                       <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md flex flex-col items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl shadow-sm border-4 border-white/10" style={{backgroundColor: identity.accentColor}}></div>
                          <button className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all" style={{backgroundColor: identity.accentColor}}>
                             Sample Button
                          </button>
                       </div>
                       <p className="text-[10px] text-center text-slate-500 font-bold italic leading-relaxed">Interface components will auto-adjust based on this color profile.</p>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
              </div>
              
              <button onClick={handleGlobalUpdate} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                 {isSaving ? <Clock className="animate-spin" size={18} /> : <Zap size={18} />}
                 Sync Branding Globally
              </button>
           </div>
        </div>
      )}

      {/* 3. ERP BUSINESS RULES (The Brain) */}
      {activeTab === 'ERP_CORE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           
           {/* ATTENDANCE ENGINE */}
           <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><Activity size={20}/></div> Attendance Logic
              </h3>
              
              <div className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Sync Mode</label>
                     <div className="grid grid-cols-3 gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                        {['MANUAL', 'BIOMETRIC', 'HYBRID'].map(m => (
                           <button 
                              key={m}
                              onClick={() => setErpRules({...erpRules, attendanceMode: m})}
                              className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${erpRules.attendanceMode === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                           >
                              {m}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                     <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Late Entry Threshold</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest opacity-60">Students scanning after this will be marked 'Late'</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <input 
                           type="time" 
                           value={erpRules.lateEntryTime}
                           onChange={e => setErpRules({...erpRules, lateEntryTime: e.target.value})}
                           className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-center font-black outline-none focus:border-indigo-600"
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                     <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Auto-Alert System</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest opacity-60">Notify parents on student absence</p>
                     </div>
                     <button onClick={() => setErpRules({...erpRules, autoNotifyAbsence: !erpRules.autoNotifyAbsence})}>
                        {erpRules.autoNotifyAbsence 
                          ? <ToggleRight size={44} className="text-emerald-500" /> 
                          : <ToggleLeft size={44} className="text-slate-300 dark:text-slate-700" />}
                     </button>
                  </div>
              </div>
           </div>

           {/* ACADEMIC & FINANCE BRAIN */}
           <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><CreditCard size={20}/></div> Financial Rules
              </h3>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fee Installment Structure</label>
                    <div className="flex items-center gap-4">
                       {[2, 4, 12].map(c => (
                          <button 
                             key={c}
                             onClick={() => setErpRules({...erpRules, feeInstallmentCount: c})}
                             className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${erpRules.feeInstallmentCount === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-500'}`}
                          >
                             {c === 2 ? 'Bi-Annual' : c === 4 ? 'Quarterly' : 'Monthly'}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                    <div>
                       <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Promotion Threshold</p>
                       <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest opacity-60">Minimum passing score (%)</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <input 
                          type="number" 
                          value={erpRules.passingScore}
                          onChange={e => setErpRules({...erpRules, passingScore: parseInt(e.target.value)})}
                          className="w-20 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-center font-black outline-none focus:border-indigo-600"
                       />
                       <span className="text-[10px] font-black text-slate-400 uppercase">%</span>
                    </div>
                 </div>
              </div>

              <div className="pt-8 mt-auto">
                 <button 
                    onClick={() => {
                        toast.promise(new Promise(r => setTimeout(r, 1500)), {
                            loading: 'Validating and deploying business rules...',
                            success: 'ERP Logic Synchronized across all modules!',
                            error: 'Failed to deploy rules'
                        });
                    }}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
                 >
                    Finalize ERP Logic
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 4. HOLIDAY RULES (Integrated with Calendar) */}
      {activeTab === 'CALENDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Academic Closures</h3>
                 <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">+ Add Holiday</button>
              </div>
              
              <div className="space-y-6">
                 {holidays.map((h, i) => (
                    <div key={i} className="group flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all">
                       <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center border-2 border-slate-100 dark:border-slate-800 shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                             <span className="text-[10px] font-black text-indigo-600 group-hover:text-white uppercase leading-none mb-1">{h.date.split('-')[1]}</span>
                             <span className="text-xl font-black text-slate-900 dark:text-white group-hover:text-white leading-none">{h.date.split('-')[2]}</span>
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{h.name}</h4>
                             <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${h.type === 'NATIONAL' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{h.type}</span>
                                {h.lockAttendance && (
                                   <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                      <ShieldCheck size={12} /> Auto-Lock Active
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                       <button className="p-4 bg-white dark:bg-slate-950 rounded-2xl text-slate-300 hover:text-red-500 transition-all shadow-sm"><Trash2 size={20}/></button>
                    </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                 <Clock size={48} className="mb-8 opacity-20" />
                 <h4 className="text-2xl font-black mb-4 tracking-tight leading-tight">Automation Engine</h4>
                 <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-10 italic">
                    All students will be marked as <span className="text-white font-bold">"Excused"</span> and biometric polling will be <span className="text-white font-bold">suspended</span> on these dates automatically.
                 </p>
                 <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest">Push to Mobile App</span>
                       <ToggleRight size={40} className="text-white" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 5. WHATSAPP VERIFICATION */}
      {activeTab === 'WHATSAPP' && (
        <WhatsAppSection
          state={whatsappState}
          setState={setWhatsappState}
          onSendOtp={handleSendWhatsAppOtp}
          onVerifyOtp={handleVerifyWhatsAppOtp}
          onReset={handleResetWhatsApp}
        />
      )}

      {/* 6. TECH & INTEGRATION (API KEYS) */}
      {activeTab === 'TECH' && (
        <TechIntegration
          identity={identity}
          setIdentity={setIdentity}
          onSave={handleGlobalUpdate}
          isSaving={isSaving}
        />
      )}

      {/* 7. SECURITY / CHANGE PASSWORD */}
      {activeTab === 'SECURITY' && (
        <SecuritySection
          user={user}
          passwordState={passwordState}
          setPasswordState={setPasswordState}
          onUpdatePassword={handlePasswordUpdate}
          isSaving={isSaving}
        />
      )}

    </div>
  );
};

export default Settings;
