import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, getMessagingInstance } from './firebase';

const FCM_SW_PATH = '/firebase-messaging-sw.js';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export interface FcmMessageResult {
  ok: boolean;
  reason?: string;
  unsubscribe: () => void;
}

/**
 * Register the FCM service worker at the root scope.
 * Returns the registration if successful.
 */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Check for existing registration with this scope
    const existing = await navigator.serviceWorker.getRegistration(FCM_SW_PATH);
    if (existing) return existing;
    // Register the FCM service worker at root
    return await navigator.serviceWorker.register(FCM_SW_PATH, {
      scope: '/',
      updateViaCache: 'none',
    });
  } catch (err) {
    console.warn('[FCM] SW registration failed:', err);
    return null;
  }
}

/**
 * Request notification permission from the user.
 * Returns the permission state: 'granted' | 'denied' | 'default' | 'unsupported'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

/**
 * Get the FCM token for this device.
 * Requires: Notification permission granted + VAPID key configured + valid SW.
 * Returns null on any failure (logs warning).
 */
export async function getFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('[FCM] Messaging not available (missing VAPID key, unsupported browser, or no service worker)');
    return null;
  }
  if (!VAPID_KEY) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY not set in .env');
    return null;
  }
  const sw = await ensureServiceWorker();
  if (!sw) {
    console.warn('[FCM] Service worker registration failed');
    return null;
  }
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: sw,
    });
    return token || null;
  } catch (err) {
    console.warn('[fcm] getToken failed', err);
    return null;
  }
}

/**
 * Save this device's FCM token to the user's profile.
 * Stored at schools/{schoolId}/users/{userId}.fcmTokens (array).
 */
export async function saveFcmToken(schoolId: string, userId: string, token: string): Promise<boolean> {
  if (!schoolId || !userId || !token) return false;
  try {
    const userRef = doc(db, 'schools', schoolId, 'users', userId);
    await setDoc(userRef, { fcmTokens: arrayUnion(token), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FCM] saveFcmToken failed:', err);
    return false;
  }
}

/**
 * Remove this device's FCM token from the user's profile (on logout or unsubscribe).
 */
export async function removeFcmToken(schoolId: string, userId: string, token: string): Promise<boolean> {
  if (!schoolId || !userId || !token) return false;
  try {
    const userRef = doc(db, 'schools', schoolId, 'users', userId);
    await setDoc(userRef, { fcmTokens: arrayRemove(token), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[FCM] removeFcmToken failed:', err);
    return false;
  }
}

/**
 * Subscribe to foreground FCM messages.
 * Calls the callback for each message received while the app is in the foreground.
 * UI concerns (toasts, banners) are the caller's responsibility — this service
 * returns a result object describing the outcome so the caller can decide.
 */
export async function onForegroundMessage(cb: (payload: MessagePayload) => void): Promise<FcmMessageResult> {
  const noop = (): void => {};
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return { ok: false, reason: 'permission denied', unsubscribe: noop };
  }
  const unsub = onMessage(messaging, (payload) => {
    cb(payload);
  });
  return { ok: true, unsubscribe: unsub };
}

/**
 * High-level helper: request permission, get token, save to user profile.
 * Use after user is authenticated.
 */
export async function initializeFcmForUser(schoolId: string, userId: string): Promise<string | null> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.info(`[FCM] Permission ${permission} — skipping token registration`);
    return null;
  }
  const token = await getFcmToken();
  if (!token) return null;
  await saveFcmToken(schoolId, userId, token);
  return token;
}
