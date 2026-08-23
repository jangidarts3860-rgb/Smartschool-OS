# 8-Layer UX Audit Checklist (Actionable)

> **Run sequentially on every design review.** Check every item. Any unchecked Critical/High = blocker.
> Version: 3.0 | Updated: 2026-07-12

---

## How to Run

1. Open the screen/flow in Figma or live product
2. Go through each layer in order (1→8)
3. Check ✅ pass, ❌ fail, ⚠️ partial
4. For failures: note Screen ID + Law reference + Severity
5. Fix order: Critical → High → Medium → Nice-to-have

---

## Layer 1 — Speed & Efficiency

| ID | Check | Law | Severity | Pass/Fail | Notes |
|----|-------|-----|----------|-----------|-------|
| 1.1 | Nav items ≤5? Progressive disclosure for more? | Hick's Law | Critical | | |
| 1.2 | Primary CTA = full-width, thumb zone (bottom 1/3), 56px height mobile? | Fitts's Law | Critical | | |
| 1.3 | Loading states for ALL async ops? Skeleton screens? No blank >400ms? | Doherty Threshold | Critical | | |
| 1.4 | Options causing paralysis? Reduced to essentials + smart defaults? | Paradox of Choice | High | | |
| 1.5 | Top 20% tasks reachable in ≤3 taps from home? | Pareto Principle | High | | |
| 1.6 | Search/filter available when list >20 items? | Hick's Law | Medium | | |

---

## Layer 2 — Memory & Brain

| ID | Check | Law | Severity | Pass/Fail | Notes |
|----|-------|-----|----------|-----------|-------|
| 2.1 | Max 7 items per section/group? Forms broken into steps ≤7 fields? | Miller's Law | Critical | | |
| 2.2 | Progress visible in multi-step flows (stepper, bar, % complete)? | Zeigarnik Effect | Critical | | |
| 2.3 | Suggestions/recents shown? No blank inputs requiring pure recall? | Recognition > Recall | Critical | | |
| 2.4 | Extraneous complexity removed? Smart defaults set (location, currency, language)? | Cognitive Load Theory | High | | |
| 2.5 | Critical info = text + visual together (icon, illustration, chart)? | Dual Coding Theory | High | | |
| 2.6 | Chunking used for long numbers (phone: +91 98765 43210, card: 1234 5678 9012 3456)? | Miller's Law | Medium | | |

---

## Layer 3 — Visual Organization (Gestalt)

| ID | Check | Law | Severity | Pass/Fail | Notes |
|----|-------|-----|----------|-----------|-------|
| 3.1 | Related elements grouped tightly (8px internal gap, 24px between groups)? | Proximity | Critical | | |
| 3.2 | Same function = same visual style (primary buttons, cards, icon weights)? | Similarity | Critical | | |
| 3.3 | Cards/borders/backgrounds define clear groups? No floating elements? | Common Region | Critical | | |
| 3.4 | Carousel/h-scroll: last item ≥30% visible? | Closure | High | | |
| 3.5 | Steps/flow visually connected (lines, arrows, aligned centers)? | Continuity | High | | |
| 3.6 | Foreground clearly separates from background (contrast ≥4.5:1, elevation/shadow)? | Figure-Ground | Critical | | |
| 3.7 | Icons simple (max 2-3 shapes)? No decorative complexity? | Prägnanz | Medium | | |
| 3.8 | Key content in F-pattern (top-left) or Z-pattern (landing) scan path? | F/Z Pattern | High | | |

---

## Layer 4 — Complexity Management

| ID | Check | Law | Severity | Pass/Fail | Notes |
|----|-------|-----|----------|-----------|-------|
| 4.1 | Auto-fill used wherever possible (OTP, address, card, UPI, name)? | Tesler's Law | Critical | | |
| 4.2 | Every element necessary? (Occam's Razor audit — remove if no clear purpose) | Occam's Razor | High | | |
| 4.3 | Top 20% features prominent? Bottom 80% hidden behind "More"? | Pareto Principle | High | | |
| 4.4 | Only ONE element highlighted per view (Von Restorff)? | Von Restorff | High | | |
| 4.5 | Advanced options hidden until needed ("More options", "Advanced settings")? | Progressive Disclosure | High | | |

---

## Layer 5 — Psychology & Emotion

| ID | Check | Law | Severity | Pass/Fail | Notes |
|----|-------|-----|----------|-----------|-------|
| 5.1 | Design polished at visceral level (aligned, consistent, quality feel)? | Aesthetic-Usability | High | | |
| 5.2 | Progress/completion visible (bar, steps, checklist)? | Goal Gradient Effect | High | | |
| 5.3 | Trust signals present (reviews, badges, user counts, security icons)? | Social Proof | High | | |
| 5.4 | Last state memorable/delightful (success animation, celebration, thank you)? | Peak-End Rule | High | | |
| 5.5 | All 3 emotional levels addressed? Visceral (look), Behavioral (use), Reflective (meaning)? | Emotional Design | Medium | | |
| 5.6 | Colors match semantic meaning? (Red=error/danger, Green=success/money, Blue=trust, Orange=warning) Indian context: Green=UPI/money | Color Psychology | High | | |
| 5.7 | State changes visually distinct enough to perceive (>14% difference)? | Weber's Law | Medium | | |

---

## Layer 6 — Heuristics + Principles

| ID | Check | Source | Severity | Pass/Fail | Notes |
|----|-------|--------|----------|-----------|-------|
| 6.1 | System status visible (loading, saved, synced, offline)? | Nielsen H1 | Critical | | |
| 6.2 | Real-world language (no jargon)? "Add to cart" not "Create line item"? | Nielsen H2 | High | | |
| 6.3 | Undo/Cancel available for destructive actions? | Nielsen H3 | Critical | | |
| 6.4 | Consistent design throughout (colors, spacing, icons, radii, motion)? | Nielsen H4 | High | | |
| 6.5 | Errors prevented before they happen (confirmations, validation, constraints)? | Nielsen H5 | Critical | | |
| 6.6 | Recognition over recall everywhere? | Nielsen H6 | Critical | | |
| 6.7 | Shortcuts for experts (swipe actions, keyboard shortcuts, long-press)? | Nielsen H7 | Medium | | |
| 6.8 | Minimalist — no unnecessary elements? | Nielsen H8 | High | | |
| 6.9 | Error = What happened + Why + How to fix? (Never "Something went wrong") | Nielsen H9 | Critical | | |
| 6.10 | Contextual help available (tooltips, empty states, inline hints)? | Nielsen H10 | Medium | | |
| 6.11 | Visibility, Feedback, Constraints, Mapping, Consistency, Affordance? | Don Norman 6 | High | | |
| 6.12 | All 8 Shneiderman golden rules met? | Shneiderman 8 | High | | |
| 6.13 | Honest? Unobtrusive? Long-lasting? Thorough to last detail? | Dieter Rams 10 | High | | |

---

## Layer 7 — Anti-Pattern Check

| ID | Check | Severity | Pass/Fail | Notes |
|----|-------|----------|-----------|-------|
| 7.1 | No hidden costs revealed late? | Critical | | |
| 7.2 | No pre-checked opt-in boxes (newsletter, marketing)? | Critical | | |
| 7.3 | Cancellation as easy as signup (same clicks, no calls)? | Critical | | |
| 7.4 | No fake urgency/scarcity (fake timers, "only 1 left" when false)? | Critical | | |
| 7.5 | No shame-based decline options ("No, I don't want to save money")? | Critical | | |
| 7.6 | Paste allowed in ALL inputs (OTP, password, card, UPI)? | High | | |
| 7.7 | Back button behaves expectedly (previous screen, not home)? | High | | |
| 7.8 | No notification bombing (max 1 marketing/day, user controls)? | High | | |
| 7.9 | No icon-only nav without labels? | High | | |
| 7.10 | No multiple primary CTAs cannibalizing each other (1 max per screen)? | High | | |
| 7.11 | No disguised ads (content that looks like UI)? | High | | |
| 7.12 | Infinite scroll ethical? (not weaponized attention, has stop points)? | Medium | | |

> **Full dark pattern library:** Read `anti-patterns.md`

---

## Layer 8 — Accessibility (WCAG 2.2) [NON-NEGOTIABLE — OVERRIDES AESTHETICS]

| ID | Check | WCAG | Severity | Pass/Fail | Notes |
|----|-------|------|----------|-----------|-------|
| 8.1 | Color contrast: Normal text ≥4.5:1, Large text (≥18pt/14pt bold) ≥3:1? | 1.4.3 AA | Critical | | |
| 8.2 | Touch targets: ≥44×44px (iOS) / ≥48×48dp (Android) / ≥56×56px preferred for India Tier 2/3? | 2.5.5 AA | Critical | | |
| 8.3 | Info NOT conveyed by color alone (add icon, label, pattern, underline)? | 1.4.1 A | Critical | | |
| 8.4 | Font size: Body ≥16px (14px absolute minimum), Captions ≥12px? | 1.4.4 AA | Critical | | |
| 8.5 | Error states: Never only red — always icon + text + border? | 1.4.1 + 3.3.1 | Critical | | |
| 8.6 | Interactive elements have accessible labels (aria-label, alt, title)? | 4.1.2 A | Critical | | |
| 8.7 | Animations reducible for motion-sensitive users (prefers-reduced-motion)? | 2.3.3 AAA | High | | |
| 8.8 | Tap targets spaced ≥8px apart (no accidental taps)? | 2.5.5 | High | | |
| 8.9 | Focus order logical (top-left → bottom-right)? Visible focus ring ≥2px? | 2.4.3 A | High | | |
| 8.10 | Heading hierarchy correct (h1→h2→h3, no skipping)? | 1.3.1 A | High | | |
| 8.11 | Form inputs have associated labels (not placeholder-only)? | 1.3.1 A | Critical | | |
| 8.12 | Hindi/regional scripts render correctly (Noto Sans Devanagari, line-height ≥1.5)? | 1.4.12 | High | | |

---

## Audit Report Template

```
UX AUDIT REPORT — [Product/Screen] — [Date]

SCREENS REVIEWED: [S01 Home, S02 Cart, S03 Checkout...]

LAYER SUMMARY:
Layer 1 (Speed):      ✅✅✅❌⚠️  → 3P/1F/1W
Layer 2 (Memory):     ✅✅✅✅✅  → 5P/0F/0W
Layer 3 (Gestalt):    ✅✅❌✅✅✅  → 5P/1F/0W
Layer 4 (Complexity): ✅✅✅⚠️  → 3P/0F/1W
Layer 5 (Psych):      ✅✅✅✅⚠️✅  → 5P/0F/1W
Layer 6 (Heuristics): ✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F
Layer 7 (Anti):       ✅✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F
Layer 8 (A11y):       ✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F

CRITICAL FAILURES (Fix Before Handoff):
- [S02] 1.3: Checkout skeleton missing — blank 2s on slow 3G (Doherty Threshold)
- [S03] 8.1: Error text contrast 3.2:1 on red background (WCAG 1.4.3)

HIGH PRIORITY:
- [S01] 3.4: Carousel last item not visible (Closure)
- [S04] 5.7: Button hover state barely perceptible (Weber's Law)

RECOMMENDATIONS: [Law-backed, severity-ordered]
```

---

## Quick Reference — Law → Layer Mapping

| Law | Primary Layer |
|-----|---------------|
| Fitts's Law | 1, 4 |
| Hick's Law | 1, 4 |
| Miller's Law | 2, 4 |
| Jakob's Law | 3, 4 |
| Doherty Threshold | 1 |
| Zeigarnik Effect | 2 |
| Goal Gradient | 5 |
| Von Restorff | 3, 4 |
| Pareto | 1, 4 |
| Serial Position | 3, 5 |
| Tesler's Law | 4 |
| Aesthetic-Usability | 5 |
| Occam's Razor | 4 |
| Postel's Law | 4, 6 |
| Peak-End | 5 |
| Gestalt (all) | 3 |
| Social Proof | 5 |
| Scarcity | 5 |
| Fogg Model | 2, 5 |
| Hook Model | 5 |
| Krug's Law | 3, 6 |
| F/Z Pattern | 3 |
| Emotional Design | 5 |
| Progressive Disclosure | 4 |
| Color Psychology | 5 |
| Microinteractions | 3, 5 |
| Info Architecture | 3, 4 |
| Cognitive Load | 2, 4 |
| Paradox of Choice | 1, 4 |
| Weber's Law | 5 |
| Dual Coding | 2, 3, 5 |
| Nielsen / Norman / Shneiderman / Rams | 6, 7, 8 |