# Design Tokens — Complete Reference

> Single source of truth for all design decisions. Used by Figma Variables, CSS, JSON, React Native.
> Version: 3.0 | Updated: 2026-07-12

---

## Token Architecture — 3-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: COMPONENT TOKENS (Specific)                       │
│  button-primary-bg, input-border-focus, card-shadow-hover   │
│  ↑ aliases ↑                                                │
│  LAYER 2: SEMANTIC TOKENS (Purpose-driven)                  │
│  color-action-primary, color-surface-card, space-4, radius-md │
│  ↑ aliases ↑                                                │
│  LAYER 1: PRIMITIVE TOKENS (Raw values)                     │
│  color-brand-500, color-neutral-900, space-16, radius-8     │
└─────────────────────────────────────────────────────────────┘

RULE: Components ONLY use Layer 3. Layer 3 aliases Layer 2. Layer 2 aliases Layer 1.
```

---

## Layer 1: Primitive Tokens (Raw Values)

### Color Primitives — Brand Scale (10 Steps)

| Token | Hex | Usage |
|-------|-----|-------|
| `color-brand-50` | `#EEF2FF` | Lightest tint — hover backgrounds |
| `color-brand-100` | `#E0E7FF` | Light tint — pill backgrounds |
| `color-brand-200` | `#C7D2FE` | Subtle borders, disabled states |
| `color-brand-300` | `#A5B4FC` | Secondary actions, outlines |
| `color-brand-400` | `#818CF8` | Icons, secondary text |
| `color-brand-500` | `#6366F1` | **BASE — Primary brand color** |
| `color-brand-600` | `#4F46E5` | Hover states, pressed |
| `color-brand-700` | `#4338CA` | Active, emphasis |
| `color-brand-800` | `#3730A3` | Dark mode primary |
| `text-on-brand` |
| `color-brand-900` | `#312E81` | Darkest — text on light brand |

### Color Primitives — Neutral Scale (10 Steps + 950)

| Token | Light Mode Hex | Dark Mode Hex | Usage |
|-------|----------------|---------------|-------|
| `color-neutral-0` | `#FFFFFF` | `#000000` | Pure white/black |
| `color-neutral-50` | `#F9FAFB` | `#111827` | Page background (light) / Card (dark) |
| `color-neutral-100` | `#F3F4F6` | `#1F2937` | Card background (light) / Elevated (dark) |
| `color-neutral-200` | `#E5E7EB` | `#374151` | Borders, dividers (light) / Borders (dark) |
| `color-neutral-300` | `#D1D5DB` | `#4B5563` | Input borders, disabled |
| `color-neutral-400` | `#9CA3AF` | `#6B7280` | Placeholder text, icons |
| `color-neutral-500` | `#6B7280` | `#9CA3AF` | Secondary text (light) / Secondary text (dark) |
| `color-neutral-600` | `#4B5563` | `#D1D5DB` | Body text (light) |
| `color-neutral-700` | `#374151` | `#E5E7EB` | Heading text (light) |
| `color-neutral-800` | `#1F2937` | `#F3F4F6` | Primary text (light) |
| `color-neutral-900` | `#111827` | `#F9FAFB` | Near black / Near white |
| `color-neutral-950` | `#030712` | `#FFFFFF` | Darkest / Pure white |

### Color Primitives — Semantic Colors (Feedback)

| Token | Light Hex | Dark Hex | Usage |
|-------|-----------|----------|-------|
| `color-success-500` | `#22C55E` | `#4ADE80` | Success states, positive amounts |
| `color-success-100` | `#DCFCE7` | `#14532D` | Success backgrounds |
| `color-warning-500` | `#F59E0B` | `#FBBF24` | Warning states, pending |
| `color-warning-100` | `#FEF3C7` | `#78350F` | Warning backgrounds |
| `color-error-500` | `#EF4444` | `#F87171` | Error states, destructive |
| `color-error-100` | `#FEE2E2` | `#7F1D1D` | Error backgrounds |
| `color-info-500` | `#3B82F6` | `#60A5FA` | Info states, neutral actions |
| `color-info-100` | `#DBEAFE` | `#1E3A5F` | Info backgrounds |

---

## Layer 2: Semantic Tokens (Purpose-Driven)

### Surface (Backgrounds)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `color-surface-page` | `{color-neutral-50}` | `{color-neutral-950}` | Main page background |
| `color-surface-card` | `{color-neutral-0}` | `{color-neutral-900}` | Cards, sheets, modals |
| `color-surface-elevated` | `{color-neutral-100}` | `{color-neutral-800}` | Dropdowns, popovers, tooltips |
| `color-surface-overlay` | `{color-neutral-900/50}` | `{color-neutral-0/50}` | Modal backdrop |
| `color-surface-input` | `{color-neutral-0}` | `{color-neutral-800}` | Input field background |
| `color-surface-hover` | `{color-neutral-100}` | `{color-neutral-800}` | Hover on cards, rows |
| `color-surface-pressed` | `{color-neutral-200}` | `{color-neutral-700}` | Pressed/active state |
| `color-surface-brand` | `{color-brand-50}` | `{color-brand-900}` | Brand-tinted surfaces |
| `color-surface-brand-hover` | `{color-brand-100}` | `{color-brand-800}` | Brand surface hover |

### Text (Typography

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `color-text-primary` | `{color-neutral-900}` | `{color-neutral-50}` | Main headings, body |
| `color-text-secondary` | `{color-neutral-600}` | `{color-neutral-400}` | Subheadings, metadata |
| `color-text-tertiary` | `{color-neutral-400}` | `{color-neutral-500}` | Captions, timestamps |
| `color-text-disabled` | `{color-neutral-300}` | `{color-neutral-600}` | Disabled text |
| `color-text-inverse` | `{color-neutral-0}` | `{color-neutral-950}` | On dark/brand backgrounds |
| `color-text-on-brand` | `{color-neutral-0}` | `{color-neutral-950}` | Text on brand-500/600 |
| `color-text-link` | `{color-brand-600}` | `{color-brand-400}` | Links, inline actions |
| `color-text-success` | `{color-success-500}` | `{color-success-500}` | Positive amounts, success |
| `color-text-warning` | `{color-warning-500}` | `{color-warning-500}` | Warnings |
| `color-text-error` | `{color-error-500}` | `{color-error-500}` | Errors, negative amounts |

### Action (Interactive)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `color-action-primary` | `{color-brand-500}` | `{color-brand-400}` | Primary CTA background |
| `color-action-primary-hover` | `{color-brand-600}` | `{color-brand-300}` | Primary hover |
| `color-action-primary-pressed` | `{color-brand-700}` | `{color-brand-500}` | Primary pressed |
| `color-action-primary-disabled` | `{color-neutral-300}` | `{color-neutral-600}` | Primary disabled |
| `color-action-secondary` | `{color-neutral-0}` | `{color-neutral-900}` | Secondary button bg |
| `color-action-secondary-hover` | `{color-neutral-100}` | `{color-neutral-800}` | Secondary hover |
| `color-action-secondary-border` | `{color-neutral-300}` | `{color-neutral-600}` | Secondary border |
| `color-action-ghost` | `transparent` | `transparent` | Ghost button bg |
| `color-action-ghost-hover` | `{color-neutral-100}` | `{color-neutral-800}` | Ghost hover |
| `color-action-destructive` | `{color-error-500}` | `{color-error-500}` | Destructive actions |
| `color-action-destructive-hover` | `{color-error-600}` | `{color-error-400}` | Destructive hover |

### Border

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `color-border-subtle` | `{color-neutral-200}` | `{color-neutral-700}` | Dividers, subtle borders |
| `color-border-default` | `{color-neutral-300}` | `{color-neutral-600}` | Input borders, card borders |
| `color-border-strong` | `{color-neutral-400}` | `{color-neutral-500}` | Emphasized borders |
| `color-border-focus` | `{color-brand-500}` | `{color-brand-400}` | Focus rings, input focus |
| `color-border-error` | `{color-error-500}` | `{color-error-500}` | Error input borders |
| `color-border-success` | `{color-success-500}` | `{color-success-500}` | Success input borders |

### Shadow / Elevation

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `shadow-none` | `none` | `none` | Flat elements |
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle hover, active input |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | `0 1px 3px rgba(0,0,0,0.4)` | Cards, list items |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | `0 4px 6px rgba(0,0,0,0.4)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | `0 10px 15px rgba(0,0,0,0.4)` | Modals, floating panels |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | `0 20px 25px rgba(0,0,0,0.5)` | Drawers, bottom sheets |
| `shadow-2xl` | `0 25px 50px rgba(0,0,0,0.25)` | `0 25px 50px rgba(0,0,0,0.6)` | Hero cards, featured |

---

## Layer 3: Component Tokens (Specific Aliases)

### Button

| Token | Aliases |
|-------|---------|
| `button-primary-bg` | `{color-action-primary}` |
| `button-primary-bg-hover` | `{color-action-primary-hover}` |
| `button-primary-bg-pressed` | `{color-action-primary-pressed}` |
| `button-primary-bg-disabled` | `{color-action-primary-disabled}` |
| `button-primary-text` | `{color-text-on-brand}` |
| `button-primary-border` | `transparent` |
| `button-primary-radius` | `{radius-md}` |
| `button-secondary-bg` | `{color-action-secondary}` |
| `button-secondary-bg-hover` | `{color-action-secondary-hover}` |
| `button-secondary-border` | `{color-action-secondary-border}` |
| `button-secondary-text` | `{color-action-primary}` |
| `button-ghost-bg` | `{color-action-ghost}` |
| `button-ghost-bg-hover` | `{color-action-ghost-hover}` |
| `button-ghost-text` | `{color-action-primary}` |
| `button-destructive-bg` | `{color-action-destructive}` |
| `button-destructive-bg-hover` | `{color-action-destructive-hover}` |
| `button-destructive-text` | `{color-text-on-brand}` |

### Input Field

| Token | Aliases |
|-------|---------|
| `input-bg` | `{color-surface-input}` |
| `input-border` | `{color-border-default}` |
| `input-border-hover` | `{color-border-strong}` |
| `input-border-focus` | `{color-border-focus}` |
| `input-border-error` | `{color-border-error}` |
| `input-text` | `{color-text-primary}` |
| `input-placeholder` | `{color-text-tertiary}` |
| `input-disabled-bg` | `{color-surface-hover}` |
| `input-disabled-border` | `{color-border-subtle}` |
| `input-radius` | `{radius-md}` |
| `input-padding-x` | `{space-4}` |
| `input-padding-y` | `{space-3}` |
| `input-font-size` | `{text-base}` |

### Card

| Token | Aliases |
|-------|---------|
| `card-bg` | `{color-surface-card}` |
| `card-border` | `{color-border-default}` |
| `card-shadow` | `{shadow-sm}` |
| `card-shadow-hover` | `{shadow-md}` |
| `card-radius` | `{radius-lg}` |
| `card-padding` | `{space-6}` |

### Modal / Bottom Sheet / Drawer

| Token | Aliases |
|-------|---------|
| `modal-bg` | `{color-surface-card}` |
| `modal-backdrop` | `{color-surface-overlay}` |
| `modal-radius` | `{radius-xl}` |
| `modal-shadow` | `{shadow-lg}` |
| `modal-padding` | `{space-6}` |
| `sheet-handle-bg` | `{color-border-subtle}` |
| `sheet-handle-radius` | `{radius-full}` |

---

## Spacing Tokens (8pt Grid — Strict)

| Token | Value | Rem | Usage |
|-------|-------|-----|-------|
| `space-0` | `0` | `0` | Reset |
| `space-1` | `4px` | `0.25rem` | Micro: icon+label gap |
| `space-2` | `8px` | `0.5rem` | Small: list item gap, icon padding |
| `space-3` | `12px` | `0.75rem` | Compact padding |
| `space-4` | `16px` | `1rem` | **Medium: component padding** |
| `space-5` | `20px` | `1.25rem` | Comfortable padding |
| `space-6` | `24px` | `1.5rem` | **Large: card padding** |
| `space-7` | `28px` | `1.75rem` | |
| `space-8` | `32px` | `2rem` | **XL: section gap** |
| `space-9` | `36px` | `2.25rem` | |
| `space-10` | `40px` | `2.5rem` | **2XL: large section gap** |
| `space-12` | `48px` | `3rem` | **3XL: hero padding** |
| `space-14` | `56px` | `3.5rem` | |
| `space-16` | `64px` | `4rem` | **4XL: major section gap** |
| `space-20` | `80px` | `5rem` | **5XL: page sections** |
| `space-24` | `96px` | `6rem` | **6XL: hero sections** |

**RULES:**
- ❌ NEVER use odd numbers (5px, 7px, 15px)
- ❌ NEVER use values outside this scale
- Component internal padding: `space-3` to `space-6`
- Between components: `space-4` to `space-7`
- Between sections: `space-8` to `space-12`

---

## Typography Tokens

### Font Families

| Token | Value | Fallback |
|-------|-------|----------|
| `font-display` | `"Satoshi Variable", "Clash Grotesk Variable", "Geist Variable"` | `system-ui, sans-serif` |
| `font-body` | `"Geist Variable", "Inter Variable", "Satoshi Variable"` | `system-ui, sans-serif` |
| `font-mono` | `"Geist Mono Variable", "JetBrains Mono Variable"` | `ui-monospace, monospace` |
| `font-hindi` | `"Noto Sans Devanagari Variable", "Hind Variable"` | `system-ui, sans-serif` |

### Font Sizes (Major Third Scale — 1.250 ratio)

| Token | px / line-height | rem / line-height | Usage |
|-------|------------------|-------------------|-------|
| `text-2xs` | `10px / 14px` | `0.625rem / 0.875rem` | Badges, tiny labels |
| `text-xs` | `12px / 16px` | `0.75rem / 1rem` | Captions, meta |
| `text-sm` | `14px / 20px` | `0.875rem / 1.25rem` | Helper text, secondary |
| `text-base` | `16px / 24px` | `1rem / 1.5rem` | **Body — BASE SIZE** |
| `text-lg` | `20px / 28px` | `1.25rem / 1.75rem` | H4, lead text |
| `text-xl` | `25px / 32px` | `1.5625rem / 2rem` | H3 |
| `text-2xl` | `31px / 40px` | `1.9375rem / 2.5rem` | H2 |
| `text-3xl` | `39px / 48px` | `2.4375rem / 3rem` | H1 |
| `text-4xl` | `49px / 56px` | `3.0625rem / 3.5rem` | Display |
| `text-5xl` | `61px / 72px` | `3.8125rem / 4.5rem` | Hero |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `weight-light` | `300` | Decorative only |
| `weight-regular` | `400` | Body text |
| `weight-medium` | `500` | UI labels, emphasis |
| `weight-semibold` | `600` | H3-H4, subheadings |
| `weight-bold` | `700` | H1-H2, CTAs, key numbers |
| `weight-extrabold` | `800` | Display, Hero text |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tracking-tight` | `-0.02em` | Large display text |
| `tracking-normal` | `0` | Body text |
| `tracking-wide` | `0.04em` | UI labels, caps |
| `tracking-wider` | `0.08em` | Overlines, badges |

### Semantic Typography Tokens

| Token | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| `heading-hero` | `text-5xl` | `weight-extrabold` | `1.1` | `tracking-tight` | Hero headlines |
| `heading-display` | `text-4xl` | `weight-extrabold` | `1.1` | `tracking-tight` | Display headlines |
| `heading-h1` | `text-3xl` | `weight-bold` | `1.2` | `tracking-tight` | Page titles |
| `heading-h2` | `text-2xl` | `weight-semibold` | `1.3` | `tracking-normal` | Section titles |
| `heading-h3` | `text-xl` | `weight-semibold` | `1.4` | `tracking-normal` | Sub-sections |
| `heading-h4` | `text-lg` | `weight-medium` | `1.4` | `tracking-normal` | Card titles |
| `body-lg` | `text-lg` | `weight-regular` | `1.5` | `tracking-normal` | Lead paragraphs |
| `body-base` | `text-base` | `weight-regular` | `1.5` | `tracking-normal` | **Default body** |
| `body-sm` | `text-sm` | `weight-regular` | `1.5` | `tracking-normal` | Secondary text |
| `label` | `text-sm` | `weight-medium` | `1.4` | `tracking-wide` | Form labels, buttons |
| `caption` | `text-xs` | `weight-regular` | `1.5` | `tracking-normal` | Meta, timestamps |
| `overline` | `text-xs` | `weight-semibold` | `1.4` | `tracking-wider` | Section labels, badges |

---

## Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | `0px` | Sharp corners, dividers |
| `radius-sm` | `4px` | Badges, tags, small chips |
| `radius-md` | `8px` | **Buttons, inputs, small cards** |
| `radius-lg` | `12px` | **Cards, dropdowns, popovers** |
| `radius-xl` | `16px` | **Modals, drawers, bottom sheets** |
| `radius-2xl` | `24px` | Hero cards, featured sections |
| `radius-3xl` | `32px` | Large feature cards |
| `radius-full` | `9999px` | Pills, avatars, FABs, tags |

**USAGE RULES:**
- Buttons: `radius-md` (8px)
- Inputs: `radius-md` (8px)
- Cards: `radius-lg` (12px)
- Modals/Bottom Sheets: `radius-xl` (16px)
- Avatars/Profile: `radius-full`
- Tags/Badges: `radius-full`

---

## Motion Tokens

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | `0ms` | Immediate state changes |
| `duration-micro` | `100ms` | Hover color, icon swap |
| `duration-fast` | `150ms` | Button press, checkbox |
| `duration-normal` | `200ms` | Dropdown, tooltip |
| `duration-moderate` | `300ms` | Modal, card expand |
| `duration-slow` | `400ms` | Page transition, drawer |
| `duration-very-slow` | `600ms` | Onboarding, hero entrance |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Default |
| `ease-enter` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements entering |
| `ease-exit` | `cubic-bezier(0.4, 0.0, 1.0, 1)` | Elements exiting |
| `ease-sharp` | `cubic-bezier(0.4, 0.0, 0.6, 1)` | Quick, decisive |
| `ease-spring` | `spring(stiffness: [per personality], damping: [per personality])` | Natural, organic |

### Spring Personality Map

| Personality | Stiffness | Damping | Mass | Use For |
|-------------|-----------|---------|------|---------|
| Serious (Banking/Medical) | 400 | 40 | 1 | Zero bounce, trust |
| Snappy (SaaS/Productivity) | 300 | 30 | 1 | Minimal bounce, fast |
| Smooth (E-com/Fintech) | 260 | 26 | 1 | Confident, smooth |
| Friendly (Social/Consumer) | 220 | 22 | 1 | Light bounce |
| Playful (Entertainment/Kids) | 180 | 15 | 1 | Bouncy, fun |

---

## Z-Index Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | `0` | Page content |
| `z-dropdown` | `100` | Dropdowns, popovers |
| `z-sticky` | `200` | Sticky headers, nav |
| `z-modal` | `300` | Modals, bottom sheets |
| `z-drawer` | `400` | Side drawers |
| `z-toast` | `500` | Toasts, snackbars |
| `z-tooltip` | `600` | Tooltips |
| `z-max` | `9999` | Emergency overlays |

---

## Breakpoint Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `bp-xs` | `320px` | Small mobile |
| `bp-sm` | `375px` | Mobile (iPhone SE) |
| `bp-md` | `768px` | Tablet |
| `bp-lg` | `1024px` | Desktop |
| `bp-xl` | `1440px` | Large desktop |
| `bp-2xl` | `1920px` | Ultra-wide |

---

## Figma Variables Setup

### Collections Structure

```
Collection 1: "Primitives" (Hidden from designers)
  ├── color/brand/50-900
  ├── color/neutral/0-950
  ├── color/success-500, warning-500, error-500, info-500
  ├── spacing/1-24
  ├── radius/none-full
  ├── typography/font-family-*
  ├── typography/font-size-*
  ├── typography/font-weight-*
  ├── typography/line-height-*
  └── typography/letter-spacing-*

Collection 2: "Semantic" (What designers use) — MODES: Light, Dark
  ├── color/surface/page, card, elevated, overlay, input, hover, pressed, brand
  ├── color/text/primary, secondary, tertiary, disabled, inverse, on-brand, link, success, warning, error
  ├── color/action/primary, primary-hover, primary-pressed, primary-disabled, secondary, ghost, destructive
  ├── color/border/subtle, default, strong, focus, error, success
  ├── shadow/none, xs, sm, md, lg, xl, 2xl
  └── motion/duration-*, easing-*

Collection 3: "Component" (Optional for large systems)
  ├── button/primary-*, secondary-*, ghost-*, destructive-*
  ├── input/bg, border-*, text, placeholder, radius, padding
  ├── card/bg, border, shadow, radius, padding
  ├── modal/bg, backdrop, radius, shadow, padding
  └── ...
```

### Naming Convention

```
Format: category/subcategory/variant

Examples:
  color/surface/page
  color/text/primary
  color/action/primary
  color/feedback/error/text
  space/4
  radius/md
  shadow/lg
  duration/moderate
```

---

## Developer Export — CSS Variables

```css
:root {
  /* Color Primitives — Brand */
  --color-brand-50: #EEF2FF;
  --color-brand-100: #E0E7FF;
  --color-brand-200: #C7D2FE;
  --color-brand-300: #A5B4FC;
  --color-brand-400: #818CF8;
  --color-brand-500: #6366F1;
  --color-brand-600: #4F46E5;
  --color-brand-700: #4338CA;
  --color-brand-800: #3730A3;
  --color-brand-900: #312E81;

  /* Color Primitives — Neutral */
  --color-neutral-0: #FFFFFF;
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;
  --color-neutral-950: #030712;

  /* Semantic — Surface (Light) */
  --color-surface-page: var(--color-neutral-50);
  --color-surface-card: var(--color-neutral-0);
  --color-surface-elevated: var(--color-neutral-100);
  --color-surface-overlay: rgba(17, 24, 39, 0.5);
  --color-surface-input: var(--color-neutral-0);
  --color-surface-hover: var(--color-neutral-100);
  --color-surface-pressed: var(--color-neutral-200);
  --color-surface-brand: var(--color-brand-50);
  --color-surface-brand-hover: var(--color-brand-100);

  /* Semantic — Text (Light) */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-disabled: var(--color-neutral-300);
  --color-text-inverse: var(--color-neutral-0);
  --color-text-on-brand: var(--color-neutral-0);
  --color-text-link: var(--color-brand-600);
  --color-text-success: var(--color-success-500);
  --color-text-warning: var(--color-warning-500);
  --color-text-error: var(--color-error-500);

  /* Semantic — Action (Light) */
  --color-action-primary: var(--color-brand-500);
  --color-action-primary-hover: var(--color-brand-600);
  --color-action-primary-pressed: var(--color-brand-700);
  --color-action-primary-disabled: var(--color-neutral-300);
  --color-action-secondary: var(--color-neutral-0);
  --color-action-secondary-hover: var(--color-neutral-100);
  --color-action-secondary-border: var(--color-neutral-300);
  --color-action-ghost: transparent;
  --color-action-ghost-hover: var(--color-neutral-100);
  --color-action-destructive: var(--color-error-500);
  --color-action-destructive-hover: var(--color-error-600);

  /* Semantic — Border (Light) */
  --color-border-subtle: var(--color-neutral-200);
  --color-border-default: var(--color-neutral-300);
  --color-border-strong: var(--color-neutral-400);
  --color-border-focus: var(--color-brand-500);
  --color-border-error: var(--color-error-500);
  --color-border-success: var(--color-success-500);

  /* Shadow */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
  --shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-9: 36px;
  --space-10: 40px;
  --space-12: 48px;
  --space-14: 56px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Radius */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-3xl: 32px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Satoshi Variable', 'Clash Grotesk Variable', 'Geist Variable', system-ui, sans-serif;
  --font-body: 'Geist Variable', 'Inter Variable', 'Satoshi Variable', system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', 'JetBrains Mono Variable', ui-monospace, monospace;
  --font-hindi: 'Noto Sans Devanagari Variable', 'Hind Variable', system-ui, sans-serif;

  /* Motion */
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-moderate: 300ms;
  --duration-slow: 400ms;
  --duration-very-slow: 600ms;

  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    /* Semantic — Surface (Dark) */
    --color-surface-page: var(--color-neutral-950);
    --color-surface-card: var(--color-neutral-900);
    --color-surface-elevated: var(--color-neutral-800);
    --color-surface-overlay: rgba(255, 255, 255, 0.1);
    --color-surface-input: var(--color-neutral-800);
    --color-surface-hover: var(--color-neutral-800);
    --color-surface-pressed: var(--color-neutral-700);
    --color-surface-brand: var(--color-brand-900);
    --color-surface-brand-hover: var(--color-brand-800);

    /* Semantic — Text (Dark) */
    --color-text-primary: var(--color-neutral-50);
    --color-text-secondary: var(--color-neutral-400);
    --color-text-tertiary: var(--color-neutral-500);
    --color-text-disabled: var(--color-neutral-600);
    --color-text-inverse: var(--color-neutral-950);
    --color-text-on-brand: var(--color-neutral-950);
    --color-text-link: var(--color-brand-400);

    /* Semantic — Action (Dark) */
    --color-action-primary: var(--color-brand-400);
    --color-action-primary-hover: var(--color-brand-300);
    --color-action-primary-pressed: var(--color-brand-500);
    --color-action-primary-disabled: var(--color-neutral-600);
    --color-action-secondary: var(--color-neutral-900);
    --color-action-secondary-hover: var(--color-neutral-800);
    --color-action-secondary-border: var(--color-neutral-600);
    --color-action-ghost-hover: var(--color-neutral-800);
    --color-action-destructive: var(--color-error-500);
    --color-action-destructive-hover: var(--color-error-400);

    /* Semantic — Border (Dark) */
    --color-border-subtle: var(--color-neutral-700);
    --color-border-default: var(--color-neutral-600);
    --color-border-strong: var(--color-neutral-500);
    --color-border-focus: var(--color-brand-400);

    /* Shadow (Dark) */
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.4);
    --shadow-xl: 0 20px 25px rgba(0,0,0,0.5);
    --shadow-2xl: 0 25px 50px rgba(0,0,0,0.6);
  }
}
```

---

## Developer Export — Design Token JSON (Style Dictionary Format)

```json
{
  "color": {
    "brand": {
      "50": { "value": "#EEF2FF", "type": "color" },
      "100": { "value": "#E0E7FF", "type": "color" },
      "200": { "value": "#C7D2FE", "type": "color" },
      "300": { "value": "#A5B4FC", "type": "color" },
      "400": { "value": "#818CF8", "type": "color" },
      "500": { "value": "#6366F1", "type": "color" },
      "600": { "value": "#4F46E5", "type": "color" },
      "700": { "value": "#4338CA", "type": "color" },
      "800": { "value": "#3730A3", "type": "color" },
      "900": { "value": "#312E81", "type": "color" }
    },
    "neutral": {
      "0": { "value": "#FFFFFF", "type": "color" },
      "50": { "value": "#F9FAFB", "type": "color" },
      "100": { "value": "#F3F4F6", "type": "color" },
      "200": { "value": "#E5E7EB", "type": "color" },
      "300": { "value": "#D1D5DB", "type": "color" },
      "400": { "value": "#9CA3AF", "type": "color" },
      "500": { "value": "#6B7280", "type": "color" },
      "600": { "value": "#4B5563", "type": "color" },
      "700": { "value": "#374151", "type": "color" },
      "800": { "value": "#1F2937", "type": "color" },
      "900": { "value": "#111827", "type": "color" },
      "950": { "value": "#030712", "type": "color" }
    },
    "surface": {
      "page": { "value": "{color.neutral.50}", "type": "color" },
      "card": { "value": "{color.neutral.0}", "type": "color" },
      "elevated": { "value": "{color.neutral.100}", "type": "color" }
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
    "1": { "value": "4px", "type": "dimension" },
    "2": { "value": "8px", "type": "dimension" },
    "4": { "value": "16px", "type": "dimension" },
    "6": { "value": "24px", "type": "dimension" },
    "8": { "value": "32px", "type": "dimension" }
  },
  "borderRadius": {
    "md": { "value": "8px", "type": "dimension" },
    "lg": { "value": "12px", "type": "dimension" },
    "xl": { "value": "16px", "type": "dimension" },
    "full": { "value": "9999px", "type": "dimension" }
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

---

## Token Governance Rules

1. **Never hardcode values in components** — always reference tokens
2. **Component tokens (Layer 3) are the ONLY tokens components use**
3. **Dark mode = semantic token mode switch** — no component changes
4. **Adding new primitive** → add to Primitives collection → create semantic aliases → create component aliases
5. **Changing brand color** → update `color-brand-500` → all semantic → all component tokens update automatically
6. **Token naming** = `category/subcategory/variant` (kebab-case)
7. **Document every token** with description + usage example in Figma