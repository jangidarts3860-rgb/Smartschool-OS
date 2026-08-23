import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import { TenantProvider } from './hooks/SchoolContext';
import './global.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // 1E-4: block all text, email, phone, password, and PIN input values
      // from being captured in replays. Without this, student PINs and
      // parent phone numbers shown on screen get uploaded to Sentry.
      maskAllText: true,
      blockAllMedia: true,
      mask: [
        'input[type="password"]',
        'input[type="tel"]',
        'input[type="email"]',
        'input[type="number"][autocomplete*="cc"]',
        '[data-sentry-mask]',
        '[data-sentry-block]'
      ]
    }),
  ],
  // Don't send PII to Sentry. If a parent name appears in an error message,
  // it would otherwise be visible in the Sentry UI forever.
  sendDefaultPii: false,
  beforeSendTransaction(event) {
    // Strip query params (sometimes contain schoolId or token fragments)
    if (event.request?.url) {
      try {
        const u = new URL(event.request.url);
        u.search = '';
        event.request.url = u.toString();
      } catch { /* ignore invalid URLs */ }
    }
    return event;
  },
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <Sentry.ErrorBoundary fallback={(errorData) => (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
            <p>{(errorData.error as Error)?.message || 'Unknown error'}</p>
            <button onClick={errorData.resetError}>Try again</button>
          </div>
        )}>
          <BrowserRouter>
            <TenantProvider>
              <App />
            </TenantProvider>
          </BrowserRouter>
        </Sentry.ErrorBoundary>
      </React.StrictMode>
    );
    if (import.meta.env.DEV) console.log("SmartSchool App Mounted Successfully");
  } catch (error) {
    console.error("Error mounting React app:", error);
    rootElement.innerHTML = '<div style="color:red; padding:20px;">Failed to start application. See console for details.</div>';
  }
} else {
  console.error("Critical: Could not find root element to mount the app.");
}