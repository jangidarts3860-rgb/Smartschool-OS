---
name: ux-audit-v2
description: Senior UX Auditor. Run 8-layer heuristic audit on any design. Use for: "UX audit karo", "design review", "heuristic check", "accessibility audit", "dark pattern check", "design kya galat hai". Trigger on any design review request. Always cite ux-thinking laws by number.
version: 2.0
---
# UX Audit v2 — 8-Layer Heuristic Audit

> **Source of Truth:** `ux-thinking` skill (37 Laws + 4 Frameworks + Conflict Hierarchy)
> **This skill executes audits.** Laws come from ux-thinking. Anti-patterns from `anti-patterns.md`.

---

## Activation Protocol

When user says: "UX audit karo", "design review", "check accessibility", "dark pattern check":
1. **CONTEXT**: Identify Platform, Industry, Screen type, User type, Goal.
2. **LAWS**: Activate laws specific to that screen type.
3. **CONFLICT**: Resolve any clashes strictly by the Priority Hierarchy (P1 Safety > P2 Trust > P3 Usability > P4 Aesthetic).
4. **VALIDATE**: Run the full 8-layer checklist below.
5. **OUTPUT**: Present using the strict Law-Backed Findings format.

**Output Format:** Every finding must use:
```
FINDING: [What's wrong]
SEVERITY: Critical (blocks task) | High (damages UX) | Medium (friction) | Low (polish)
EFFORT: Quick win (<1hr) | Medium (1 day) | Big change (1 week+)
LAW: [Specific law from ux-thinking — e.g., "Law 5: Doherty Threshold"]
SCREEN: [Screen ID or description]
FIX: [Exact change — no vague words]
BRAIN NOTE: [1-sentence psychology — why user brain responds this way]
```

---

## Context Identification Matrix (Before Audit)

| Check | Variants | Impact on Audit |
|-------|----------|-----------------|
| **Platform** | Mobile / Web / Tablet | Mobile needs 44px targets, Web needs F-pattern/Hover. |
| **Industry** | Food / E-commerce / Fintech | Fintech demands extra trust + zero-ambiguity checks. |
| **Screen Type** | Form / Nav / View / Dashboard | Dictates which laws are actively scrutinized. |
| **User Type** | Novice / Power User / Elderly | Need for shortcuts, dual-coding, or huge text. |
| **Mode** | Regular / Case Study / Portfolio | If Case Study, justify each fix with "Decision Justification" format. |

---

## Layer 1: Speed & Efficiency

| # | Check | Law | Severity | Screen | Notes |
|---|-------|-----|----------|--------|-------|
| 1.1 | Nav items ≤5? Progressive disclosure for more? | Hick's Law | Critical | | |
| 1.2 | Primary CTA = large, thumb zone (bottom 1/3), full-width mobile? | Fitts's Law | Critical | | |
| 1.3 | Loading states for ALL async ops? No blank screens >400ms? | Doherty Threshold | Critical | | |
| 1.4 | Options causing paralysis? Reduced to essentials + defaults? | Paradox of Choice | High | | |
| 1.5 | High-value tasks (top 20%) reachable in ≤3 taps? | Pareto Principle | High | | |
| 1.6 | Search/filter available when list >20 items? | Hick's Law | Medium | | |

---

## Layer 2: Memory & Brain

| # | Check | Law | Severity | Screen | Notes |
|---|-------|-----|----------|--------|-------|
| 2.1 | Max 7 items per section? Forms broken into steps? | Miller's Law | Critical | | |
| 2.2 | Progress visible in multi-step flows? | Zeigarnik Effect | Critical | | |
| 2.3 | Suggestions/recents shown? No blank inputs requiring recall? | Recognition > Recall | Critical | | |
| 2.4 | Extraneous complexity removed? Smart defaults set? | Cognitive Load Theory | High | | |
| 2.5 | Critical info = text + visual together? (2x retention) | Dual Coding Theory | High | | |
| 2.6 | Chunking for long numbers (phone, card, OTP)? | Miller's Law | Medium | | |

---

## Layer 3: Visual Organization (Gestalt)

| # | Check | Law | Severity | Screen | Notes |
|---|-------|-----|----------|--------|-------|
| 3.1 | Related elements grouped tightly (8px internal, 24px between)? | Proximity | Critical | | |
| 3.2 | Same function = same visual style? | Similarity | Critical | | |
| 3.3 | Cards/borders define clear groups? | Common Region | Critical | | |
| 3.4 | Carousel/h-scroll: last item ≥30% visible? | Closure | High | | |
| 3.5 | Steps/flow visually connected (lines, arrows, alignment)? | Continuity | High | | |
| 3.6 | Foreground clearly separates from background? | Figure-Ground | Critical | | |
| 3.7 | Icons simple (max 2-3 shapes)? | Prägnanz | Medium | | |
| 3.8 | Key content in F-pattern (top-left) or Z-pattern (landing)? | F/Z Pattern | High | | |

---

## Layer 4: Complexity Management

| # | Check | Law | Severity | Screen | Notes |
|---|-------|-----|----------|--------|-------|
| 4.1 | Auto-fill used wherever possible (OTP, address, card)? | Tesler's Law | Critical | | |
| 4.2 | Every element necessary? (Occam's Razor audit) | Occam's Razor | High | | |
| 4.3 | Top 20% features visually prominent? | Pareto Principle | High | | |
| 4.4 | Only ONE element highlighted per view? | Von Restorff Effect | Critical | | |
| 4.5 | Advanced options hidden until needed? | Progressive Disclosure | High | | |
| 4.6 | Smart defaults pre-selected (region, language, currency)? | Tesler's Law | Medium | | |

---

## Layer 5: Psychology & Emotion

| # | Check | Law | Severity | Screen | Notes |
|---|-------|-----|----------|--------|-------|
| 5.1 | Design polished at visceral level? | Aesthetic-Usability | High | | |
| 5.2 | Progress/completion visible near end of flows? | Goal Gradient Effect | High | | |
| 5.3 | Trust signals present (reviews, badges, counts)? | Social Proof | Critical (fintech) | | |
| 5.4 | Last state memorable/delightful? (success screen, confirmation) | Peak-End Rule | High | | |
| 5.5 | All 3 emotional levels addressed? (Visceral, Behavioral, Reflective) | Emotional Design | Medium | | |
| 5.6 | Colors match semantic meaning? (Red=error, Green=success, Indian context: Green=UPI) | Color Psychology | Critical | | |
| 5.7 | State changes visually distinct enough to perceive (>14% diff)? | Weber's Law | High | | |
| 5.8 | Is friction proportional to motivation? (M * A * P aligned?) | Fogg Behavior Model | High | | |
| 5.9 | Is there an ethical investment phase for returning users? | Hook Model | Medium | | |
| 5.10 | Are critical elements paired visual+text? | Dual Coding Theory | Critical | | |

---

## Layer 5.5: Fintech & High-Stakes Special Audit (Auto-runs for finance apps)

| # | Check | Rationale | Severity |
|---|-------|-----------|----------|
| F.1 | Security badges / "Encryption" text visible near money input | Lowers anxiety | Critical |
| F.2 | Balance is prominent, never hidden | Reduces cognitive load | Critical |
| F.3 | Two money amounts on same line have unmistakable bold labels | Prevents costly mistakes | Critical |
| F.4 | Explicit confirmation required for sends/transfers > ₹500 | Error prevention (P1) | Critical |
| F.5 | Fees shown BEFORE final confirm button | Honesty (Dieter Rams) | Critical |
| F.6 | Error message says exactly "Your money is safe" if failed mid-flow | Panic prevention | Critical |

---

## Layer 6: Heuristics + Principles

### Nielsen's 10 Heuristics

| # | Check | Severity |
|---|-------|----------|
| 6.1 | System status visible (loading, saved, synced)? | Critical |
| 6.2 | Real-world language (no jargon)? "Add to cart" not "Create line item" | High |
| 6.3 | Undo/Cancel available for destructive actions? | Critical |
| 6.4 | Consistent design throughout (colors, spacing, icons, radii, motion)? | High |
| 6.5 | **Errors prevented before they happen?** (confirmations, validation, constraints) | **Critical (P1)** |
| 6.6 | Recognition > recall everywhere? | Critical |
| 6.7 | Shortcuts for experts (swipe actions, keyboard, long-press)? | Medium |
| 6.8 | Minimalist — no decorative-only elements? | High |
| 6.9 | Error = What + Why + How to fix? (Never "Something went wrong") | Critical |
| 6.10 | Contextual help available (tooltips, empty states, inline hints)? | Medium |

### Don Norman's 6 Principles
| Check | Severity |
|-------|----------|
| Visibility: Key actions visible, not hidden? | Critical |
| Feedback: Every action has perceivable response <100ms? | Critical |
| Constraints: Invalid actions prevented (disabled, validation)? | High |
| Mapping: Controls match spatial/mental model? | High |
| Consistency: Same action = same result everywhere? | Critical |
| Affordance: Controls look like what they do? | Critical |

### Shneiderman's 8 Golden Rules
| Check | Severity |
|-------|----------|
| All 8 met? (consistency, shortcuts, feedback, closure, error handling, reversal, locus of control, memory load) | High |

### Dieter Rams' 10 Principles
| Check | Severity |
|-------|----------|
| Honest? Unobtrusive? Long-lasting? Thorough to last detail? | High |

---

## Layer 7: Anti-Pattern Check

| # | Anti-Pattern | Severity | Screen | Notes |
|---|--------------|----------|--------|-------|
| 7.1 | Hidden costs revealed late? | Critical | | |
| 7.2 | Pre-checked opt-in boxes (marketing, newsletter)? | Critical | | |
| 7.3 | Cancellation harder than signup? | Critical | | |
| 7.4 | Fake urgency/scarcity (fake timers, "only 1 left" when false)? | Critical | | |
| 7.5 | Confirmshaming ("No thanks, I don't want to save money")? | High | | |
| 7.6 | Paste disabled in inputs (OTP, password, card)? | Critical | | |
| 7.7 | Back button breaks (closes app, loses data, unexpected)? | High | | |
| 7.8 | Notification bombing (>2/day non-transactional)? | High | | |
| 7.9 | Icon-only nav without labels? | High | | |
| 7.10 | Multiple primary CTAs cannibalizing each other? (1 max per screen) | High | | |
| 7.11 | Disguised ads (content that looks like UI)? | High | | |
| 7.12 | Infinite scroll weaponized (no stop, no footer access)? | Medium | | |

> **Full library:** Read `anti-patterns.md` for 50+ patterns by category.

---

## Layer 8: Accessibility (WCAG 2.2) [NON-NEGOTIABLE — OVERRIDES AESTHETICS]

| # | Check | WCAG | Severity | Screen | Notes |
|---|-------|------|----------|--------|-------|
| 8.1 | Color contrast: Normal text ≥4.5:1, Large text (≥18pt) ≥3:1? | 1.4.3 AA | **Critical (P1)** | | |
| 8.2 | Touch targets ≥44×44px (iOS) / ≥48×48dp (Android) / ≥56×56px India Tier 2/3? | 2.5.5 AA | **Critical (P1)** | | |
| 8.3 | Info NOT conveyed by color alone (add icon/label/pattern)? | 1.4.1 A | **Critical (P1)** | | |
| 8.4 | Font size: Body ≥16px (14px absolute min), Captions ≥12px? | 1.4.4 AA | **Critical (P1)** | | |
| 8.5 | Error states: NEVER only red — always icon + text + border? | 1.4.1 + 3.3.1 | **Critical (P1)** | | |
| 8.6 | Interactive elements have accessible labels (aria-label, `<label>`)? | 4.1.2 A | **Critical (P1)** | | |
| 8.7 | Animations respect `prefers-reduced-motion`? | 2.3.3 AAA | **Critical (P1)** | | |
| 8.8 | Tap targets spaced ≥8px apart (no accidental taps)? | 2.5.5 | **Critical (P1)** | | |
| 8.9 | Focus order logical (top-left → bottom-right)? Visible focus ring ≥2px? | 2.4.3 A | High | | |
| 8.10 | Heading hierarchy correct (h1→h2→h3, no skipping)? | 1.3.1 A | High | | |
| 8.11 | Form inputs have associated labels (not placeholder-only)? | 1.3.1 A | **Critical (P1)** | | |
| 8.12 | Hindi/regional scripts render correctly (Noto Sans Devanagari, line-height ≥1.5)? | 1.4.12 | High | | |

---

## Audit Report Template

```
UX AUDIT REPORT — [Product/Screen] — [Date]

SCREENS REVIEWED: [S01 Home, S02 Cart, S03 Checkout...]

LAYER SUMMARY:
Layer 1 (Speed):     ✅✅✅❌⚠️  → 3P/1F/1W
Layer 2 (Memory):    ✅✅✅✅✅  → 5P/0F/0W
Layer 3 (Gestalt):   ✅✅❌✅✅✅  → 5P/1F/0W
Layer 4 (Complexity): ✅✅✅⚠️  → 3P/0F/1W
Layer 5 (Psych):     ✅✅✅✅⚠️✅  → 5P/0F/1W
Layer 6 (Heuristics): ✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F
Layer 7 (Anti):      ✅✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F
Layer 8 (A11y):      ✅✅✅✅✅✅✅✅✅✅✅  → 12P/0F

CRITICAL FAILURES (Fix Before Handoff):
- [S02] 1.3: Checkout skeleton missing — blank 2s on slow 3G (Doherty Threshold)
- [S03] 8.1: Error text contrast 3.2:1 on red background (WCAG 1.4.3)

HIGH PRIORITY:
- [S01] 3.4: Carousel last item not visible (Closure)
- [S04] 5.7: Button hover state barely perceptible (Weber's Law)

RECOMMENDATIONS: [Law-backed, severity-ordered]
```

---

## Law Conflict Resolution (From ux-thinking)

| Conflict | Winner | Reason |
|----------|--------|--------|
| Fitts's (big CTA) vs Aesthetic (minimal) | **Fitts's** | P3 > P4 |
| Von Restorff (1 highlight) vs Client (3) | **Von Restorff** | Cognitive clarity |
| Hick's (fewer) vs Business (show all) | **Hick's + Progressive Disclosure** | P3 + pattern |
| Scarcity (urgency) vs Honest (Dieter Rams) | **Honest** | P2 > conversion |
| Fogg Ability (less friction) vs Security | **Security** | P1 irreversible risk |
| WCAG contrast vs design-taste color ban | **WCAG** | P1 — accessibility |
| Brand ref violates UX law | **UX Law** | Tier 1 > Tier 5 |

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