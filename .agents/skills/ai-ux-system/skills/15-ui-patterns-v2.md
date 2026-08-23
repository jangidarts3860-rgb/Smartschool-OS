---
name: ui-patterns-v2
description: UI Pattern Library — Visual styles, layout systems, component specs, animation rules, accessibility, performance. Use for: "component banao", "UI build karo", "layout fix karo", "responsive karo", "animation add karo", "dark mode", "glassmorphism", "bento grid", "accessibility check karo", "chart banana hai", "code review karo".
version: 2.0
---
# UI Patterns v2 — Visual Execution Database

> **Hierarchy:** Tier 1 = ux-thinking (laws) | Tier 2 = design-taste-frontend (code) | Tier 3 = THIS SKILL
> **This skill executes.** Laws come from ux-thinking. Code quality from design-taste-frontend.

---

## Style Database — 50+ Visual Personalities

| Style | Canvas | Primary | Radius | Shadow | Font Pair | Use Case |
|-------|--------|---------|--------|--------|-----------|----------|
| Minimal Premium | `#FFFFFF` | 1 accent | 8-12px | `shadow-sm` | Inter + Geist | Luxury, Portfolio |
| Dark Dramatic | `#0A0A0A` | Brand-400 | 12-16px | `shadow-lg` + glow | Geist Mono + Geist | Dev tools, Creative |
| Bold Editorial | `#FAFAFA` | High contrast | 0-4px | None | Clash Grotesk + Inter | Media, Brand |
| Warm Indian | `#FFFEF7` | Amber `#D97706` | 12-16px | Warm `shadow-sm` | Mukta + Inter | FinTech, Gov, Health |
| Soft Friendly | `#FEF7EE` | Orange `#EA580C` | 16-24px | Layered | Nunito + Inter | Kids, Education |
| Vibrant Expressive | `#FFFFFF` | Multi (Pink/Purple/Teal) | 12-16px | Colored | Display + Inter | Consumer, Social |
| Clean Corporate | `#F8FAFC` | Blue `#2563EB` | 8px | `shadow-sm` | Inter + Roboto | Enterprise, B2B |
| FinTech Dark | `#0F1117` | Green `#10B981` | 8-12px | Ring shadows | JetBrains Mono + Inter | Trading, Banking |
| Glassmorphism | Blur `20px` | White `0.1` | 16-24px | Multi-layer | Inter + SF Pro | Landing, Onboarding |
| Claymorphism | Pastel | Same | 24-32px | Inset/Outset | Quicksand + Inter | Playful, Kids |
| Brutalism | `#FFFFFF` | Black | 0px | Hard borders | Courier + System | Experimental, Art |
| Neumorphism | `#E0E5EC` | Same | 16-20px | Inset/Outset soft | Inter + SF Pro | Calm, Health |
| Flat 2.0 | `#FAFAFA` | 1 accent | 4-8px | Subtle `shadow-sm` | System fonts | Mobile Apps, Web |

---

## Layout Patterns

### Mobile (India-First)
```
- Max content width: 390px (iPhone base), test at 375px
- Bottom CTA: Fixed, full-width, 56px height, 16px from edge
- Tab bar: 4-5 items, icon + label, 83px height (iOS) / 80dp (Android)
- Cards: 16px horizontal margin, 12px gap between cards
- Section spacing: 24px between sections, 16px within section
- Safe area: Respect notch top, gesture bar bottom (34px iOS)
```

### Web (Responsive)
```
Breakpoints: 375 / 768 / 1024 / 1440
Container: max-w-7xl (1280px), centered, 16px mobile padding
Grid: CSS Grid preferred over flex-math
Sidebar: 240-280px fixed, collapsible at 768px
Header: 64px fixed, search + notifications + avatar
Hero: min-h-[100dvh] (not h-screen)
```

### Dashboard
```
- Metric cards: 2-4 cols, same height, 8px gap
- Sidebar: Left, 240px, collapsible to 72px (icons only)
- Header: 64px, search (Cmd+K), notifications, avatar
- Content: padding 24px, max-w-full
- Charts: 300-400px height, responsive width
```

---

## Component Specs

### Buttons
```
Primary:   56px mobile / 48px web | full-width mobile | min 120px web
Secondary: Same height | outlined | same touch target
Danger:    Red semantic | confirm dialog required before action
States:    Default | Hover | Active (scale 0.98) | Loading (spinner) | Disabled (0.4 opacity) | Success
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
Label:           Above input, never placeholder-only
Error:           Below field, red + icon + text (never color alone)
Helper text:     Below field, muted, 12px
Validation:      On blur (not keystroke)
Submit button:   Loading → Success → Error states
```

### Navigation
```
Mobile:  Bottom tab, max 5 items, icon + label always
Web:     Top nav OR Left sidebar — never both primary
Modal:   Close = X + swipe-down + Escape key
Drawer:  Left side, overlay dark bg, swipe-right to close
```

### Images
```
Product screenshots: 1px border `#E5E7EB`, radius 5-8px
Dashboard/workflow: Prominent in feature sections
Light gradient: Behind hero content
Distinctive:
  - Social icons: 14px radius, circular, 1px border
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

### Spring Personality Guide
```
Product Type         Stiffness  Damping  Mass  Feel
Banking/Medical      400        40       1     Zero bounce, serious
SaaS/Productivity    300        30       1     Snappy, minimal bounce
E-com/Fintech        260        26       1     Smooth, confident
Social/Consumer      220        22       1     Light bounce, friendly
Entertainment/Kids   180        15       1     Bouncy, playful
```

---


---

## Edge Cases & Stress Testing (UI Resilience)

```
1. The German Word Test: Long titles/names (45+ chars) 
   → Spec: Use `truncate` or `line-clamp-2` with `break-words`.
2. The "999+" Test: Badges and counters must stop growing. 
   → Spec: Design for 1, 10, and 99+. Box width must adjust without breaking layout.
3. Missing Data: No avatar image uploaded? 
   → Spec: Fallback to initials with a generated solid background color.
4. Permissions Denied: Camera/Mic/Location blocked by OS.
   → Spec: Clean fallback UI explaining *why* it's needed with a CTA to "Open Settings".
```

---

## Offline & Network States (India-First)

```
RULES FOR SLOW/DROPPED NETWORKS:
- Loading Skeletons: Exact shape of incoming content (not generic boxes), 1.5s shimmer loop.
- Offline Banner: Unobtrusive banner (e.g., bg-amber-100) "You are offline. Showing cached data."
- Optimistic UI: Immediately update UI for basic actions (Like, Save, Bookmark) while offline, sync in background when network returns.
```

## Accessibility Implementation

```
Contrast (WCAG AA minimum):
  Normal text:  4.5:1
  Large text:   3:1 (≥18pt / ≥14pt bold)
  UI elements:  3:1

Touch targets:
  iOS:     44×44pt minimum
  Android: 48×48dp minimum
  India:   56×56px preferred (Tier 2/3)

Never color-only:
  ✅ Error = Icon + Text + Border
  ✅ Success = Icon + Text + Border
  ✅ Links = Underline + Color
  ❌ Red text only

Focus:
  Visible ring: 2px, 2px offset, brand color
  Order: Top-left → Bottom-right logical
  Skip link: First focusable element

Screen reader:
  aria-label on icon buttons
  aria-describedby on errors
  role="alert" on toasts
  lang="hi" / "en" per element

Motion:
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    .skeleton, .progress-bar, :focus-visible { animation-duration: 1s !important; }
  }
```

---

## Charts

```
Type Selection:
  Trend over time     → Line chart
  Comparison          → Bar chart
  Part of whole       → Donut (max 5 segments)
  Distribution        → Histogram
  Correlation         → Scatter

Rules:
- Legend always visible, near chart
- Tooltip on hover/tap with exact values
- Empty state: Message + guidance, not blank axes
- Accessible colors: Never red+green only
- Screen reader: aria-label describing key insight
```

---

## Data Density & Elite Table Systems

### Data Table Anatomy (Stripe/Linear Standard)

#### Grid & Row Spacing
```
Row Heights (Strict Sizes):
  Compact:   36px (highly dense, data analysis)
  Standard:  44px (general SaaS dashboards — DEFAULT)
  Spacious:  56px (low density, media rows, user profiles)

Cell Paddings: Left & Right padding minimum 16px.
  Text, status, ID tags        → Left-aligned
  Numbers, currencies, metrics → Right-aligned (easier downward scanning)
  Actions (meatballs, edit)    → Pinned to extreme right

Borders & Grids:
  ❌ BAN vertical gridlines. Use only horizontal divider lines.
  Divider: border-slate-100 / dark:border-slate-900 at 0.5px or 1px max.
  ❌ BAN zebra striping on modern UIs.
  ✅ Use subtle hover state highlights: hover:bg-slate-50/50 / hover:bg-zinc-900/30.
```

#### Typography Hierarchy Inside Cells
```
Headings:          11px uppercase, semi-bold/medium, muted (text-slate-400 / dark:text-zinc-500), tracking-wider
Primary Cell Text: 13px or 14px, regular/medium, high contrast (text-slate-900 / dark:text-zinc-100)
Secondary Text:    12px, regular, muted (text-slate-500 / dark:text-zinc-400)
Rule: Max 2 weights per cell system (Regular + Medium). No font weight bloat.
```

### Advanced Filters & Search Composition
```
The "Filter Bar" Pattern (Hick's Law — prevent paralysis with 1000s of rows):
1. Interactive search field: Left-aligned, search icon, placeholder, shortcut (⌘F)
2. Filter chips: Dynamic badges [Key: Value] [x]. E.g., "Status: Paid (x)", "Role: Admin (x)"
3. Save View: Inline CTA "Save this view" — B2B power-user bookmark for complex filter combos
4. Empty Filter State: Clear "Reset filters" CTA (Fitts's Law — easy escape)
```

### Power-User Interactive Patterns

#### Command Menu (CMD+K)
```
Trigger: Global keydown (⌘K / Ctrl+K)
Visuals: Centered overlay modal, backdrop-blur-md, hairline border, shadow-sm
Structure:
  - Focused input at top ("Search actions, documents, students...")
  - Miller-chunked sections: "Recents", "Navigation", "Actions", "Settings"
  - Key indicators on right (Enter to run, Tab to expand, ⌥P for profile)
```

#### Multi-Select Action Drawers
```
When users select multiple table rows via checkboxes, bottom bar slides up:
  Background: bg-slate-900 dark:bg-zinc-900/90 + inner glow (border-t border-white/10)
  Content: "3 items selected" + quick action icons ("Change status", "Delete", "Export")
  Destructive primary button ONLY if action is irreversible (Severity Critical warnings)
```

### Table Performance & Scanning QA
```
☐ Pinned header row stays fixed on vertical scrolling?
☐ Cell widths auto-truncate with ellipses (text-ellipsis overflow-hidden whitespace-nowrap)?
☐ Status indicators use colored pills with dual-signal markers (color + icon)?
☐ Column headers show sort arrow ONLY on hover/active (no visual pollution)?
☐ Skeletal loading layout mimics rows exactly with 1500ms shimmer pulse?
```

---

## Performance Checklist

```
Images:    WebP/AVIF | lazy load | width/height set (prevent CLS)
Fonts:     font-display: swap | preload critical only
Animation: transform/opacity only | requestAnimationFrame for JS
Lists:     Virtualize at 50+ items
Bundle:    Route-level code splitting
Mobile:    Test on slow 3G + budget Android
```

---

## Pre-Delivery QA Checklist

```
VISUAL:
☐ Correct breakpoints tested (375 / 768 / 1024 / 1440)?
☐ Dark mode works without hardcoded colors?
☐ No emojis as icons (use SVG/Phosphor/Lucide)?
☐ Icon style consistent throughout?
☐ No lorem ipsum anywhere?

INTERACTION:
☐ All tap targets ≥44px? (56px India)
☐ Loading state on all async actions?
☐ Error states built (not just happy path)?
☐ Empty states designed?
☐ Back/cancel always available?

ACCESSIBILITY:
☐ Contrast 4.5:1 on all text?
☐ Labels on all inputs?
☐ Color + icon + text on errors?
☐ Focus order logical?
☐ prefers-reduced-motion handled?

PERFORMANCE:
☐ Images lazy loaded below fold?
☐ No layout shift on load?
☐ Animations on transform/opacity only?

UX LAW COMPLIANCE (from ux-thinking):
☐ Severity Critical issues addressed?
☐ No anti-patterns from Layer 7?
☐ Layer 8 (WCAG) fully passed?
```

---

## Quick Reference Cards

### Button Spec
```
Primary:   bg=action-primary, text=text-on-brand, radius=8px, h=56px/48px
Secondary: bg=transparent, border=action-secondary-border, text=action-primary
Ghost:     bg=transparent, text=action-primary
Danger:    bg=action-destructive, text=text-on-brand
Sizes:     sm=32px, md=40px, lg=48px, xl=56px
Min width: 80px
States:    8 (default, hover, active, focus, loading, disabled, success, error)
```

### Input Spec
```
Height:      48px mobile / 40px web
Padding:     12px 16px
Border:      1px border-default / 2px border-focus
Radius:      8px
Label:       14px medium, above, persistent
Error:       border-error (2px), icon + text below, 12px
Helper:      12px regular, text-tertiary, below field
Placeholder: text-tertiary, never as label
```

### Card Spec
```
Padding:     16px/24px/32px
Radius:      12px standard / 16px large / 8px small
Border:      1px border-subtle OR shadow-sm
Shadow:      0 1px 3px rgba(0,0,0,0.1)
Hover:       shadow-md (web)
Interactive: Whole card tappable, cursor pointer
```

### Spacing Scale (8pt)
```
space-1:  4px   (icon+label gap)
space-2:  8px   (list item gap, icon padding)
space-3:  12px  (compact padding)
space-4:  16px  (component padding — BASE)
space-5:  20px  (comfortable padding)
space-6:  24px  (card padding — STANDARD)
space-7:  32px  (xl section gap)
space-8:  40px  (2xl section gap)
space-10: 48px  (3xl hero padding)
space-12: 64px  (4xl major section)
space-16: 80px  (5xl page sections)
space-20: 96px  (6xl hero sections)
```

### Radius Scale
```
radius-none:  0px
radius-sm:    4px   (badges, tags, small chips)
radius-md:    8px   (buttons, inputs, small cards)
radius-lg:    12px  (cards, dropdowns, popovers)
radius-xl:    16px  (modals, drawers, bottom sheets)
radius-2xl:   24px  (hero cards, featured sections)
radius-3xl:   32px  (large feature cards)
radius-full:  9999px (pills, avatars, FABs, tags)
```
---

## Technical Feasibility & Developer Handoff

### Token-First Enforcement Rules
```
Absolute Law: NEVER use random hex codes, manual pixel values, or custom shadows in design execution or handoff. Everything must map to a semantic design token.

1. Colors (Semantic over Literal)
   - YES: `bg-primary`, `text-surface-inverse`, `border-error`, `--color-success-100`
   - NO: `#4F46E5`, `#FFFFFF`, `#FF0000`

2. Spacing & Layout (Strict 4px Grid)
   - YES: `space-4` (16px), `gap-6` (24px), `p-2` (8px)
   - NO: `15px gap`, `padding: 21px`

3. Sizing (T-Shirt Sizes)
   - Radius: `radius-sm` (4px), `radius-md` (8px), `radius-lg` (12px), `radius-full`
   - Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
```

### The 5 Mandatory Interactive States
```
When designing any interactive component (button, input, card, chip), you MUST specify how it behaves across these 5 states. A design without states is a wireframe, not a product.

1. Default: The resting state of the UI.
2. Hover: (Web only) Cursor over element. Usually a slight background darken or elevation (shadow-md).
3. Active / Pressed: The moment of interaction. Tends to scale down slightly (scale-95) or darken further.
4. Disabled: Element cannot be interacted with. `opacity-50`, `pointer-events-none`, `text-slate-400`. Must still pass minimum WCAG contrast if readable context is needed, otherwise dim it.
5. Focus / Focus-Visible: Keyboard navigation state. MUST have a high-contrast outline (e.g., `ring-2 ring-primary ring-offset-2`). Do not rely on default browser outlines.
```

### Component Anatomy Spec Format (3-Column Table)
```
When handing off a component to engineering, break down its anatomy clearly:

| Element | Design Token | Tailwind / CSS Equivalent |
|---------|-------------|----------------------------|
| Container | `surface-main`, `radius-lg`, `shadow-sm` | `bg-white rounded-xl shadow-sm` |
| Primary Text | `text-heading-sm`, `color-text-main` | `text-lg font-semibold text-slate-900` |
| Action Button | `bg-primary`, `radius-md`, `space-3` | `bg-indigo-600 rounded-lg p-3` |
| Hover State | `surface-hover` | `hover:bg-slate-50` |
| Focus State | `ring-focus` | `focus:ring-2 focus:ring-indigo-500` |
```

### Responsive & Fluid Handoff
```
When handing off responsive designs, specify breakpoints where behavior changes, not just fixed mobile/desktop layouts.

- Breakpoints: Mobile (<768px), Tablet (768px - 1024px), Desktop (>1024px).
- Behavior notes required: Does the flex row wrap? Does the table become a card list? Do margins collapse?
```

---
## 10-Year Creative Director Protocol: Editorial & Bento Layouts

### 1. The Bento Box & Asymmetrical Grids (Breaking the 12-Column Monotony)
* **Rule:** Standard 12-column equal-card grids look like templates. Use asymmetrical "Bento Grids" (mixing 2x2, 2x1, 1x1 cells) to create a visual journey.
* **Execution:** Assign cell sizes based on content hierarchy, not code convenience. The hero feature gets a 2x2 span, secondary features get 1x1.

### 2. Invisible Framing (Whitespace as Borders)
* **Rule:** Amateur UIs rely on visible 1px borders for structure. Premium UIs use whitespace and proximity to group content.
* **Execution:** Remove internal dividers and borders wherever possible. Increase padding/gap to 32px or 48px to group elements optically rather than caging them in lines.

### 3. The Editorial Approach
* **Rule:** Treat software interfaces like high-end magazine layouts.
* **Execution:** Introduce deliberate asymmetry. Allow large typography to break out of rigid containers. Use full-bleed imagery bleeding into margins.
