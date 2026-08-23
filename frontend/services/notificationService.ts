import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { WhatsAppConfig, WhatsAppPhoneMapping, NotificationLog } from '@/types';
import { toast } from 'react-hot-toast';
import { incrementWhatsApp, shouldBlockOperation } from './usageService';

const SETTINGS_COLLECTION = 'settings';
const NOTIFICATIONS_COLLECTION = 'notificationLogs';
const PHONE_MAPPING_COLLECTION = 'whatsappMappings';

// WhatsApp URL length limit (after encoding)
const MAX_MESSAGE_LENGTH = 4096;
const MAX_PHONE_LENGTH = 15;

/**
 * Sanitize phone number for WhatsApp URL
 */
const sanitizePhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return '';
  }
  const sanitized = digitsOnly.slice(0, MAX_PHONE_LENGTH);
  return sanitized.startsWith('91') ? sanitized : sanitized;
};

/**
 * Sanitize message for WhatsApp URL
 */
const sanitizeMessage = (message: string): string => {
  try {
    const decoded = decodeURIComponent(message);
    const truncated = decoded.slice(0, MAX_MESSAGE_LENGTH);
    return encodeURIComponent(truncated);
  } catch {
    return encodeURIComponent(message.slice(0, MAX_MESSAGE_LENGTH));
  }
};

/**
 * Fetch school's WhatsApp phone mapping from database
 * Returns the Meta-provided Phone Number ID for this school
 */
export const getWhatsAppPhoneMapping = async (
  schoolId: string
): Promise<WhatsAppPhoneMapping | null> => {
  try {
    const mappingRef = doc(db, PHONE_MAPPING_COLLECTION, schoolId);
    const snap = await getDoc(mappingRef);
    return snap.exists() ? snap.data() as WhatsAppPhoneMapping : null;
  } catch (error) {
    console.error("Phone mapping fetch error:", error);
    return null;
  }
};

/**
 * Save/update school's WhatsApp phone mapping
 * Stores: SchoolID <--> Meta_Phone_Number_ID
 */
export const saveWhatsAppPhoneMapping = async (
  mapping: WhatsAppPhoneMapping
): Promise<boolean> => {
  try {
    const mappingRef = doc(db, PHONE_MAPPING_COLLECTION, mapping.schoolId);
    await setDoc(mappingRef, {
      ...mapping,
      createdAt: mapping.createdAt || serverTimestamp(),
      verifiedAt: mapping.verifiedAt || null
    }, { merge: true });
    toast.success("WhatsApp phone mapping saved successfully");
    return true;
  } catch (error) {
    console.error("Phone mapping save error:", error);
    toast.error("Failed to save phone mapping");
    return false;
  }
};

/**
 * Verify and validate Meta Phone Number ID
 */
export const verifyWhatsAppPhoneMapping = async (
  schoolId: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const mapping = await getWhatsAppPhoneMapping(schoolId);

    if (!mapping) {
      return { valid: false, error: 'No WhatsApp mapping found for this school' };
    }

    if (!mapping.phoneNumberId) {
      return { valid: false, error: 'Meta Phone Number ID not configured' };
    }

    if (!mapping.isActive) {
      return { valid: false, error: 'WhatsApp is not active for this school' };
    }

    // Update verifiedAt timestamp
    const mappingRef = doc(db, PHONE_MAPPING_COLLECTION, schoolId);
    await setDoc(mappingRef, { verifiedAt: serverTimestamp() }, { merge: true });

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Verification failed' };
  }
};

export const notificationService = {
  // --- WHATSAPP INVITE ONLY (FREE MODE) ---
  generateWhatsAppInvite: (name: string, appLink: string) => {
    const sanitizedName = name.replace(/[<>\"'&]/g, '').trim();
    const sanitizedLink = appLink.startsWith('http') ? appLink : 'https://app.smartschool.edu';
    const message = `Namaste ${sanitizedName}, hamare school ki official app join karein aur saare updates dashboard par dekhein: ${sanitizedLink}`;
    return sanitizeMessage(message);
  },

  openWhatsAppWeb: (phone: string, message: string): boolean => {
    if (import.meta.env.VITE_ENABLE_WHATSAPP !== true &&
        import.meta.env.VITE_ENABLE_WHATSAPP !== 'true') {
      toast.error('WhatsApp integration is disabled. Enable VITE_ENABLE_WHATSAPP to use this feature.');
      return false;
    }
    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedMessage = sanitizeMessage(message);

    if (!sanitizedPhone) {
      toast.error('Invalid phone number');
      return false;
    }

    const url = `https://web.whatsapp.com/send?phone=${sanitizedPhone}&text=${sanitizedMessage}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    return win !== null && win !== undefined;
  },

  // --- INTERNAL APP NOTIFICATIONS ---
  sendInternalNotification: async (
    schoolId: string,
    userId: string,
    data: { title: string, message: string, type: 'FEES' | 'ATTENDANCE' | 'NOTICE' | 'SYSTEM' },
    isSilent: boolean = false
  ) => {
    try {
      const userNotifRef = collection(db, 'schools', schoolId, 'users', userId, 'notifications');
      await addDoc(userNotifRef, {
        ...data,
        isRead: false,
        isSilent,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Internal Notif Error:", error);
    }
  },

  // --- CONFIG MANAGEMENT (BYOA) ---
  getWhatsAppConfig: async (schoolId: string): Promise<WhatsAppConfig | null> => {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') return null;
    try {
      const configRef = doc(db, 'schools', schoolId, SETTINGS_COLLECTION, 'whatsapp');
      const snap = await getDoc(configRef);
      return snap.exists() ? snap.data() as WhatsAppConfig : null;
    } catch (error) {
      console.error("Config fetch error:", error);
      return null;
    }
  },

  saveWhatsAppConfig: async (schoolId: string, config: WhatsAppConfig) => {
    try {
      const configRef = doc(db, 'schools', schoolId, SETTINGS_COLLECTION, 'whatsapp');
      await setDoc(configRef, config);
      toast.success("WhatsApp Configuration saved securely");
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  },

  // --- TEMPLATE PARSER ---
  parseTemplate: (template: string, data: Record<string, string>) => {
    let parsed = template;
    for (const [key, value] of Object.entries(data)) {
      parsed = parsed.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return parsed;
  },

  // --- MULTI-TENANT WHATSAPP MESSAGE SENDING ---
  /**
   * Send WhatsApp message using school's specific Meta Phone Number ID
   * Fetches: SchoolID --> Meta_Phone_Number_ID mapping
   */
  sendWhatsAppMessage: async (
    schoolId: string,
    senderName: string,
    recipient: { id: string, name: string, phone: string },
    type: NotificationLog['type'],
    message: string
  ): Promise<{ status: NotificationLog['status']; phoneNumberId?: string; error?: string }> => {
    try {
      // STEP 1: Fetch school-specific WhatsApp mapping (SchoolID --> Meta Phone Number ID)
      const phoneMapping = await getWhatsAppPhoneMapping(schoolId);
      const config = await notificationService.getWhatsAppConfig(schoolId);

      // Check if MOCK mode or no mapping exists
      // ALSO honor VITE_ENABLE_WHATSAPP — when the global feature flag is off,
      // we MUST NOT open wa.me links, call the Meta API, or invoke the
      // sendWhatsAppInvite Cloud Function. Treat as MOCK so logs reflect the
      // intended "SENT_MOCK" path without any side effects.
      const isWhatsAppFlagOn = import.meta.env.VITE_ENABLE_WHATSAPP === true ||
        import.meta.env.VITE_ENABLE_WHATSAPP === 'true';
      const isMock = import.meta.env.VITE_USE_MOCK === 'true' ||
        !isWhatsAppFlagOn ||
        !phoneMapping?.phoneNumberId ||
        phoneMapping.provider === 'MOCK' ||
        !phoneMapping?.isActive;

      let status: NotificationLog['status'] = 'FAILED';
      let errorDetail = '';
      const phoneNumberId = phoneMapping?.phoneNumberId || config?.whatsappPhoneNumberId;

      // STEP 2: Check usage limits before sending
      if (!isMock) {
        const limitCheck = await shouldBlockOperation(schoolId, 'whatsapp');
        if (limitCheck.blocked) {
          return {
            status: 'FAILED',
            phoneNumberId,
            error: limitCheck.reason
          };
        }
      }

      if (isMock) {
        // MOCK MODE: Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        status = 'MOCK_SENT';
      } else {
        // 1E-7: previously this branch was a stub that just set status='PENDING'
        // and never actually delivered. We now invoke the `sendWhatsAppInvite`
        // Cloud Function (functions/src/invites.ts) which does the real Meta
        // Graph API call. The template is a generic CREDENTIAL_RESET-style
        // message since the dedicated fee-reminder type doesn't exist yet.
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const fns = getFunctions();
          const send = httpsCallable(fns, 'sendWhatsAppInvite');
          const result = await send({
            schoolId,
            phone: recipient.phone,
            name: recipient.name,
            uniqueId: recipient.id,
            credential: message.slice(0, 100),
            type: 'NOTICE',
            testMode: false
          });
          const data = result.data as { success?: boolean; status?: string };
          status = data?.success ? 'SENT' : 'FAILED';
          if (!data?.success) {
            errorDetail = data?.status || 'Cloud Function returned success=false';
          }
        } catch (cfErr: unknown) {
          const msg = cfErr instanceof Error ? cfErr.message : 'Cloud Function call failed';
          console.error('[notificationService] sendWhatsAppInvite failed:', msg);
          status = 'FAILED';
          errorDetail = msg;
        }
      }

      // STEP 2: Log the notification with phone number ID
      const logRef = collection(db, 'schools', schoolId, NOTIFICATIONS_COLLECTION);
      await addDoc(logRef, {
        schoolId,
        type,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        message,
        status,
        provider: isMock ? 'MOCK_MODE' : phoneMapping?.provider || 'UNKNOWN',
        phoneNumberId, // Meta Phone Number ID used
        sentBy: senderName,
        sentAt: serverTimestamp(),
        errorDetail
      });

      // STEP 3: Track usage (background, non-blocking)
      incrementWhatsApp(schoolId, status === 'MOCK_SENT' || status === 'SENT').catch(err => {
        console.warn('WhatsApp usage tracking failed:', err);
      });

      return { status, phoneNumberId };

    } catch (error) {
      console.error("Critical Send Error:", error);
      return { status: 'FAILED', error: 'Unknown error' };
    }
  },

  /**
   * Broadcast message to multiple recipients
   * Uses school's Meta Phone Number ID for all messages
   */
  broadcastWhatsAppMessage: async (
    schoolId: string,
    senderName: string,
    recipients: Array<{ id: string, name: string, phone: string }>,
    type: NotificationLog['type'],
    message: string,
    onProgress?: (sent: number, total: number) => void
  ): Promise<{ sent: number; failed: number }> => {
    let sent = 0;
    let failed = 0;

    // Fetch phone mapping once for all recipients
    const phoneMapping = await getWhatsAppPhoneMapping(schoolId);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]!;
      const result = await notificationService.sendWhatsAppMessage(
        schoolId,
        senderName,
        recipient,
        type,
        message
      );

      if (result.status === 'SENT' || result.status === 'MOCK_SENT') {
        sent++;
      } else {
        failed++;
      }

      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }

      // Rate limiting: wait 100ms between messages
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { sent, failed };
  },

  // --- INTERNAL NOTIFICATIONS ---
  getInternalNotifications: async (schoolId: string, userId: string) => {
    const notifRef = collection(db, 'schools', schoolId, 'users', userId, 'notifications');
    const snapshot = await getDocs(notifRef);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  // --- REAL-TIME LOGS ---
  subscribeToLogs: (schoolId: string, callback: (logs: NotificationLog[]) => void) => {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      const now = Date.now();
      callback([
        { id: 'log-1', schoolId, type: 'CUSTOM', recipientId: 'STU001', recipientName: 'Aarav Patel', recipientPhone: '+91 98765 43210', message: 'App invite link shared via WhatsApp', status: 'SENT', provider: 'MOCK', sentAt: new Date(now - 4 * 3600000), sentBy: 'Vikram Malhotra' },
        { id: 'log-2', schoolId, type: 'CUSTOM', recipientId: 'STU002', recipientName: 'Ananya Sharma', recipientPhone: '+91 91234 56780', message: 'App invite link shared via WhatsApp', status: 'SENT', provider: 'MOCK', sentAt: new Date(now - 28 * 3600000), sentBy: 'Vikram Malhotra' },
        { id: 'log-3', schoolId, type: 'CUSTOM', recipientId: 'STU003', recipientName: 'Reyansh Singh', recipientPhone: '+91 99887 76655', message: 'Phone number not registered on WhatsApp', status: 'FAILED', provider: 'MOCK', sentAt: new Date(now - 50 * 3600000), sentBy: 'Vikram Malhotra', errorDetail: 'Recipient not on WhatsApp' }
      ]);
      return () => {};
    }
    const logsRef = collection(db, 'schools', schoolId, NOTIFICATIONS_COLLECTION);
    const q = query(logsRef, orderBy('sentAt', 'desc'), limit(100));

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationLog[];
      callback(logs);
    });
  },

  // --- BULK SCHOOL MAPPING UTILITIES ---
  /**
   * Get all schools with WhatsApp mappings configured
   */
  getAllSchoolMappings: async (): Promise<WhatsAppPhoneMapping[]> => {
    try {
      const mappingRef = collection(db, PHONE_MAPPING_COLLECTION);
      const snapshot = await getDocs(mappingRef);
      return snapshot.docs.map((d: any) => d.data() as WhatsAppPhoneMapping);
    } catch (error) {
      console.error("Error fetching all mappings:", error);
      return [];
    }
  },

  /**
   * Check which schools have WhatsApp properly configured
   */
  getConfiguredSchools: async (): Promise<string[]> => {
    try {
      const mappings = await notificationService.getAllSchoolMappings();
      return mappings
        .filter(m => m.isActive && m.phoneNumberId)
        .map(m => m.schoolId);
    } catch (error) {
      console.error("Error fetching configured schools:", error);
      return [];
    }
  }
};

export default notificationService;
