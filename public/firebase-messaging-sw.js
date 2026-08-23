// Firebase Cloud Messaging Service Worker
// Receives background push messages when the app tab is not in focus.
// Foreground messages are handled by the app's onMessage() listener.
//
// To enable: set the VITE_FIREBASE_* env vars in your .env and the build
// will substitute them here. Without these, the SW still loads but
// background messages will be silently dropped.
//
// NOTE: This file is a static asset — Vite copies it as-is from public/ to dist/.
// It does NOT have access to import.meta.env at runtime. The build pipeline
// does string substitution; in dev, leave placeholders and they will be
// replaced by the same public Firebase config the main app uses.

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// IMPORTANT: The Firebase config below is PUBLIC client config (visible in
// your built JS bundle anyway). It is used here so the SW can identify
// the project for FCM token issuance. The same values must match
// services/firebase.ts in the main app.
firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = (payload.notification && payload.notification.title) || 'SmartSchool';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    tag: (payload.data && payload.data.tag) || 'smartschool-default',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
