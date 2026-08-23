---
name: technical-feasibility-v2
description: Senior Design Engineer. Developer handoff specs, token JSON/CSS export, component anatomy, Figma-to-code mapping, implementation feasibility review. Trigger: "dev handoff", "token JSON", "CSS variables", "component anatomy", "implementation review", "design to code", "engineering specs", "token export", "Figma to React", "design system code".
version: 2.0
---
# Technical Feasibility v2 — Developer Handoff Specs

> **Hierarchy:** Tier 1 = ux-thinking | Tier 2 = design-taste-frontend | Tier 3 = THIS SKILL
> **This skill produces developer-ready specs.** No ambiguity.

---

## Component Anatomy Spec (Every Component)

```
COMPONENT: [Name]

ANATOMY:
├── Container (bg, border, radius, padding)
├── Label (typography token, color token)
├── Icon (optional, size, position)
└── [Other parts]

TOKEN REFERENCES:
├── background: [semantic token]
├── text: [semantic token]
├── border: [semantic token]
└── [all visual properties → token names]

AUTO LAYOUT:
Direction: Row / Column
Gap: [space token]
Padding: T[space] R[space] B[space] L[space]
Sizing: Hug / Fill / Fixed [px]

INTERACTIONS:
Hover:   [change] | [duration] | [easing]
Press:   [change] | [duration] | [easing]
Focus:   [focus ring + color + size]
Loading: [skeleton / spinner / progress]

ACCESSIBILITY:
Role: [ARIA role]
Label: [aria-label pattern]
Keyboard: [Tab / Enter / Space / Escape]
Min touch target: [44px / 56px]
```

---

## Design Token JSON (For Developers)

```json
{
  "color": {
    "brand": { "500": { "value": "#6366F1", "type": "color" } },
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

---

## CSS Variables Output

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
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px;
  --space-9: 48px; --space-10: 64px; --space-12: 96px;
  --space-14: 128px; --space-16: 160px; --space-20: 320px;

  /* Radius */
  --radius-none: 0px;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --radius-xl: 16px; --radius-2xl: 24px; --radius-3xl: 32px;
  --radius-full: 9999px;

  /* Typography */
  --font-body: 'Satoshi', sans-serif;
  --font-display: 'Clash Grotesk', sans-serif;
  --text-base: 16px; --text-lg: 20px; --text-xl: 25px;

  /* Motion */
  --duration-micro: 100ms; --duration-fast: 150ms; --duration-normal: 200ms;
  --duration-moderate: 300ms; --duration-slow: 400ms; --duration-very-slow: 600ms;
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

## Implementation Review Checklist

### For Designers (Before Handoff)
- [ ] All components use semantic tokens (no raw hex)
- [ ] Dark mode tokens defined for every surface/text/border
- [ ] All 7 states designed for interactive components
- [ ] Touch targets ≥44px (56px India)
- [ ] Auto-layout applied everywhere
- [ ] Real copy used (no lorem ipsum)
- [ ] Edge cases handled (empty, error, loading, long text)

### For Developers (Implementation Review)
- [ ] CSS variables match design token JSON exactly
- [ ] Dark mode switches via `prefers-color-scheme` (no component changes)
- [ ] Touch targets meet minimum (test on device)
- [ ] Focus states visible and accessible
- [ ] `prefers-reduced-motion` respected
- [ ] Animations use `transform` + `opacity` only
- [ ] No layout triggers (`width`, `height`, `top`, `left`)
- [ ] Tabular numerals for money (`font-variant-numeric: tabular-nums`)
- [ ] Hindi/regional fonts load and render correctly
- [ ] 200% zoom test passed (no horizontal scroll)

---

## Token Governance Rules

1. **Never hardcode values in components** — always reference tokens
2. **Component tokens (Layer 3) are the ONLY tokens components use**
3. **Dark mode = semantic token mode switch** — no component changes
4. **Adding new primitive** → add to Primitives collection → create semantic aliases → create component aliases
5. **Changing brand color** → update `color-brand-500` → all semantic → all component tokens update automatically
6. **Token naming** = `category/subcategory/variant` (kebab-case)
7. **Document every token** with description + usage example in Figma