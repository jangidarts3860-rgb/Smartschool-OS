# Accessibility — WCAG 2.2 AA/AAA Compliance

> Non-negotiable. Overrides all aesthetic decisions. Run Layer 8 audit on every screen.
> Version: 3.0 | Updated: 2026-07-12

---

## WCAG 2.2 Quick Reference

| Principle | Guideline | Level | Key Criteria |
|-----------|-----------|-------|--------------|
| **Perceivable** | 1.1 Non-text Content | A | Alt text, icons labeled |
| | 1.3 Adaptable | A | Semantic HTML, heading order |
| | 1.4 Distinguishable | AA | Contrast 4.5:1, resize text, reflow |
| | 1.4.11 Non-text Contrast | AA | UI components 3:1 |
| | 1.4.12 Text Spacing | AA | No loss of content at 200% zoom |
| **Operable** | 2.1 Keyboard | A | All functionality keyboard accessible |
| | 2.4 Navigable | A | Focus order, headings, labels |
| | 2.4.11 Focus Appearance | AA | Focus indicator 2px, 3:1 contrast |
| | 2.5.8 Target Size | AA | 44×44px minimum |
| | 2.5.7 Dragging | AA | Alternative to dragging |
| **Understandable** | 3.2 Predictable | A | Consistent navigation, no surprise |
| | 3.3 Input Assistance | A | Error identification, suggestions |
| **Robust** | 4.1 Compatible | A | Valid HTML, ARIA, status messages |

---

## Layer 8 Checklist (From ux-audit-checklist.md)

### Color & Contrast
- [ ] **8.1** Normal text ≥4.5:1, Large text (≥18pt/14pt bold) ≥3:1 — *WCAG 1.4.3 AA*
- [ ] **8.2** Touch targets ≥44×44px (iOS) / ≥48×48dp (Android) / ≥56×56px preferred for India Tier 2/3 — *WCAG 2.5.8 AA*
- [ ] **8.3** Information NOT conveyed by color alone — add icon, label, pattern, underline — *WCAG 1.4.1 A*
- [ ] **8.4** Body font size ≥16px (14px absolute minimum) — *WCAG 1.4.4 AA*
- [ ] **8.5** Error states: NEVER only red — always icon + text + border — *WCAG 1.4.1 + 3.3.1*
- [ ] **8.6** Interactive elements have accessible labels (aria-label, aria-labelledby, `<label>`) — *WCAG 4.1.2 A*
- [ ] **8.7** Animations respect `prefers-reduced-motion` — *WCAG 2.3.3 AAA*
- [ ] **8.8** Tap targets spaced ≥8px apart — *WCAG 2.5.8*
- [ ] **8.9** Focus order logical (top-left → bottom-right) — *WCAG 2.4.3 A*
- [ ] **8.10** Focus indicator visible, ≥2px, ≥3:1 contrast — *WCAG 2.4.7 AA*
- [ ] **8.11** Language declared (`lang="en"`, `lang="hi"`) — *WCAG 3.1.1 A*
- [ ] **8.12** Heading hierarchy correct (h1→h2→h3, no skipping) — *WCAG 1.3.1 A*

---

## Color Contrast Requirements

### Text
| Text Type | Minimum Contrast | Enhanced (AAA) |
|-----------|------------------|----------------|
| Body (<18pt regular, <14pt bold) | 4.5:1 | 7:1 |
| Large (≥18pt regular, ≥14pt bold) | 3:1 | 4.5:1 |
| Incidental (inactive, decorative) | — | — |

### UI Components (Non-text)
| Element | Minimum Contrast |
|---------|------------------|
| Button borders | 3:1 |
| Input borders | 3:1 |
| Focus rings | 3:1 |
| Icons (meaningful) | 3:1 |
| Dividers | 3:1 |
| Checkbox/radio | 3:1 |
| Switch track | 3:1 |
| Slider thumb | 3:1 |

### Testing Tools
- **Figma**: Stark, Able, Color Blind plugins
- **Browser**: DevTools → Elements → Color picker → Contrast ratio
- **CLI**: `axe-core`, `pa11y`, `lighthouse`
- **Color Blind**: Simulate via Stark, Color Oracle, Chrome DevTools rendering emulation

---

## Touch Targets

### Minimum Sizes
| Platform | Minimum | Recommended (India) |
|----------|---------|---------------------|
| iOS | 44×44pt | 48×48pt |
| Android | 48×48dp | 56×56dp |
| Web | 44×44px | 48×48px |

### Implementation
```css
/* CSS - ensure minimum touch target */
.button,
.input,
.icon-button,
.nav-item {
  min-height: 44px;
  min-width: 44px;
}

/* Expand hitbox without visual change */
.icon-button::before {
  content: '';
  position: absolute;
  inset: -10px; /* expands 10px each side */
}
```

### Spacing Between Targets
- **Minimum**: 8px gap between adjacent touch targets
- **Preferred**: 12px gap
- **Exception**: Inline links in paragraph (use `padding-inline: 2px`)

---

## Color-Independent Information

### Never Do This
```tsx
// ❌ Color only
<div className="text-red-500">Error: Invalid email</div>
<button className="bg-green-500">Success</button>
```

### Always Do This
```tsx
// ✅ Color + Icon + Text
<div className="flex items-center gap-2 text-red-500">
  <AlertCircleIcon aria-hidden="true" />
  <span>Error: Invalid email format</span>
</div>

<button className="flex items-center gap-2 bg-green-500">
  <CheckIcon aria-hidden="true" />
  <span>Payment successful</span>
</button>

// ✅ Pattern for charts/graphs
// Use: color + pattern (stripes, dots) + direct labels
```

### Error State Pattern
```tsx
// Input Error
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-2 border-red-500"
  />
  <p id="email-error" role="alert" className="flex items-center gap-1 text-red-500">
    <ErrorIcon aria-hidden="true" />
    <span>Enter a valid email (e.g., name@domain.com)</span>
  </p>
</div>
```

---

## Screen Reader Support

### Required ARIA Patterns

#### Buttons
```tsx
// Icon-only button
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>

// Loading button
<button aria-busy="true" disabled>
  <Spinner aria-hidden="true" />
  <span>Saving...</span>
</button>
```

#### Inputs
```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-hint email-error"
  aria-invalid={hasError}
/>
<p id="email-hint">We'll never share your email</p>
<p id="email-error" role="alert">Invalid email format</p>
```

#### Modals / Dialogs
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-desc">This action cannot be undone.</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

#### Toast / Snackbar
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  <span>Item saved</span>
</div>
<!-- Error toast -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  <span>Failed to save</span>
</div>
```

#### Progress / Loading
```tsx
<div role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
  <div style={{ width: '45%' }} />
</div>
<!-- Indeterminate -->
<div role="progressbar" aria-valuetext="Loading" />
```

#### Tabs
```tsx
<div role="tablist" aria-label="Account settings">
  <button role="tab" aria-selected="true" aria-controls="panel-profile" id="tab-profile">Profile</button>
  <button role="tab" aria-selected="false" aria-controls="panel-security" id="tab-security">Security</button>
</div>
<div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">...</div>
<div role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>...</div>
```

#### Carousel
```tsx
<div role="region" aria-label="Product images" aria-roledescription="carousel">
  <button aria-label="Previous" />
  <div role="group" aria-roledescription="slide" aria-label="1 of 4">...</div>
  <button aria-label="Next" />
</div>
```

### Live Regions
| Priority | Role | Use Case |
|----------|------|----------|
| Polite | `role="status"` | Success, info, non-urgent |
| Assertive | `role="alert"` | Errors, warnings, critical |
| Off | `aria-live="off"` | Decorative updates |

---

## Focus Management

### Focus Order
1. Top-left → bottom-right (reading order)
2. Modal: Trap focus, first focusable element
3. Page change: Focus main `<h1>` or skip link
4. Toast: Don't steal focus, announce via live region

### Focus Styles
```css
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove default outline ONLY if custom focus visible */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip link (first focusable) */
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  padding: 8px 16px;
  background: var(--color-action-primary);
  color: var(--color-text-on-brand);
  z-index: 9999;
}
.skip-link:focus {
  top: 16px;
}
```

### Focus Trap (Modal)
```tsx
// On mount: focus first focusable element
// On Tab: cycle within modal
// On Shift+Tab: cycle reverse
// On Escape: close modal, return focus to trigger
```

---

## Reduced Motion

### CSS Implementation
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep functional motion: loading spinners, progress bars */
  .spinner,
  .progress-bar {
    animation-duration: 1s !important;
  }
}
```

### What to Reduce
- [ ] Page transitions (slide, fade)
- [ ] Hover animations (scale, color transitions)
- [ ] Carousel auto-play
- [ ] Parallax scrolling
- [ ] Staggered entrance animations
- [ ] Micro-interaction springs/bounce

### What to KEEP (Functional)
- [ ] Loading spinners (user needs to know it's working)
- [ ] Progress bars (shows completion)
- [ ] Skeleton shimmer (shows loading state)
- [ ] Focus indicators (accessibility requirement)
- [ ] Error shake (critical feedback)

---

## Text Spacing (WCAG 1.4.12)

User must be able to override without loss of content:
```css
/* Ensure containers don't break with user spacing */
.text-container {
  /* Don't use fixed heights */
  min-height: auto;
  /* Allow wrapping */
  overflow-wrap: break-word;
  /* Line height relative */
  line-height: 1.5;
}

/* Test with: */
@media (prefers-reduced-motion: no-preference) {
  /* Not for motion - use browser extension "Text Spacing Bookmarklet" */
}
```

**Requirements (user sets):**
- Line height ≥ 1.5x font size
- Paragraph spacing ≥ 2x font size
- Letter spacing ≥ 0.12x font size
- Word spacing ≥ 0.16x font size

---

## Language & Localization (India)

### Language Declaration
```html
<html lang="en">          <!-- English -->
<html lang="hi">          <!-- Hindi -->
<html lang="ta">          <!-- Tamil -->
<html lang="te">          <!-- Telugu -->
<!-- etc. -->
```

### Mixed Content
```tsx
// Switch language per element
<p lang="en">Welcome to <span lang="hi">भारत</span></p>

// RTL for Urdu
<div dir="rtl" lang="ur">...</div>
```

### Font Requirements
| Script | Font | Min Size | Line Height |
|--------|------|----------|-------------|
| Devanagari (Hindi, Marathi, Sanskrit) | Noto Sans Devanagari Variable | 16px | 1.6 |
| Bengali | Noto Sans Bengali Variable | 16px | 1.6 |
| Tamil | Noto Sans Tamil Variable | 16px | 1.6 |
| Telugu | Noto Sans Telugu Variable | 16px | 1.6 |
| Gujarati | Noto Sans Gujarati Variable | 16px | 1.6 |
| Gurmukhi (Punjabi) | Noto Sans Gurmukhi Variable | 16px | 1.6 |
| Kannada | Noto Sans Kannada Variable | 16px | 1.6 |
| Malayalam | Noto Sans Malayalam Variable | 16px | 1.6 |
| Odia | Noto Sans Odia Variable | 16px | 1.6 |

**Container Test:** All text containers must fit Hindi text at 200% zoom (Hindi ~30% wider than English).

---

## Color Blindness Safe Palettes

### Deuteranopia/Protanopia (Red-Green) — 8% males
```css
/* Safe combinations */
--success: #22C55E;    /* Green */
--error: #EF4444;      /* Red — add icon! */
--warning: #F59E0B;    /* Amber */
--info: #3B82F6;       /* Blue */

/* Avoid: Red/Green together as only differentiator */
```

### Tritanopia (Blue-Yellow) — Rare
```css
/* Safe: High contrast blue/orange */
--primary: #2563EB;
--accent: #EA580C;
```

### Testing
- Figma: Stark → Color Blind Simulator
- Chrome DevTools: Rendering → Emulate vision deficiencies
- macOS: System Settings → Accessibility → Display → Color Filters

---

## Audit Report Template

```
ACCESSIBILITY AUDIT — [Screen/Flow] — [Date]

WCAG LEVEL: AA (target) / AAA (stretch)

PASS: [Count]  FAIL: [Count]  N/A: [Count]

CRITICAL FAILURES (Block Release):
- [Criterion] [Screen] [Description] [Fix]

HIGH PRIORITY:
- [Criterion] [Screen] [Description] [Fix]

RECOMMENDATIONS:
- [Criterion] [Screen] [Description] [Fix]

TESTED WITH:
- [ ] axe-core automated
- [ ] Keyboard only (Tab, Shift+Tab, Enter, Space, Esc, Arrows)
- [ ] NVDA / VoiceOver / TalkBack
- [ ] Zoom 200% (no horizontal scroll)
- [ ] prefers-reduced-motion
- [ ] Color blind simulation (Deutero/Protano/Tritano)
- [ ] Hindi/regional text at 200% zoom

SIGN-OFF: [Name] [Date]
```

---

## Quick Reference Cards

### Button A11y
- [ ] `role="button"` (or native `<button>`)
- [ ] `aria-label` if icon-only
- [ ] `aria-disabled="true"` (not HTML disabled for custom)
- [ ] `aria-busy="true"` during loading
- [ ] Focus ring visible
- [ ] 44×44px minimum
- [ ] Text contrast 4.5:1

### Input A11y
- [ ] `<label for="id">` linked
- [ ] `aria-describedby` → hint/error
- [ ] `aria-invalid="true"` on error
- [ ] Error = icon + text + border
- [ ] Paste enabled
- [ ] Autocomplete attributes

### Modal A11y
- [ ] `role="dialog"` + `aria-modal="true"`
- [ ] `aria-labelledby` → title
- [ ] Focus trap
- [ ] Focus first element on open
- [ ] Return focus to trigger on close
- [ ] ESC closes
- [ ] Backdrop click closes

### Navigation A11y
- [ ] Skip link (first focusable)
- [ ] Current page `aria-current="page"`
- [ ] Dropdown: `aria-expanded`, `aria-controls`
- [ ] Mobile menu: `role="dialog"` or `aria-modal`