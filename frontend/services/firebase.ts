import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Frontend-only demo mode: the app is fully functional without any backend.
// When VITE_USE_MOCK / VITE_DEMO_MODE is on, placeholder config keeps the
// Firebase SDK initialized so every screen falls back to mock data instead
// of crashing on missing environment variables.
const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (isDemoMode ? 'demo-api-key' : undefined),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (isDemoMode ? 'smartschool-demo.firebaseapp.com' : undefined),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (isDemoMode ? 'smartschool-demo' : undefined),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (isDemoMode ? 'smartschool-demo.appspot.com' : undefined),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (isDemoMode ? '000000000000' : undefined),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (isDemoMode ? 'demo-app-id' : undefined)
};

// Hard-fail in production if config is missing (only when NOT running in demo mode).
// In dev, fall back to local emulators via `firebase emulators:start`.
const isProduction = import.meta.env.MODE === 'production';
if (isProduction && !isDemoMode && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  throw new Error("Missing required Firebase configuration. Please check your .env file.");
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Initialize Firebase services
export const auth = getAuth(app);

// CONDITIONAL OFFLINE PERSISTENCE:
// Use memory-only cache on localhost/emulators to prevent severe multi-tab/development connection assertion crashes,
// while keeping full persistent local cache in production environments.
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const db = initializeFirestore(app, {
  localCache: typeof window !== 'undefined'
    ? (isLocalhost
        ? memoryLocalCache()
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      )
    : undefined,
  experimentalForceLongPolling: isLocalhost,
  experimentalAutoDetectLongPolling: false
});

export const storage = getStorage(app);

const functionsApp = initializeApp(firebaseConfig, 'functions');
export const functions = getFunctions(app);

// Firebase Cloud Messaging (lazy init — only on browsers that support it)
let _messaging: ReturnType<typeof import('firebase/messaging').getMessaging> | null = null;
export const getMessagingInstance = async () => {
  if (_messaging) return _messaging;
  if (typeof window === 'undefined') return null;
  // Service workers + Notification API required
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  // Required: valid VAPID key + messaging sender ID
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;
  const { getMessaging, isSupported } = await import('firebase/messaging');
  const supported = await isSupported();
  if (!supported) return null;
  _messaging = getMessaging(app);
  return _messaging;
};

export default app;

