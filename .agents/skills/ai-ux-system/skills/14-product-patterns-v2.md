---
name: product-patterns-v2
description: Product Pattern Library — Real-world patterns by industry. FinTech, Food Delivery, E-commerce, SaaS, Social, Health, EdTech. Onboarding, checkout, search, settings, notifications, empty states, trust signals. Trigger: "financial app pattern", "checkout flow", "onboarding pattern", "search pattern", "notification pattern", "trust signals", "empty state pattern", "financial UX", "food delivery UX", "ecommerce pattern".
version: 2.0
---
# Product Patterns v2 — Industry Battle-Tested Patterns

> **Source:** 100+ product analyses, ux-thinking laws, Indian market reality.
> **Use:** Don't invent. Apply. Adapt only with evidence.

---

## FinTech Patterns (India Context)

### Onboarding (KYC + Trust)
```
FLOW: Splash → Language → Value Prop → Phone → OTP → KYC (PAN/Aadhaar) → MPIN → Success
PATTERNS:
- Progressive disclosure: One question per screen
- Auto-read OTP (SMS Retriever API) + manual fallback
- DigiLocker / CKYC integration for instant KYC
- MPIN creation: 6-digit, confirm, biometric opt-in
- Trust signals throughout: "RBI Licensed", "₹1L insurance", "10M+ users"
```

### Money Transfer (UPI-First)
```
FLOW: Amount → Recipient (UPI ID/Contact/QR) → Review → UPI PIN → Success
PATTERNS:
- UPI apps detected → show logos (GPay, PhonePe, Paytm, BHIM)
- Amount visible BEFORE UPI app switch
- Recipient verification: Name + last 4 of UPI ID
- "Request Money" as separate flow (not mixed)
- Failure: Specific error ("Insufficient balance" not "Failed") + retry
```

### Dashboard (Money Visibility)
```
PATTERNS:
- Balance: Large, top, real-time, color-coded (green + / red -)
- Quick actions: Send / Request / Scan / Bill Pay (4-icon grid)
- Recent transactions: List, infinite scroll, pull-to-refresh
- Spend insights: Category rings, monthly trend, budget alerts
- Hidden balance toggle (privacy in public)
```

### Trust Signals (Non-Negotiable)
```
PLACEMENT:
- Onboarding: "RBI Licensed", "₹1L insurance", "256-bit encryption"
- Payment screen: Lock icon, "Secured by NPCI", bank logos
- Settings: "Security", "Privacy", "Delete Account" (easy to find)
- Support: 24/7 chat, callback, WhatsApp, email — all visible
```

---

## Food Delivery Patterns

### Home / Discovery
```
PATTERNS:
- Hero: Search bar (prominent) + "Quick delivery" chips
- Categories: Horizontal scroll, 8-10 icons, veg/non-veg toggle
- Restaurant cards: Image (16:9), name, cuisine tags, rating, delivery time, offer badge
- Filters: Vegetarian, Rating 4.0+, Delivery time <30min, Offers
- Sort: Relevance / Delivery time / Rating / Cost / Promoted
```

### Restaurant Page
```
PATTERNS:
- Hero: Image carousel, name, rating, delivery time, min order
- Menu: Category tabs (sticky), items with image, name, desc, price, veg badge
- Cart: Persistent bottom bar (subtotal, item count, "View Cart")
- Customization: Modal — size, spice, add-ons, special instructions
```

### Checkout (Speed = Conversion)
```
FLOW: Cart → Address → Payment → Confirm → Track
PATTERNS:
- Address: Saved + "Add new" (map pin + manual), default marked
- Payment: UPI apps first → Wallets → Cards → COD (last)
- Offer auto-apply (coupon code field hidden until "Have a code?")
- Order summary: Itemized, delivery fee, packing, tax, total
- Confirm: Large "Place Order" (UPI deep link if UPI selected)
```

### Tracking (Anxiety Reduction)
```
PATTERNS:
- Live map: Driver avatar, real-time location, ETA countdown
- Status pills: Confirmed → Preparing → Picked → Nearby → Delivered
- Driver contact: Call / Chat (masked number)
- "Share live location" with family
- Delivered: Photo proof (doorstep) + "Rate experience"
```

---

## E-Commerce Patterns

### Product Listing (Discovery)
```
PATTERNS:
- Grid: 2-col mobile, 4-col desktop, 16:9 images
- Card: Image, name, price (strikethrough + current), rating, "X% OFF" badge
- Quick view: Tap → modal (image carousel, variants, add to cart)
- Filters: Sidebar (mobile: bottom sheet) — Category, Brand, Price, Rating, Discount
- Sort: Relevance / Price / Newest / Rating / Popular
- Infinite scroll + "Back to top" FAB
```

### Product Detail (Conversion)
```
PATTERNS:
- Image carousel: Thumbnails, pinch-zoom, video support
- Price: Large, strikethrough original, savings highlighted
- Variants: Size/Color as pills (not dropdown), stock indicator
- Ratings: Summary + breakdown + "Verified Purchase" filter
- Reviews: Photos, helpful votes, sort by recent/relevant
- Add to Cart: Sticky bottom bar (mobile) / Right rail (desktop)
- Trust: "Easy returns", "Authentic guarantee", "Ships in 24h"
```

### Checkout (Minimal Friction)
```
FLOW: Cart → Address → Payment → Review → Success
PATTERNS:
- Guest checkout default (account optional post-purchase)
- Address: Autofill (Google Places), save multiple, default
- Payment: Saved cards (tokenized), UPI, COD, EMI, PayLater
- Order summary: Sticky, editable quantities, promo code inline
- Success: Order ID, expected delivery, "Track" CTA, WhatsApp share
```

---

## SaaS / B2B Patterns

### Onboarding (Time-to-Value)
```
PATTERNS:
- Role-based: "I'm a [Designer / PM / Dev]" → tailored setup
- Interactive demo: "Try it now" with sample data
- Checklist: "3 steps to launch" — progress bar, celebrate completion
- Empty states: Templates ("Start with [Template]") not blank
- Tooltips: Contextual, dismissible, "Don't show again"
```

### Dashboard (Density OK)
```
PATTERNS:
- Left nav: Collapsible, icons + labels, active state clear
- Top bar: Search (Cmd+K), notifications, profile, help
- Metrics row: 3-4 KPIs (sparkline + trend), click → detail
- Tables: Sortable, filterable, column toggle, row actions
- Density toggle: Comfortable / Compact / Condensed
```

### Settings (Progressive Disclosure)
```
PATTERNS:
- Sections: Account / Team / Billing / Security / Integrations / Advanced
- Danger zone: "Delete account" at bottom, red, confirmation modal
- SSO/SCIM: Enterprise toggle, clear setup guides
- Webhooks: Test button, retry logic, delivery logs
```

---

## Social / Community Patterns

### Feed (Engagement)
```
PATTERNS:
- Algorithm: "Following" (chronological) + "For You" (algo) tabs
- Post types: Text, Image, Video, Link, Poll — unified card
- Actions: Like / Comment / Share / Save / Report (consistent order)
- Infinite scroll + "New posts" banner (not auto-refresh)
- Loading: Skeleton cards matching final layout
```

### Notifications (Relevance > Volume)
```
PATTERNS:
- Grouped: "5 likes on your post" not 5 separate
- Priority: High (mentions, DMs) → Medium (likes) → Low (suggestions)
- Channels: In-app + Push + Email (user controls each)
- Digest: Daily/Weekly summary opt-in
- Actions inline: "Reply", "View", "Dismiss" on notification
```

---

## Health / Fitness Patterns

### Onboarding (Motivation)
```
PATTERNS:
- Goal setting: "Lose 5kg" / "Run 5k" / "Build muscle" — visual
- Baseline: Current weight / steps / sleep → auto from HealthKit/Google Fit
- Plan: "3 workouts/week" → calendar integration
- Streak: Visual calendar, "Don't break the chain"
```

### Workout / Tracking
```
PATTERNS:
- Workout: Timer + sets/reps/weight + rest timer + video demo
- Auto-log: Apple Watch / Wear OS / manual fallback
- Progress: Charts (weight, volume, PRs), photos, body measurements
- Social: Share workout, challenge friends, leaderboards
```

---

## EdTech Patterns

### Learning Flow
```
PATTERNS:
- Course: Modules → Lessons (video + notes + quiz)
- Progress: Circle ring (module), bar (course), streak (daily)
- Spaced repetition: "Review today" queue (SRS algorithm)
- Notes: Timestamped, searchable, exportable
- Offline: Download modules, sync on connect
```

### Motivation
```
PATTERNS:
- XP / Levels / Badges (Duolingo-style)
- Streak freeze (paid/earned)
- Leaderboards: Friends / Global / Weekly
- Certificates: Shareable (LinkedIn), verifiable
```

---

## Universal Patterns (Cross-Industry)

### Empty States
```
TEMPLATE:
[Illustration] — Positive, not sad
[Headline] — "No orders yet"
[Body] — "Find something you'll love"
[Primary CTA] — "Explore Restaurants"
[Secondary] — "Browse categories"
```

### Error States
```
TEMPLATE:
[Icon] — Warning, not skull
[Headline] — "Couldn't load restaurants"
[Body] — "Check your connection and try again"
[Primary CTA] — "Retry"
[Secondary] — "Contact support"
```

### Loading States
```
RULES:
- Skeleton = exact content shape (not generic boxes)
- Shimmer: left→right, 1.5s loop, subtle
- Critical content first (hero, primary CTA)
- Never blank screen >400ms
```

### Permissions
```
TEMPLATE:
[Icon] — Friendly
[Headline] — "Allow location?"
[Body] — "We use location to show nearby restaurants"
[Primary] — "Allow" (triggers native prompt)
[Secondary] — "Not now" (respects, asks later contextually)
```

### Onboarding Carousel
```
RULES:
- Max 3 screens (Value → How → Action)
- Skip visible always
- Dots indicator (current highlighted)
- Last screen = Primary CTA to start
```

---

## Anti-Patterns by Industry

| Industry | Anti-Pattern | Why It Fails |
|----------|--------------|--------------|
| FinTech | Card-only payment | India = UPI-first |
| Food | No veg filter | 40%+ Indian users vegetarian |
| E-com | Guest checkout hidden | 30% drop-off |
| SaaS | No empty state templates | "Blank slate" paralysis |
| Social | Notification spam | Uninstall #1 reason |
| Health | No offline mode | Workout = no signal |
| EdTech | Video-only (no notes) | Can't review efficiently |

---

## Pattern Application Checklist

```
BEFORE USING A PATTERN:
☐ Does it solve MY user's problem? (Not "industry standard")
☐ Does it pass ux-thinking law audit?
☐ Does it work on ₹8k Android / 2G?
☐ Is it accessible (WCAG AA)?
☐ Is it bilingual-ready (Hindi + English)?
☐ Does it have error/empty/loading states?
☐ Can I measure if it works?
```

---

## Growth Design & Activation Engine

### Premium Onboarding Funnels

#### Progressive Profile Completion Rule (Miller's Law)
```
DON'T ask for password, name, payment + role all on page 1.
Break signup into 3 stages:
  Stage 1 — Account Creation: Email & password (or 1-click Google auth) ONLY
  Stage 2 — Persona Selection: "Who are you?" Teacher/Student/Admin → personalize on-the-fly
  Stage 3 — Activation Setup: First meaningful action (create a class, add a student)
```

#### Onboarding Progress UI Specs
```
Use Goal Gradient Effect layout:
  ✅ Progress bar starts pre-filled at 25% ("Account created!")
  ✅ Descriptive titles: "Personalize", "Invite Crew", "Finish" (NOT "Step 1 of 5")
  ✅ Back/Skip always visible unless strict compliance required
```

### High-Conversion Pricing Artifacts

#### Visual Tiering Rules
```
The "Best Value" Pop:
  - Highlight exactly ONE primary tier (usually the middle plan)
  - Primary tier: Indigo Action color (80-15-5 rule). Others: ghost/slate borders
  - Von Restorff Effect: Squircle chip badge ("Most Popular", "Best Value") on top

Yearly / Monthly Toggle:
  - Toggle badge: "Save 20%" in pill (bg-emerald-50 text-emerald-700)
  - Slide animation: 200ms ease-out spring physics

Feature Checklists:
  - Standard features: slate checkmarks
  - Premium features: vibrant text or text gradient highlight
```

### Frictionless Checkout Layouts

#### Trust Signals Placement
```
Place trust badges DIRECTLY beneath the primary "Pay" CTA:
  - UPI / VISA / Mastercard / Razorpay logos
  - Lock icon + "SSL Secured & Encrypted"
  ❌ No promotional copy at checkout (causes cognitive division)
```

#### Order Summaries & Form Fields
```
Desktop layout: 60/40 split. Mobile: stacked.
  Left panel: Single-column clean input fields, auto-fill enabled (Tesler's Law)
  Right panel: Invoice card — Base Price + Tax + Promo Code block
Micro-copy: Clear pricing terms + localized currency formats (₹ + Indian format)
```

### Behavioral Psychology Cheatsheet
```
Growth flow review triggers:
  - Weber's Law: Is primary "Upgrade Now" CTA at least 14% larger/higher contrast than surroundings?
  - Zeigarnik Effect: Does the flow show how close user is to completion?
  - Fogg Model: Do simplifying prompts appear only when ability is highest?
  - India Hook: Does billing plan highlight UPI autopay prominently? (Top trust signal Tier 1-3)
  - No Dark Patterns: Hidden auto-renew terms require double-confirmation opt-in. Priority 2 safety rule.
```
## Behavioral Economics & Growth Psychology (The Growth Design Engine)

### The Hook Model Implementation
```
Every recurring core habit MUST map to:
1. TRIGGER
   - External: Push notification, email, contextual CTA (e.g., "Your report is ready").
   - Internal: User's emotional need (e.g., FOMO, boredom, anxiety about missing a payment).
2. ACTION 
   - The simplest behavior in anticipation of reward (e.g., clicking the push, scrolling the feed).
   - Friction removal is critical here (Fogg Ability).
3. VARIABLE REWARD
   - The unpredictability that drives dopamine.
   - Rewards of the Tribe: Social validation, likes, comments (Social apps).
   - Rewards of the Hunt: Finding a deal, swiping for matches, discovering new content (E-com/Content).
   - Rewards of the Self: Mastery, completion, leveling up, clearing an inbox (Productivity/Gaming).
4. INVESTMENT
   - User does work to improve the experience for next time.
   - E.g., Adding a friend, rating a product, saving a playlist, adding money to wallet.
   - Loads the next trigger.
```

### Cognitive Biases & Heuristics in UX
```
1. Paradox of Choice
   - Rule: Hick's Law on steroids. Never show >3 primary choices.
   - Execution: Pre-select a "Smart Default" based on data. Hide edge-case choices behind "Advanced options".

2. Loss Aversion (Ethical Framing)
   - Rule: People fear losing ₹100 more than they desire gaining ₹100.
   - Execution: "You will lose your ₹500 cashback if you skip" works better than "Complete to earn ₹500".
   - Constraint: Must be true. Do not invent fake losses (Priority 2: Honest).

3. Endowment Effect
   - Rule: People value what they feel they already own.
   - Execution: Give users a "taste" of the premium tier (e.g., free premium trial instantly applied) before asking them to pay. "Your Pro trial is active."

4. Peak-End Rule for Growth
   - Rule: Users judge an experience by its peak (most intense moment) and its end.
   - Execution: Over-design the success completion screen (confetti, major visual celebration) and the "Aha!" moment of the product.
```

### The Empty State Formula
```
Never leave a screen blank. Every empty state MUST have 3 elements:
1. Illustration/Icon: Visually interesting, branded, lighthearted.
2. Comforting/Instructive Text: "It's quiet in here..." + "Your saved items will appear here."
3. Primary Action CTA: A button that helps them populate the screen ("Start Shopping", "Create Task").
```

### Activation & Onboarding Funnels
```
1. Time-to-Value (TTV) Optimization
   - The "Aha! Moment" must happen before the paywall or complex signup if possible.
   - Execution: Allow "Skip to explore" for non-critical onboarding steps.

2. Progressive Disclosure Validation
   - Never ask for all permissions (Location, Push, Camera) upfront.
   - Execution: Ask in context. Ask for Camera permission ONLY when user taps "Scan QR".

3. Pricing Page Psychology
   - 3-Tier Anchoring: Show a high-priced decoy to make the middle tier look reasonable.
   - Center/Highlight the preferred tier (Size, Elevation, "Most Popular" badge).
   - Clear toggle for Monthly/Yearly with explicit "Save X%" callout.
```
