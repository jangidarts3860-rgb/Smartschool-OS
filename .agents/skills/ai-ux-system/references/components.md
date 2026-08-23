# Components — Complete Specification & Database

> Deep component specs with exact tokens, states, responsive rules, and Indian market patterns.
> Version: 3.0 | Updated: 2026-07-12

---

## Component Contract (Every Component Must Have)

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | ✅ | Unique identifier (kebab-case) |
| **Purpose** | ✅ | One-sentence: what it does |
| **Anatomy** | ✅ | Visual parts with token refs |
| **Variants** | ✅ | Type × Size × State matrix |
| **Tokens** | ✅ | All visual properties → design tokens |
| **States** | ✅ | All 8 states with exact token changes |
| **Auto Layout** | ✅ | Direction, gap, padding, sizing |
| **Content Limits** | ✅ | Max chars, truncation rules, localization |
| **Responsive** | ✅ | Breakpoint behavior |
| **Accessibility** | ✅ | Role, labels, focus, touch target, ARIA |
| **Interaction** | ✅ | Hover, press, focus, loading, keyboard |
| **Owner** | ✅ | Design / Dev owner |
| **Code Counterpart** | ✅ | React/Vue/Flutter component name |

---

## Layout Specifications

### Breakpoints

| Name | Width | Columns | Gutter | Margin | Use Case |
|------|-------|---------|--------|--------|----------|
| Mobile | 320-479px | 4 | 16px | 16px | Default (India mobile-first) |
| Mobile Large | 480-639px | 4 | 16px | 20px | Large phones |
| Tablet | 640-1023px | 8 | 24px | 24px | Tablets, foldables |
| Desktop | 1024-1439px | 12 | 24px | 32px | Laptops |
| Desktop Large | 1440px+ | 12 | 32px | 48px | Monitors |

### Container Widths

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| Mobile | 100% | 16px |
| Tablet | 720px | 24px |
| Desktop | 1200px | 32px |
| Desktop Large | 1400px | 48px |

### Grid System

- **Mobile**: 4-column, 16px gutter
- **Tablet**: 8-column, 24px gutter
- **Desktop**: 12-column, 24px gutter
- **Baseline grid**: 4pt (aligns with 8pt spacing)

### Safe Areas (Mobile)

| Area | iOS | Android | Notes |
|------|-----|---------|-------|
| Top (notch) | 44-59px | 24-48px | Status bar + nav |
| Bottom (home indicator) | 34px | 0-32px | Gesture bar |
| Side | 0px | 0px | Full width |

---

## Visual Language Definitions (Style Presets)

### 1. Minimal Premium
| Property | Value |
|----------|-------|
| Background | `color-neutral-0` / `color-neutral-950` |
| Primary | `color-brand-500` (restrained) |
| Border | `color-border-subtle` (hairline) |
| Radius | `radius-md` (8px) |
| Shadow | `shadow-sm` only |
| Typography | `font-body` (Geist/Inter), `weight-regular` base |
| Space | Generous (`space-6` to `space-12`) |
| Motion | `duration-normal`, `ease-standard` |

### 2. Dark Dramatic
| Property | Value |
|----------|-------|
| Background | `color-neutral-950` |
| Primary | `color-brand-400` (lighter for dark) |
| Border | `color-border-default` (visible) |
| Radius | `radius-lg` (12px) |
| Shadow | `shadow-lg` + colored glow (`color-brand-500/20`) |
| Typography | `font-display` (Satoshi/Clash) for headings |
| Space | Cinematic (`space-8` to `space-16`) |
| Motion | `duration-slow`, `ease-enter` |

### 3. Bold Editorial
| Property | Value |
|----------|-------|
| Background | `color-neutral-50` / `color-neutral-900` |
| Primary | High contrast (black/white) |
| Border | `color-border-strong` (thick 2-3px) |
| Radius | `radius-none` or `radius-sm` (sharp) |
| Shadow | None (flat) |
| Typography | `font-display` bold headings, `font-body` serif option |
| Space | Asymmetric, editorial |
| Motion | `duration-fast`, `ease-sharp` |

### 4. Warm Indian
| Property | Value |
|----------|-------|
| Background | `#FFFEF7` (warm cream) / `#1A1A1A` (warm dark) |
| Primary | `#D97706` (amber) / `#F59E0B` |
| Border | `#E5E7EB` warm / `#374151` warm dark |
| Radius | `radius-lg` (12px) friendly |
| Shadow | `shadow-sm` warm tint |
| Typography | `font-body` + `font-hindi` (Noto Sans Devanagari) |
| Space | Comfortable (`space-5` to `space-8`) |
| Motion | `duration-normal`, `ease-standard` |

### 5. Soft Friendly
| Property | Value |
|----------|-------|
| Background | `#FEF7EE` (peach cream) |
| Primary | `#EA580C` (orange) |
| Border | None (card separation via shadow) |
| Radius | `radius-xl` (16px) + `radius-full` |
| Shadow | `shadow-md` soft, layered |
| Typography | Rounded font (Quicksand, Nunito) |
| Space | Generous, breathing |
| Motion | `duration-moderate`, `ease-spring` (bouncy) |

### 6. Vibrant Expressive
| Property | Value |
|----------|-------|
| Background | White with color accents |
| Primary | Multiple: `#EC4899`, `#8B5CF6`, `#06B6D4`, `#F59E0B` |
| Border | Color-tinted (`color-brand-200`) |
| Radius | `radius-lg` to `radius-xl` |
| Shadow | Colored shadows (`color-brand-500/30`) |
| Typography | Display font for headings |
| Space | Dynamic, playful |
| Motion | `duration-slow`, `ease-spring` |

### 7. Clean Corporate
| Property | Value |
|----------|-------|
| Background | `#FFFFFF` / `#F8FAFC` |
| Primary | `#2563EB` (corporate blue) |
| Border | `#E2E8F0` (slate) |
| Radius | `radius-md` (8px) |
| Shadow | `shadow-sm` only |
| Typography | System fonts (Inter, Roboto) |
| Space | Regular (`space-4` to `space-8`) |
| Motion | `duration-fast`, `ease-standard` |

### 8. Luxury Refined
| Property | Value |
|----------|-------|
| Background | `#0A0A0A` (near black) / `#FAFAFA` |
| Primary | `#D4AF37` (gold) / `#C9A84C` |
| Border | Hairline (`0.5px`) `rgba(212,175,55,0.3)` |
| Radius | `radius-sm` (4px) precise |
| Shadow | None or `shadow-xs` only |
| Typography | Serif display (Playfair, Cormorant) + Sans body |
| Space | Extreme generous (`space-10` to `space-20`) |
| Motion | `duration-very-slow`, `ease-enter` |

---

## Component Database — Tier 1: Foundation (Build First)

### Button

**Anatomy:**
```
[Container: bg, border, radius, padding]
  ├── [Icon: optional, leading/trailing, size=text-sm]
  └── [Label: typography=label, color=text-on-brand]
```

**Variants:**
| Type | Size | States (8) |
|------|------|------------|
| Primary | sm (32px), md (40px), lg (48px), xl (56px) | Default, Hover, Pressed, Focus, Loading, Disabled, Success, Error |
| Secondary | sm, md, lg, xl | All 8 |
| Ghost | sm, md, lg, xl | All 8 |
| Destructive | sm, md, lg, xl | All 8 |
| Icon Only | sm, md, lg | All 8 |

**Tokens:**
| Property | Primary | Secondary | Ghost | Destructive |
|----------|---------|-----------|-------|-------------|
| bg | `button-primary-bg` | `button-secondary-bg` | `button-ghost-bg` | `button-destructive-bg` |
| bg-hover | `button-primary-bg-hover` | `button-secondary-bg-hover` | `button-ghost-bg-hover` | `button-destructive-bg-hover` |
| bg-pressed | `button-primary-bg-pressed` | — | — | `button-destructive-bg-hover` |
| text | `button-primary-text` | `button-secondary-text` | `button-ghost-text` | `button-destructive-text` |
| border | `transparent` | `button-secondary-border` | `transparent` | `transparent` |
| radius | `button-primary-radius` | `button-primary-radius` | `button-primary-radius` | `button-primary-radius` |

**Auto Layout:** Row, Gap `space-2`, Padding `0 space-4` (sm) / `0 space-6` (md/lg/xl), Align Center, Hug

**Touch Target:** Minimum 44×44px (48×48px India), expand hitbox via padding if visual smaller

**States:**
| State | Visual Change | Duration | Easing |
|-------|---------------|----------|--------|
| Hover | bg → hover token | `duration-micro` | `ease-standard` |
| Pressed | scale(0.97) + bg → pressed | `duration-micro` | `ease-sharp` |
| Focus | 2px ring `color-border-focus` + 2px offset | `duration-instant` | — |
| Loading | Label hidden → spinner (same size) | `duration-instant` | — |
| Disabled | opacity 0.4, cursor not-allowed | `duration-instant` | — |
| Success | bg → `color-success-500`, icon ✓ | `duration-fast` | `ease-enter` |
| Error | shake + `color-error-500` border | `duration-fast` | `ease-sharp` |

**Content Rules:**
- CTA = Verb + Noun + Price: "Pay ₹1,299", "Book Appointment"
- Hindi: "₹1,299 चुकाएं", "अपॉइंटमेंट बुक करें"
- Max 3 words, 5 words absolute max
- No "Click here", "Submit", "OK"

**Accessibility:**
- `role="button"`
- `aria-disabled` on disabled (not HTML disabled for custom buttons)
- `aria-label` on icon-only buttons
- Keyboard: Enter/Space activate
- Focus visible always

---

### Input Field

**Anatomy:**
```
[Container: bg, border, radius, padding]
  ├── [Label: typography=label, color=text-secondary] (outside, above)
  ├── [Leading Icon: optional, color=text-tertiary]
  ├── [Input: typography=body-base, color=text-primary]
  ├── [Trailing Icon: optional (clear, eye, search)]
  └── [Helper/Error: typography=caption, color=text-tertiary/error]
```

**Variants:**
| Type | Keyboard | Validation |
|------|----------|------------|
| Text | default | On blur |
| Email | email | On blur + submit |
| Password | text (secure) | On blur |
| Number | numeric | On blur |
| Phone | tel | On blur (auto-format +91) |
| OTP | numeric (6x 1-char) | Auto-advance, paste support |
| Search | search | Debounced 300ms |
| Amount | numeric (2 decimals) | On blur, ₹ prefix |

**Sizes:**
- Mobile: 48px height, `text-base`
- Web: 40px height, `text-base`

**Tokens:**
| Property | Token |
|----------|-------|
| bg | `input-bg` |
| border | `input-border` |
| border-hover | `input-border-hover` |
| border-focus | `input-border-focus` |
| border-error | `input-border-error` |
| text | `input-text` |
| placeholder | `input-placeholder` |
| disabled-bg | `input-disabled-bg` |
| disabled-border | `input-disabled-border` |
| radius | `input-radius` |
| padding-x | `input-padding-x` |
| padding-y | `input-padding-y` |
| font-size | `input-font-size` |

**Auto Layout:** Row, Gap `space-2`, Padding `space-3 space-4`, Align Center, Fill Width

**States (8):**
| State | Border | BG | Text | Icon | Helper |
|-------|--------|-----|------|------|--------|
| Default | `input-border` | `input-bg` | `input-text` | `text-tertiary` | Helper text |
| Hover | `input-border-hover` | `input-bg` | — | — | — |
| Focus | `input-border-focus` (2px) | `input-bg` | — | `text-primary` | — |
| Filled | `input-border` | `input-bg` | `input-text` | — | — |
| Error | `input-border-error` (2px) | `input-bg` | `input-text` | `text-error` | Error text (icon + msg) |
| Disabled | `input-disabled-border` | `input-disabled-bg` | `text-disabled` | `text-disabled` | — |
| Loading | `input-border-focus` | `input-bg` | — | Spinner | "Verifying..." |
| Success | `color-border-success` | `input-bg` | — | ✓ `text-success` | Success text |

**Indian Patterns:**
- Phone: Auto +91, format `XXXXX XXXXX`
- OTP: 6 single-char fields, auto-advance, paste splits, SMS auto-read
- Amount: ₹ symbol fixed left, 2 decimals, comma separators (1,23,456.78)
- UPI: Validate @handle format, show bank logos

**Accessibility:**
- Persistent label (never placeholder-only)
- `aria-describedby` → helper/error ID
- `aria-invalid="true"` on error
- Error = icon + text + border (never color-only)
- Paste allowed everywhere

---

### Typography Component (All Semantic Styles)

| Style | Token | Usage |
|-------|-------|-------|
| Heading Hero | `heading-hero` | Hero, splash |
| Heading Display | `heading-display` | Marketing display |
| Heading H1 | `heading-h1` | Page titles |
| Heading H2 | `heading-h2` | Section titles |
| Heading H3 | `heading-h3` | Sub-sections |
| Heading H4 | `heading-h4` | Card titles |
| Body Large | `body-lg` | Lead paragraphs |
| Body Base | `body-base` | **Default reading text** |
| Body Small | `body-sm` | Secondary, metadata |
| Label | `label` | Form labels, buttons |
| Caption | `caption` | Timestamps, hints |
| Overline | `overline` | Section labels, badges |

**Responsive:** All sizes scale down 1 step on mobile (H1 mobile = H2 desktop)

**Localization:** Hindi text 30% wider → test all containers at 200% zoom

---

### Icon System

| Size | Token | Usage |
|------|-------|-------|
| 16px | `icon-xs` | Inline with caption |
| 20px | `icon-sm` | Inline with body, button sm |
| 24px | `icon-md` | **Default** — button md, list items, inputs |
| 28px | `icon-lg` | Button lg, card actions |
| 32px | `icon-xl` | Button xl, empty states |
| 48px | `icon-2xl` | Hero, onboarding illustrations |

**Style:** Phosphor / Lucide / Heroicons (consistent weight: Regular for UI, Bold for emphasis)
**Color:** Always `currentColor` (inherits text token)
**Touch Target:** Icon buttons = 48×48px minimum (icon 24px + 12px padding)

---

### Avatar

**Variants:** Image, Initials (2-3 chars), Placeholder (generic)
**Sizes:** 32, 40, 48, 56, 64, 80, 120px
**Radius:** `radius-full`
**Border:** `color-border-subtle` 1px on placeholder
**Stack:** Max 3 visible, rest `+N` badge
**Tokens:** `avatar-size-{size}`, `avatar-border`, `avatar-bg-placeholder`

---

### Badge / Tag

**Variants:** Status (success/warning/error/info), Category, Count, New
**Sizes:** sm (20px), md (24px), lg (28px)
**Radius:** `radius-full`
**Tokens:** `badge-bg-{variant}`, `badge-text-{variant}`, `badge-radius`, `badge-padding-x`
**Count Badge:** Min width 20px, `radius-full`, `color-error-500` bg, `text-on-brand`

---

### Divider

**Orientation:** Horizontal, Vertical
**Thickness:** 1px (hairline)
**Tokens:** `divider-color` = `color-border-subtle`, `divider-thickness` = 1px
**With Label:** Centered text `overline` style, bg = surface, padding `space-2 space-3`

---

## Component Database — Tier 2: Feedback

### Toast / Snackbar

**Anatomy:** `[Icon] [Message] [Action: optional] [Dismiss: X]`
**Position:** Mobile: bottom (above nav), Web: bottom-right
**Duration:** 4s default, 8s with action, persistent for errors
**Stack:** Max 3, oldest pushes out
**Variants:** Success, Error, Warning, Info
**Tokens:** `toast-bg` = `color-surface-elevated`, `toast-shadow` = `shadow-lg`, `toast-radius` = `radius-lg`
**Animation:** Slide up + fade (enter 250ms), slide down + fade (exit 200ms)
**Accessibility:** `role="status"`, `aria-live="polite"` (assertive for error)

---

### Alert Banner

**Anatomy:** `[Icon] [Title] [Description] [Actions: 1-2] [Dismiss]`
**Position:** Top of page/section, below nav
**Persistent** until dismissed or resolved
**Variants:** Info, Warning, Error, Success
**Tokens:** `alert-bg` = `color-feedback-{variant}-bg`, `alert-border` = `color-border-{variant}`, `alert-text` = `color-feedback-{variant}-text`

---

### Loading / Skeleton

**Principle:** Shape matches real content exactly (not generic boxes)
**Animation:** Shimmer left→right, `duration-slow` (1.5s loop), `ease-standard`
**Colors:** `color-surface-card` base, `color-surface-hover` highlight
**Variants:** Text (lines), Card, List Item, Avatar + Text, Table Row
**Never:** Spinner alone on content pages (use skeleton)

---

### Progress Bar

**Types:** Determinate (known %), Indeterminate (unknown)
**Tokens:** `progress-track-bg` = `color-surface-input`, `progress-fill` = `color-action-primary`, `progress-radius` = `radius-full`, `progress-height` = 4px (8px for prominent)
**Animation:** Indeterminate = translateX loop, Determinate = width transition `duration-normal`

---

### Empty State

**Anatomy:** `[Illustration] [Headline] [Body] [Primary CTA] [Secondary: optional]`
**Illustration:** Positive/aspirational (NOT sad/broken)
**Variants:** First-time, Cleared, Filtered, Error, Offline
**Tokens:** `empty-illustration-size` = 120-160px, `empty-headline` = `heading-h3`, `empty-body` = `body-base`, `empty-cta` = `button-primary`

---

### Error State

**Anatomy:** `[Illustration] [Headline: What happened] [Body: Why + What to do] [Primary CTA: Fix] [Secondary: Escape]`
**Copy Rules:** Never "Something went wrong" alone. Always: What + Why + Fix.
**Tokens:** Same as Empty State

---

## Component Database — Tier 3: Input Controls

### Checkbox / Radio

**Size:** 24×24px touch target (visual 20×20px)
**States:** Unchecked, Hover, Focus, Checked, Indeterminate (checkbox), Disabled
**Tokens:** `checkbox-border`, `checkbox-bg-checked` = `color-action-primary`, `checkbox-icon` = `color-text-on-brand`
**Group:** Vertical stack, gap `space-3`, label clickable

---

### Toggle / Switch

**Size:** Track 52×32px, Thumb 28×28px
**States:** Off, Hover, Focus, On, Disabled
**Animation:** TranslateX + background color, `duration-fast`, `ease-standard`
**Tokens:** `switch-track-off`, `switch-track-on` = `color-action-primary`, `switch-thumb`, `switch-thumb-shadow`

---

### Select / Dropdown

**Trigger:** Input-like, trailing chevron icon
**Panel:** `color-surface-elevated`, `shadow-md`, `radius-lg`, max-height 320px, scroll
**Options:** Padding `space-3 space-4`, hover `color-surface-hover`, selected `color-brand-50` + check icon
**Searchable:** Yes if >10 options
**Tokens:** `select-trigger-*` = input tokens, `select-panel-*` = panel tokens

---

### Date Picker

**Mobile:** Bottom sheet (calendar month grid)
**Web:** Popover from trigger
**Range:** Start/End with highlighted range between
**Tokens:** `calendar-header`, `calendar-day`, `calendar-day-selected`, `calendar-day-range`, `calendar-day-disabled`

---

### OTP Input (Critical for India)

**Layout:** 6 single-char fields, horizontal, gap `space-2`
**Behavior:** Auto-advance on input, Backspace → previous, Paste → split across all
**SMS Auto-read:** WebOTP API (Web), SMS Retriever (Android), `autocomplete="one-time-code"`
**Tokens:** `otp-field-width` = 40px, `otp-field-height` = 56px, `otp-font-size` = `text-2xl`, `otp-font-weight` = `weight-bold`

---

### Phone Input (India)

**Format:** `+91` fixed prefix → `XXXXX XXXXX` (5+5 grouping)
**Validation:** 10 digits, starts with 6-9
**Tokens:** `phone-prefix` = "+91", `phone-group-gap` = `space-2`

---

### Search Bar

**Variants:** Inline (nav), Full-screen (results), Expandable
**Tokens:** `search-bg` = `color-surface-input`, `search-icon` = `text-tertiary`, `search-placeholder` = `text-tertiary`
**Results:** Dropdown (inline) or Screen (full), skeleton while loading

---

## Component Database — Tier 4: Layout

### Card

**Types:** Basic, Interactive (tap), Featured (hero), Media (image heavy)
**Anatomy:** `[Media: optional] [Content: Title, Subtitle, Meta, Actions]`
**Tokens:** `card-bg`, `card-border`, `card-shadow`, `card-shadow-hover`, `card-radius`, `card-padding`
**Interactive:** Whole card tappable, `cursor: pointer`, hover `card-shadow-hover`, pressed `scale(0.98)`
**Media:** Aspect ratios — 16:9 (video), 4:3 (product), 1:1 (avatar), 21:9 (banner)

---

### List Item

**Types:** Single line, Two-line (title + subtitle), Three-line, With Avatar, With Trailing (chevron, action, switch)
**Height:** 56px (single), 72px (two-line), 88px (three-line)
**Tokens:** `list-item-height`, `list-item-padding-x` = `space-4`, `list-item-gap` = `space-3`
**Divider:** `color-border-subtle`, inset `space-4` from leading edge

---

### Bottom Navigation (India Standard — 4 Tabs)

**Height:** 83px iOS / 80dp Android (includes safe area)
**Items:** Max 5, ideal 4 (Home, Core, Discover, Profile)
**Active:** Filled icon + label `color-text-primary`, indicator pill `color-action-primary`
**Inactive:** Outline icon + label `color-text-tertiary`
**Tokens:** `nav-height`, `nav-bg` = `color-surface-card`, `nav-border-top` = `color-border-subtle`, `nav-item-gap` = `space-1`
**Animation:** Icon morph (if same metric), label fade, pill slide `duration-moderate` `ease-standard`

---

### Top App Bar

**Height:** 56px (mobile), 64px (web)
**Anatomy:** `[Leading: Back/Menu] [Title: heading-h4] [Trailing: Actions (max 2)]`
**Variants:** Static, Collapsing (scroll), Pinned
**Tokens:** `appbar-height`, `appbar-bg` = `color-surface-card`, `appbar-shadow` = `shadow-xs` (on scroll)

---

### Bottom Sheet

**Sizes:** Small (300px), Medium (50%), Large (90%), Full
**Handle:** 40×4px pill, `radius-full`, `color-border-default`, centered top `space-3`
**Backdrop:** `color-surface-overlay`, tap to dismiss
**Swipe:** Drag down to dismiss, threshold 40% height or velocity >500px/s
**Tokens:** `sheet-bg` = `color-surface-card`, `sheet-radius` = `radius-xl` (top only), `sheet-handle-*`, `sheet-backdrop`

---

### Modal / Dialog

**Sizes:** sm (320px), md (480px), lg (640px), full (mobile)
**Anatomy:** `[Header: Title + Close] [Body] [Footer: Actions]`
**Focus Trap:** Yes. Tab cycles within. ESC closes.
**Tokens:** `modal-bg`, `modal-backdrop`, `modal-radius`, `modal-shadow`, `modal-padding`
**Animation:** Enter: fade + scale(0.95→1) `duration-moderate` `ease-enter`. Exit: fade + scale(1→0.95) `duration-fast` `ease-exit`

---

### Tab Bar (Horizontal Scrollable)

**Height:** 48px
**Indicator:** Animated pill, width = label width + `space-4`, `color-action-primary`, `radius-full`
**Tokens:** `tab-height`, `tab-indicator-bg`, `tab-indicator-radius`, `tab-label-active` = `color-text-primary`, `tab-label-inactive` = `color-text-tertiary`

---

## Component Database — Tier 5: India-Specific

### UPI Payment Card

**Anatomy:** `[App Icon] [App Name] [@handle] [Radio]`
**Apps (Priority):** GPay, PhonePe, Paytm, BHIM, Amazon Pay, WhatsApp Pay, Bank UPI
**States:** Default, Hover, Selected, Disabled (not installed)
**Tokens:** `upi-card-bg`, `upi-card-border`, `upi-card-border-selected` = `color-action-primary`, `upi-icon-size` = 32px

---

### Trust Badge

**Types:** Verified (shield), Secured (lock), Rating (stars), "50L+ Users", "RBI Licensed", "ISO 27001"
**Sizes:** Inline (16px), Card (24px), Hero (32px)
**Tokens:** `badge-trust-icon`, `badge-trust-text` = `caption`, `badge-trust-color` = `color-text-secondary`

---

### Price Tag

**Format:** `₹1,23,456` (Indian numbering: lakhs/crores)
**Variants:** Current only, Current + Original (strikethrough), Discount badge
**Tokens:** `price-current` = `heading-h3` + `weight-bold` + `color-text-primary`, `price-original` = `body-base` + `text-tertiary` + strikethrough, `price-discount` = `badge-error` + "XX% OFF"

---

### Offer Banner

**Anatomy:** `[Icon] [Headline: "Flat ₹200 off"] [Sub: "On orders above ₹999"] [CTA: "Apply"]`
**Variants:** Cashback, Discount, Free Delivery, New User
**Tokens:** `offer-bg` = `color-surface-brand`, `offer-border` = `color-border-brand`, `offer-icon` = `color-action-primary`

---

### Rating Stars

**Display:** 5 stars, 0.5 increments, `icon-sm` (20px)
**Interactive:** Tap to rate (if editable), hover fills progressively
**With Count:** `caption` "4.7 (12,345 reviews)"
**Tokens:** `star-filled` = `color-warning-500`, `star-empty` = `color-border-subtle`, `star-half` = gradient mask

---

### Language Toggle

**Placement:** Top app bar trailing, Settings, Onboarding
**Format:** "EN | हिंदी" or Dropdown (EN, HI, TA, TE, BN, MR, GU, KN, ML, PA, OR)
**Tokens:** `lang-toggle-active` = `color-text-primary`, `lang-toggle-inactive` = `color-text-tertiary`

---

## State Matrix — All Components Must Support

| State | Visual Spec | Duration | Easing |
|-------|-------------|----------|--------|
| Default | Base tokens | — | — |
| Hover (web) | BG/border → hover tokens | `duration-micro` | `ease-standard` |
| Pressed / Active | Scale 0.97 + BG → pressed | `duration-micro` | `ease-sharp` |
| Focus | 2px ring `color-border-focus` + 2px offset | `duration-instant` | — |
| Loading | Spinner / Skeleton (same size) | `duration-instant` | — |
| Disabled | Opacity 0.4, cursor not-allowed | `duration-instant` | — |
| Error | Border `color-error-500` (2px), shake | `duration-fast` | `ease-sharp` |
| Success | Border `color-success-500`, check icon | `duration-fast` | `ease-enter` |

---

## Responsive Behavior Rules

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Button | Full-width primary | Auto-width, min 120px | Auto-width, min 120px |
| Input | Full-width | Max 400px | Max 400px |
| Card | Full-width, stack | 2-col grid | 3-4 col grid |
| Bottom Nav | Fixed, 4 tabs | Rail (left) | Rail (left) |
| Modal | Full-screen (sheet) | Centered md | Centered md/lg |
| Table | Horizontal scroll / Card stack | Full table | Full table |
| Search | Expandable / Full-screen | Inline expandable | Inline persistent |

---

## Accessibility Checklist (Per Component)

- [ ] Touch target ≥44×44px (48×48px India)
- [ ] Color contrast ≥4.5:1 (text), ≥3:1 (UI)
- [ ] Not color-only (icon + label + pattern)
- [ ] Focus visible, logical order
- [ ] Screen reader labels (aria-label, aria-labelledby)
- [ ] ARIA roles correct (button, dialog, listbox, etc.)
- [ ] Keyboard operable (Tab, Enter, Space, Esc, Arrows)
- [ ] `prefers-reduced-motion` respected
- [ ] Hindi/regional text renders, containers flex
- [ ] Error = icon + text + border (never color-only)

---

## Content Stress Tests (Run Before Ship)

| Test | Target |
|------|--------|
| Longest realistic label | No truncation, wraps gracefully |
| Large numbers (₹9,99,99,999) | Fits, comma-separated |
| Zero/negative values | Shows correctly ("₹0", "-₹500") |
| Hindi + English mixed | 30% wider, no overflow |
| 200% zoom / Large text | All functional, no horizontal scroll |
| Missing image | Placeholder shown, layout holds |
| Network latency (3G) | Skeletons, no layout shift |
| Rapid taps | No duplicate submissions |
| RTL (Urdu) | Layout mirrors correctly |

---

## Visual Language Quick Reference

| Personality | Font Pair | Primary | Radius | Shadow | Space |
|-------------|-----------|---------|--------|--------|-------|
| Minimal Premium | Geist + Inter | Restrained brand | 8px | sm | Generous |
| Dark Dramatic | Clash + Geist | Brand-400 | 12px | lg + glow | Cinematic |
| Bold Editorial | Clash + Serif | High contrast | 0-4px | None | Asymmetric |
| Warm Indian | Inter + Noto Devanagari | Amber | 12px | sm warm | Comfortable |
| Soft Friendly | Nunito + Inter | Orange | 16px | md layered | Breathing |
| Vibrant Expressive | Display + Inter | Multi-color | 12-16px | Colored | Dynamic |
| Clean Corporate | Inter + Roboto | Blue | 8px | sm | Regular |
| Luxury Refined | Playfair + Inter | Gold | 4px | None | Extreme |