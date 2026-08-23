/**
 * Usage Tracking Service - Background Billing & Analytics
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

const USAGE_COLLECTION = 'usage';
const ALERTS_COLLECTION = 'usageAlerts';
const LIMITS_COLLECTION = 'schoolUsageLimits';

interface UsageStats {
  schoolId: string;
  period: 'daily' | 'monthly' | 'yearly';
  messageCount: number;
  apiCalls: number;
  storageUsed: number;
  lastUpdated: Date | null;
  whatsappCount: number;
  whatsappSuccess: number;
  whatsappFailed: number;
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
  storageUploads: number;
  storageDownloads: number;
  storageDeletes: number;
  storageBytesUploaded: number;
  aiQueries: number;
  aiTokensUsed: number;
  loginCount: number;
  userCreations: number;
  profileUpdates: number;
  attendanceMarks: number;
  feeTransactions: number;
  studentImports: number;
  reportGenerations: number;
  createdAt?: Date | null;
}

interface SchoolUsageLimit {
  schoolId: string;
  monthlyMessageLimit: number;
  monthlyApiLimit: number;
  storageLimit: number;
  isUnlimited: boolean;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

interface UsageAlert {
  id?: string;
  schoolId: string;
  alertType: 'MESSAGE_QUOTA' | 'API_QUOTA' | 'STORAGE_QUOTA' | 'SUSPICIOUS_ACTIVITY';
  threshold: number;
  currentUsage: number;
  percentage: number;
  createdAt: Date | null;
  acknowledgedAt?: Date | null;
}

interface NotificationLog {
  id: string;
  schoolId: string;
  type: 'FEE_REMINDER' | 'ABSENT_ALERT' | 'NOTICE_BROADCAST' | 'CUSTOM';
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'MOCK_SENT' | 'PENDING';
  provider: string;
  phoneNumberId?: string;
  sentAt: Date | null;
  sentBy: string;
  errorDetail?: string;
}

const DEFAULT_LIMITS: Record<string, Omit<SchoolUsageLimit, 'schoolId'>> = {
  FREE: { monthlyMessageLimit: 500, monthlyApiLimit: 1000, storageLimit: 100 * 1024 * 1024, isUnlimited: false, tier: 'FREE' },
  BASIC: { monthlyMessageLimit: 2000, monthlyApiLimit: 5000, storageLimit: 500 * 1024 * 1024, isUnlimited: false, tier: 'BASIC' },
  PREMIUM: { monthlyMessageLimit: 10000, monthlyApiLimit: 20000, storageLimit: 2 * 1024 * 1024 * 1024, isUnlimited: false, tier: 'PREMIUM' },
  ENTERPRISE: { monthlyMessageLimit: 0, monthlyApiLimit: 0, storageLimit: 0, isUnlimited: true, tier: 'ENTERPRISE' }
};

const getCurrentDateKey = (): string => {
  return new Date().toISOString().split('T')[0]!;
};

export const getUsageStats = async (
  schoolId: string,
  date: string = getCurrentDateKey()
): Promise<UsageStats | null> => {
  try {
    const usageRef = doc(db, USAGE_COLLECTION, schoolId, 'daily', date);
    const snap = await getDoc(usageRef);
    if (snap.exists()) {
      return snap.data() as UsageStats;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get usage stats:', error);
    return null;
  }
};

export const incrementCounter = async (
  schoolId: string,
  counterName: keyof Omit<UsageStats, 'schoolId' | 'period' | 'lastUpdated' | 'createdAt'>,
  amount: number = 1,
  date: string = getCurrentDateKey()
): Promise<void> => {
  try {
    const usageRef = doc(db, USAGE_COLLECTION, schoolId, 'daily', date);
    await updateDoc(usageRef, {
      [counterName]: increment(amount),
      lastUpdated: serverTimestamp()
    });
  } catch {
    try {
      const initialStats: Record<string, unknown> = {
        schoolId,
        date,
        whatsappCount: 0,
        whatsappSuccess: 0,
        whatsappFailed: 0,
        firestoreReads: 0,
        firestoreWrites: 0,
        firestoreDeletes: 0,
        storageUploads: 0,
        storageDownloads: 0,
        storageDeletes: 0,
        storageBytesUploaded: 0,
        aiQueries: 0,
        aiTokensUsed: 0,
        loginCount: 0,
        userCreations: 0,
        profileUpdates: 0,
        attendanceMarks: 0,
        feeTransactions: 0,
        studentImports: 0,
        reportGenerations: 0,
        period: 'daily',
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      (initialStats as Record<string, number>)[counterName as string] = amount;
      await setDoc(doc(db, USAGE_COLLECTION, schoolId, 'daily', date), initialStats);
    } catch (createError) {
      if (import.meta.env.DEV) console.warn('Failed to create usage stats:', createError);
    }
  }
};

export const addBytes = async (schoolId: string, bytes: number, date: string = getCurrentDateKey()): Promise<void> => {
  await incrementCounter(schoolId, 'storageBytesUploaded', bytes, date);
};

export const incrementWhatsApp = async (schoolId: string, success: boolean, date: string = getCurrentDateKey()): Promise<void> => {
  try {
    await incrementCounter(schoolId, 'whatsappCount', 1, date);
    if (success) {
      await incrementCounter(schoolId, 'whatsappSuccess', 1, date);
    } else {
      await incrementCounter(schoolId, 'whatsappFailed', 1, date);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track WhatsApp usage:', error);
  }
};

export const incrementFirestore = async (schoolId: string, operation: 'read' | 'write' | 'delete', count: number = 1, date: string = getCurrentDateKey()): Promise<void> => {
  try {
    const counterName = `firestore${operation.charAt(0).toUpperCase() + operation.slice(1)}s` as keyof Omit<UsageStats, 'schoolId' | 'period' | 'lastUpdated' | 'createdAt'>;
    await incrementCounter(schoolId, counterName, count, date);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track Firestore usage:', error);
  }
};

export const incrementStorage = async (schoolId: string, operation: 'upload' | 'download' | 'delete', bytes?: number, date: string = getCurrentDateKey()): Promise<void> => {
  try {
    const counterName = `storage${operation.charAt(0).toUpperCase() + operation.slice(1)}s` as keyof Omit<UsageStats, 'schoolId' | 'period' | 'lastUpdated' | 'createdAt'>;
    await incrementCounter(schoolId, counterName, 1, date);
    if (operation === 'upload' && bytes && bytes > 0) {
      await addBytes(schoolId, bytes, date);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track storage usage:', error);
  }
};

export const incrementAI = async (schoolId: string, tokensUsed: number = 0, date: string = getCurrentDateKey()): Promise<void> => {
  try {
    await incrementCounter(schoolId, 'aiQueries', 1, date);
    if (tokensUsed > 0) {
      await incrementCounter(schoolId, 'aiTokensUsed', tokensUsed, date);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track AI usage:', error);
  }
};

export const incrementUser = async (schoolId: string, operation: 'login' | 'creation' | 'update', date: string = getCurrentDateKey()): Promise<void> => {
  try {
    const counterName = operation === 'login' ? 'loginCount' : operation === 'creation' ? 'userCreations' : 'profileUpdates';
    await incrementCounter(schoolId, counterName as 'loginCount' | 'userCreations' | 'profileUpdates', 1, date);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track user usage:', error);
  }
};

export const incrementHeavyOperation = async (schoolId: string, operation: 'attendance' | 'fee' | 'import' | 'report', count: number = 1, date: string = getCurrentDateKey()): Promise<void> => {
  try {
    const counterName = operation === 'attendance' ? 'attendanceMarks' : operation === 'fee' ? 'feeTransactions' : operation === 'import' ? 'studentImports' : 'reportGenerations';
    await incrementCounter(schoolId, counterName as 'attendanceMarks' | 'feeTransactions' | 'studentImports' | 'reportGenerations', count, date);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to track heavy operation:', error);
  }
};

export const usageService = {
  getUsage: async (schoolId: string): Promise<{ messageCount: number; apiCalls: number; storageUsed: number; lastUpdated: Date | null } | null> => {
    try {
      const todayStats = await getUsageStats(schoolId, getCurrentDateKey());
      if (todayStats) {
        return {
          messageCount: todayStats.whatsappCount || 0,
          apiCalls: todayStats.aiQueries || 0,
          storageUsed: todayStats.storageBytesUploaded || 0,
          lastUpdated: todayStats.lastUpdated
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  subscribeToUsage: (schoolId: string, callback: (stats: { messageCount: number; apiCalls: number; storageUsed: number; lastUpdated: Date | null } | null) => void) => {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      callback({ messageCount: 248, apiCalls: 96, storageUsed: 512, lastUpdated: new Date() });
      return () => {};
    }
    let unsubscribed = false;
    const date = getCurrentDateKey();
    const usageRef = doc(db, USAGE_COLLECTION, schoolId, 'daily', date);
    
    try {
      const unsub = onSnapshot(usageRef, (snap) => {
        if (unsubscribed) return;
        if (snap.exists()) {
          const data = snap.data();
          callback({
            messageCount: data.whatsappCount || 0,
            apiCalls: data.aiQueries || 0,
            storageUsed: data.storageBytesUploaded || 0,
            lastUpdated: data.lastUpdated?.toDate() || null
          });
        } else {
          callback(null);
        }
      }, (err) => {
        // Silently ignore permission/auth errors during logout
        if (import.meta.env.DEV && err.code !== 'permission-denied') {
          console.warn('Usage subscription error:', err);
        }
        if (!unsubscribed) callback(null);
      });

      return () => { 
        unsubscribed = true;
        try {
          unsub(); 
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (err) {
      console.error('Failed to initialize usage snapshot:', err);
      return () => { unsubscribed = true; };
    }
  },

  getLimits: async (schoolId: string): Promise<SchoolUsageLimit> => {
    return { schoolId, ...DEFAULT_LIMITS['FREE']! };
  },

  setLimits: async (schoolId: string, tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => {
    const limitsRef = doc(db, 'schools', schoolId, LIMITS_COLLECTION, 'limits');
    const data = DEFAULT_LIMITS[tier];
    try {
      await setDoc(limitsRef, { ...data, schoolId, updatedAt: serverTimestamp() });
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to set limits:', err);
      return false;
    }
  },

  createAlert: async (schoolId: string, alertType: UsageAlert['alertType'], threshold: number, currentUsage: number, percentage: number) => {
    try {
      const alertsRef = collection(db, 'schools', schoolId, ALERTS_COLLECTION);
      const existing = await getDocs(query(alertsRef, where('alertType', '==', alertType), where('acknowledgedAt', '==', null)));
      if (!existing.empty) return;
      const alertRef = doc(alertsRef);
      await setDoc(alertRef, { schoolId, alertType, threshold, currentUsage, percentage, createdAt: serverTimestamp() });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Alert creation error:', err);
    }
  },

  getActiveAlerts: async (schoolId: string): Promise<UsageAlert[]> => {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      return [];
    }
    try {
      const alertsRef = collection(db, 'schools', schoolId, ALERTS_COLLECTION);
      const snapshot = await getDocs(query(alertsRef, where('acknowledgedAt', '==', null), orderBy('createdAt', 'desc'), limit(5)));
      return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as unknown as UsageAlert[];
    } catch {
      return [];
    }
  },

  acknowledgeAlert: async (schoolId: string, alertId: string) => {
    try {
      await updateDoc(doc(db, 'schools', schoolId, ALERTS_COLLECTION, alertId), { acknowledgedAt: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  },

  getMessageHistory: async (schoolId: string): Promise<NotificationLog[]> => {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      return [];
    }
    try {
      const logsRef = collection(db, 'schools', schoolId, 'notificationLogs');
      const snapshot = await getDocs(query(logsRef, orderBy('sentAt', 'desc'), limit(100)));
      return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as NotificationLog[];
    } catch {
      return [];
    }
  },

  getTierDisplay: (tier: SchoolUsageLimit['tier']): string => {
    const displays: Record<string, string> = { FREE: 'Free Tier', BASIC: 'Basic Plan', PREMIUM: 'Premium Plan', ENTERPRISE: 'Enterprise' };
    return displays[tier] || 'Unknown';
  },

  getUsageColor: (percentage: number): string => {
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-amber-500';
    if (percentage >= 50) return 'text-emerald-500';
    return 'text-indigo-500';
  },

  getDaysUntilReset: (): number => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.getDate() - now.getDate();
  },

  trackMessage: async (schoolId: string) => {
    await incrementWhatsApp(schoolId, true);
  }
};

/**
 * Plan limits — single source of truth. School plans override these in
 * `schools/{schoolId}/config/billing` (plan name + customLimits).
 */
const DEFAULT_PLAN_LIMITS: Record<string, {
  whatsappPerDay: number;
  storageGB: number;
  aiQueriesPerDay: number;
  firestoreReadsPerDay: number;
  firestoreWritesPerDay: number;
}> = {
  TRIAL: { whatsappPerDay: 50, storageGB: 1, aiQueriesPerDay: 25, firestoreReadsPerDay: 5000, firestoreWritesPerDay: 500 },
  BASIC: { whatsappPerDay: 250, storageGB: 5, aiQueriesPerDay: 100, firestoreReadsPerDay: 25000, firestoreWritesPerDay: 2500 },
  PRO: { whatsappPerDay: 2000, storageGB: 50, aiQueriesPerDay: 1000, firestoreReadsPerDay: 200000, firestoreWritesPerDay: 20000 },
  ENTERPRISE: { whatsappPerDay: 20000, storageGB: 500, aiQueriesPerDay: 10000, firestoreReadsPerDay: 2000000, firestoreWritesPerDay: 200000 },
};

async function getPlanLimits(schoolId: string): Promise<typeof DEFAULT_PLAN_LIMITS[keyof typeof DEFAULT_PLAN_LIMITS]> {
  try {
    const cfg = await getDoc(doc(db, 'schools', schoolId, 'config', 'billing'));
    if (cfg.exists()) {
      const data = cfg.data() as { plan?: string; customLimits?: any };
      if (data.customLimits) return data.customLimits;
      if (data.plan && DEFAULT_PLAN_LIMITS[data.plan]) return DEFAULT_PLAN_LIMITS[data.plan]!;
    }
  } catch (err) {
    console.warn('[usageService] getPlanLimits failed, falling back to TRIAL:', err);
  }
  return DEFAULT_PLAN_LIMITS.TRIAL!;
}

/**
 * Check if school has exceeded usage limits. Reads today's counters from
 * `schools/{schoolId}/usage/daily/{date}` and compares against plan limits.
 */
export const checkUsageLimits = async (schoolId: string): Promise<{
  exceeded: boolean;
  limits?: any;
  exceededFields: string[];
  blockOperations: boolean;
}> => {
  try {
    const [limits, today] = await Promise.all([
      getPlanLimits(schoolId),
      getUsageStats(schoolId, getCurrentDateKey())
    ]);
    const exceededFields: string[] = [];
    const whatsapp = today?.whatsappCount || 0;
    const ai = today?.aiQueries || 0;
    const reads = today?.firestoreReads || 0;
    const writes = today?.firestoreWrites || 0;
    if (whatsapp >= limits.whatsappPerDay) exceededFields.push('WhatsApp Messages');
    if (ai >= limits.aiQueriesPerDay) exceededFields.push('AI Queries');
    if (reads >= limits.firestoreReadsPerDay) exceededFields.push('Firestore Reads');
    if (writes >= limits.firestoreWritesPerDay) exceededFields.push('Firestore Writes');
    return {
      exceeded: exceededFields.length > 0,
      limits,
      exceededFields,
      blockOperations: exceededFields.length > 0
    };
  } catch (error) {
    console.warn('Failed to check usage limits:', error);
    return { exceeded: false, exceededFields: [], blockOperations: false };
  }
};

/**
 * Check if operation should be blocked due to usage limits
 */
export const shouldBlockOperation = async (
  schoolId: string,
  operationType: 'whatsapp' | 'storage' | 'ai'
): Promise<{ blocked: boolean; reason?: string }> => {
  try {
    const limitCheck = await checkUsageLimits(schoolId);

    if (!limitCheck.blockOperations) {
      return { blocked: false };
    }

    // Check specific operation type
    const blockedReasons: Record<string, boolean> = {
      whatsapp: limitCheck.exceededFields.includes('WhatsApp Messages'),
      storage: limitCheck.exceededFields.includes('Storage'),
      ai: limitCheck.exceededFields.includes('AI Queries')
    };

    if (blockedReasons[operationType]) {
      return {
        blocked: true,
        reason: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} limit exceeded. Please upgrade your plan.`
      };
    }

    return { blocked: false };
  } catch (error) {
    console.warn('Failed to check operation blocking:', error);
    return { blocked: false }; // Default to allow on error
  }
};

/**
 * Monitor usage and create alerts automatically.
 * Uses the school's plan limits instead of a hardcoded 1000/day.
 */
export const monitorUsageAndAlert = async (schoolId: string): Promise<void> => {
  try {
    const [today, limits] = await Promise.all([
      getUsageStats(schoolId, getCurrentDateKey()),
      getPlanLimits(schoolId)
    ]);
    if (!today) return;

    const whatsappPercentage = (today.whatsappCount / limits.whatsappPerDay) * 100;
    if (whatsappPercentage >= 80 && whatsappPercentage < 100) {
      console.warn(`Usage Alert: ${schoolId} - WhatsApp Messages at ${Math.round(whatsappPercentage)}%`);
    }
    if (whatsappPercentage >= 100) {
      console.warn(`Usage Alert: ${schoolId} - WhatsApp Messages limit reached!`);
    }
  } catch (error) {
    console.warn('Failed to monitor usage and create alerts:', error);
  }
};

export default {
  getUsageStats,
  incrementCounter,
  addBytes,
  incrementWhatsApp,
  incrementFirestore,
  incrementStorage,
  incrementAI,
  incrementUser,
  usageService
};