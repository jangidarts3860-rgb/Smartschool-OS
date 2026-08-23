# SmartSchoolApp Deployment Guide

## Required Environment Variables

### Vercel (api/ + frontend)
- `GHOST_TOKEN_SECRET` — 32+ random bytes, base64 or hex. Generate with: `openssl rand -hex 32`
- `HEALTH_CHECK_TOKEN` — used by api/healthCheck

### Firebase Functions
- `GHOST_TOKEN_SECRET` — same as Vercel
- `HEALTH_CHECK_TOKEN` — same as Vercel

## Deployment Steps

1. `npm install` (root)
2. `cd functions && npm install && npm run build`
3. `cd ../api && npm install`
4. `firebase deploy --only firestore:rules` (P0 audit updated)
5. `firebase deploy --only firestore:indexes` (P1 audit added usageAlerts)
6. `firebase deploy --only functions` (P0 audit updated auth, payment, gemini, invites)
7. `vercel --prod` (frontend + api/)

## Pre-deploy Checklist

- [ ] `GHOST_TOKEN_SECRET` set in Vercel env (32+ bytes)
- [ ] `GHOST_TOKEN_SECRET` set in Firebase Functions config
- [ ] `HEALTH_CHECK_TOKEN` set in Firebase Functions config
- [ ] `VITE_DEV_OTP` set in Vercel env (for Settings.tsx WhatsApp linking in dev)
- [ ] Firestore rules reviewed
- [ ] All tests passing locally

## Known Follow-ups (post-deploy)

- Migrate `notificationScheduler.initializeDailyJob` to a Cloud Function
- Migrate `cerebro-ask` rate limit to Vercel KV / Upstash
- Add dedicated `sendWhatsAppFeeReminder` Cloud Function
- Verify parent↔child link also checks `linkedStudents` field
