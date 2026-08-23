---
name: ui-execution-v2
description: Elite Figma execution skill for creating professional, production-ready screens, components, and design systems inside Figma using MCP tools. Use when: "Figma mein design karo", "screen banao Figma mein", "component banao", "wireframe", "Figma se design karo", "UI spec chahiye", "design system Figma mein", "design review", "UI improve karo Figma mein", "auto-layout", "design tokens Figma", "beast UI", "top 1% UI".
version: 2.0
---
# Figma Design v2 — Elite Execution Skill (Beast Mode Enabled)

> **Hierarchy:** Tier 1 = UX Brain (ux-thinking) | Tier 2 = design-taste-frontend | Tier 3 = THIS SKILL
> UX laws and psychology → ux-thinking is the authority.
> This skill executes those decisions inside Figma or high-fidelity UI code.
> If a UI decision violates a ux-thinking law → FLAG IT before proceeding.

---

## Authority Note

```
references/ux-laws.md in this skill = DEPRECATED.
Canonical UX law source = ux-thinking skill (37 Laws + 4 Frameworks).
When Q3 (Which UX Laws apply?) is answered below, cite ux-thinking laws by number.
Do NOT use internal ux-laws.md for law decisions.
```

---

## Mandatory: Web Search (Before Starting Any Design)

Search for current trends:
```
Query: "[product type] UI design [current year] trending"
Example: "fintech app UI design 2026" / "food delivery dark mode design 2026"
```
Then read `references/design-trends.md` to cross-reference.

---

## Mandatory: Premium Visual Check (Beast Mode Gate)

Run this gate before finalizing any screen:

```
PREMIUM VISUAL GATE (BEAST MODE):
☐ Layout: Bento grid or editorial composition? (No generic 12-col card soup)
☐ Typography: Large H1 hero + micro ALL-CAPS labels? (No uniform text sizes)
☐ Spacing: p-8 or p-12 extreme whitespace? (No cramped p-4 everywhere)
☐ Shadows: Soft multi-layer 0 20px 40px rgba? (No heavy single shadow-xl/lg)
☐ Borders: Hairline border-white/10 or border-black/5? (No thick 1px solid borders)
☐ Colors: 95% mono + 1 vibrant accent? (No rainbow multi-color palette)
☐ Glassmorphism: backdrop-blur-xl + bg-white/5 if used? (No heavy opaque glass)
☐ WWTD check: Would Linear/Stripe/Apple approve this?
```

If any box is unchecked → fix before delivery. No exceptions.

---

## Top 1% Premium UI Aesthetic Engine (Beast Mode Specs)

### 🚫 1. Banned Rules
- **NO Default Colors:** Never use pure `#FF0000` or basic HEX primary colors. Always use tinted, desaturated, or HSL-based sophisticated palettes (e.g., slate, zinc, neutral-800).
- **NO Heavy Drop Shadows:** Ban `shadow-lg` or `shadow-xl` with high opacity.
- **NO Boring Grids:** Ban standard symmetrical 12-column card layouts unless it's a data table.
- **NO Generic Fonts:** Ban Roboto, Arial, Open Sans. (Use Inter, Geist, Satoshi, SF Pro, or elegant Serif for editorial).
- **NO Cluttered Borders:** Ban thick grey borders separating every item.

### ✨ 2. Top 1% Aesthetics Specs
- **Bento Box Grids:** Use asymmetrical grid layouts (Bento grids) with varying card sizes (e.g., 2x2, 1x2) for dashboards and features.
- **Editorial Typography:** Massive contrast in typography. Huge, tracking-tight (letter-spacing tight) H1s, paired with tiny, tracking-wide ALL-CAPS micro-labels.
- **Extreme Whitespace (Let it breathe):** Double the padding/margins you usually apply. If you think `p-4` is good, make it `p-8` or `p-12`. Spatial design is premium.
- **Subtle Glassmorphism:** Use `backdrop-blur-xl`, `bg-white/5` (dark mode) or `bg-white/60` (light mode).
- **Hairline Borders:** Use 1px borders with very low opacity (e.g., `border-white/10` or `border-black/5`) to define structure without adding noise.
- **Multi-layered Soft Shadows:** Instead of heavy shadows, use extremely soft, wide-spread, low-opacity shadows (e.g., `0px 20px 40px rgba(0,0,0,0.04)`).
- **Inner Glows / Edge Highlights:** Give cards a premium feel with subtle inner borders (e.g., `box-shadow: inset 0 1px 0 rgba(255,255,255,0.1)`).
- **Monochrome + 1 Neon/Vibrant Accent:** 95% of the UI should be shades of monochrome (black, white, greys). Only 5% should use a highly vibrant accent color (e.g., Electric Violet, Emerald, or Neon Cyan).
- **Mesh Gradients & Glows:** For hero backgrounds or empty states, use soft, blurred, multi-colored mesh gradients placed behind UI elements (`blur-3xl`).
- **Surface Elevation:** In dark mode, don't use pitch black (`#000000`) everywhere. Use deep slates (e.g., `#09090B`) and elevate cards with slightly lighter tones (`#18181B`).
- **Pill Shapes & Squircles:** Use fully rounded pill shapes for badges, status indicators (`rounded-full`) and `rounded-2xl` / `rounded-3xl` for modern app-like cards.
- **Text Gradients:** Key headings can have subtle linear text gradients (e.g., `bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60`).

### 🎯 3. Reference Framework (WWTD - What Would They Do?)
Before finalizing any UI, ask yourself:
- *Would Linear approve this layout?* (Dark, sharp, minimal, glow effects)
- *Would Stripe approve this form?* (Soft, highly polished, perfect micro-interactions, clean typography)
- *Would Apple approve this spacing?* (Massive margins, extreme clarity, perfect hierarchy)

---

## Beast Mode: 80-15-5 Color Enforcement System

Every screen MUST pass this ratio before delivery. No exceptions.

### The 3-Role System
```
| Role       | Colors             | Budget | Usage                                    |
|------------|--------------------|--------|------------------------------------------|
| Structure  | Zinc / Slate       | 80%    | Backgrounds, cards, nav, borders, text   |
| Action     | Indigo             | 15%    | Primary CTA buttons ONLY                 |
| Status     | Emerald/Amber/Rose | 5%     | Success, Paid, Live, Warning, Error ONLY |
```

### Allowed Color Classes (Whitelist)
```css
/* PRIMARY CTA ONLY — clickable + primary action */
bg-indigo-600 text-white hover:bg-indigo-700

/* Interactive icon container — hover state ONLY */
bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600

/* Hero gradient — MAX 1 per page, username/title only */
bg-gradient-to-r from-indigo-600 to-purple-600

/* Success / Paid / Live */
bg-emerald-500 animate-pulse   /* live dot */
text-emerald-600               /* status label */

/* Warning / Pending */
text-amber-600 bg-amber-100

/* Error / Overdue */
text-rose-600 bg-rose-100
```

### Banned Color Usage (Hard Reject)
```
❌ Indigo on decorative / non-clickable elements → use slate-100
❌ Indigo on informational icon containers → use slate-100 text-slate-500
❌ Emerald for anything non-success → remove
❌ Multiple gradients per screen → max 1 only
❌ shadow-xl with backdrop-blur → use shadow-sm only
❌ bg-gradient on empty states → use bg-slate-100 dark:bg-slate-800
```

### One-Line Decision Rule
> "Agar element clickable hai aur primary action hai → Indigo.
> Agar success/live/paid status hai → Emerald.
> Baaki sab → Zinc. Koi exception nahi."

### Color Audit Gate (Run Per Screen)
```
COLOR AUDIT:
☐ Count Indigo elements — are they ALL primary CTAs? (max 15% of screen)
☐ Count Emerald elements — are they ALL status indicators? (max 5%)
☐ Remaining visual weight — is it 80%+ Zinc/Slate?
☐ Gradient count — max 1 per page?
☐ Non-interactive Indigo — zero tolerance?
☐ shadow-xl + blur combo — zero tolerance?
```

---

## Beast Mode: Glassmorphism Stack (Exact Spec)

```css
/* CORRECT — use exactly this combination */
backdrop-blur-md          ✅
bg-white/90               ✅
dark:bg-slate-900/90      ✅
border border-slate-100/50 ✅
shadow-sm                 ✅

/* NEVER combine these */
shadow-xl + backdrop-blur  ❌  /* blur already provides depth */
```

---

## Beast Mode: Layout Templates

### Template 1 — Bento Dashboard
```
┌──────────────────────┬──────────────┐
│                      │              │
│   Hero Stat Card     │  Quick       │
│   (2x height)        │  Action      │
│                      │  Card        │
├────────────┬─────────┴──────────────┤
│            │                        │
│  Metric    │   Activity Feed        │
│  Card      │   (full-width)         │
│            │                        │
└────────────┴────────────────────────┘

Rules:
- Cards MUST vary in size (1x1, 2x1, 1x2) — NO uniform grid
- gap-4 between cards, p-8 container padding
- Hero card = gradient bg (max 1), rest = zinc surface
```

### Template 2 — Editorial Feature Page
```
┌─────────────────────────────────────┐
│  TRACKING-WIDE ALL-CAPS MICRO LABEL │
│                                     │
│  Massive H1 Hero                    │
│  tracking-tight                     │
│                                     │
│  Subtitle in muted text             │
│                                     │
│         [Primary CTA Button]        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         p-12 extreme                │
│         whitespace                  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Feature  │  │ Feature  │        │
│  │ Card 1   │  │ Card 2   │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘

Rules:
- H1: text-4xl md:text-6xl font-bold tracking-tight
- Micro label: text-xs uppercase tracking-widest text-slate-500
- Section gap: py-16 md:py-24
- Max-width container: max-w-4xl mx-auto
```

### Template 3 — Card Detail / Profile
```
┌─────────────────────────────────────┐
│  ← Back                            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Avatar/Image         Status ●  ││
│  │                                 ││
│  │  Name                           ││
│  │  Subtitle                       ││
│  │                                 ││
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ││
│  │  │ Stat  │ │ Stat  │ │ Stat  │ ││
│  │  └───────┘ └───────┘ └───────┘ ││
│  └─────────────────────────────────┘│
│                                     │
│  Section Title                      │
│  ┌─────────────────────────────────┐│
│  │ List Item Row                →  ││
│  ├─────────────────────────────────┤│
│  │ List Item Row                →  ││
│  └─────────────────────────────────┘│
│                                     │
│  [Full Width CTA Button]           │
└─────────────────────────────────────┘

Rules:
- Status badge: Emerald for active, Amber for pending, Rose for overdue
- Stats row: 3 items max (Miller's Law), zinc surface
- List rows: min-height 56px touch target
- CTA: sticky bottom on mobile, indigo-600
```

### Template 4 — Empty State
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         [Illustration/Icon]         │
│                                     │
│         No [Items] Yet              │
│         (Friendly microcopy)        │
│                                     │
│         [Primary CTA Button]        │
│                                     │
│                                     │
└─────────────────────────────────────┘

Rules:
- bg-slate-100 dark:bg-slate-800 — NO gradient backgrounds
- Icon: Lucide React, text-slate-400, 48px
- Title: text-lg font-semibold text-slate-900
- Body: text-sm text-slate-500, max-w-xs mx-auto
- CTA: indigo-600 ONLY if primary action exists
```

---

## Beast Mode: 8-State Component Matrix

Every interactive component MUST define all 8 states. Ship with missing states = rejected.

```
STATE        │ VISUAL SPEC                              │ FEEDBACK
═════════════╪══════════════════════════════════════════╪══════════════════════
1. Default   │ Base resting appearance                  │ None
2. Hover     │ bg-opacity shift (+5%), cursor pointer   │ 150ms ease-out
3. Active    │ scale(0.97-0.98), bg-darken 10%         │ <100ms, haptic light
4. Focus     │ ring-2 ring-indigo-500 ring-offset-2    │ Keyboard only
5. Loading   │ Spinner replaces icon/text, bg unchanged│ Disable re-tap
6. Disabled  │ opacity-40, cursor-not-allowed           │ None (no haptic)
7. Error     │ border-rose-500, bg-rose-50, icon+text  │ Shake animation 400ms
8. Success   │ border-emerald-500, bg-emerald-50, ✓    │ Scale pop 200ms
```

### State Transition Map (Which State Can Go Where)
```
Default → Hover → Active → Loading → Success/Error
Default → Focus → Active → Loading → Success/Error
Default → Disabled (no other transitions)
Error → Default (on retry/fix)
Success → Default (after 2s auto-reset or manual)
Loading → Success | Error (never back to Default directly)
```

---

## Mandatory Reference Files (Read These)

| File | When to Read |
|------|-------------|
| `references/design-trends.md` | ALWAYS — fonts, colors, icons, layouts |
| `references/aesthetic-system.md` | ALWAYS — personality + font pairing |
| `references/indian-patterns.md` | ALWAYS when product targets Indian users |
| `references/figma-architecture.md` | Spacing, tokens, components, grid setup |
| `references/motion-specs.md` | When interaction/animation specs needed |
| `references/design-pipeline.md` | Pipeline stage selection |

Note: `references/ux-laws.md` is deprecated. Use ux-thinking skill for all law decisions.

---

## Pre-Execution Protocol — 5 Questions Before Design

### Q1: Who is this for?
> User: [age, city tier, tech literacy, primary device, language preference]
> Emotional goal: What should they FEEL? (Trusted / Excited / Safe / Empowered)

### Q2: Aesthetic Personality? (from aesthetic-system.md)
> ONE from: Minimal Premium / Dark Dramatic / Bold Editorial / Warm Indian / Soft Friendly / Vibrant Expressive / Clean Corporate / Luxury Refined
> Reason: "[Personality] because [product type + user emotional goal]"
> Commit fully. Never mix personalities.

### Q3: Which 3 ux-thinking Laws are most critical here?
> Check ux-thinking Step 2 auto-activation for this screen type.
> Law 1: [Name + Number] — because [specific reason for this screen]
> Law 2: [Name + Number] — because [specific reason]
> Law 3: [Name + Number] — because [specific reason]
> FLAG any Figma decision that violates these laws.

### Q4: Primary action on this screen?
> One screen = one job. State it: "User must [action] without friction."
> Everything else is secondary.

### Q5: Indian market context? (from indian-patterns.md)
> Tier: [1/2/3] | Language: [Hindi/English/Bilingual]
> Special: [UPI flow / bilingual layout / trust signals / offline state]

**Only after answering all 5 → begin execution.**

---

## Execution Protocol

### Step 1: Plan Structure (Write Before Figma)
1. Screen layout in words
2. Component list — every element named
3. Color palette — from aesthetic personality
4. Typography — from font pair of personality
5. Spacing tokens — all on 8pt grid

### Step 2: Execute in Figma (MCP Tools)
```
1. figma_get_status         → Confirm connection
2. figma_get_file_data      → Understand file structure
3. figma_execute            → Build in this order:
   - Main frame (correct device size from figma-architecture.md)
   - Auto Layout on ALL containers (zero manual positioning)
   - Components with ALL 8 states (see below)
   - Semantic color tokens (never bare hex)
   - Typography from scale
   - Real microcopy (zero lorem ipsum — ever)
   - Accessibility + focus order
   - Edge case handling on all text containers
4. figma_capture_screenshot → Verify visually
5. Iterate from screenshot
```

### Step 3: UX Law Compliance Check
Before delivering, verify against ux-thinking laws selected in Q3:
```
LAW COMPLIANCE CHECK:
✅ Law 1 [name]: [How this design satisfies it]
✅ Law 2 [name]: [How this design satisfies it]
✅ Law 3 [name]: [How this design satisfies it]
❌ Any violations? → FLAG before delivery, propose fix
```

---

## Design Specs Delivery Format

```
════════════════════════════════════════════════════════════════
DESIGN SPECS
════════════════════════════════════════════════════════════════
AESTHETIC PERSONALITY: [Name]
FONT PAIR: [Display] + [Body]
PRIMARY ACTION: [One job of this screen]

TYPOGRAPHY:
  Heading:  [size]px / [weight] / [line-height]px
  Body:     [size]px / [weight] / [line-height]px
  Caption:  [size]px / [weight] / [line-height]px

COLORS (Semantic tokens only — no bare hex):
  surface-primary:   [hex]
  action-accent:     [hex]
  text-primary:      [hex]

SPACING: All values on 8pt grid
  Section gap:    [value]px
  Card padding:   [value]px
  Component gap:  [value]px

COMPONENT STATES (all 8):
  Default | Hover | Active/Pressed | Focus | Loading | Disabled | Error | Success

AUTO LAYOUT:
  [Frame]: Direction [Row/Col] | Gap [px] | Padding [T R B L] | Sizing [Hug/Fill]

ACCESSIBILITY:
  Contrast: [ratio]:1 (AA/AAA) — must pass ux-thinking Layer 8
  Touch targets: [size]px minimum (44px floor)
  Focus order: [1→2→3...]

INDIAN MARKET:
  Tier: [1/2/3] | Language: [Hindi/English/Bilingual]
  Special patterns: [list]

════════════════════════════════════════════════════════════════
DESIGN RATIONALE (ux-thinking Brain Notes)
════════════════════════════════════════════════════════════════
Aesthetic: [Personality] — [Why: connect to user emotional goal]
Law 1 Applied: [Name] — [Specific UI decision made because of this law]
Law 2 Applied: [Name] — [Specific UI decision]
Law 3 Applied: [Name] — [Specific UI decision]
What makes this senior: [The one decision a junior would NOT have made]
════════════════════════════════════════════════════════════════
```

---

## Component Architecture

### Auto-Layout Rules (Non-Negotiable)
```
- EVERY container = Auto Layout. No exceptions.
- Nested Auto Layout: inner component → parent frame → page frame
- Sizing: Hug content for components, Fill container for layouts
- Min/Max width set on all responsive elements
- Resizing behavior defined for every text layer
```

### Design Token System (Figma Variables)

```
COLOR TOKENS (never bare hex):
  semantic/brand/primary
  semantic/brand/secondary
  semantic/status/success | warning | error | info
  semantic/text/primary | secondary | tertiary | disabled
  semantic/surface/primary | secondary | elevated

SPACING TOKENS (8pt grid):
  spacing/4 = 4px
  spacing/8 = 8px
  spacing/16 = 16px
  spacing/24 = 24px
  spacing/32 = 32px
  spacing/48 = 48px

RADIUS TOKENS:
  radius/sm = 4px   (badges, chips)
  radius/md = 8px   (buttons, inputs)
  radius/lg = 12px  (cards)
  radius/xl = 16px  (modals, sheets)
  radius/pill = 9999px
```

### Component States (Build All 8 — Always)
```
1. Default    — base resting state
2. Hover      — web only, subtle bg change
3. Active     — pressed/clicked, scale 0.98
4. Focus      — keyboard focus ring, 2-3px offset
5. Loading    — spinner inside button, content skeleton
6. Disabled   — 0.4 opacity, cursor not-allowed
7. Error      — red semantic token + icon + text
8. Success    — green semantic token + checkmark
```

---

## Quick Reference — Measurements

### Spacing (8pt Grid)
```
4px   Micro (icon + label gap)
8px   Small (list item gap)
16px  Component padding
24px  Card padding
32px  Between sections
48px  Hero padding
64px  Major section gaps
```

### Typography Scale
```
12/16px  Captions, labels
14/20px  Helper text
16/24px  Body (base)
20/28px  H4, subheadings
25/32px  H3
31/40px  H2
39/48px  H1
```

### Touch Targets
```
Minimum:   44×44px (ux-thinking Layer 8 requirement)
Preferred: 56×56px (India Tier 2/3)
```

---

## Microcopy Rules
```
- Zero lorem ipsum. Ever.
- CTA buttons: Verb + Noun ("Save Changes", "Pay ₹1,299", "अपॉइंटमेंट बुक करें")
- Error: [What happened] + [Why] + [What to do next]
- Empty state: Explain + Encourage (never "No data")
- Indian: ₹ symbol, lakh/crore, DD/MM/YYYY dates
```

---

## Pipeline Reference

| Request | Start Stage | End Stage |
|---------|-------------|-----------|
| "Just design the UI" | Stage 7 (Hi-Fi) | Stage 8 |
| "Design a screen" | Stage 6 (Mid-Fi) | Stage 9 |
| "Design a feature" | Stage 4 (Journey) | Stage 10 |
| "Design a product" | Stage 1 (Personas) | Stage 11 |
| "Create components" | Stage 9 | Stage 9 |
| "Fix/improve design" | Stage 7 | Stage 8 |

Full pipeline: `references/design-pipeline.md`

---

## Component Specs Database (From references/components.md)

### Buttons
```
Primary:   56px height mobile / 48px web | full-width mobile | min 120px web
Secondary: Same height | outlined | same touch target
Danger:    Red semantic color | confirm dialog required before action
States:    Default | Hover | Active | Loading (spinner inside) | Disabled | Success
```

### Cards
```
Padding:       16px (compact) / 24px (standard) / 32px (featured)
Border radius: 12px standard / 16px large / 8px small
Border:        0.5px subtle OR no border + shadow
Shadow:        box-shadow: 0 1px 3px rgba(0,0,0,0.1) — never heavy
```

### Forms
```
Input height:    48px mobile / 40px web
Label:           above input, never placeholder-only
Error:           below field, red + icon + text (never color alone)
Helper text:     below field, muted, 12px
Real-time validate: on blur (not on keypress)
Submit button:   shows loading → success/error state
```

### Navigation
```
Mobile:  Bottom tab, max 5 items, icon + label always
Web:     Top nav OR left sidebar — never both primary
Modal:   Close = top-right X + swipe-down + Escape key
Drawer:  Left side, overlay dark bg, swipe-right to close
```

### Charts
```
Type selection:
  Trend over time    → Line chart
  Comparison         → Bar chart
  Part of whole      → Donut (max 5 segments)
  Distribution       → Histogram
  Correlation        → Scatter

Rules:
  - Legend always visible, near chart
  - Tooltip on hover/tap with exact values
  - Empty state: message + guidance, not blank axes
  - Accessible colors: never red+green only
  - Screen reader: aria-label on chart describing key insight
```

---

## Animation Rules
```
Micro-interactions:  150-200ms ease-out
Screen transitions:  300-400ms
Skeleton screens:    Shimmer, 1.5s loop, never static grey
Spring physics:      Preferred over cubic-bezier for natural feel
Properties to animate: transform + opacity ONLY
Never animate:       width / height / top / left (causes reflow)
Reduced motion:      Always define prefers-reduced-motion fallback
Max simultaneous:    3 animations on budget Android
Exit faster:         Exit = 60-70% of enter duration
```

---

## Pre-Delivery QA Checklist (Run Before Every Delivery)

```
VISUAL:
☐ Correct breakpoints tested (375 / 768 / 1024 / 1440)?
☐ Dark mode works without hardcoded colors?
☐ No emojis as icons (use SVG/Phosphor/Lucide)?
☐ Icon style consistent throughout?
☐ No lorem ipsum anywhere?

INTERACTION:
☐ All tap targets ≥44px?
☐ Loading state on all async actions?
☐ Error states built (not just happy path)?
☐ Empty states designed?
☐ Back/cancel always available?

ACCESSIBILITY:
☐ Contrast 4.5:1 on all text?
☐ Labels on all inputs?
☐ Color + icon + text on errors (not color alone)?
☐ Focus order logical?
☐ prefers-reduced-motion handled?

UX LAW COMPLIANCE (from ux-thinking):
☐ Severity Critical issues addressed?
☐ No anti-patterns from Layer 7?
☐ Layer 8 (WCAG) fully passed?
```
---
## 10-Year Creative Director Protocol: Top 1% Execution Standards
* **Color Discipline:** 90% Restrained Neutrals (Zinc/Slate/Charcoal), 10% Purposeful Accent. DO NOT use pure `#000` or pure `#FFF`.
* **Elevated Borders & Shadows:** Hairline borders (`border-white/10` in dark mode, `border-black/5` in light mode). Soft, diffused shadows (never hard drops).
* **Typography Hierarchy:** Extreme weight jumps (Bold Display + Regular Body). Strict tracking rules: Negative for large fonts, wide positive spacing for all-caps microcopy. 
* **The "Would Stripe Ship This?" Check:** If it looks like a generic Dribbble template with colorful card soup—delete it. Aim for "Quiet Luxury" and ruthless functional minimalism.
