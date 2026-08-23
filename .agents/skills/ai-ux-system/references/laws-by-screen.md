# Laws by Screen Type — Auto-Activation + Checklists

> **Read this when starting any screen design.** Auto-activates relevant laws from `ux-laws.md`.
> Version: 3.0 | Updated: 2026-07-12

---

## Quick Reference: Screen Type → Laws

| Screen Type | Primary Laws (Auto-Activate) | Secondary Laws |
|-------------|------------------------------|----------------|
| **Navigation / Menu** | Hick's, Serial Position, Jakob's, Progressive Disclosure, Paradox of Choice | Fitts's (tap targets), Closure (scroll hint), Similarity (consistent style) |
| **Button / CTA** | Fitts's, Affordance, Von Restorff, Color Psychology, Weber's Law | Doherty (feedback <100ms), Microinteractions, Aesthetic-Usability |
| **Form** | Miller's, Tesler's, Error Prevention (Nielsen H5), Postel's, Cognitive Load | Zeigarnik (progress), Goal Gradient (completion), Dual Coding (labels+icons) |
| **Onboarding** | Zeigarnik, Goal Gradient, Fogg (M×A×P), Doherty, Peak-End, Dual Coding | Serial Position (first/last screens), Social Proof, Hook Model Trigger |
| **Product Listing** | Proximity, Similarity, Common Region, Closure, Social Proof, Paradox of Choice | Fitts's (card tap), Serial Position (top items), Figure-Ground (card separation) |
| **Checkout / Payment** | Tesler's, Error Prevention, Doherty, Shneiderman Closure, Trust Signals, Goal Gradient | Fitts's (pay button), Color Psychology (green=success), Weber's (state changes) |
| **Empty State** | Fogg Model (Prompt), Zeigarnik (incomplete), Affordance, Dual Coding | Peak-End (delight), Social Proof (others' content), Progressive Disclosure |
| **Notification** | Hook Model Trigger, Fogg Prompt, Scarcity (honest only) | Doherty (immediate), Peak-End (tone), Color Psychology (red=urgent) |
| **Dashboard** | Miller's (7±2 widgets), Proximity, Figure-Ground, F-Pattern, Aesthetic-Usability, Dual Coding | Serial Position (top-left priority), Von Restorff (1 highlight), Closure (scroll) |
| **Error Screen** | Nielsen H9, Don Norman Feedback, Postel's, Cognitive Load | Fitts's (retry button), Color Psychology (red=error but not color-only), Dual Coding |
| **Landing Page** | Z-Pattern, Fogg, Social Proof, Scarcity (honest), Peak-End, Dual Coding | Serial Position (hero + footer), Von Restorff (1 CTA), Aesthetic-Usability |
| **Profile / Settings** | Pareto (top 20% settings), Recognition>Recall, User Control, Progressive Disclosure | Fitts's (tap targets), Common Region (groups), Figure-Ground |
| **Modal / Overlay** | Doherty, Nielsen H3 (Control), Cognitive Load, Don Norman Constraints | Fitts's (close button), Peak-End (dismiss feeling), Microinteractions |
| **Animation / Motion** | Weber's Law (perceivable change), Microinteractions, Doherty Threshold | Fitts's (target size during motion), Aesthetic-Usability, Prefers-reduced-motion |
| **Fintech Screen** | Trust Signals, Tesler's, Error Prevention, Cognitive Load, Scarcity (honest) | Color Psychology (Green=UPI/money), Goal Gradient, Dual Coding, Serial Position |

---

## Screen-Specific Checklists

### 🧭 Navigation / Menu (Bottom Nav, Drawer, Tabs)

- [ ] **Hick's Law**: ≤5 items visible. More? Progressive disclosure ("More" tab).
- [ ] **Serial Position**: Most important = Position 1 or 5 (bottom nav). Least = middle.
- [ ] **Jakob's Law**: Bottom nav on mobile (iOS/Android standard). Hamburger only for secondary.
- [ ] **Fitts's Law**: Tap targets ≥48×48px. Active state clear (filled icon + label color).
- [ ] **Closure**: Swipeable tabs show partial next tab. Drawer shows peek.
- [ ] **Similarity**: All nav items same visual weight. Active = distinct (not just color).
- [ ] **Accessibility**: Focus order logical. Screen reader labels on icon-only items.

### 🔘 Button / CTA (Primary, Secondary, Ghost, Danger)

- [ ] **Fitts's Law**: Primary = full-width mobile, ≥48px height, thumb zone (bottom 1/3).
- [ ] **Von Restorff**: Only ONE primary CTA per screen. Others = secondary/ghost.
- [ ] **Affordance**: Looks pressable (elevation, border, fill). Disabled = 40% opacity + not-allowed cursor.
- [ ] **Color Psychology**: Primary=Brand, Danger=Red, Success=Green, Ghost=Neutral.
- [ ] **Weber's Law**: Hover/pressed state = distinct (>14% change). Not just opacity.
- [ ] **Doherty Threshold**: Feedback <100ms (ripple, scale 0.98, color shift).
- [ ] **Microinteractions**: Loading = spinner inside button (same size). Success = checkmark.
- [ ] **Accessibility**: 4.5:1 contrast on text. Focus ring ≥2px. aria-disabled on disabled.

### 📝 Form (Login, Signup, Checkout, Profile Edit)

- [ ] **Miller's Law**: ≤7 fields per step. Multi-step with progress bar if more.
- [ ] **Tesler's Law**: Auto-fill OTP (SMS/WhatsApp), address, card, UPI. Smart defaults.
- [ ] **Error Prevention (P1)**: Confirm before irreversible. Inline validation on blur (not keystroke).
- [ ] **Postel's Law**: Accept flexible input (spaces in card/phone, auto-format). Clear correction guidance.
- [ ] **Cognitive Load**: Labels always visible (not placeholder-only). Helper text below field.
- [ ] **Zeigarnik**: Progress indicator (step 2 of 4). Shows incomplete → motivates completion.
- [ ] **Goal Gradient**: Visual progress accelerates near end (larger jumps).
- [ ] **Dual Coding**: Labels + icons (lock=password, mail=email, phone=OTP).
- [ ] **Accessibility**: 4.5:1 contrast. Error = icon + text + border (not color-only). aria-describedby on errors.

### 🎬 Onboarding (Splash, Permissions, Value Props, Account Setup)

- [ ] **Zeigarnik**: Progress bar / dots visible. "3 steps to start."
- [ ] **Goal Gradient**: Momentum builds — steps get easier, not harder.
- [ ] **Fogg (M×A×P)**: Motivation (value prop) → Ability (1 tap) → Prompt (CTA). All 3 per screen.
- [ ] **Doherty**: Instant feedback. No loading between onboarding screens.
- [ ] **Peak-End**: Last screen = "You're ready!" + primary CTA to core value.
- [ ] **Dual Coding**: Each screen = illustration + headline + 1 line body. No walls of text.
- [ ] **Serial Position**: Screen 1 = strongest value prop. Screen N = action + success.
- [ ] **Social Proof**: "10L+ users trust us" / "Rated 4.7★" on permission/value screens.
- [ ] **Hook Model**: Internal trigger (problem) → External trigger (notification) → Action → Variable Reward → Investment.

### 🛍 Product Listing (Grid, List, Cards, Infinite Scroll)

- [ ] **Proximity**: Card internal padding 12-16px. Gap between cards 12-16px.
- [ ] **Similarity**: All product cards same layout, image ratio, button style.
- [ ] **Common Region**: Card border OR shadow OR background defines boundary.
- [ ] **Closure**: Horizontal scroll shows 30% of next card. Vertical scroll = no closure needed.
- [ ] **Social Proof**: Rating stars + review count + "X bought today" on card.
- [ ] **Paradox of Choice**: Filters/sorts reduce visible options. Default sort = "Recommended."
- [ ] **Fitts's Law**: Whole card tappable (not just button). Tap target = card bounds.
- [ ] **Figure-Ground**: Card elevation/shadow separates from page background.
- [ ] **Accessibility**: Image alt text = product name. Price not color-only (₹ symbol + number).

### 💳 Checkout / Payment (UPI, Card, Wallet, COD)

- [ ] **Tesler's Law**: Auto-detect UPI apps installed. Pre-fill saved cards/addresses.
- [ ] **Error Prevention (P1)**: Amount shown BEFORE pay button. Confirm dialog for >₹1500.
- [ ] **Doherty Threshold**: Skeleton during gateway load. "Processing..." state <400ms.
- [ ] **Shneiderman Closure**: Clear steps: Review → Pay → Success. Each step has closure.
- [ ] **Trust Signals**: Lock icon, "Secured by Razorpay/PhonePe", RBI/PCI badges, "Your money is safe."
- [ ] **Goal Gradient**: Progress: Cart → Address → Payment → Success. Visual bar.
- [ ] **Fitts's Law**: Pay button = full-width, 56px, bottom fixed, thumb zone.
- [ ] **Color Psychology**: Green for UPI/success. Red only for errors. Blue for info.
- [ ] **Weber's Law**: State changes distinct: Idle → Processing (spinner) → Success (check) / Error (shake+red).
- [ ] **Accessibility**: UPI ID readable. Screen reader announces amount + status. Error = icon+text+border.

### 📭 Empty State (No Orders, No Results, First Time)

- [ ] **Fogg Model**: This IS a prompt. Motivation (why bother) + Ability (1 tap) + Prompt (CTA).
- [ ] **Zeigarnik**: If setup incomplete, show progress: "1 of 3 done — Add delivery address."
- [ ] **Affordance**: CTA button obvious. "Explore Restaurants" not "Go."
- [ ] **Dual Coding**: Illustration (empty box, search, celebration) + Headline + 1 line body + CTA.
- [ ] **Peak-End**: Delightful illustration. Positive tone. "Your cart is waiting 🛒"
- [ ] **First-time vs Returning**: First-time = "Welcome! Start by..." Returning = "No orders yet. Order again?"
- [ ] **Filtered Empty**: "No results for 'pizza' — Try 'biryani' or clear filters."
- [ ] **Accessibility**: Illustration has alt text. CTA ≥48px. Color not only indicator.

### 🔔 Notification (Push, In-App, Toast, Banner)

- [ ] **Hook Model Trigger**: External (push) → Internal (habit). Action must be 1 tap.
- [ ] **Fogg Prompt**: Right moment (post-payment = "Track order"). Not random.
- [ ] **Scarcity**: Only if genuine ("Flash sale ends in 2h"). Never fake.
- [ ] **Doherty**: Toast appears <100ms. Auto-dismiss 4-5s. Swipe to dismiss.
- [ ] **Peak-End**: Success toast = green + check + "Order placed!" Error = red + X + "Retry."
- [ ] **Color Psychology**: Red=urgent/error, Green=success, Blue=info, Orange=warning.
- [ ] **Accessibility**: Announced via aria-live. Not color-only. Dismissible.

### 📊 Dashboard (Analytics, Admin, User Home)

- [ ] **Miller's Law**: ≤7 widgets visible. More? Tabs or progressive disclosure.
- [ ] **Proximity**: Related metrics grouped (Revenue + Orders + AOV). 24px between groups.
- [ ] **Figure-Ground**: Cards elevated (shadow) or bordered. Background distinct.
- [ ] **F-Pattern**: Top-left = most critical (North Star metric). Top-right = actions.
- [ ] **Aesthetic-Usability**: Clean, aligned, breathing room. No clutter.
- [ ] **Dual Coding**: Metrics = large number + label + trend icon (↑↓) + sparkline.
- [ ] **Serial Position**: First widget = North Star. Last = secondary action.
- [ ] **Von Restorff**: Only ONE metric highlighted (alert, target achieved).
- [ ] **Accessibility**: Data tables have headers. Charts have text summaries. Color-blind safe palette.

### ❌ Error Screen (404, 500, Network, Validation)

- [ ] **Nielsen H9**: Error = What happened + Why + How to fix. Never "Something went wrong."
- [ ] **Don Norman Feedback**: System explains state. "No internet — checking connection..."
- [ ] **Postel's Law**: Forgiving. "Retry" button prominent. Offline mode if possible.
- [ ] **Cognitive Load**: Simple language. No error codes (or hidden in "Details").
- [ ] **Fitts's Law**: Primary action (Retry/Go Home) = full-width, thumb zone.
- [ ] **Color Psychology**: Red for error but NOT color-only. Icon (⚠) + Text + Border.
- [ ] **Dual Coding**: Illustration (wifi off, server sad, 404 lost) + Copy + CTA.
- [ ] **Accessibility**: aria-live="assertive". Focus moves to error headline. Retry ≥48px.

### 🏠 Landing Page (Marketing, App Store, Waitlist)

- [ ] **Z-Pattern**: Hero (top-left) → Benefits (top-right) → Social Proof (mid) → CTA (bottom).
- [ ] **Fogg (M×A×P)**: Hero = Motivation. CTA = Ability (1 click). Sticky CTA = Prompt.
- [ ] **Social Proof**: Logos, numbers ("50L+ users"), ratings, testimonials. Verified.
- [ ] **Scarcity**: Honest only. "Early access closes Friday" (real deadline).
- [ ] **Peak-End**: Hero = Peak. Footer CTA = End. Both strong.
- [ ] **Dual Coding**: Every section = visual + text. No text-only sections.
- [ ] **Serial Position**: Hero (1st) + Final CTA (last) = highest recall.
- [ ] **Von Restorff**: ONE primary CTA above fold. Sticky CTA = same action.
- [ ] **Aesthetic-Usability**: Polished = trustworthy. But speed > beauty (Lighthouse ≥90).

### 👤 Profile / Settings (Account, Preferences, Notifications, Help)

- [ ] **Pareto**: Top 20% settings (Notifications, Privacy, Language, Theme) = prominent.
- [ ] **Recognition>Recall**: Current values shown. "Language: Hindi (हिंदी)" not just "Change."
- [ ] **User Control (P2)**: Easy logout, delete account, data export. No dark patterns.
- [ ] **Progressive Disclosure**: Advanced (Developer options, API keys, Beta features) behind "Advanced."
- [ ] **Fitts's Law**: Tap targets ≥48px. Switches = 52×32px thumb-friendly.
- [ ] **Common Region**: Cards group related settings (Account, Security, Preferences).
- [ ] **Figure-Ground**: Active section highlighted. Inactive = muted.
- [ ] **Accessibility**: Toggle = role="switch" + aria-checked. Language selector = native names.

### 🪟 Modal / Overlay (Bottom Sheet, Dialog, Confirmation)

- [ ] **Doherty**: Appears <100ms. Spring animation (stiffness 300, damping 30).
- [ ] **Nielsen H3 (Control)**: Close button (X), backdrop tap, swipe down, ESC key — ALL work.
- [ ] **Cognitive Load**: Single purpose. No multi-step in modal (use bottom sheet instead).
- [ ] **Don Norman Constraints**: Disable background scroll. Focus trapped in modal.
- [ ] **Fitts's Law**: Close button ≥44×44px top-right. Primary action = full-width bottom.
- [ ] **Peak-End**: Dismissal smooth (scale 0.95 → 0). No jank.
- [ ] **Microinteractions**: Enter: slide up + fade. Exit: slide down + fade. 250ms.
- [ ] **Accessibility**: Focus trap. aria-modal="true". aria-labelledby on title.

### 🎞 Animation / Motion (Transitions, Microinteractions, Loading)

- [ ] **Weber's Law**: State change >14% visual difference. Opacity 0→1, Scale 0.95→1, Slide 20px.
- [ ] **Microinteractions**: Trigger → Rules → Feedback → Loops. Every motion has purpose.
- [ ] **Doherty Threshold**: Feedback <100ms. Loading skeleton = immediate.
- [ ] **Fitts's Law**: Moving targets don't shrink below 44px during animation.
- [ ] **Aesthetic-Usability**: Spring physics (not linear). Stiffness/damping per personality.
- [ ] **Prefers-reduced-motion**: All animations ≤0.01ms when enabled. Instant transitions.
- [ ] **Personality Mapping**:
  - Banking/Medical: Stiffness 400, Damping 40, Mass 1 (zero bounce, serious)
  - SaaS/Productivity: Stiffness 300, Damping 30, Mass 1 (snappy, minimal bounce)
  - E-com/Fintech: Stiffness 260, Damping 26, Mass 1 (smooth, confident)
  - Social/Consumer: Stiffness 220, Damping 22, Mass 1 (light bounce, friendly)
  - Entertainment/Kids: Stiffness 180, Damping 15, Mass 1 (bouncy, playful)
- [ ] **Duration Scale**: Micro 100ms, Fast 150ms, Normal 200ms, Moderate 300ms, Slow 400ms, Very Slow 600ms.

### 🏦 Fintech Screen (KYC, Invest, Transfer, Bill Pay, Credit)

- [ ] **Trust Signals**: RBI/SEBI badges, Bank logos, "₹1L+ insured", Real user count, 4.7★ rating.
- [ ] **Tesler's Law**: Auto-fill PAN, Aadhaar (masked), Bank account verification (penny drop).
- [ ] **Error Prevention (P1)**: Confirm amount + recipient before UPI pin. "You're sending ₹5,000 to Ramesh."
- [ ] **Cognitive Load**: One decision per screen. "Enter UPI PIN" not "Review + PIN."
- [ ] **Scarcity (Honest)**: "Offer ends 11:59 PM" only if real. No fake countdowns.
- [ ] **Color Psychology**: Green = Money in / Success / UPI. Red = Money out / Error. Blue = Info / KYC.
- [ ] **Goal Gradient**: KYC steps: 1/4 → 2/4 → 3/4 → Complete. Visual progress.
- [ ] **Dual Coding**: Icons for each step (ID card, Selfie, Bank, Done) + Text.
- [ ] **Serial Position**: First screen = "Why KYC?" (motivation). Last = "You're verified!" (celebration).
- [ ] **Accessibility**: Currency announced as "Rupees five thousand" not "5000". Screen reader reads full transaction summary before confirm.

---

## Activation Protocol for Agents

```
WHEN USER SAYS: "Design a [screen type]"
1. LOOK UP screen type in table above
2. LOAD primary laws + secondary laws from ux-laws.md
3. RUN screen-specific checklist above
4. OUTPUT: Law-backed decisions with Severity + Brain Note
5. FLAG any conflicts → resolve via Conflict Hierarchy (ux-laws.md)
```

---

## Screen Type Aliases (User Language → Canonical)

| User Says | Map To |
|-----------|--------|
| "Home screen" / "Dashboard" | Dashboard |
| "Login page" / "Sign up" / "OTP screen" | Form |
| "Payment page" / "Checkout" / "UPI screen" | Checkout / Payment |
| "Product page" / "Listing" / "Catalog" / "Menu" | Product Listing |
| "Onboarding flow" / "Welcome screens" | Onboarding |
| "Error page" / "404" / "No internet" | Error Screen |
| "Settings" / "Profile page" / "Account" | Profile / Settings |
| "Popup" / "Dialog" / "Bottom sheet" / "Confirmation" | Modal / Overlay |
| "Landing page" / "Marketing page" / "Waitlist" | Landing Page |
| "Notification" / "Toast" / "Snackbar" / "Banner" | Notification |
| "Animation" / "Transition" / "Microinteraction" | Animation / Motion |
| "KYC" / "Invest" / "Transfer" / "Bill pay" / "Credit" | Fintech Screen |