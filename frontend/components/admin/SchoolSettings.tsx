import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2, MapPin, Phone, Mail, Upload, Plus, Trash2, Shield, Users, Key,
  Zap, Settings as SettingsIcon, CheckCircle2, AlertCircle, Calendar, ToggleLeft,
  ToggleRight, School, Lock, Loader2, Brain, DollarSign, Wrench,
  AlertTriangle, CalendarDays, CreditCard, Globe, WifiOff, Palette,
  Monitor, Smartphone, Fingerprint, Radio, MessageSquare, Bell, Clock,
  Database, Cloud, Download, ExternalLink, Server,
  Scan, QrCode, RadioTower,
  ChevronDown, ChevronUp,
  ShieldCheck, Timer, Send
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, storage } from '@/services/firebase';
import {
  collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query,
  where, serverTimestamp, deleteDoc, orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

interface Props {
  user: User;
}

interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  campusImageUrl?: string;
  principal: string;
  affiliation: string;
  academicYear: string;
  socialLinks: { facebook: string; twitter: string; instagram: string; youtube: string };
}

interface ErpRules {
  lateEntryTime: string;
  lateGracePeriod: number;
  attendanceThreshold: number;
  autoNotifyAbsence: boolean;
  passingScore: number;
  gradingScale: string;
  allowManualOverride: boolean;
  morningShiftStart: string;
  afternoonShiftStart: string;
  attendanceCutoffTime: string;
}

interface WhiteLabel {
  customDomain: string;
  appName: string;
  primaryColor: string;
  faviconUrl: string;
  loginBgUrl: string;
  dnsVerified: boolean;
  sslActive: boolean;
}

interface Finance {
  gstPercentage: number;
  enableGst: boolean;
  razorpayKeyId: string;
  // razorpayKeySecret REMOVED — managed at platform level (Cloud Function env)
  stripePublishableKey: string;
  // stripeSecretKey REMOVED — managed at platform level (Cloud Function env)
  paymentGateway: 'RAZORPAY' | 'STRIPE' | 'BOTH';
  currency: string;
}

interface Hardware {
  deviceType: 'ZKTeco' | 'Mantra' | 'Suprema' | 'Hikvision';
  deviceIp: string;
  devicePort: number;
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';
  lastPing: number;
  nfcEnabled: boolean;
}

interface Comms {
  inviteEnabled: boolean;
  autoSendOnCreate: boolean;
  activeTemplate: string;
  totalInvitesSent: number;
  lastInviteSentAt?: string;
}

interface Holiday {
  id?: string;
  date: string;
  name: string;
  type: 'NATIONAL' | 'SCHOOL' | 'FESTIVAL';
  lockAttendance: boolean;
}

interface SystemSettings {
  apiKeys: string[];
  aiFallback: boolean;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  enabledAt?: string;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  autoLogout: boolean;
  backupEnabled: boolean;
  lastBackupAt?: string;
}

const TABS = [
  { id: 'INFO', label: 'School Profile', icon: School },
  { id: 'WHITE_LABEL', label: 'Domain & Brand', icon: Palette },
  { id: 'ERP', label: 'ERP Cutoffs', icon: Wrench },
  { id: 'FINANCE', label: 'Payment Gateways', icon: DollarSign },
  { id: 'HARDWARE', label: 'Biometrics & NFC', icon: Fingerprint },
  { id: 'COMMS', label: 'Communication', icon: Radio },
  { id: 'CALENDAR', label: 'Academic Holidays', icon: CalendarDays },
  { id: 'SYSTEM', label: 'AI Key Pools', icon: Brain },
  { id: 'MAINTENANCE', label: 'Security & Backups', icon: Shield },
];

const DEFAULT_PROFILE: SchoolProfile = {
  name: 'Delhi Public International School',
  address: 'Sector 14, Ring Road, New Delhi, 110001',
  phone: '+91 98765 43210',
  email: 'admin@dpis-delhi.edu.in',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=256&q=80',
  campusImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
  principal: 'Dr. Rajeshwar Sharma',
  affiliation: 'CBSE Affiliation No. 1030492',
  academicYear: '2025-26',
  socialLinks: {
    facebook: 'https://facebook.com/dpisschool',
    twitter: 'https://twitter.com/dpisschool',
    instagram: 'https://instagram.com/dpisschool',
    youtube: 'https://youtube.com/@dpisschool'
  }
};

const DEFAULT_ERP: ErpRules = {
  lateEntryTime: '08:30',
  lateGracePeriod: 15,
  attendanceThreshold: 75,
  autoNotifyAbsence: true,
  passingScore: 33,
  gradingScale: 'standard',
  allowManualOverride: false,
  morningShiftStart: '07:30',
  afternoonShiftStart: '12:30',
  attendanceCutoffTime: '09:00'
};

const DEFAULT_WHITE_LABEL: WhiteLabel = {
  customDomain: 'portal.dpis-delhi.edu.in',
  appName: 'SmartSchool OS - DPIS',
  primaryColor: '#4f46e5',
  faviconUrl: '/favicon.ico',
  loginBgUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
  dnsVerified: true,
  sslActive: true
};

const DEFAULT_FINANCE: Finance = {
  gstPercentage: 18,
  enableGst: true,
  razorpayKeyId: 'rzp_test_1DP5mmOlF5G5ag',
  stripePublishableKey: 'pk_test_51MzSAMPLEKEY123456789',
  paymentGateway: 'RAZORPAY',
  currency: 'INR'
};

const DEFAULT_HARDWARE: Hardware = {
  deviceType: 'ZKTeco',
  deviceIp: '192.168.1.100',
  devicePort: 4370,
  connectionStatus: 'connected',
  lastPing: Date.now(),
  nfcEnabled: true
};

const DEFAULT_COMMS: Comms = {
  inviteEnabled: true,
  autoSendOnCreate: true,
  activeTemplate: 'TEACHER_INVITE',
  totalInvitesSent: 28,
  lastInviteSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
};

const DEFAULT_SYSTEM: SystemSettings = {
  apiKeys: ['AIzaSy-SAMPLE-KEY-GEMINI-AI-2026'],
  aiFallback: true,
  modelName: 'gemini-2.0-flash',
  maxTokens: 8192,
  temperature: 0.7
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message: 'School portal closed for scheduled maintenance. Please check back at 06:00 AM.',
  twoFactorEnabled: true,
  sessionTimeoutMinutes: 30,
  autoLogout: true,
  backupEnabled: true,
  lastBackupAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
};

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'h1', date: '2026-08-15', name: 'Independence Day', type: 'NATIONAL', lockAttendance: true },
  { id: 'h2', date: '2026-10-02', name: 'Gandhi Jayanti', type: 'NATIONAL', lockAttendance: true },
  { id: 'h3', date: '2026-10-20', name: 'Dussehra Break', type: 'FESTIVAL', lockAttendance: true },
  { id: 'h4', date: '2026-11-10', name: 'Diwali Vacation', type: 'FESTIVAL', lockAttendance: true },
  { id: 'h5', date: '2026-12-25', name: 'Christmas Holiday', type: 'NATIONAL', lockAttendance: true },
  { id: 'h6', date: '2027-01-26', name: 'Republic Day', type: 'NATIONAL', lockAttendance: true }
];

const LS_KEY = 'smartschool_settings_cache';

const getLsCache = (): Record<string, any> => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};

const setLsCache = (tab: string, data: any) => {
  const cache = getLsCache();
  cache[tab] = data;
  localStorage.setItem(LS_KEY, JSON.stringify(cache));
};

const isMock = () => import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const SchoolSettings: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('INFO');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lsCache = useRef(getLsCache());

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_PROFILE);
  const [profileDirty, setProfileDirty] = useState(false);

  const [erpRules, setErpRules] = useState<ErpRules>(DEFAULT_ERP);
  const [erpDirty, setErpDirty] = useState(false);

  const [whiteLabel, setWhiteLabel] = useState<WhiteLabel>(DEFAULT_WHITE_LABEL);
  const [whiteLabelDirty, setWhiteLabelDirty] = useState(false);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [showDnsCard, setShowDnsCard] = useState(false);

  const [finance, setFinance] = useState<Finance>(DEFAULT_FINANCE);
  const [financeDirty, setFinanceDirty] = useState(false);

  const [hardware, setHardware] = useState<Hardware>(DEFAULT_HARDWARE);
  const [hardwareDirty, setHardwareDirty] = useState(false);
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcResult, setNfcResult] = useState<{ uid: string; owner: string } | null>(null);

  const [comms, setComms] = useState<Comms>(DEFAULT_COMMS);
  const [commsDirty, setCommsDirty] = useState(false);

  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS);
  const [holidayForm, setHolidayForm] = useState<Holiday>({ date: '', name: '', type: 'SCHOOL', lockAttendance: true });
  const [showHolidayForm, setShowHolidayForm] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [systemDirty, setSystemDirty] = useState(false);

  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE);
  const [maintenanceDirty, setMaintenanceDirty] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupRunning, setBackupRunning] = useState(false);

  const showSaved = useCallback(() => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const configDocRef = useCallback((tabId: string) => {
    if (!user.schoolId) return null;
    return doc(db, 'schools', user.schoolId, 'config', tabId);
  }, [user.schoolId]);

  const loadFromLs = useCallback(<T,>(tab: string, setter: React.Dispatch<React.SetStateAction<T>>, defaults: T) => {
    const cached = lsCache.current[tab];
    if (cached) setter(cached as T);
    else setter(defaults);
  }, []);

  useEffect(() => {
    const schoolId = user.schoolId;
    if (!schoolId) {
      setSchoolProfile(DEFAULT_PROFILE);
      setErpRules(DEFAULT_ERP);
      setWhiteLabel(DEFAULT_WHITE_LABEL);
      setFinance(DEFAULT_FINANCE);
      setHardware(DEFAULT_HARDWARE);
      setComms(DEFAULT_COMMS);
      setSystemSettings(DEFAULT_SYSTEM);
      setMaintenance(DEFAULT_MAINTENANCE);
      setHolidays(DEFAULT_HOLIDAYS);
      setLoading(false);
      return;
    }

    if (isMock()) {
      loadFromLs('profile', setSchoolProfile, DEFAULT_PROFILE);
      loadFromLs('erpRules', setErpRules, DEFAULT_ERP);
      loadFromLs('whiteLabel', setWhiteLabel, DEFAULT_WHITE_LABEL);
      loadFromLs('finance', setFinance, DEFAULT_FINANCE);
      loadFromLs('hardware', setHardware, DEFAULT_HARDWARE);
      loadFromLs('comms', setComms, DEFAULT_COMMS);
      loadFromLs('system', setSystemSettings, DEFAULT_SYSTEM);
      loadFromLs('maintenance', setMaintenance, DEFAULT_MAINTENANCE);
      const savedHolidays = getLsCache()['holidays'];
      if (savedHolidays) setHolidays(savedHolidays);
      else setHolidays(DEFAULT_HOLIDAYS);
      setLoading(false);
      return;
    }

    const listeners: (() => void)[] = [];

    const setupListener = <T,>(tabId: string, setter: React.Dispatch<React.SetStateAction<T>>, defaults: T) => {
      const ref = configDocRef(tabId);
      if (!ref) return;
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) setter(snap.data() as T);
        else setter(defaults);
      }, () => {
        setter(defaults);
      });
      listeners.push(unsub);
    };

    setupListener('profile', setSchoolProfile, DEFAULT_PROFILE);
    setupListener('erpRules', setErpRules, DEFAULT_ERP);
    setupListener('whiteLabel', setWhiteLabel, DEFAULT_WHITE_LABEL);
    setupListener('finance', setFinance, DEFAULT_FINANCE);
    setupListener('hardware', setHardware, DEFAULT_HARDWARE);
    setupListener('comms', setComms, DEFAULT_COMMS);
    setupListener('system', setSystemSettings, DEFAULT_SYSTEM);
    setupListener('maintenance', setMaintenance, DEFAULT_MAINTENANCE);

    const unsubHolidays = onSnapshot(
      query(collection(db, 'schools', schoolId, 'holidays'), orderBy('date', 'asc')),
      (snap) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Holiday));
        setHolidays(list.length > 0 ? list : DEFAULT_HOLIDAYS);
      },
      () => {
        setHolidays(DEFAULT_HOLIDAYS);
      }
    );
    listeners.push(unsubHolidays);

    setLoading(false);
    return () => listeners.forEach(u => u());
  }, [user.schoolId, configDocRef, loadFromLs]);

  const saveToFirestore = async (tabId: string, data: any) => {
    if (!user.schoolId) return;
    setSaveStatus('saving');
    try {
      if (isMock()) {
        setLsCache(tabId, data);
        await new Promise(r => setTimeout(r, 300));
        showSaved();
        toast.success(`${tabId} saved (mock)!`);
        return;
      }
      const ref = configDocRef(tabId);
      if (!ref) throw new Error('No schoolId');
      await setDoc(ref, data, { merge: true });
      showSaved();
      toast.success(`${tabId} saved successfully!`);
    } catch (err) {
      toast.error(`Failed to save ${tabId}`);
      setSaveStatus('idle');
    }
  };

  const handleSaveProfile = () => saveToFirestore('profile', schoolProfile).then(() => setProfileDirty(false));
  const handleSaveErp = () => saveToFirestore('erpRules', erpRules).then(() => setErpDirty(false));
  const handleSaveWhiteLabel = () => saveToFirestore('whiteLabel', whiteLabel).then(() => setWhiteLabelDirty(false));
  const handleSaveFinance = () => saveToFirestore('finance', finance).then(() => setFinanceDirty(false));
  const handleSaveHardware = () => saveToFirestore('hardware', hardware).then(() => setHardwareDirty(false));
  const handleSaveComms = () => saveToFirestore('comms', comms).then(() => setCommsDirty(false));
  const handleSaveSystem = () => saveToFirestore('system', systemSettings).then(() => setSystemDirty(false));
  const handleSaveMaintenance = () =>
    saveToFirestore('maintenance', {
      ...maintenance,
      enabledAt: maintenance.enabled ? new Date().toISOString() : undefined
    }).then(() => setMaintenanceDirty(false));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl' | 'loginBgUrl') => {
    const file = e.target.files?.[0];
    if (!file || !user.schoolId) return;
    setSaveStatus('saving');
    try {
      const storageRef = ref(storage, `schools/${user.schoolId}/${field}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (field === 'logoUrl') {
        setSchoolProfile(p => ({ ...p, logoUrl: url }));
        setProfileDirty(true);
      } else if (field === 'faviconUrl') {
        setWhiteLabel(w => ({ ...w, faviconUrl: url }));
        setWhiteLabelDirty(true);
      } else {
        setWhiteLabel(w => ({ ...w, loginBgUrl: url }));
        setWhiteLabelDirty(true);
      }
      showSaved();
      toast.success(`${field} updated!`);
    } catch { toast.error('Upload failed'); setSaveStatus('idle'); }
  };

  // P1 fix: hardware/network actions no longer fake success via setTimeout.
  // They now invoke the corresponding Cloud Function stub which returns
  // { ok: true, pending: true } and surface a "Contact support to enable"
  // inline notice in production. Mock mode (VITE_USE_MOCK=true) keeps a
  // simulated preview behavior behind the same code path.
  const callHardwareCloud = async (
    fnName: 'provisionDNS' | 'provisionBiometric' | 'provisionNFC',
    payload: Record<string, unknown>
  ): Promise<{ ok: boolean; pending: boolean; mock?: boolean }> => {
    if (isMock()) {
      return { ok: true, pending: true, mock: true };
    }
    try {
      const functions = getFunctions();
      const fn = httpsCallable(functions, fnName);
      const result = await fn({ schoolId: user.schoolId, ...payload });
      return (result.data as { ok: boolean; pending: boolean }) || { ok: true, pending: true };
    } catch (err) {
      console.warn(`${fnName} call failed:`, err);
      toast.error(`Unable to reach ${fnName}. Contact support to enable.`);
      return { ok: false, pending: true };
    }
  };

  const handleVerifyDns = async () => {
    setDnsChecking(true);
    const res = await callHardwareCloud('provisionDNS', { domain: whiteLabel.customDomain });
    setDnsChecking(false);
    if (res.ok) {
      if (res.mock) {
        setWhiteLabel(w => ({ ...w, dnsVerified: true, sslActive: true }));
        setWhiteLabelDirty(true);
        toast.success('[Preview Mode] DNS Verified & SSL Active');
      } else {
        toast('Provisioning is pending. Contact support to enable.', { icon: 'ℹ️' });
      }
    }
  };

  const handleTestBiometricConnection = async () => {
    setHardware(h => ({ ...h, connectionStatus: 'testing' }));
    const res = await callHardwareCloud('provisionBiometric', {
      deviceType: hardware.deviceType,
      ip: hardware.deviceIp,
      port: hardware.devicePort,
    });
    if (res.ok) {
      if (res.mock) {
        const ping = Math.floor(Math.random() * 60) + 10;
        setHardware(h => ({ ...h, connectionStatus: 'connected', lastPing: ping }));
        toast.success(`[Preview Mode] Connection established! Ping: ${ping}ms.`);
      } else {
        setHardware(h => ({ ...h, connectionStatus: 'idle' }));
        toast('Biometric provisioning is pending. Contact support to enable.', { icon: 'ℹ️' });
      }
    } else {
      setHardware(h => ({ ...h, connectionStatus: 'failed' }));
    }
  };

  const handleOpenNfcScanner = async () => {
    const res = await callHardwareCloud('provisionNFC', {});
    if (!res.ok) return;
    if (res.mock) {
      setNfcModalOpen(true);
      setNfcScanning(true);
      setNfcResult(null);
      setTimeout(() => {
        setNfcScanning(false);
        setNfcResult({ uid: '04:EA:8C:3B:12', owner: 'Student ID STU-2026-0042 [Preview]' });
        setTimeout(() => {
          toast.success('[Preview Mode] Card scanned.');
          setTimeout(() => setNfcModalOpen(false), 800);
        }, 1200);
      }, 2500);
    } else {
      toast('NFC provisioning is pending. Contact support to enable.', { icon: 'ℹ️' });
    }
  };

  const handleCreateBackup = async () => {
    if (!user.schoolId) return;
    setBackupRunning(true);
    setBackupProgress(0);

    if (isMock()) {
      const interval = setInterval(() => {
        setBackupProgress(p => {
          const next = p + 5;
          if (next >= 100) {
            clearInterval(interval);
            setBackupRunning(false);
            setMaintenance(m => ({ ...m, lastBackupAt: new Date().toISOString() }));
            toast.success('[Preview Mode] Backup simulated.');
            return 100;
          }
          return next;
        });
      }, 100);
      return;
    }

    try {
      const functions = getFunctions();
      const createBackup = httpsCallable(functions, 'createSchoolBackup');
      const progressInterval = setInterval(() => {
        setBackupProgress(p => Math.min(p + 10, 90));
      }, 300);
      const result = await createBackup({ schoolId: user.schoolId });
      clearInterval(progressInterval);
      setBackupProgress(100);
      const data = result.data as any;
      setMaintenance(m => ({ ...m, lastBackupAt: new Date().toISOString() }));
      setTimeout(() => {
        setBackupRunning(false);
        toast.success(`Snapshot backup uploaded: ${data.gsUrl}`);
      }, 500);
    } catch {
      setBackupRunning(false);
      setBackupProgress(0);
      toast.error('Backup failed');
    }
  };

  const handleColorChange = (color: string) => {
    setWhiteLabel(w => ({ ...w, primaryColor: color }));
    setWhiteLabelDirty(true);
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-color', color);
  };

  const handleAddApiKey = () => { setSystemSettings(s => ({ ...s, apiKeys: [...s.apiKeys, ''] })); setSystemDirty(true); };

  const handleRemoveApiKey = (idx: number) => {
    setSystemSettings(s => ({ ...s, apiKeys: s.apiKeys.filter((_, i) => i !== idx) }));
    setSystemDirty(true);
  };

  const handleUpdateApiKey = (idx: number, val: string) => {
    setSystemSettings(s => ({
      ...s, apiKeys: s.apiKeys.map((k, i) => i === idx ? val : k)
    }));
    setSystemDirty(true);
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      if (isMock()) {
        setHolidays(h => h.filter(x => x.id !== id));
        const cache = getLsCache();
        cache['holidays'] = holidays.filter(x => x.id !== id);
        localStorage.setItem(LS_KEY, JSON.stringify(cache));
        toast.success('Holiday removed');
        return;
      }
      await deleteDoc(doc(db, 'schools', user.schoolId, 'holidays', id));
      toast.success('Holiday removed');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaveHoliday = async () => {
    setShowHolidayForm(false);
    if (!holidayForm.date || !holidayForm.name) return;
    try {
      if (isMock()) {
        const newH = { ...holidayForm, id: Date.now().toString() };
        setHolidays(h => [...h, newH].sort((a, b) => a.date.localeCompare(b.date)));
        const cache = getLsCache();
        cache['holidays'] = [...holidays, newH].sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem(LS_KEY, JSON.stringify(cache));
        setHolidayForm({ date: '', name: '', type: 'SCHOOL', lockAttendance: true });
        showSaved();
        toast.success('Holiday added!');
        return;
      }
      const holidayRef = doc(collection(db, 'schools', user.schoolId, 'holidays'));
      await setDoc(holidayRef, { ...holidayForm, createdAt: serverTimestamp() });
      setHolidayForm({ date: '', name: '', type: 'SCHOOL', lockAttendance: true });
      showSaved();
      toast.success('Holiday added!');
    } catch { toast.error('Failed to add holiday'); setSaveStatus('idle'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Settings...</p>
    </div>
  );

  const isDirty = profileDirty || erpDirty || whiteLabelDirty || financeDirty || hardwareDirty || commsDirty || systemDirty || maintenanceDirty;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-24 page-enter w-full">

      {/* Sidebar / Tabs */}
      <div className="lg:w-64 shrink-0">
        <div className="sticky top-6 bg-white dark:bg-zinc-900/60 backdrop-blur-2xl p-3.5 lg:p-4 rounded-3xl lg:rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 mb-3 bg-white/5 rounded-xl border border-white/5">
            <SettingsIcon size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Settings Hub</span>
          </div>
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide snap-x">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`snap-start shrink-0 px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 bg-white/5 lg:bg-transparent'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 min-w-0">

        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-black rounded-[2rem] p-6 md:p-8 text-white overflow-hidden shadow-[0_20px_50px_rgba(30,27,75,0.4)] border border-white/10 group">
          <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] transform translate-x-1/4 -translate-y-1/4" aria-hidden="true" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
                 <SettingsIcon size={12} className="text-indigo-400" /> System Configuration
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
                {TABS.find(t => t.id === activeTab)?.label || 'Settings'}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {activeTab === 'INFO' && 'Manage school identity, branding and contact details'}
                {activeTab === 'WHITE_LABEL' && 'Custom domain mapping, app naming, color theme & favicon'}
                {activeTab === 'ERP' && 'Attendance cutoff times, shift schedules and academic rules'}
                {activeTab === 'FINANCE' && 'GST configuration, Razorpay and Stripe payment gateway keys'}
                {activeTab === 'HARDWARE' && 'Biometric device connections and NFC card programming'}
                {activeTab === 'COMMS' && 'SmartSchool centralized WhatsApp invite system — sends magic link invites only'}
                {activeTab === 'CALENDAR' && 'National, school and festival holiday register with attendance lock'}
                {activeTab === 'SYSTEM' && 'Rotatable Gemini API key pool and AI model parameters'}
                {activeTab === 'MAINTENANCE' && 'Two-factor auth, session policies and database backup snapshots'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black">
                  <CheckCircle2 size={14} /> Saved
                </span>
              )}
              {isDirty && (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold animate-pulse">
                  <AlertCircle size={14} /> Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== TAB: INFO ===== */}
        {activeTab === 'INFO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">

              {/* School Campus Photo & Identity Showcase Banner */}
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group min-h-[260px] flex flex-col justify-end p-6 md:p-8 bg-slate-900">
                <img 
                  src={schoolProfile.campusImageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80'} 
                  alt="School Campus Building"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.65]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Floating Campus Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Main Campus
                  </span>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-5">
                  {/* Logo overlay on campus */}
                  <div className="relative group/logo shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[2rem] border-2 border-white/40 shadow-2xl flex items-center justify-center p-3 overflow-hidden">
                      {schoolProfile.logoUrl ? (
                        <img src={schoolProfile.logoUrl} className="w-full h-full object-contain" alt="School Logo" />
                      ) : (
                        <Upload className="text-slate-400" size={28} />
                      )}
                    </div>
                    <label className="absolute inset-0 bg-indigo-600/80 rounded-[2rem] opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 text-white">
                      <Upload size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider">Logo</span>
                      <input type="file" className="hidden" onChange={(e) => handleLogoUpload(e, 'logoUrl')} accept="image/*" />
                    </label>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Registered Institution</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight truncate">
                      {schoolProfile.name || 'Delhi Public International School'}
                    </h2>
                    <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-2 truncate">
                      <MapPin size={13} className="text-indigo-400 shrink-0" />
                      {schoolProfile.address || 'Sector 14, Ring Road, New Delhi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm space-y-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Institutional Details & Credentials</h3>
                  <p className="text-xs text-slate-500 mt-1">Official institution credentials used across reports, invoices, and the parent portal.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="School Name" value={schoolProfile.name} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, name: v })); setProfileDirty(true); }} icon={Building2} placeholder="Delhi Public School" />
                  <InputField label="Principal Name" value={schoolProfile.principal} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, principal: v })); setProfileDirty(true); }} icon={Users} />
                  <InputField label="Affiliation Number" value={schoolProfile.affiliation} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, affiliation: v })); setProfileDirty(true); }} icon={Shield} />
                  <InputField label="Academic Year" value={schoolProfile.academicYear} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, academicYear: v })); setProfileDirty(true); }} icon={Calendar} placeholder="2025-26" />
                  <InputField label="Email" value={schoolProfile.email} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, email: v })); setProfileDirty(true); }} icon={Mail} />
                  <InputField label="Phone" value={schoolProfile.phone} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, phone: v })); setProfileDirty(true); }} icon={Phone} />
                  <div className="md:col-span-2">
                    <InputField label="Campus Image URL" value={schoolProfile.campusImageUrl || ''} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, campusImageUrl: v })); setProfileDirty(true); }} icon={Globe} placeholder="https://images.unsplash.com/photo-..." />
                  </div>
                  <div className="md:col-span-2">
                    <InputField label="Campus Address" value={schoolProfile.address} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, address: v })); setProfileDirty(true); }} icon={MapPin} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Official Channels & Handles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Facebook" value={schoolProfile.socialLinks.facebook} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, facebook: v } })); setProfileDirty(true); }} icon={Globe} />
                    <InputField label="Twitter / X" value={schoolProfile.socialLinks.twitter} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: v } })); setProfileDirty(true); }} icon={Globe} />
                    <InputField label="Instagram" value={schoolProfile.socialLinks.instagram} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: v } })); setProfileDirty(true); }} icon={Globe} />
                    <InputField label="YouTube" value={schoolProfile.socialLinks.youtube} onChange={(v: any) => { setSchoolProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, youtube: v } })); setProfileDirty(true); }} icon={Globe} />
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={saveStatus === 'saving' || !profileDirty}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center gap-3">
                  {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  Save School Profile
                </button>
              </div>
            </div>

            {/* Right Column: Live Institutional Card Preview */}
            <div className="lg:col-span-4 space-y-6">
              {/* Digital Pass / Identity Card */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-6 rounded-[2.5rem] text-white shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <School size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">SmartSchool Verified</p>
                      <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Digital Accreditation</p>
                    </div>
                  </div>
                  <ShieldCheck size={18} className="text-emerald-400" />
                </div>

                {/* Campus Image in Preview Card */}
                <div className="w-full h-36 rounded-2xl overflow-hidden mb-4 border border-white/10 relative shadow-inner">
                  <img 
                    src={schoolProfile.campusImageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'} 
                    alt="School Building"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      {schoolProfile.academicYear || '2025-26'}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-300">
                      CBSE Affiliated
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Institution</p>
                    <p className="font-bold text-white text-sm leading-tight mt-0.5">{schoolProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Principal / Head</p>
                    <p className="font-semibold text-slate-200 text-xs mt-0.5">{schoolProfile.principal}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Affiliation Code</p>
                    <p className="font-mono font-bold text-indigo-400 text-xs mt-0.5">{schoolProfile.affiliation}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Multi-Tenant Ready</span>
                  <span className="font-mono text-indigo-300">v3.4.0</span>
                </div>
              </div>

              {/* System Security Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] text-white border border-white/10 shadow-lg">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Security & Sync</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Data Encryption</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Lock size={12} /> AES-256</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Cloud Sync Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: WHITE_LABEL ===== */}
        {activeTab === 'WHITE_LABEL' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">

              {/* Custom Domain */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                  <Globe size={20} className="text-indigo-600" /> Custom Domain
                </h3>
                <p className="text-xs text-slate-500 mb-6">Map a custom URL to your school portal (e.g. portal.yourschool.org)</p>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <InputField label="Custom URL" value={whiteLabel.customDomain}
                      onChange={(v: any) => { setWhiteLabel(w => ({ ...w, customDomain: v })); setWhiteLabelDirty(true); }}
                      icon={ExternalLink} placeholder="portal.schoolname.org" />
                  </div>
                  <button onClick={() => setShowDnsCard(!showDnsCard)}
                    className="px-5 py-4 mb-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                    {showDnsCard ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    DNS Config
                  </button>
                </div>

                {showDnsCard && (
                  <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Required DNS Records</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CNAME Record</p>
                        <code className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-2 block">portal → cdn.smartschool.io</code>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TXT Record</p>
                        <code className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-2 block">smartschool-verify={user.schoolId || 'XXXXX'}</code>
                      </div>
                    </div>
                    <button onClick={handleVerifyDns} disabled={dnsChecking || !whiteLabel.customDomain}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2">
                      {dnsChecking ? <Loader2 className="animate-spin" size={14} /> : <RadioTower size={14} />}
                      {dnsChecking ? 'Verifying DNS...' : 'Verify DNS Records'}
                    </button>
                    {(whiteLabel.dnsVerified || whiteLabel.sslActive) && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <ShieldCheck size={20} className="text-emerald-600" />
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          Verified & SSL Active (Secure)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Branding Panel */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                  <Monitor size={20} className="text-indigo-600" /> Branding
                </h3>
                <p className="text-xs text-slate-500 mb-6">Customize the application name and visual assets.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Application Name" value={whiteLabel.appName}
                    onChange={(v: any) => { setWhiteLabel(w => ({ ...w, appName: v })); setWhiteLabelDirty(true); }}
                    icon={Monitor} placeholder="DPS ERP" />

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Accent Color</label>
                    <div className="flex gap-4 items-center">
                      <input type="color" value={whiteLabel.primaryColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-16 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
                      <input type="text" value={whiteLabel.primaryColor}
                        onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && handleColorChange(e.target.value)}
                        className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black outline-none dark:text-white font-mono" />
                      <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700" style={{ backgroundColor: whiteLabel.primaryColor }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Favicon</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        {whiteLabel.faviconUrl ? (
                          <img src={whiteLabel.faviconUrl} className="w-full h-full object-contain" alt="Favicon" />
                        ) : (
                          <Upload className="text-slate-300" size={20} />
                        )}
                      </div>
                      <label className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 cursor-pointer transition-all">
                        Upload
                        <input type="file" className="hidden" onChange={(e) => handleLogoUpload(e, 'faviconUrl')} accept="image/*" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Login Background</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-24 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        {whiteLabel.loginBgUrl ? (
                          <img src={whiteLabel.loginBgUrl} className="w-full h-full object-cover" alt="Login BG" />
                        ) : (
                          <Upload className="text-slate-300" size={20} />
                        )}
                      </div>
                      <label className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 cursor-pointer transition-all">
                        Upload
                        <input type="file" className="hidden" onChange={(e) => handleLogoUpload(e, 'loginBgUrl')} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-6 bg-slate-900 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Live Preview</p>
                <div className="p-6 bg-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white" style={{ backgroundColor: whiteLabel.primaryColor }}>
                    {whiteLabel.appName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">{whiteLabel.appName || 'SmartSchool'}</p>
                    <p className="text-slate-400 text-xs">{whiteLabel.customDomain || 'portal.school.edu'}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSaveWhiteLabel} disabled={saveStatus === 'saving' || !whiteLabelDirty}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Palette size={16} />}
              Save Domain & Branding
            </button>
          </div>
        )}

        {/* ===== TAB: ERP ===== */}
        {activeTab === 'ERP' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Clock size={24} className="text-indigo-600" /> Attendance & Shift Cutoffs
                </h3>
                <p className="text-xs text-slate-500 mt-2">Configure attendance cutoff times, shift schedules, and grading thresholds.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Cutoff Time</label>
                  <input type="time" value={erpRules.attendanceCutoffTime} onChange={(e) => { setErpRules(r => ({ ...r, attendanceCutoffTime: e.target.value })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morning Shift Start</label>
                  <input type="time" value={erpRules.morningShiftStart} onChange={(e) => { setErpRules(r => ({ ...r, morningShiftStart: e.target.value })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afternoon Shift Start</label>
                  <input type="time" value={erpRules.afternoonShiftStart} onChange={(e) => { setErpRules(r => ({ ...r, afternoonShiftStart: e.target.value })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late Entry Time</label>
                  <input type="time" value={erpRules.lateEntryTime} onChange={(e) => { setErpRules(r => ({ ...r, lateEntryTime: e.target.value })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grace Period (minutes)</label>
                  <input type="number" value={erpRules.lateGracePeriod} onChange={(e) => { setErpRules(r => ({ ...r, lateGracePeriod: Number(e.target.value) })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Threshold (%)</label>
                  <input type="number" value={erpRules.attendanceThreshold} onChange={(e) => { setErpRules(r => ({ ...r, attendanceThreshold: Number(e.target.value) })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passing Score (%)</label>
                  <input type="number" value={erpRules.passingScore} onChange={(e) => { setErpRules(r => ({ ...r, passingScore: Number(e.target.value) })); setErpDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Auto-Notify on Absence</p>
                  <p className="text-[10px] text-slate-500">Send WhatsApp alert when student is marked absent</p>
                </div>
                <button onClick={() => { setErpRules(r => ({ ...r, autoNotifyAbsence: !r.autoNotifyAbsence })); setErpDirty(true); }}>
                  {erpRules.autoNotifyAbsence ? <ToggleRight size={44} className="text-emerald-500" /> : <ToggleLeft size={44} className="text-slate-300" />}
                </button>
              </div>
            </div>

            <button onClick={handleSaveErp} disabled={saveStatus === 'saving' || !erpDirty}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Save ERP Cutoffs
            </button>
          </div>
        )}

        {/* ===== TAB: FINANCE ===== */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <CreditCard size={24} className="text-indigo-600" /> Payment Gateway Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-2">Configure GST, Razorpay and Stripe payment processing.</p>
              </div>

              {/* GST */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">GST Configuration</h4>
                  <button onClick={() => { setFinance(f => ({ ...f, enableGst: !f.enableGst })); setFinanceDirty(true); }}>
                    {finance.enableGst ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-slate-300" />}
                  </button>
                </div>
                {finance.enableGst && (
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">GST Percentage</label>
                    <div className="relative w-32">
                      <input type="number" value={finance.gstPercentage}
                        onChange={(e) => { setFinance(f => ({ ...f, gstPercentage: Number(e.target.value) })); setFinanceDirty(true); }}
                        className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black text-right pr-10" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Gateway Selector */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Gateway</label>
                <div className="flex gap-4">
                  {(['RAZORPAY', 'STRIPE', 'BOTH'] as const).map(g => (
                    <button key={g} onClick={() => { setFinance(f => ({ ...f, paymentGateway: g })); setFinanceDirty(true); }}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        finance.paymentGateway === g
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                      }`}>
                      {g === 'BOTH' ? 'Razorpay + Stripe' : g}
                    </button>
                  ))}
                </div>
              </div>

              {(finance.paymentGateway === 'RAZORPAY' || finance.paymentGateway === 'BOTH') && (
                <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap size={16} className="text-indigo-600" /> Razorpay Keys
                  </h4>
                  <InputField label="Key ID (Publishable)" value={finance.razorpayKeyId} onChange={(v: any) => { setFinance(f => ({ ...f, razorpayKeyId: v })); setFinanceDirty(true); }} icon={Key} placeholder="rzp_live_..." />
                  <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <Shield size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      <strong>Key Secret</strong> is managed at platform level (Cloud Function environment).
                      Never store it in the browser — any school member with read access could extract it.
                    </p>
                  </div>
                </div>
              )}

              {(finance.paymentGateway === 'STRIPE' || finance.paymentGateway === 'BOTH') && (
                <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-indigo-600" /> Stripe Keys
                  </h4>
                  <InputField label="Publishable Key" value={finance.stripePublishableKey} onChange={(v: any) => { setFinance(f => ({ ...f, stripePublishableKey: v })); setFinanceDirty(true); }} icon={Key} placeholder="pk_live_..." />
                  <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <Shield size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      <strong>Secret Key</strong> is managed at platform level (Cloud Function environment).
                      Never store it in the browser — any school member with read access could extract it.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                <select value={finance.currency} onChange={(e) => { setFinance(f => ({ ...f, currency: e.target.value })); setFinanceDirty(true); }}
                  className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black">
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            <button onClick={handleSaveFinance} disabled={saveStatus === 'saving' || !financeDirty}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Save Payment Configuration
            </button>
          </div>
        )}

        {/* ===== TAB: HARDWARE ===== */}
        {activeTab === 'HARDWARE' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Fingerprint size={24} className="text-indigo-600" /> Biometric Device Connection
                </h3>
                <p className="text-xs text-slate-500 mt-2">Configure and test connection to biometric attendance devices.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Type</label>
                  <select value={hardware.deviceType}
                    onChange={(e) => { setHardware(h => ({ ...h, deviceType: e.target.value as Hardware['deviceType'] })); setHardwareDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black">
                    <option value="ZKTeco">ZKTeco</option>
                    <option value="Mantra">Mantra</option>
                    <option value="Suprema">Suprema</option>
                    <option value="Hikvision">Hikvision</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device IP Address</label>
                  <input type="text" value={hardware.deviceIp}
                    onChange={(e) => { setHardware(h => ({ ...h, deviceIp: e.target.value })); setHardwareDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black font-mono"
                    placeholder="192.168.1.100" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Port</label>
                  <input type="number" value={hardware.devicePort}
                    onChange={(e) => { setHardware(h => ({ ...h, devicePort: Number(e.target.value) })); setHardwareDirty(true); }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                </div>
                <div className="space-y-4 flex items-end">
                  <button onClick={handleTestBiometricConnection} disabled={hardware.connectionStatus === 'testing'}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                    {hardware.connectionStatus === 'testing' ? (
                      <><Loader2 className="animate-spin" size={16} /> Testing...</>
                    ) : (
                      <><RadioTower size={16} /> Test Connection</>
                    )}
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className={`p-6 rounded-2xl transition-all ${
                hardware.connectionStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                  : hardware.connectionStatus === 'failed'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : hardware.connectionStatus === 'testing'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-4">
                  {hardware.connectionStatus === 'testing' && (
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                      <RadioTower size={18} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                    </div>
                  )}
                  {hardware.connectionStatus === 'connected' && <ShieldCheck size={24} className="text-emerald-600" />}
                  {hardware.connectionStatus === 'failed' && <AlertCircle size={24} className="text-red-500" />}
                  {hardware.connectionStatus === 'idle' && <Radio size={24} className="text-slate-400" />}
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">
                      {hardware.connectionStatus === 'idle' && 'No connection attempted'}
                      {hardware.connectionStatus === 'testing' && 'Scanning network...'}
                      {hardware.connectionStatus === 'connected' && `Connection established! Ping: ${hardware.lastPing}ms. Device active.`}
                      {hardware.connectionStatus === 'failed' && 'Connection failed. Check IP and port.'}
                    </p>
                    {hardware.connectionStatus === 'connected' && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-bold">{hardware.deviceType} @ {hardware.deviceIp}:{hardware.devicePort}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* NFC Card Programmer */}
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                  <Smartphone size={24} className="text-indigo-600" /> NFC Card Programmer
                </h3>
                <p className="text-xs text-slate-500 mb-6">Program and scan NFC student ID cards.</p>

                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hardware.nfcEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <QrCode size={24} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white">NFC Card Reader</p>
                      <p className="text-[10px] text-slate-500">WebNFC compatible browser required</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setHardware(h => ({ ...h, nfcEnabled: !h.nfcEnabled }))}>
                      {hardware.nfcEnabled ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-slate-300" />}
                    </button>
                    <button onClick={handleOpenNfcScanner} disabled={!hardware.nfcEnabled}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2">
                      <Scan size={14} /> Open Card Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSaveHardware} disabled={saveStatus === 'saving'}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Save Hardware Config
            </button>
          </div>
        )}

        {/* ===== NFC Scanner Modal ===== */}
        {nfcModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
              {nfcScanning && !nfcResult && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 animate-pulse" />
              )}
              <div className="relative z-10 text-center space-y-8">
                {nfcScanning && !nfcResult && (
                  <>
                    <div className="relative w-40 h-40 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-ping" />
                      <div className="absolute inset-2 rounded-full border-4 border-indigo-400/40 animate-spin" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-4 rounded-full border-4 border-indigo-300/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone size={48} className="text-indigo-400 animate-bounce" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-black text-lg">Scanning NFC Card</p>
                      <p className="text-indigo-300/60 text-xs mt-2">Tap card to the reader...</p>
                    </div>
                  </>
                )}
                {nfcResult && (
                  <>
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-black text-lg">Card Detected!</p>
                      <div className="p-4 bg-white/5 rounded-2xl space-y-2 text-left">
                        <div className="flex justify-between">
                          <span className="text-indigo-300 text-xs font-bold">Card UID</span>
                          <span className="text-white font-mono text-sm">{nfcResult.uid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-300 text-xs font-bold">Linked Owner</span>
                          <span className="text-white font-bold text-sm">{nfcResult.owner}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: COMMS ===== */}
        {activeTab === 'COMMS' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <MessageSquare size={24} className="text-indigo-600" /> SmartSchool Invite System
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  All external communication uses SmartSchool's centralized WhatsApp API. 
                  WhatsApp is used ONLY for sending Welcome/Invite Magic Links to new users 
                  (teachers, students, parents). All daily notifications (attendance, fees, 
                  exams, results) happen inside the app via the Notification Bell.
                </p>
              </div>

              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-4">
                  <ShieldCheck size={24} className="text-indigo-600 shrink-0 mt-1" />
                  <div className="space-y-3">
                    <p className="font-black text-indigo-900 dark:text-indigo-200 text-sm">Centralized API — No School Config Needed</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      SmartSchool OS manages a single WhatsApp Business API key at the platform level. 
                      Each school simply enables or disables the invite feature. The system auto-sends 
                      magic link invites with the school's branding when new users are created.
                    </p>
                    <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 size={12} /> WhatsApp — Only invite magic links (welcome messages)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={12} /> In-App — Attendance alerts, fee reminders, exam results, notices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${comms.inviteEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Send Invite via WhatsApp</p>
                    <p className="text-[10px] text-slate-500">Auto-send magic link invites to new users</p>
                  </div>
                </div>
                <button onClick={() => { setComms(c => ({ ...c, inviteEnabled: !c.inviteEnabled })); setCommsDirty(true); }}>
                  {comms.inviteEnabled ? <ToggleRight size={44} className="text-emerald-500" /> : <ToggleLeft size={44} className="text-slate-300" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Bell size={20} className="text-indigo-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Auto-Send on User Creation</p>
                    <p className="text-[10px] text-slate-500">Automatically send invite when admin adds a new user</p>
                  </div>
                </div>
                <button disabled={!comms.inviteEnabled} onClick={() => { setComms(c => ({ ...c, autoSendOnCreate: !c.autoSendOnCreate })); setCommsDirty(true); }}>
                  {comms.autoSendOnCreate ? <ToggleRight size={44} className="text-emerald-500" /> : <ToggleLeft size={44} className="text-slate-300" />}
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite Template</label>
                <select value={comms.activeTemplate} onChange={(e) => { setComms(c => ({ ...c, activeTemplate: e.target.value })); setCommsDirty(true); }}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black">
                  <option value="TEACHER_INVITE">Teacher Invite</option>
                  <option value="STUDENT_ADMISSION">Student Admission</option>
                  <option value="PARENT_WELCOME">Parent Welcome</option>
                  <option value="CREDENTIAL_RESET">Credential Reset</option>
                </select>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Invite History */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <Clock size={20} className="text-indigo-600" /> Invite History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                    <p className="text-3xl font-black text-indigo-600">{comms.totalInvitesSent}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Total Invites Sent</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                    <p className="text-3xl font-black text-emerald-600">{comms.inviteEnabled ? 'Active' : 'Paused'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Invite System</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                    <p className="text-3xl font-black text-indigo-600">{comms.autoSendOnCreate ? 'Auto' : 'Manual'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Send Mode</p>
                  </div>
                </div>
                {comms.lastInviteSentAt && (
                  <p className="text-[10px] text-slate-400 mt-4 text-center">
                    Last invite sent: {new Date(comms.lastInviteSentAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Send Test Invite */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <RadioTower size={24} className="text-indigo-400" />
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Send Test Invite</p>
                    <p className="text-[10px] text-slate-500">Send a sample magic link invite to your phone</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Sending test invite...');
                      const schoolId = user.schoolId;
                      if (!schoolId) { toast.error('No school ID'); return; }
                      if (isMock()) {
                        await new Promise(r => setTimeout(r, 1500));
                        setComms(c => ({ ...c, totalInvitesSent: c.totalInvitesSent + 1, lastInviteSentAt: new Date().toISOString() }));
                        setCommsDirty(true);
                        toast.dismiss();
                        toast.success('Test invite sent! Check your WhatsApp.');
                        return;
                      }
                      // Call cloud function
                      const functions = getFunctions();
                      const sendInvite = httpsCallable(functions, 'sendWhatsAppInvite');
                      const result = await sendInvite({ schoolId, testMode: true });
                      toast.dismiss();
                      toast.success('Test invite sent via SmartSchool API!');
                      setComms(c => ({ ...c, totalInvitesSent: c.totalInvitesSent + 1, lastInviteSentAt: new Date().toISOString() }));
                      setCommsDirty(true);
                    } catch { toast.dismiss(); toast.error('Failed to send test invite'); }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2">
                  <Send size={14} /> Send Test
                </button>
              </div>
            </div>

            <button onClick={handleSaveComms} disabled={saveStatus === 'saving' || !commsDirty}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Save Invite Config
            </button>
          </div>
        )}

        {/* ===== TAB: CALENDAR ===== */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <CalendarDays size={24} className="text-indigo-600" /> Holiday Register
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">Manage national, school and festival holidays with attendance lock.</p>
                </div>
                <button onClick={() => setShowHolidayForm(!showHolidayForm)}
                  className="px-6 py-3 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-200 transition-all flex items-center gap-2">
                  <Plus size={14} /> Add Holiday
                </button>
              </div>

              {showHolidayForm && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm(h => ({ ...h, date: e.target.value }))}
                      className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                    <input type="text" value={holidayForm.name} onChange={(e) => setHolidayForm(h => ({ ...h, name: e.target.value }))}
                      placeholder="Holiday name" className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black" />
                  </div>
                  <div className="flex items-center gap-6">
                    <select value={holidayForm.type} onChange={(e) => setHolidayForm(h => ({ ...h, type: e.target.value as any }))}
                      className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black">
                      <option value="NATIONAL">National</option>
                      <option value="SCHOOL">School</option>
                      <option value="FESTIVAL">Festival</option>
                    </select>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={holidayForm.lockAttendance} onChange={(e) => setHolidayForm(h => ({ ...h, lockAttendance: e.target.checked }))} className="w-5 h-5" />
                      <span className="text-xs font-bold text-slate-600">Lock Attendance</span>
                    </label>
                  </div>
                  <button onClick={handleSaveHoliday} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700">
                    Add Holiday
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {holidays.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-bold">No holidays added yet</p>
                  </div>
                ) : holidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-indigo-600 uppercase">{h.date.split('-')[1]}</span>
                        <span className="text-xl font-black text-indigo-600">{h.date.split('-')[2]}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{h.name}</p>
                        <div className="flex gap-3 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${h.type === 'NATIONAL' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : h.type === 'FESTIVAL' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>{h.type}</span>
                          {h.lockAttendance && <span className="text-[9px] font-bold text-emerald-500 uppercase px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20">Auto-Lock</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => h.id && handleDeleteHoliday(h.id)} className="p-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: SYSTEM ===== */}
        {activeTab === 'SYSTEM' && (
          <div className="space-y-8">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl space-y-8">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Brain size={24} className="text-indigo-400" /> AI Neural Key Pool
                </h3>
                <p className="text-[10px] text-indigo-300/60 mt-2">Manage Gemini API keys. System auto-rotates on rate limit.</p>
              </div>

              {/* Security Warning Banner */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Shield size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-300 uppercase tracking-widest">Security Notice</p>
                  <p className="text-[11px] text-amber-200/70 mt-1 leading-relaxed">
                    API keys are stored encrypted. Never share your Settings page access. 
                    Keys are auto-rotated on rate limit. Contact platform admin for key rotation.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(systemSettings.apiKeys || []).map((key, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10 group">
                    <div className="flex-1 relative">
                      <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                      <input type="password" value={key} onChange={(e) => handleUpdateApiKey(idx, e.target.value)}
                        placeholder="AIza..." className="w-full bg-transparent border-none outline-none pl-12 pr-4 text-white font-mono text-sm" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-400/40 uppercase">
                        {key ? `****...****${key.slice(-4)}` : 'Empty'}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveApiKey(idx)}
                      className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={handleAddApiKey}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 flex items-center gap-2">
                  <Plus size={14} /> Add API Key
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Model</label>
                  <select value={systemSettings.modelName} onChange={(e) => { setSystemSettings(s => ({ ...s, modelName: e.target.value })); setSystemDirty(true); }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Max Tokens</label>
                  <input type="number" value={systemSettings.maxTokens} onChange={(e) => { setSystemSettings(s => ({ ...s, maxTokens: Number(e.target.value) })); setSystemDirty(true); }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Temperature</label>
                  <input type="number" step="0.1" min="0" max="2" value={systemSettings.temperature}
                    onChange={(e) => { setSystemSettings(s => ({ ...s, temperature: Number(e.target.value) })); setSystemDirty(true); }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${systemSettings.aiFallback ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-xs font-black text-white uppercase">Global Fallback</p>
                    <p className="text-[9px] text-indigo-300/40">Auto-switch on rate limit</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSystemSettings(s => ({ ...s, aiFallback: !s.aiFallback })); setSystemDirty(true); }}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:scale-105"
                >
                  {systemSettings.aiFallback ? <ToggleRight size={44} className="text-indigo-400" /> : <ToggleLeft size={44} className="text-slate-500 hover:text-slate-400" />}
                </button>
              </div>
            </div>

            <button onClick={handleSaveSystem} disabled={saveStatus === 'saving' || !systemDirty}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Save AI Pool Config
            </button>
          </div>
        )}

        {/* ===== TAB: MAINTENANCE ===== */}
        {activeTab === 'MAINTENANCE' && (
          <div className="space-y-8">
            {maintenance.enabled && (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
                <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-amber-700">Maintenance Mode Active</h4>
                  <p className="text-sm text-amber-600 mt-1">All non-admin users are locked out.</p>
                  {maintenance.enabledAt && <p className="text-xs text-amber-500 mt-2">Enabled: {new Date(maintenance.enabledAt).toLocaleString()}</p>}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              {/* Maintenance Mode */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                  <WifiOff size={20} className={maintenance.enabled ? 'text-amber-500' : 'text-indigo-600'} /> Maintenance Mode
                </h3>
                <p className="text-xs text-slate-500 mb-4">Temporarily block all non-admin access.</p>
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Enable Maintenance Mode</p>
                    <p className="text-[10px] text-slate-500">Users will be logged out and see a maintenance message</p>
                  </div>
                  <button onClick={() => {
                    if (!maintenance.enabled) {
                      if (!confirm('This will log out all students and parents. Continue?')) return;
                    }
                    setMaintenance(m => ({ ...m, enabled: !m.enabled }));
                    setMaintenanceDirty(true);
                  }} className={`p-2 rounded-full transition-all ${maintenance.enabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    {maintenance.enabled ? <ToggleRight size={48} className="text-white" /> : <ToggleLeft size={48} className="text-slate-400" />}
                  </button>
                </div>
                {maintenance.enabled && (
                  <div className="mt-4 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance Message</label>
                    <textarea value={maintenance.message}
                      onChange={(e) => { setMaintenance(m => ({ ...m, message: e.target.value })); setMaintenanceDirty(true); }}
                      rows={3} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black resize-none" />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Security */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <Shield size={20} className="text-indigo-600" /> Security Policies
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <ShieldCheck size={20} className="text-indigo-600" />
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                        <p className="text-[10px] text-slate-500">Require OTP for admin login</p>
                      </div>
                    </div>
                    <button onClick={() => { setMaintenance(m => ({ ...m, twoFactorEnabled: !m.twoFactorEnabled })); setMaintenanceDirty(true); }}>
                      {maintenance.twoFactorEnabled ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-slate-300" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <Timer size={20} className="text-indigo-600" />
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Auto-Logout</p>
                        <p className="text-[10px] text-slate-500">Log out inactive users automatically</p>
                      </div>
                    </div>
                    <button onClick={() => { setMaintenance(m => ({ ...m, autoLogout: !m.autoLogout })); setMaintenanceDirty(true); }}>
                      {maintenance.autoLogout ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-slate-300" />}
                    </button>
                  </div>

                  {maintenance.autoLogout && (
                    <div className="space-y-3 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Timeout (minutes)</label>
                      <div className="flex items-center gap-4">
                        <input type="range" min="5" max="120" value={maintenance.sessionTimeoutMinutes}
                          onChange={(e) => { setMaintenance(m => ({ ...m, sessionTimeoutMinutes: Number(e.target.value) })); setMaintenanceDirty(true); }}
                          className="flex-1 accent-indigo-600" />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 min-w-[4rem]">{maintenance.sessionTimeoutMinutes}m</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Backup */}
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <Database size={20} className="text-indigo-600" /> System Backups
                </h3>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Cloud size={24} className="text-indigo-400" />
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">Firestore Snapshot</p>
                        <p className="text-[10px] text-slate-500">Manual backup to cloud storage bucket</p>
                      </div>
                    </div>
                    <button onClick={handleCreateBackup} disabled={backupRunning}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2">
                      {backupRunning ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                      {backupRunning ? 'Creating...' : 'Create Snapshot'}
                    </button>
                  </div>

                  {backupRunning && (
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-100 ease-out"
                          style={{ width: `${backupProgress}%` }} />
                      </div>
                      <p className="text-[10px] font-bold text-indigo-600 text-right">{backupProgress}%</p>
                    </div>
                  )}

                  {maintenance.lastBackupAt && !backupRunning && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Last backup: {new Date(maintenance.lastBackupAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleSaveMaintenance} disabled={saveStatus === 'saving' || !maintenanceDirty}
              className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-3">
              {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
              Save Security & Backup Config
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, icon: Icon, placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full ${Icon ? 'pl-14' : 'px-6'} pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black outline-none transition-all dark:text-white`} />
    </div>
  </div>
);

export default SchoolSettings;
