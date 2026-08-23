# Motion & Interaction Specifications

> Exact spring values, easing curves, micro-interaction specs, Figma prototyping directives, Lottie/Rive integration.
> Version: 3.0 | Updated: 2026-07-12

---

## Core Philosophy

1. **Motion with Purpose** — Every animation answers: "What information does this give the user?"
2. **Physics-Based** — Springs > cubic-bezier > linear. Springs feel alive.
3. **The 200-400ms Rule** — Micro: 150-200ms. Transitions: 300-400ms. Never >500ms unless intentional slow reveal.
4. **Continuity** — Elements don't teleport. Cards expand into screens. Modals enter from logical origin.
5. **Performance First (India)** — Animate ONLY `transform` + `opacity`. Never `width`, `height`, `top`, `left`. Budget Android = 3 simultaneous animations max.
6. **Respect Reduce Motion** — Always define `prefers-reduced-motion` fallback. Accessibility = not optional.

---

## Platform-Specific Easing & Springs

### iOS (Spring-Forward, Snappy)

| Type | Spring Params | Cubic-Bezier Fallback | Duration |
|------|---------------|----------------------|----------|
| Standard | `stiffness: 350, damping: 35, mass: 1` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 300-400ms |
| Liquid Glass (iOS 26+) | `stiffness: 200, damping: 18, mass: 1` | `cubic-bezier(0.16, 0.5, 0.3, 0.95)` | 400-500ms |
| Enter | — | `cubic-bezier(0.0, 0.0, 0.2, 1)` | 300ms |
| Exit | — | `cubic-bezier(0.4, 0.0, 1.0, 1)` | 200ms |
| Press | `stiffness: 500, damping: 40, mass: 1` | `cubic-bezier(0.4, 0.0, 0.6, 1)` | 100ms |

### Android Material 3 (Fluid, Intentional)

| Type | Spring Params | Cubic-Bezier | Duration |
|------|---------------|--------------|----------|
| Standard | `stiffness: 300, damping: 30, mass: 1` | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` | 300ms |
| Emphasized (M3) | `stiffness: 250, damping: 25, mass: 1` | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` | 500ms |
| Enter | — | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | 300ms |
| Exit | — | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | 200ms |
| Press | `stiffness: 400, damping: 35, mass: 1` | `cubic-bezier(0.4, 0.0, 0.6, 1)` | 100ms |

### Web (Standard)

| Type | Easing | Duration |
|------|--------|----------|
| Enter | `ease-out` / `cubic-bezier(0.0, 0.0, 0.2, 1)` | 250ms |
| Exit | `ease-in` / `cubic-bezier(0.4, 0.0, 1.0, 1)` | 200ms |
| Hover | `ease-out` | 150ms |
| Press | `ease-out` | 100ms |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 300-400ms |

---

## Spring Personality Guide (Choose by Product Type)

| Product Type | Stiffness | Damping | Mass | Feel |
|--------------|-----------|---------|------|------|
| Banking / Medical | 400 | 40 | 1 | Zero bounce, serious, trustworthy |
| SaaS / Productivity | 300 | 30 | 1 | Snappy, minimal bounce, efficient |
| E-commerce / Fintech | 260 | 26 | 1 | Smooth, confident, reassuring |
| Social / Consumer | 220 | 22 | 1 | Light bounce, friendly, approachable |
| Entertainment / Kids | 180 | 15 | 1 | Bouncy, playful, delightful |

**Rule:** Use the SAME spring personality across the entire product. Consistency = trust.

---

## Duration Scale (Tokenized)

| Token | Value | Use Case |
|-------|-------|----------|
| `duration-instant` | 0ms | Immediate state changes |
| `duration-micro` | 100ms | Hover color, icon swap, checkbox tick |
| `duration-fast` | 150ms | Button press, toggle, tooltip show |
| `duration-normal` | 200ms | Dropdown open, tooltip, simple transition |
| `duration-moderate` | 300ms | Modal, card expand, bottom sheet |
| `duration-slow` | 400ms | Screen transition, drawer, page swap |
| `duration-very-slow` | 600ms | Onboarding hero, splash, major reveal |

**Exit = 60-70% of Enter duration** (feels faster, snappier)

---

## Micro-Interaction Specs (2025-2026 Trending)

### 1. Morphing Icons 🔥 Most Trending
```
Hamburger ⇄ Close    | Play ⇄ Pause    | Heart Outline ⇄ Filled
Search ⇄ Close       | Menu ⇄ Back     | Plus ⇄ Minus
```
| Spec | Value |
|------|-------|
| Duration | 250ms |
| Easing | Spring `stiffness: 260, damping: 24` |
| Figma | Component variants + Smart Animate |
| Production | Lottie JSON (path morphing) |
| Path Rules | Same number of points, same command types |

### 2. Navigation Pill Indicator (Linear/Craft Style)
```
[Home] [Explore] [Notifications] [Profile]
  ████████████
```
| Spec | Value |
|------|-------|
| Duration | 250ms |
| Easing | Spring `stiffness: 300, damping: 30` |
| Behavior | Pill slides + width morphs to label width |
| Figma | Absolute positioned pill + Smart Animate on position/width |
| Active State | Label weight 600, color primary |

### 3. Like / Reaction Pop
```
    💖
   💖  💖
💖  💖  💖  💖
    ❤️ (scales 0 → 1.3 → 1.0)
```
| Spec | Value |
|------|-------|
| Duration | 400ms |
| Scale | 0 → 1.3 → 1.0 |
| Easing | Spring `stiffness: 220, damping: 20` |
| Color | Gray → Red (simultaneous) |
| Particles | 6-8 small hearts scatter (Lottie in production) |
| Haptic | iOS: `.medium` impact | Android: `VIRTUAL_KEY` |

### 4. Loading → Content Transition
```
Skeleton (exact layout match) ──crossfade 200ms──→ Real Content
```
| Spec | Value |
|------|-------|
| Duration | 200ms |
| Easing | `ease-out` |
| Rule | NEVER: blank → spinner → content (jarring) |
| Skeleton | Must match final layout exactly (lines, images, buttons) |
| AI Thinking | Breathing dots: scale 0.6→1.0, stagger 150ms each |

### 5. Scroll-Driven Animations (Web — Huge 2025 Trend)
```
Element enters viewport → fade + slide up
Parallax hero → translateY slower than scroll
Sticky nav → shrink + shadow on scroll down
```
| Spec | Value |
|------|-------|
| CSS | `animation-timeline: scroll()` / `view()` |
| Trigger | `animation-range: entry 0% cover 50%` |
| Figma | Scroll prototype + position pinning to simulate |
| Used By | Apple, Stripe, Linear, Vercel |

### 6. Error Shake
```
translateX: 0 → +8 → -8 → +8 → -8 → 0
```
| Spec | Value |
|------|-------|
| Cycles | 3 |
| Total Duration | 400ms |
| Easing | `ease-in-out` per cycle |
| Haptic | iOS: `.error` notification | Android: `REJECT` |
| Visual | Red border + error icon + text (never color-only) |

### 7. Pull-to-Refresh
```
Pull down 60px → Spinner appears → Release → Spring back → Refresh
```
| Spec | Value |
|------|-------|
| Threshold | 60px pull |
| Spinner | Morphing dots or brand logo spin |
| Release | Spring `stiffness: 300, damping: 28` |
| Success | Checkmark morph → content fade in |

### 8. Swipe-to-Dismiss (Bottom Sheet)
```
Drag down → 40% height OR velocity >500px/s → Dismiss
Below threshold → Snap back (spring 400/40)
```
| Spec | Value |
|------|-------|
| Dismiss Threshold | 40% sheet height OR velocity >500px/s |
| Snap Back | Spring `stiffness: 400, damping: 40` |
| Dismiss | `ease-in` 250ms |

### 9. Swipe-to-Go-Back (iOS/Android)
```
Drag right from edge → Previous screen follows finger → Release → Complete
```
| Spec | Value |
|------|-------|
| Gesture | Edge swipe (20px from left) |
| Animation | Push (both screens move) |
| Follow Finger | 1:1 (no easing during drag) |
| Complete | Spring `stiffness: 300, damping: 28` |

### 10. Container Transform (Shared Element) 🔥
```
Card in List ─────morphs─────→ Detail Screen
Image, Title, Background all morph continuously
```
| Spec | Value |
|------|-------|
| Duration | 400ms (enter) / 350ms (exit) |
| Easing | Apple Spring `stiffness: 280, damping: 26` |
| Figma | Smart Animate — **SAME layer names** on both screens |
| Layers to Match | `hero-image`, `product-title`, `card-container` |
| Reverse | Exit slightly faster (350ms) |

---

## State Transition Logic

### Overlays & Modals

#### Bottom Sheet
| Phase | Transform | Duration | Easing |
|-------|-----------|----------|--------|
| Enter | `translateY(100%)` → `translateY(0)` | 350ms | `ease-out` (decelerate) |
| Exit | `translateY(0)` → `translateY(100%)` | 300ms | `ease-in` (accelerate) |
| Handle | 40×4px pill, `radius-full`, 8px from top | — | — |

#### Center Modal
| Phase | Transform + Opacity | Duration | Easing |
|-------|---------------------|----------|--------|
| Enter | `opacity(0) + scale(0.95)` → `opacity(1) + scale(1)` | 200ms | `ease-out` |
| Exit | `opacity(1) + scale(1)` → `opacity(0) + scale(0.95)` | 150ms | `ease-in` |
| Backdrop | `opacity(0)` → `opacity(0.5)` | 200ms | `ease-out` |

#### Side Drawer
| Phase | Transform | Duration | Easing |
|-------|-----------|----------|--------|
| Enter | `translateX(-100%)` → `translateX(0)` | 350ms | `ease-out` |
| Exit | `translateX(0)` → `translateX(-100%)` | 300ms | `ease-in` |

---

### Gesture Navigation

| Gesture | Trigger | Animation |
|---------|---------|-----------|
| Swipe-to-Dismiss (Sheet) | Drag down | Follow finger → threshold → dismiss / snap back |
| Swipe-to-Go-Back | Drag right (edge) | Push (both screens) → follow finger → complete |
| Swipe-to-Delete | Drag left on list item | Reveal actions → threshold → animate out |
| Pull-to-Refresh | Drag down past threshold | Spinner morph → release → spring back → refresh |

---

## Figma Prototyping Directives (Copy-Paste Ready)

### Transition Types — When to Use
| Type | Use For |
|------|---------|
| **Smart Animate** | Morphing components, shared elements, state changes |
| **Move In/Out** | Simple slide navigation (simpler than Smart Animate) |
| **Push** | Screen navigation (both screens move) |
| **Slide In/Out** | Overlay entrance (only new element moves) |
| **Dissolve** | Fade crossfade between screens |
| **Instant** | State changes that should feel immediate |

### Triggers
| Trigger | Use For |
|---------|---------|
| On Click / On Tap | Standard button/card interactions |
| While Pressing | Hold states (long press context menu) |
| On Drag | Swipe gestures, sliders |
| On Hover | Web hover states |
| After Delay | Auto-advance (loading → content) |
| Mouse Enter/Leave | Web micro-interactions |

### Smart Animate Rules (Critical)
- [ ] **Layer names MUST match exactly** between variants/screens
- [ ] Use **Components** — not just frames — for Smart Animate
- [ ] Property changes that animate: position, size, opacity, rotation, corner radius, fill, stroke, effects
- [ ] `backdrop-filter` (blur) changes animate
- [ ] Text content does NOT Smart Animate (use opacity swap)
- [ ] Nested components work if names match at all levels

### Layer Naming for Shared Elements
```text
// List Screen
Frame: "Product Card"
  ├─ Image: "hero-image"          ← SAME in detail
  ├─ Text: "product-title"        ← SAME in detail
  ├─ Frame: "card-container"      ← SAME in detail

// Detail Screen
Frame: "Product Detail"
  ├─ Image: "hero-image"          ← MATCHES list
  ├─ Text: "product-title"        ← MATCHES list
  ├─ Frame: "card-container"      ← MATCHES list
```

### Figma Spring Format
```
Easing: Spring
Stiffness: [300]     // From personality guide
Damping: [30]        // From personality guide
Mass: 1              // Always 1
```
Preview in Prototype mode → Always check on mobile device mirror.

---

## Lottie / Rive Integration Guide

### When to Use Lottie
- [ ] Confetti / particle effects (success states)
- [ ] Complex icon morphing (hamburger → close path animation)
- [ ] Onboarding illustrations that animate
- [ ] Loading animations with brand personality
- [ ] Empty state illustrations

### When to Use Rive
- [ ] Interactive animations (respond to user input real-time)
- [ ] Game-like interactions
- [ ] Complex state machines with multiple transitions
- [ ] Character animations

### Figma Workflow with Lottie
1. Design static frame in Figma
2. Export to After Effects / LottieFiles editor
3. Export as `.json`
4. In prototype: Use **LottieFiles plugin** to preview
5. Production: Hand off `.json` + specs to dev

### Free Lottie Resources
- [lottiefiles.com](https://lottiefiles.com) — Free + paid animations
- [lordicon.com](https://lordicon.com) — Animated icons (free tier)
- [useAnimations.com](https://useanimations.com) — Micro-interactions library

---

## Motion Token System (Design System Integration)

### Tokens (from design-tokens.md)
```json
{
  "duration-micro":    "100ms",
  "duration-fast":     "150ms",
  "duration-normal":   "200ms",
  "duration-moderate": "300ms",
  "duration-slow":     "400ms",
  "duration-very-slow": "600ms",

  "ease-standard":   "cubic-bezier(0.4, 0.0, 0.2, 1)",
  "ease-enter":      "cubic-bezier(0.0, 0.0, 0.2, 1)",
  "ease-exit":       "cubic-bezier(0.4, 0.0, 1.0, 1)",
  "ease-spring":     "spring(stiffness: [see personality], damping: [see personality])"
}
```

### Usage Rule
> **NEVER hardcode "300ms" in specs.**
> Always write: `duration-moderate` + the token value.
> When design system updates tokens → all motion updates automatically.

---

## Motion Specs Table (Always Output This Format)

| Element | Trigger | Type | Duration | Easing/Spring | Haptic |
|---------|---------|------|----------|---------------|--------|
| Primary Button | Press | Scale + BG | `duration-micro` | `ease-sharp` | — |
| Primary Button | Hover (web) | BG color | `duration-micro` | `ease-standard` | — |
| Nav Pill | Tap | Slide + Width | `duration-moderate` | Spring 300/30 | Light |
| Like Button | Tap | Scale 0→1.3→1 + Color | `duration-slow` | Spring 220/22 | Medium |
| Modal | Open | Fade + Scale 0.95→1 | `duration-moderate` | `ease-enter` | — |
| Bottom Sheet | Open | Slide Up | `duration-slow` | `ease-enter` | Light |
| Toast | Show | Slide Up + Fade | `duration-moderate` | `ease-enter` | Success/Error |
| Skeleton → Content | Load | Crossfade | `duration-normal` | `ease-standard` | — |
| Error Input | Submit | Shake | 400ms (3 cycles) | `ease-in-out` | Error |
| Carousel Card | Swipe | Drag 1:1 → Snap | Variable | Spring 300/30 | Light |
| Tab Indicator | Tap | Slide + Width Morph | `duration-moderate` | Spring 300/30 | Light |

---

## Accessibility: `prefers-reduced-motion`

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
  
  /* KEEP functional motion */
  .spinner,
  .progress-bar,
  .skeleton-shimmer,
  :focus-visible {
    animation-duration: 1s !important;
    transition-duration: 0.2s !important;
  }
}
```

### What to Reduce vs Keep

| Reduce (Instant) | Keep (Functional) |
|------------------|-------------------|
| Page transitions | Loading spinners |
| Hover/tap micro-interactions | Progress bars |
| Carousel auto-play | Skeleton shimmer |
| Parallax scrolling | Focus indicators |
| Staggered entrances | Error shake |
| Decorative springs | Toast slide-in |

### Figma Note
> Can't prototype reduced motion. Document in design specs:
> `@media (prefers-reduced-motion: reduce) → All transitions: 0.01ms, except functional`

---

## Performance Budget (India Target)

| Metric | Target |
|--------|--------|
| Simultaneous Animations | ≤3 on budget Android |
| Animated Properties | `transform`, `opacity` ONLY |
| Frame Rate | 60fps (no jank) |
| Main Thread | <16ms/frame |
| Lottie File Size | <50KB per animation |
| Total Motion JS | <20KB gzipped |

### Optimization Checklist
- [ ] `will-change: transform, opacity` set BEFORE animation, removed AFTER
- [ ] `transform: translateZ(0)` / `translate3d(0,0,0)` for GPU layer
- [ ] No layout triggers (`width`, `height`, `top`, `left`, `margin`)
- [ ] Lottie: `renderer: 'canvas'` (not SVG) for performance
- [ ] CSS `contain: layout paint` on animated containers
- [ ] `requestAnimationFrame` for JS-driven animations

---

## Haptic Feedback Mapping (Mobile)

| Interaction | iOS (UIFeedbackGenerator) | Android (VibrationEffect) |
|-------------|---------------------------|---------------------------|
| Button Press (Primary) | `selectionChanged()` | `PREVIEW_KEY` (light) |
| Toggle/Switch | `impactOccurred(.light)` | `VIRTUAL_KEY` |
| Success (Payment, Save) | `notificationOccurred(.success)` | `SUCCESS` |
| Error (Failed, Invalid) | `notificationOccurred(.error)` | `REJECT` |
| Warning (Destructive) | `notificationOccurred(.warning)` | `WARNING` |
| Slider/Stepper | `selectionChanged()` | `PREVIEW_KEY` |
| Pull-to-Refresh Threshold | `impactOccurred(.medium)` | `MEDIUM` |
| Long Press (Context Menu) | `impactOccurred(.heavy)` | `HEAVY` |

---

## Anti-Patterns (Never Do)

| ❌ Anti-Pattern | ✅ Correct |
|-----------------|------------|
| Animate `width`/`height` | Animate `transform: scaleX/Y()` |
| Animate `top`/`left` | Animate `transform: translateX/Y()` |
| Linear easing (robotic) | Spring or `ease-out`/`ease-in` |
| Spinner alone on content page | Skeleton matching layout |
| Blank → Spinner → Content | Skeleton → Crossfade → Content |
| >3 simultaneous animations | Sequence or reduce |
| No `prefers-reduced-motion` | Always implement |
| Decorative motion on load | Functional motion only |
| Infinite loop without pause | Respect user preference |
| Text Smart Animate | Opacity swap for text changes |
| Different springs per screen | One personality per product |