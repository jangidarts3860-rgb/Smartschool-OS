# Platform-Specific Rules

> iOS (HIG), Android (Material 3), Web — non-negotiable platform conventions.
> Version: 3.0 | Updated: 2026-07-12

---

## iOS (Human Interface Guidelines)

### Navigation
| Pattern | Spec |
|---------|------|
| Primary | Tab Bar (max 5), Navigation Bar |
| Back | Swipe from left edge (interactive) |
| Modal | Sheet (bottom), Full-screen cover |
| Deep Link | Restore exact state |

### Layout & Spacing
| Metric | Value |
|--------|-------|
| Status Bar | 44-59px (notch dependent) |
| Nav Bar | 44px (compact), 52px (large title) |
| Tab Bar | 83px (incl. home indicator 34px) |
| Safe Area Top | 44-59px |
| Safe Area Bottom | 34px (home indicator) |
| Standard Margin | 16px (compact), 20px (regular) |
| Touch Target | 44×44pt minimum |

### Typography (SF Pro)
| Style | Size | Weight | Leading |
|-------|------|--------|---------|
| Large Title | 34px | Regular | 41px |
| Title 1 | 28px | Regular | 34px |
| Title 2 | 22px | Regular | 28px |
| Title 3 | 20px | Regular | 25px |
| Headline | 17px | Semibold | 22px |
| Body | 17px | Regular | 22px |
| Callout | 16px | Regular | 21px |
| Subhead | 15px | Regular | 20px |
| Footnote | 13px | Regular | 18px |
| Caption 1 | 12px | Regular | 16px |
| Caption 2 | 11px | Regular | 13px |

### Components — iOS Specifics
| Component | iOS Behavior |
|-----------|--------------|
| Button | Rounded rect (8px), full-width in sheets, 44px min height |
| Text Field | 44px height, clear button trailing, secure text toggle |
| Switch | 51×31pt, thumb 27pt, animated |
| Picker | Drum (date/time), inline (short lists) |
| Action Sheet | Bottom, destructive = red, cancel = bold |
| Alert | Center, max 2 actions, destructive left |
| Toast | None native → use custom snackbar |
| Refresh | Pull-to-refresh (native) |
| Search | Nav bar integrated or dedicated screen |
| Share | Native share sheet (UIActivityViewController) |

### Motion
| Animation | Spec |
|-----------|------|
| Push | Slide right→left (300ms, spring) |
| Pop | Slide left→right (300ms, spring) |
| Modal Present | Slide up (250ms, spring) |
| Modal Dismiss | Slide down (200ms, spring) |
| Tab Switch | Cross-fade (150ms) |
| Spring | `stiffness: 300, damping: 30, mass: 1` |

### SF Symbols
- Use SF Symbols 5+ (variable weight)
- Match text weight: Regular/Medium/Semibold/Bold
- Sizes: 17pt (body), 22pt (title), 28pt (large)

### Haptics (iOS)
| Event | Generator |
|-------|-----------|
| Button tap | `UIImpactFeedbackGenerator(style: .light)` |
| Toggle/Switch | `UIImpactFeedbackGenerator(style: .medium)` |
| Error | `UINotificationFeedbackGenerator(.error)` |
| Success | `UINotificationFeedbackGenerator(.success)` |
| Warning | `UINotificationFeedbackGenerator(.warning)` |
| Selection change | `UISelectionFeedbackGenerator()` |

### Dark Mode
- System-controlled (auto)
- Semantic colors only: `label`, `secondaryLabel`, `systemBackground`, `secondarySystemBackground`, `separator`
- Images: SF Symbols auto, assets provide dark variants

### Accessibility (iOS)
- Dynamic Type: All text scales (11 sizes)
- VoiceOver: `accessibilityLabel`, `accessibilityHint`, `accessibilityTraits`
- Reduce Motion: Disable spring, use `ease-in-out` 200ms
- Reduce Transparency: Solid backgrounds
- Button Shapes: Underline links

---

## Android (Material 3)

### Navigation
| Pattern | Spec |
|---------|------|
| Primary | Bottom Navigation (3-5), Navigation Drawer, Top App Bar |
| Back | System back gesture (swipe from edge) + back button |
| Modal | Bottom Sheet (standard), Dialog, Full-screen |
| Deep Link | Restore exact state |

### Layout & Spacing
| Metric | Value |
|--------|-------|
| Status Bar | 24-32dp (varies) |
| Top App Bar | 64dp (centered), 56dp (compact) |
| Bottom Nav | 80dp (incl. gesture bar 0-32dp) |
| Safe Area Top | 24-32dp |
| Safe Area Bottom | 0-32dp (gesture navigation) |
| Standard Margin | 16dp (mobile), 24dp (tablet) |
| Touch Target | 48×48dp minimum (56×56dp recommended) |

### Typography (Roboto / Google Sans)
| Style | Size | Weight | Line Height |
|-------|------|--------|-------------|
| Display Large | 57sp | Regular | 64sp |
| Display Medium | 45sp | Regular | 52sp |
| Display Small | 36sp | Regular | 44sp |
| Headline Large | 32sp | Regular | 40sp |
| Headline Medium | 28sp | Regular | 36sp |
| Headline Small | 24sp | Regular | 32sp |
| Title Large | 22sp | Medium | 28sp |
| Title Medium | 16sp | Medium | 24sp |
| Title Small | 14sp | Medium | 20sp |
| Body Large | 16sp | Regular | 24sp |
| Body Medium | 14sp | Regular | 20sp |
| Body Small | 12sp | Regular | 16sp |
| Label Large | 14sp | Medium | 20sp |
| Label Medium | 12sp | Medium | 16sp |
| Label Small | 11sp | Medium | 16sp |

### Components — Android Specifics
| Component | M3 Behavior |
|-----------|-------------|
| Button | Filled (primary), Tonal (secondary), Outlined, Text — all 40dp min height |
| FAB | 56×56dp (regular), 40×40dp (small), 96×96dp (large) |
| Text Field | 56dp (filled), 40dp (outlined), label floats |
| Switch | Track 36×20dp, thumb 20dp, animated |
| Checkbox | 20×20dp |
| Radio | 20×20dp |
| Chip | Filter (toggle), Input (removable), Suggestion, Assist |
| Bottom Sheet | Standard (peaks), Modal (blocking), Expandable |
| Dialog | Alert (title+actions), Simple (list), Confirmation |
| Snackbar | Bottom, 14sp, action button, auto-dismiss 4-10s |
| Banner | Top, persistent, dismissible |
| Menu | Anchor to trigger, 280dp max width |
| Date Picker | Calendar (Material 3), range support |
| Time Picker | Clock (input mode toggle) |

### Motion (Material 3)
| Animation | Spec |
|-----------|------|
| Standard Easing | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` — 300ms |
| Emphasized Easing | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` — 500ms |
| Enter | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` — 300ms |
| Exit | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` — 200ms |
| Spring (M3) | Not native — use `cubic-bezier(0.2, 0.0, 0.0, 1.0)` |
| FAB → Detail | Container transform (shared element) |
| Bottom Sheet | Slide up 350ms standard, 500ms emphasized |

### Ripple
- All interactive surfaces: `?attr/selectableItemBackground`
- Bounded (buttons, chips) vs Unbounded (lists, grids)
- Color: `?attr/colorOnSurface` at 10% (hover), 12% (press), 16% (focus)

### Haptics (Android)
| Event | Constant |
|-------|----------|
| Light tap | `VIRTUAL_KEY` / `KEYBOARD_TAP` |
| Medium tap | `LONG_PRESS` |
| Heavy/Success/Error | `VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK/TICK/HEAVY_CLICK)` |
| Custom | `VibrationEffect.createOneShot(ms, amplitude)` |

### Dynamic Color (Material You)
- Wallpaper-extracted seed → 5 tonal palettes (Primary, Secondary, Tertiary, Neutral, Neutral Variant)
- 4 schemes: Light/Dark × Low/High contrast
- Use `ColorScheme` tokens — never hardcode
- Opt-in for apps targeting Android 12+

### Accessibility (Android)
- Font Scale: 0.85x - 2.0x (sp units auto-scale)
- TalkBack: `contentDescription`, `stateDescription`, `roleDescription`
- High Contrast: Force semantic colors
- Reduce Motion: `Settings.Global.ANIMATOR_DURATION_SCALE = 0`
- Touch Target: 48×48dp enforced by lint

---

## Web (Progressive Web App / Responsive)

### Breakpoints
| Name | Width | Columns | Container Max | Gutter |
|------|-------|---------|---------------|--------|
| Mobile | <640px | 4 | 100% | 16px |
| Tablet | 640-1023px | 8 | 720px | 24px |
| Desktop | 1024-1439px | 12 | 1200px | 24px |
| Wide | ≥1440px | 12 | 1400px | 32px |

### Navigation
| Pattern | Spec |
|---------|------|
| Primary | Top Nav (logo left, links center/right, CTA right) |
| Secondary | Sidebar (240-280px, collapsible) |
| Breadcrumbs | Above fold, `Home / Section / Page` |
| Footer | Full-width, 4-5 column groups |
| Mobile | Hamburger → Drawer / Bottom Sheet |

### Touch Targets (Web)
| Element | Minimum |
|---------|---------|
| Button/Link | 44×44px (CSS `min-height`, `min-width`) |
| Form Control | 44×44px |
| Icon Button | 44×44px (icon 24px + padding) |
| Spacing Between | 8px minimum |

### Hover / Focus (Web Only)
| State | Spec |
|-------|------|
| Hover | Background shift, underline links, scale(1.02) cards |
| Focus | 2px solid `color-border-focus`, 2px offset, `outline: none` |
| Focus-visible | Only show on keyboard focus (`:focus-visible`) |
| Active | Scale(0.98), background → pressed token |

### Typography (CSS)
```css
:root {
  --font-display: 'Satoshi Variable', 'Clash Grotesk Variable', system-ui, sans-serif;
  --font-body: 'Geist Variable', 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', 'JetBrains Mono Variable', ui-monospace, monospace;
  --font-hindi: 'Noto Sans Devanagari Variable', 'Hind Variable', system-ui, sans-serif;
}
```

### CSS Variables (Design Tokens)
```css
:root {
  /* Color */
  --color-surface-page: #F9FAFB;
  --color-surface-card: #FFFFFF;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-action-primary: #6366F1;
  --color-border-default: #E5E7EB;
  --color-border-focus: #6366F1;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px;
  --space-10: 48px; --space-12: 64px; --space-16: 80px; --space-20: 96px;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --radius-xl: 16px; --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Motion */
  --duration-fast: 150ms; --duration-normal: 200ms; --duration-moderate: 300ms;
  --duration-slow: 400ms; --duration-very-slow: 600ms;
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1);
}
```

### Dark Mode (Web)
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface-page: #030712;
    --color-surface-card: #111827;
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #9CA3AF;
    --color-action-primary: #818CF8;
    --color-border-default: #374151;
    --color-border-focus: #818CF8;
  }
}
```

### Motion (Web)
| Property | Value |
|----------|-------|
| Animate | `transform`, `opacity` ONLY |
| Will-change | Set before animation, remove after |
| Reduced Motion | `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` |
| Scroll-driven | `animation-timeline: scroll()` (modern) |

### Performance Budget
| Metric | Target |
|--------|--------|
| LCP | ≤2.5s |
| INP | ≤200ms |
| CLS | ≤0.1 |
| TTI | ≤3.5s |
| Bundle (gz) | ≤150KB initial |
| Images | WebP/AVIF, lazy, width/height set |

### Accessibility (Web - WCAG 2.2 AA)
| Requirement | Spec |
|-------------|------|
| Contrast | 4.5:1 text, 3:1 large text/UI |
| Focus | Visible, 2px, 3:1 contrast |
| Keyboard | All interactive reachable, operable |
| ARIA | Labels, roles, live regions |
| Skip Link | First focusable element |
| Language | `lang="en"` / `lang="hi"` |
| Zoom | 200% no horizontal scroll |
| Motion | `prefers-reduced-motion` respected |

---

## Cross-Platform Token Mapping

| Design Token | iOS | Android | Web |
|--------------|-----|---------|-----|
| Primary Color | `UIColor(named: "Brand500")` | `ColorScheme.primary` | `--color-action-primary` |
| Surface | `UIColor.systemBackground` | `ColorScheme.surface` | `--color-surface-card` |
| Text Primary | `UIColor.label` | `ColorScheme.onSurface` | `--color-text-primary` |
| Spacing 4 | 16pt | 16dp | `var(--space-4)` / 1rem |
| Radius MD | 8pt | 8dp | `var(--radius-md)` |
| Shadow SM | `shadow-sm` | `Elevation 1` | `var(--shadow-sm)` |
| Duration Normal | 200ms | 200ms | `var(--duration-normal)` |
| Ease Standard | `spring(300,30,1)` | `cubic-bezier(0.2,0,0,1)` | `var(--ease-standard)` |

---

## Platform Decision Matrix

| Decision | Rule |
|----------|------|
| Back Navigation | iOS: Swipe edge + back button. Android: System gesture. Web: Browser back + breadcrumb. |
| Modal vs Sheet | iOS: Sheet default. Android: Bottom Sheet. Web: Dialog (center) or Drawer (side). |
| Date Input | iOS: Drum. Android: Calendar. Web: Native `<input type="date">` + custom fallback. |
| Share | iOS: Native share sheet. Android: Native chooser. Web: Web Share API → fallback copy link. |
| Haptics | iOS: UIFeedbackGenerator. Android: VibrationEffect. Web: Vibration API (limited). |
| Biometric | iOS: FaceID/TouchID (LocalAuthentication). Android: BiometricPrompt. Web: WebAuthn. |
| Push | iOS: APNs. Android: FCM. Web: Web Push (VAPID). |
| Deep Link | iOS: Universal Links. Android: App Links. Web: Standard URLs. |

---

## Testing Checklist Per Platform

### iOS
- [ ] Dynamic Type: All text scales at 5 sizes (AX1-AX5)
- [ ] VoiceOver: All elements labeled, hints correct
- [ ] Dark Mode: All colors semantic, images adapt
- [ ] Reduce Motion: Spring animations disabled
- [ ] Safe Areas: No content under notch/home indicator
- [ ] Haptics: Appropriate feedback on all interactions
- [ ] Back Swipe: Works on all push navigations

### Android
- [ ] Font Scale: 0.85x - 2.0x works
- [ ] TalkBack: All elements announced correctly
- [ ] Dark Theme: Material You colors apply
- [ ] Reduce Motion: Animations disabled
- [ ] Touch Targets: 48dp minimum (lint clean)
- [ ] Back Gesture: Works on all screens
- [ ] Bottom Sheet: Drag handle, backdrop tap, swipe dismiss

### Web
- [ ] Lighthouse: Performance ≥90, Accessibility ≥95, Best Practices ≥90, SEO ≥90
- [ ] Keyboard: Tab order logical, focus visible, skip link works
- [ ] Screen Reader: NVDA/JAWS/VoiceOver announce correctly
- [ ] Zoom: 200% no horizontal scroll, no overlap
- [ ] Reduced Motion: All animations instant
- [ ] Contrast: All text 4.5:1, UI 3:1
- [ ] PWA: Manifest, Service Worker, HTTPS, Installable