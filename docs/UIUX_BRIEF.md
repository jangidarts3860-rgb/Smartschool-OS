# UI/UX SYSTEM BRIEF & AESTHETIC SPECIFICATION — SmartSchool OS
**Document Version:** 1.0.0-Pilot (Master Source of Truth)  
**Last Updated:** August 2026  
**Status:** Approved Design System & Styling Spec  

---

## 1. Design System Vision & Core Philosophy

SmartSchool OS is crafted as a **High-Contrast, Premium Glassmorphic Operating System** for Indian K-12 private schools. The UI balances dense administrative utility for school principals with zero-friction simplicity for teachers, students, and parents on mobile devices.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HUMAN-CENTERED DESIGN FOUNDATION                     │
├───────────────────────────┬────────────────────────────┬───────────────┤
│    MILLER'S LAW (7±2)     │   FITTS'S LAW (TOUCH ZONES)│ WCAG A11Y     │
│ Information chunking via  │ Min 44px touch height for  │ 4.5:1 contrast│
│ card grids & tabs         │ mobile buttons & inputs    │ focus rings   │
└───────────────────────────┴────────────────────────────┴───────────────┘
```

### 1.1 Anti-Slop Design Rules (Strict Enforcement)
To prevent generic, uninspired web templates, SmartSchool OS enforces strict aesthetic guidelines:
- 🚫 **NO Default Inter Font:** Typography uses the premium **Outfit** font family from Google Fonts.
- 🚫 **NO Pure Black (`#000000`):** Dark mode backgrounds use Slate-950 (`#020617`) and Slate-900 (`#0f172a`).
- 🚫 **NO Unanimated Layout Shifts:** Animations are restricted strictly to `transform` and `opacity` (never width/height reflows).
- 🎨 **Dynamic Theme Injection:** White-label primary accent colors dynamically inject CSS variables (`--brand-primary`) into `document.documentElement.style` at runtime.

---

## 2. Typography & Font System

SmartSchool OS uses **Outfit** (Google Fonts) as its primary typographic family.

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --font-primary: 'Outfit', sans-serif;
}
```

### 2.1 Typographic Scale & Hierarchy

| Element | Class / Weight | Size | Usage |
|---|---|---|---|
| **Display Heading (H1)** | `font-extrabold` (800) | `2.25rem` (36px) | Hero titles, main module headers |
| **Section Heading (H2)** | `font-bold` (700) | `1.5rem` (24px) | Card section headers, dashboard titles |
| **Subsection Title (H3)**| `font-semibold` (600) | `1.125rem` (18px) | Widget titles, modal headers |
| **Body Text** | `font-normal` (400) | `0.875rem` (14px) | Table data, paragraph copy, form labels |
| **Small / Subtext** | `font-medium` (500) | `0.75rem` (12px) | Status badges, timestamps, helper text |

---

## 3. Color Palette & Design Tokens

### 3.1 Core Color Tokens

```css
:root {
  /* Brand Identity Tokens */
  --brand-primary: #4f46e5;       /* Indigo 600 */
  --brand-primary-light: #818cf8; /* Indigo 400 */
  --brand-primary-dark: #3730a3;  /* Indigo 800 */

  /* Neutral Background Tokens */
  --bg-slate-50: #f8fafc;        /* Light Mode Surface */
  --bg-slate-100: #f1f5f9;       /* Light Mode Card Fill */
  --bg-slate-900: #0f172a;       /* Dark Mode Surface */
  --bg-slate-950: #020617;       /* Dark Mode Background */

  /* Semantic Feedback Tokens */
  --status-success: #10b981;     /* Emerald 500 */
  --status-warning: #f59e0b;     /* Amber 500 */
  --status-error: #ef4444;       /* Red 500 */
  --status-info: #3b82f6;        /* Blue 500 */

  /* Glassmorphism Tokens */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 12px;
}

.dark {
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-border: rgba(255, 255, 255, 0.05);
}
```

### 3.2 Dynamic White-Label Theme Engine
Admins can select custom primary colors in the `WHITE_LABEL` settings tab. Upon change, JavaScript updates root CSS variables:

```typescript
// White-label dynamic CSS injection pattern
document.documentElement.style.setProperty('--brand-primary', customColorHex);
```

---

## 4. Layout Grid, Spacing & Breakpoints

### 4.1 Responsive Breakpoint Scale

| Breakpoint Prefix | Screen Width | Targeted Devices |
|---|---|---|
| `sm:` | `640px` | Mobile Landscape & Small Tablets |
| `md:` | `768px` | Tablets & Small Laptops |
| `lg:` | `1024px` | Desktop Displays |
| `xl:` | `1280px` | Large Monitors & Control Centers |

### 4.2 Grid & Touch Zone Standards
- **Card Grid Layout (`.card-stack`):** `display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));`
- **Fitts's Law Touch Zone:** Minimum **44px** height (`min-height: 44px`) for all buttons, select boxes, and input fields to support high-speed mobile tapping.

---

## 5. Micro-Animations & Motion Physics

All animations are hardware-accelerated using `transform` and `opacity` GPU layers.

```css
/* Animation Utility Classes */
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-6px); }
  30%, 70% { transform: translateX(6px); }
}
```

### 5.1 Interactive Micro-Effects
- **Hover Lift (`.hover-lift`):** `transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2);`
- **Glow Shadow (`.shadow-glow`):** `box-shadow: 0 0 20px -5px var(--brand-primary-light);`
- **Click Feedback (`.hover-scale`):** Scales to `1.02` on hover and shrinks to `0.98` on active click.

---

## 6. Accessibility (A11Y) & Psychological Design Rules

### 6.1 WCAG 2.1 Focus Ring Standard
Keyboard navigation is supported via custom focus ring utilities:

```css
:focus-visible {
  outline: 3px solid var(--brand-primary);
  outline-offset: 4px;
  border-radius: 4px;
}
```

### 6.2 Sensitive Academic Grade UX Laws
To avoid unnecessary anxiety for students and parents:
- **Sensitive Grade Styling:** Failing grades (F / Below Pass Cutoff) are styled with subtle Rose-50 backgrounds (`bg-rose-50 text-rose-700`) rather than harsh solid red banners.
- **Rank Protection:** Class rankings in the bottom 10% are explicitly hidden from the parent view.

---

## 7. Multi-Role Component Pattern Specifications

### 7.1 Teacher FaceGrid Gesture Component
High-speed attendance Component built for zero-latency classroom marking:

```
┌────────────────────────────────────────────────────────┐
│ [Student Photo]  STU-24-001  Rahul Sharma             │
│                                                        │
│  Single Tap ──>  [ PRESENT (Emerald Glow Badge) ]      │
│  Double Tap ──>  [ ABSENT  (Rose Red Glow Badge) ]     │
└────────────────────────────────────────────────────────┘
```

### 7.2 Parent Multi-Child Selector Component
Located in the top application bar, allowing instant switching between children:
- Switching context retains active tab (e.g., viewing Fees for Child 1 switches to Fees for Child 2 without resetting the page).

---

## 8. Design Token Safelisting & Production CSS Setup

To prevent dynamic Tailwind classes (e.g., status badges generated via template literals `bg-${color}-100`) from being purged during build, `tailwind.config.js` safelists key color scales:

```javascript
// tailwind.config.js safelist pattern
safelist: [
  {
    pattern: /^(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|emerald|teal|cyan|blue|indigo|purple|rose|slate)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    variants: ['hover', 'group-hover', 'dark', 'dark:hover', 'focus'],
  },
  'shadow-premium',
  'animate-fade-in-up',
  'animate-scale-in',
  'backdrop-blur-xs',
]
```
