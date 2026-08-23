---
name: design-system-v2
description: Senior Design Systems Engineer. Use for: design tokens, component library, Figma variables, style guide, color system, typography system, spacing system, icon system, reusable UI foundation. Trigger: "design system banao", "component library", "design tokens", "style guide", "color palette banao", "typography system", "spacing system", "icon system", "Figma variables", "token system", "brand system", "component banao", "button system", "form system", "card system".
version: 2.0
---
# Design System v2 — Senior Design Systems Engineer

> **Authority:** Tier 1 = ux-thinking (laws) | Tier 2 = design-taste-frontend (code) | Tier 3 = THIS SKILL
> **Color decisions → ux-thinking Layer 8 (WCAG) + conflict hierarchy approves first.**
> **Typography decisions → design-taste-frontend for code, aesthetic-system.md for Figma.**

---

## Mandatory: Trending Check (Before Every System)

**Step 1 — Web Search (run these 3 queries):**
```
1. "[product type] design system 2025 trending"
2. "best fonts [product category] UI 2025"
3. "Figma variables best practices 2026"
```

**Step 2 — Read `references/design-trends.md`** (covers fonts, colors, icons, layouts, components, platform trends, Figma Variables 2025-26)

**Why:** Wrong font = entire product feels 2019. Wrong colors = generic AI output. Catch before building.

---

## Phase 0: Collect Context

| Input | Why Critical |
|-------|--------------|
| Product type | App category determines component needs |
| Aesthetic personality | From figma-design skill — must match |
| Target market | India Tier 1/2/3 affects token values |
| Platform | Android / iOS / Web / All |
| Team size | Solo → simple system. Team → strict naming |
| Existing design? | Extract tokens or build fresh |
| Dev framework | React Native / Flutter / Web — affects output |

---

## Phase 1: Foundation Tokens (DNA of System)

### 1A: Color Tokens — 3-Layer System

**Layer 1: Primitive Tokens** (raw values — NEVER use directly in UI)
```
PRIMITIVE COLORS — [Product Name]
═══════════════════════════════════════════════════════════════

BRAND SCALE (primary brand color — 10 shades):
brand-50:   [lightest tint]
brand-100:  [very light]
brand-200:  [light]
brand-300:  [medium-light]
brand-400:  [medium]
brand-500:  [BASE — main brand color]  ← PRIMARY
brand-600:  [medium-dark]
brand-700:  [dark]
brand-800:  [very dark]
brand-900:  [darkest shade]

NEUTRAL SCALE (grays — 10 shades):
neutral-0:   #FFFFFF
neutral-50:  [warm/cool off-white]
neutral-100: [very light gray]
neutral-200: [light gray]
neutral-300: [medium-light gray]
neutral-400: [medium gray]
neutral-500: [true medium]
neutral-600: [medium-dark]
neutral-700: [dark gray]
neutral-800: [very dark]
neutral-900: [near black]
neutral-950: [darkest]

SEMANTIC PRIMITIVES:
success-500: #22C55E  (green)
warning-500: #F59E0B  (amber)
error-500:   #EF4444  (red)
info-500:    #3B82F6  (blue)
```

**Layer 2: Semantic Tokens** (purpose-named — USE THESE in components)
```
SEMANTIC TOKENS — Light Mode
═══════════════════════════════════════════════════════════════

SURFACE (backgrounds):
surface-page:      neutral-0      (main page background)
surface-card:      neutral-50     (cards, panels)
surface-sunken:    neutral-100    (inputs, recessed areas)
surface-overlay:   neutral-900/50 (modal backdrop)
surface-inverse:   neutral-900    (dark surfaces on light bg)

TEXT:
text-primary:      neutral-900    (main content)
text-secondary:    neutral-600    (captions, hints)
text-disabled:     neutral-400    (inactive)
text-inverse:      neutral-0      (on dark backgrounds)
text-on-brand:     neutral-0      (text on brand color buttons)

ACTION (interactive):
action-primary:    brand-500      (primary CTA)
action-primary-hover: brand-600
action-primary-active: brand-700
action-secondary:  neutral-0      (ghost/outline buttons)
action-disabled:   neutral-300

BORDER:
border-subtle:     neutral-200    (dividers, subtle borders)
border-default:    neutral-300    (inputs, cards)
border-strong:     neutral-400    (emphasized)
border-brand:      brand-500      (focused inputs, active)

FEEDBACK:
feedback-success-bg:   success-500/10
feedback-success-text: success-500
feedback-warning-bg:   warning-500/10
feedback-warning-text: warning-500
feedback-error-bg:     error-500/10
feedback-error-text:   error-500
feedback-info-bg:      info-500/10
feedback-info-text:    info-500

SEMANTIC TOKENS — Dark Mode
═══════════════════════════════════════════════════════════════
surface-page:      neutral-950
surface-card:      neutral-900
surface-sunken:    neutral-800
text-primary:      neutral-50
text-secondary:    neutral-400
border-default:    neutral-700
action-primary:    brand-400      (lighter for dark bg)
```

**Layer 3: Component Tokens** (component-specific — optional for large systems)
```
COMPONENT TOKENS (examples):
button-primary-bg:      action-primary
button-primary-text:    text-on-brand
button-primary-border:  transparent
button-primary-hover:   action-primary-hover

input-bg:           surface-sunken
input-border:       border-default
input-border-focus: border-brand
input-text:         text-primary
input-placeholder:  text-disabled

card-bg:            surface-card
card-border:        border-subtle
card-shadow:        shadow-sm
```

---

### 1B: Spacing Tokens (8pt Grid — Strict)

```
SPACING SCALE
═══════════════════════════════════════════════════════════════
space-0:    0px
space-1:    4px    micro (icon+label gap)
space-2:    8px    small (list item gap, icon padding)
space-3:    12px   (compact padding)
space-4:    16px   medium (component padding)
space-5:    20px   (comfortable padding)
space-6:    24px   large (card padding)
space-7:    32px   xl (section gap)
space-8:    40px   2xl (large section gap)
space-9:    48px   3xl (hero padding)
space-10:   64px   4xl (major section gap)
space-11:   80px   5xl (page sections)
space-12:   96px   6xl (hero sections)
space-16:   128px  7xl (full-bleed sections)

RULES:
❌ NEVER use odd numbers (5px, 7px, 15px)
❌ NEVER use values outside this scale
✅ Component internal padding: space-3 to space-6
✅ Between components: space-4 to space-7
✅ Between sections: space-8 to space-12
```

---

### 1C: Typography Tokens

```
FONT FAMILIES
═══════════════════════════════════════════════════════════════
font-display: "[Display Font]", sans-serif
font-body:    "[Body Font]", sans-serif
font-mono:    "[Mono Font]", monospace  (for code/data)
font-hindi:   "Noto Sans Devanagari", "Hind", sans-serif

FONT SIZES (Major Third scale — 1.250 ratio)
═══════════════════════════════════════════════════════════════
text-2xs:    10px / line: 14px  (badges, tiny labels)
text-xs:     12px / line: 16px  (captions, meta)
text-sm:     14px / line: 20px  (helper text, secondary)
text-base:   16px / line: 24px  (body — BASE SIZE)
text-lg:     20px / line: 28px  (H4, lead text)
text-xl:     25px / line: 32px  (H3)
text-2xl:    31px / line: 40px  (H2)
text-3xl:    39px / line: 48px  (H1)
text-4xl:    49px / line: 56px  (Display)
text-5xl:    61px / line: 72px  (Hero)

FONT WEIGHTS
═══════════════════════════════════════════════════════════════
weight-light:     300  (decorative only)
weight-regular:   400  (body text)
weight-medium:    500  (UI labels, emphasis)
weight-semibold:  600  (headings H3-H4, subheadings)
weight-bold:      700  (H1-H2, CTAs, key numbers)
weight-extrabold: 800  (Display, Hero text)

LETTER SPACING
═══════════════════════════════════════════════════════════════
tracking-tight:   -0.02em  (large display text)
tracking-normal:   0       (body text)
tracking-wide:     0.04em  (UI labels, caps)
tracking-wider:    0.08em  (overlines, badges)

SEMANTIC TYPOGRAPHY TOKENS
═══════════════════════════════════════════════════════════════
heading-hero:    5xl / extrabold / tight
heading-display: 4xl / extrabold / tight
heading-h1:      3xl / bold / tight
heading-h2:      2xl / semibold / normal
heading-h3:      xl  / semibold / normal
heading-h4:      lg  / medium  / normal
body-lg:         lg  / regular / normal
body-base:       base/ regular / normal
body-sm:         sm  / regular / normal
label:           sm  / medium  / wide
caption:         xs  / regular / normal
overline:        xs  / semibold/ wider
```

---

### 1D: Border Radius Tokens

```
RADIUS SCALE
═══════════════════════════════════════════════════════════════
radius-none:  0px
radius-sm:    4px    (badges, tags, small chips)
radius-md:    8px    (buttons, inputs, small cards)
radius-lg:    12px   (cards, dropdowns, popovers)
radius-xl:    16px   (modals, drawers, bottom sheets)
radius-2xl:   24px   (hero cards, featured sections)
radius-3xl:   32px   (large feature cards)
radius-full:  9999px (pills, avatars, FABs, tags)

USAGE RULES:
✅ Buttons: radius-md (8px)
✅ Input fields: radius-md (8px)
✅ Cards: radius-lg (12px)
✅ Modals / Bottom sheets: radius-xl (16px)
✅ Avatar / Profile pics: radius-full
✅ Tags / Badges: radius-full
✅ Consistent within product — never random
```

---

### 1E: Shadow / Elevation Tokens

```
SHADOW SCALE
═══════════════════════════════════════════════════════════════
shadow-none: none
shadow-xs:   0 1px 2px rgba(0,0,0,0.05)
             (subtle hover states, active inputs)
shadow-sm:   0 1px 3px rgba(0,0,0,0.1),
             0 1px 2px rgba(0,0,0,0.06)
             (cards, list items)
shadow-md:   0 4px 6px rgba(0,0,0,0.07),
             0 2px 4px rgba(0,0,0,0.06)
             (dropdowns, popovers, tooltips)
shadow-lg:   0 10px 15px rgba(0,0,0,0.1),
             0 4px 6px rgba(0,0,0,0.05)
             (modals, floating panels)
shadow-xl:   0 20px 25px rgba(0,0,0,0.1),
             0 10px 10px rgba(0,0,0,0.04)
             (drawers, bottom sheets)
shadow-2xl:  0 25px 50px rgba(0,0,0,0.25)
             (hero cards, featured elements)

ELEVATION RULES:
✅ Page background: shadow-none
✅ Cards (resting): shadow-sm
✅ Cards (hover): shadow-md
✅ Dropdown menus: shadow-md
✅ Modals: shadow-lg
✅ Bottom sheet: shadow-xl
✅ Multi-layered soft shadows: Instead of heavy shadow-xl/lg, use extremely soft, wide-spread, low-opacity shadows (e.g., 0px 20px 40px rgba(0,0,0,0.04)).
✅ Inner Glows / Edge Highlights: Give cards a premium feel with subtle inner borders (e.g., box-shadow: inset 0 1px 0 rgba(255,255,255,0.1)).
✅ Hairline Borders: Use 1px borders with very low opacity (e.g., border-white/10 or border-black/5) to define structure without adding noise.
✅ Squircle Corners: Use radius-xl (16px) or radius-2xl (24px) / radius-3xl (32px) for modern squircle app-like cards, not just radius-md (8px).
❌ NEVER mix elevation and border on same element
```

---

### 1F: Motion Tokens

```
DURATION TOKENS
═══════════════════════════════════════════════════════════════
duration-instant:  0ms    (immediate state changes)
duration-micro:    100ms  (hover color, icon swap)
duration-fast:     150ms  (button press, checkbox)
duration-normal:   200ms  (dropdown, tooltip)
duration-moderate: 300ms  (modal, card expand)
duration-slow:     400ms  (page transition, drawer)
duration-very-slow:600ms  (onboarding, hero entrance)

EASING TOKENS
═══════════════════════════════════════════════════════════════
ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1)
ease-enter:      cubic-bezier(0.0, 0.0, 0.2, 1)
ease-exit:       cubic-bezier(0.4, 0.0, 1.0, 1)
ease-sharp:      cubic-bezier(0.4, 0.0, 0.6, 1)
ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1)

RULE: Never use linear easing for UI elements.
```

---

## Phase 2: Component Library

### 2A: Component Anatomy (Every Component Must Have)

```
FOR EVERY COMPONENT, DEFINE:

NAME: [Component name]
PURPOSE: [What it does — one sentence]
WHEN TO USE: [Specific use cases]
WHEN NOT TO USE: [Anti-patterns]

VARIANTS:
├── Size: xs / sm / md / lg / xl
├── Type: primary / secondary / tertiary / ghost / danger
└── State: default / hover / active / focus / loading / disabled / error / success

ANATOMY:
[Visual breakdown of parts]
├── Container (background, border, radius, padding)
├── Label (typography token, color token)
├── Icon (optional, size, position)
└── [Other parts]

TOKEN REFERENCES:
├── background: [semantic token name]
├── text: [semantic token name]
├── border: [semantic token name]
└── [all visual properties → token names]

AUTO LAYOUT:
Direction: Row / Column
Gap: [space token]
Padding: T[space] R[space] B[space] L[space]
Sizing: Hug / Fill / Fixed [px]

INTERACTIONS:
Hover:   [what changes + duration + easing]
Press:   [what changes + duration + easing]
Focus:   [focus ring + color + size]
Loading: [skeleton / spinner / progress]

ACCESSIBILITY:
Role: [ARIA role]
Label: [aria-label pattern]
Keyboard: [Tab / Enter / Space / Escape behavior]
Min touch target: [44px / 56px]
```

---

### 2B: Core Component Set (Build in This Order)

```
TIER 1 — Foundation (build first, everything depends on these)
══════════════════════════════════════════════════════════════════
├── Button       (primary / secondary / ghost / danger / icon)
├── Input        (text / password / number / search)
├── Typography   (all heading + body + label styles)
├── Icon         (size system + color system)
├── Avatar       (image / initials / placeholder)
├── Badge / Tag  (status / category / count)
└── Divider      (horizontal / vertical)

TIER 2 — Feedback (user needs to know what's happening)
══════════════════════════════════════════════════════════════════
├── Toast / Snackbar  (success / error / warning / info)
├── Alert Banner      (page-level feedback)
├── Loading / Skeleton (shimmer pattern)
├── Progress Bar       (linear / circular)
├── Empty State        (illustration + message + CTA)
└── Error State        (404 / 500 / no connection)

TIER 3 — Input Controls
══════════════════════════════════════════════════════════════════
├── Checkbox
├── Radio Button
├── Toggle / Switch
├── Select / Dropdown
├── Date Picker
├── OTP Input         ← critical for Indian apps
├── Phone Input       ← with +91 prefix auto
└── Search Bar

TIER 4 — Layout Components
══════════════════════════════════════════════════════════════════
├── Card              (basic / interactive / feature)
├── List Item         (single / with avatar / with meta)
├── Bottom Navigation (Indian standard — 4 tabs)
├── Top App Bar       (with/without back button)
├── Bottom Sheet      (with handle)
├── Modal / Dialog
└── Tab Bar           (scrollable / fixed)

TIER 5 — Indian Market Specific
══════════════════════════════════════════════════════════════════
├── UPI Payment Card  (with app logos: GPay/PhonePe/Paytm)
├── Trust Badge       (verified / secured / rating)
├── Price Tag         (₹ format / original + discount)
├── Offer Banner      (cashback / discount)
├── Rating Stars      (with count)
└── Language Toggle   (Hindi ⇄ English)
```

---

### 2C: Component Documentation Template

```
════════════════════════════════════════════════════════════════
COMPONENT: Button
════════════════════════════════════════════════════════════════
PURPOSE: Triggers an action or navigates to a destination.

VARIANTS:
  Type:  primary | secondary | ghost | danger | link
  Size:  sm (32px) | md (40px) | lg (48px) | xl (56px)
  State: default | hover | active | loading | disabled

SIZING:
  sm: height 32px | padding 0 12px | text-sm/medium
  md: height 40px | padding 0 16px | text-base/semibold
  lg: height 48px | padding 0 20px | text-base/semibold
  xl: height 56px | padding 0 24px | text-lg/bold
  Min width: 80px (all sizes)

TOKEN MAP:
  Primary:
    bg:           action-primary
    bg-hover:     action-primary-hover
    bg-active:    action-primary-active
    bg-disabled:  action-disabled
    text:         text-on-brand
    border:       transparent
    radius:       radius-md

  Secondary:
    bg:           transparent
    border:       border-brand (1.5px)
    text:         action-primary
    bg-hover:     brand-50

  Ghost:
    bg:           transparent
    border:       transparent
    text:         action-primary
    bg-hover:     neutral-100

  Danger:
    bg:           error-500
    text:         text-inverse

AUTO LAYOUT:
  Direction: Row | Gap: space-2 | Padding: T0 R[size] B0 L[size]
  Align: Center | Sizing: Hug

INTERACTIONS:
  Hover:   bg → hover token | duration-micro | ease-standard
  Press:   scale(0.97) + active bg | duration-micro | ease-sharp
  Focus:   2px outline brand-500 + 2px offset | visible always
  Loading: text hides → spinner appears | same size

ACCESSIBILITY:
  Role: button
  Keyboard: Enter + Space to activate
  Disabled: aria-disabled="true" (not HTML disabled)
  Touch target: min 44×44px (use padding if needed)

COPY RULES:
  ✅ Verb + Noun: "Pay ₹1,299", "Save Changes", "Create Account"
  ✅ Hindi: "₹1,299 चुकाएं", "बदलाव सेव करें", "खाता बनाएं"
  ❌ Never: "Click here", "Submit", "OK"
  Max length: 3 words preferred, 5 words max
════════════════════════════════════════════════════════════════
```

---

## Phase 3: Figma Variables Setup

### Step-by-Step in Figma

```
STEP 1: Create Variable Collections
════════════════════════════════════════════════════════════════
Collection 1: "Primitives" (raw values — hidden from designers)
  ├── All brand-X, neutral-X, success-X etc.

Collection 2: "Semantic" (what designers actually use)
  ├── All surface-X, text-X, action-X etc.
  ├── Mode 1: Light | Mode 2: Dark

Collection 3: "Spacing" (space-1 through space-16)
Collection 4: "Radius" (radius-sm through radius-full)
Collection 5: "Typography" (font sizes, weights)

STEP 2: Variable Naming in Figma
════════════════════════════════════════════════════════════════
Format: category/subcategory/variant
Examples:
  color/surface/page
  color/text/primary
  color/action/primary
  color/feedback/error/text
  space/4           (= 16px)
  radius/md         (= 8px)

STEP 3: Apply to Components
════════════════════════════════════════════════════════════════
✅ Never use hex colors directly in components
✅ Always bind to Variable
✅ When dark mode toggled → all components update automatically

STEP 4: Publish as Library
════════════════════════════════════════════════════════════════
Assets panel → Publish → All pages can use it
```

---

## Phase 4: Design System Documentation

### Style Guide Page (In Figma)

```
PAGE STRUCTURE:
├── 00_Cover         (product name, version, date)
├── 01_Colors        (all palette + semantic tokens displayed)
├── 02_Typography    (all styles displayed with examples)
├── 03_Spacing       (visual spacing scale)
├── 04_Radius        (visual radius scale)
├── 05_Shadows       (visual elevation scale)
├── 06_Icons         (icon library grid)
├── 07_Buttons       (all variants × all states)
├── 08_Inputs        (all variants × all states)
├── 09_Cards         (all card types)
├── 10_Navigation    (bottom nav, app bar, tabs)
├── 11_Feedback      (toasts, alerts, empty states)
├── 12_Indian_Patterns (UPI, trust badges, bilingual)
└── 13_Usage_Rules   (do's and don'ts for each component)
```

---

## Phase 5: Developer Handoff (CSS/JSON Output)

### Design Token JSON (For Developers)

```json
{
  "color": {
    "brand": {
      "500": { "value": "[hex]", "type": "color" }
    },
    "surface": {
      "page": { "value": "{color.neutral.0}", "type": "color" },
      "card": { "value": "{color.neutral.50}", "type": "color" }
    },
    "text": {
      "primary": { "value": "{color.neutral.900}", "type": "color" },
      "secondary": { "value": "{color.neutral.600}", "type": "color" }
    },
    "action": {
      "primary": { "value": "{color.brand.500}", "type": "color" }
    }
  },
  "spacing": {
    "1": { "value": "4px", "type": "spacing" },
    "2": { "value": "8px", "type": "spacing" },
    "4": { "value": "16px", "type": "spacing" },
    "6": { "value": "24px", "type": "spacing" }
  },
  "borderRadius": {
    "md": { "value": "8px", "type": "borderRadius" },
    "lg": { "value": "12px", "type": "borderRadius" },
    "full": { "value": "9999px", "type": "borderRadius" }
  },
  "typography": {
    "body-base": {
      "fontSize": { "value": "16px" },
      "fontWeight": { "value": "400" },
      "lineHeight": { "value": "24px" }
    }
  }
}
```

### CSS Variables Output

```css
:root {
  /* Colors */
  --color-surface-page: #FFFFFF;
  --color-surface-card: #F9FAFB;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-action-primary: #6366F1;
  --color-border-default: #E5E7EB;
  --color-feedback-error: #EF4444;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-7: 32px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Typography */
  --font-body: 'Satoshi', sans-serif;
  --font-display: 'Clash Grotesk', sans-serif;
  --text-base: 16px;
  --text-lg: 20px;
  --text-xl: 25px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

## Quality Checklist (Before Calling System Complete)

### Tokens
- [ ] All colors are semantic (no raw hex in components)
- [ ] Spacing always on 8pt grid
- [ ] Dark mode tokens defined for all surface/text/border
- [ ] All tokens named consistently (category/subcategory/variant)

### Components
- [ ] All 7 states designed for every interactive component
- [ ] Touch targets minimum 44px (56px for Tier 2/3)
- [ ] Every component uses tokens (not raw values)
- [ ] Auto Layout applied on all components
- [ ] Real copy used (no lorem ipsum anywhere)

### Documentation
- [ ] Every component has do/don't examples
- [ ] Figma Variables set up with Light + Dark modes
- [ ] Token JSON exported for developers
- [ ] Style guide page complete in Figma

### Indian Market
- [ ] Hindi font tested in all text components
- [ ] UPI payment component exists
- [ ] Trust badge component exists
- [ ] Price format uses ₹ symbol
- [ ] Bilingual button variant exists

---

## Anti-Patterns — NEVER DO THESE

```
❌ Using raw hex in components (#6366F1 directly)
   → One brand color change = update 100 places

❌ Inconsistent naming (btn-primary AND primary-button AND PrimaryBtn)
   → Confusion, errors, dev handoff nightmare

❌ Designing states only when needed
   → "I'll add hover states later" = it never happens
   → All 7 states: design upfront

❌ Separate systems for mobile and web
   → Same tokens, different component sizing
   → One system to rule all platforms

❌ No dark mode tokens
   → Adding dark mode later = full redesign

❌ Typography without line-height tokens
   → Text looks cramped / spaced wrong everywhere

❌ Component library without usage rules
   → Designers use components wrong
   → System breaks silently

❌ Building everything before first use
   → Build what you need now
   → Tier 1 components → ship → add Tier 2 → ship
```
---

## Brand Identity integration (Brand Identity Director - Templates)

When acting as a Brand Identity Director, use these specific templates and gates to ensure strict control over brand expression and export:

### Gate 4 — Exploration Prompt Formula
When generating prompts for brand exploration or identity ideation:
`[identity type] + [single strategic idea] + [brand attributes] + [audience/context] + [formal constraints] + [typography direction] + [color rules] + [applications] + [technical requirements] + [avoid list]`

*Default Avoid List:* gradients, 3D, drop shadows, clip-art detail, unexplained geometry, fake readable text, mockup-only presentation, photorealism.

### Gate 5 — Revision Prompt Template
When processing client or internal revisions to a brand mark or identity:
`Keep [approved strategic idea]. Change [specific failure]. Simplify [specific element]. Preserve [approved form/relationship]. Use [technical constraints]. Test in [applications/sizes]. Avoid [failure modes]. Return isolated mark, wordmark, lockups, and one-color versions; do not invent final text.`

### Gate 7 — Machine-Readable Brand Spec (Minimal Shape)
Always output brand specs in this JSON format to prevent brand drift:
```json
{
  "brand": "brand-name",
  "tokens": {
    "color.primary": "#000000",
    "color.canvas": "#FFFFFF",
    "font.primary": "Font Name"
  },
  "variants": ["primary", "horizontal", "stacked", "icon-only", "monochrome", "reversed"],
  "usage_rules": {
    "min_size_px": 24,
    "clear_space": "1x cap-height"
  },
  "prohibited": ["gradient fill", "drop shadow", "rotation beyond 0deg", "recoloring outside token set"]
}
```
*Note: This is the floor, not the ceiling. Keep `prohibited` explicit.*

### Gate 7 — Asset Naming Convention
Force this naming convention unless overridden: `brandname_variant_colormode.ext`
*(Examples: `acme_icon-only_dark.svg`, `acme_horizontal_light.png`, `acme_primary_mono.svg`)*

---
## 10-Year Creative Director Protocol: Optical Alignment & Typography Mastery

### 1. Optical vs. Mathematical Alignment
* **Rule:** Never rely purely on CSS/Figma exact mathematical center alignment for asymmetrical shapes (e.g., Play buttons, Chevrons, custom icons). 
* **Execution:** Shift asymmetrical icons optically (usually 5-10% toward their visually lighter side) so they *feel* centered in their containers.

### 2. High-End Typography Nudges
* **Headlines (Display/H1/H2):** Apply negative tracking (letter-spacing: -2% to -4%). Large text needs tighter spacing to look premium and locked-in.
* **Microcopy & OVERLINES (All-Caps):** Apply wide tracking (letter-spacing: 1.5px to 2px). Never use All-Caps without widening the tracking (it creates breathable elegance).
* **Line Height (Leading):**
  * Headings: Tight (110% - 120% / 1.1 - 1.2)
  * Body: Open and readable (150% - 160% / 1.5 - 1.6)
* **Font Weight Contrast:** Skip intermediate weights. Create extreme contrast (e.g., a Bold headline paired with a Regular/Light body) instead of matching Medium with Semibold.
