# Brand Pattern: Wise

## Lessons & Core Philosophy
Wise's design is **bold, confident fintech** that communicates "money without borders" through massive typography and a distinctive lime-green accent. The design operates on a warm off-white canvas with near-black text (`#0E0F0C`) and a signature **Wise Green (`#9FE870`)** — a fresh, lime-bright color that feels alive and optimistic, unlike the corporate blues of traditional banks.

The typography uses **Wise Sans** — a proprietary font at extreme weight 900 (black) for display headings with a remarkably tight line-height of 0.85 and OpenType `"calt"` (contextual alternates). At 126px, the text is so dense it feels like a protest sign — bold, urgent, impossible to ignore. Inter serves as the body font with weight 600 as the default for emphasis, creating a consistently confident voice.

What distinguishes Wise is its **green-on-white-on-black material palette**: Lime Green (`#9FE870`) appears on buttons with dark green text (`#163300`), creating a nature-inspired CTA that feels fresh. Hover states use `scale(1.05)` expansion rather than color changes — buttons physically grow on interaction. The border-radius system uses 9999px for buttons (pill), 30px–40px for cards, and the shadow system is minimal — just `rgba(14,15,12,0.12) 0px 0px 0px 1px` ring shadows.

What makes Wise distinctive is its **semantic color system for money**: Green only for positive/inflows, Red only for negative/outflows, Amber for pending. Green is NEVER used for large background areas — it's reserved for buttons and accents. The border-radius system uses 9999px for all buttons and images (pill/circle), creating a cohesive pill-shaped language.

### Key Characteristics
- Wise Sans weight 900, line-height 0.85 — billboard-scale bold headlines
- Wise Green (`#9FE870`) with Dark Green (`#163300`) text — fresh, optimistic fintech
- Inter weight 600 as body default — confident, not light
- `scale(1.05)` hover / `scale(0.95)` active — buttons physically grow/shrink
- Pill buttons (9999px), large card radius (30px–40px)
- Ring shadows only — `rgba(14,15,12,0.12) 0px 0px 0px 1px`
- Semantic money colors: Green=in, Red=out, Amber=pending
- Inter 600 as body default — confident reading weight
- Wise Sans `"calt"` on ALL text

---

## Detailed Specifications

### Color Palette & Roles

**Primary Brand**
| Token | Hex | Use |
|-------|-----|-----|
| Wise Green | `#9FE870` | Primary CTA, brand accent |
| Dark Green | `#163300` | Button text on green, deep accent |
| Light Mint | `#E2F6D5` | Soft green surface, badge BG |
| Pastel Green | `#CDFFAD` | Hover accent |
| Near Black | `#0E0F0C` | Primary text, dark backgrounds |

**Semantic Money Colors**
| Token | Hex | Use |
|-------|-----|-----|
| Positive Green | `#054D28` | Inflows, success, positive balances |
| Danger Red | `#D03238` | Outflows, errors, negative balances |
| Warning Yellow | `#FFD11A` | Pending, warnings |
| Background Cyan | `rgba(56,200,255,0.10)` | Info tint |
| Bright Orange | `#FFC091` | Warm accent |

**Neutral Scale**
| Token | Light | Dark |
|-------|-------|------|
| Warm Dark | `#454745` | Secondary text, borders |
| Gray | `#868685` | Muted text, tertiary |
| Light Surface | `#E8EBE6` | Subtle green-tinted surface |

**Button States**
| Variant | BG | Text | Border | Radius | Hover | Active |
|---------|-----|------|--------|--------|--------|--------|
| Primary Green | `#9FE870` | `#163300` | none | 9999px | `scale(1.05)` | `scale(0.95)` |
| Secondary Subtle | `rgba(22,51,0,0.08)` | `#0E0F0C` | none | 9999px | `scale(1.05)` | `scale(0.95)` |
| Tertiary | Transparent | `#0E0F0C` | none | 9999px | BG `#E8EBE6` | — |

**Cards & Containers**
- Radius: 16px (small), 30px (medium), 40px (large/featured)
- Border: `1px solid rgba(14,15,12,0.12)` or `#9FE870`
- Shadow: `rgba(14,15,12,0.12) 0px 0px 0px 1px` (ring only)

**Inputs**
- Radius: 10px (standard), 20px (comfortable)
- Border: `1px solid rgba(14,15,12,0.12)`
- Focus: Ring `#9FE870`
- BG: Transparent or `#E8EBE6`

**Navigation**
- Green-tinted hover: `rgba(211,242,192,0.4)`
- Clean header, Wise wordmark left, pill CTAs right

---

## Trade-offs
- **Pros:** Instantly recognizable. Green = money movement = trust. Bold typography = confidence. Pill buttons = friendly, approachable.
- **Cons:** Green-heavy = accessibility risk (color blindness). Weight 900 = readability risk at small sizes. Tight line-height = reading fatigue in long form. Pill-only buttons = no visual hierarchy for secondary actions.

---

## What NOT to Copy
- **Don't use `#9FE870` as your brand green** — it's Wise's signature.
- **Don't use weight 900 for headlines** unless your brand IS "bold/confident."
- **Don't use line-height 0.85** on body text — only for massive display.
- **Don't use green for large backgrounds** — Wise reserves it for buttons/accents.
- **Don't use `scale(1.05)` hover on everything** — only buttons.
- **Don't use pill (9999px) radius on cards** — only buttons/images.

---

## Agent Prompt Guide

**Quick Colors:**
- Canvas: `#FFFFFF` / `#0E0F0C`
- Green: `#9FE870`
- Dark Green: `#163300`
- Text: `#0E0F0C` / `#454745`
- Border: `rgba(14,15,12,0.12)`
- Red: `#D03238`
- Yellow: `#FFD11A`

**Prompts:**
- "Create a Wise-style hero: `#FFFFFF` bg. Headline 96px Wise Sans weight 900, line-height 0.85, `#0E0F0C`, `calt` on. Subtitle 22px Inter 400, `#454745`. Green pill CTA: `#9FE870` bg, `#163300` text, 9999px radius, 5px 16px padding, `scale(1.05)` hover."
- "Design a Wise money transfer card: White bg, `1px solid rgba(14,15,12,0.12)` border, 30px radius. Amount: 48px Inter 600 `#0E0F0C`. Direction: Green `#054D28` for in, Red `#D03238` for out. Fee row: 14px `#454745`. Green pill CTA `Send money` `#9FE870` bg."
- "Build a Wise button: Primary `#9FE870` bg, `#163300` text, 9999px radius, 5px 16px padding. Hover: `scale(1.05)`. Active: `scale(0.95)`. Secondary: `rgba(22,51,0,0.08)` bg, `#0E0F0C` text, same radius."
- "Design a Wise notification toast: Green `#E2F6D5` bg, `#163300` border, 9999px radius. Icon: check `#163300`. Text: 14px 600 `#0E0F0C` '£1,500 credited'. Dismiss: `#6A6A6A` text."
- "Create a Wise balance display: `#FFFFFF` card, 40px radius. Balance: 64px Inter 600 `#0E0F0C` tabular-nums. Currency: `#454745`. 'Send' pill `#9FE870` bg `#163300` text. 'Request' subtle `rgba(22,51,0,0.08)`."

---

## Trade-offs
- Bold = memorable, but accessibility risk on green
- Weight 900 = impact, but legibility risk at small sizes
- Pill buttons = friendly, but no visual hierarchy for secondary
- Tight line-height = density, but reading fatigue

---

## What NOT to Copy
- Don't copy the exact Wise Green — it's their signature.
- Don't use weight 900 on body text — only massive display.
- Don't use line-height 0.85 on anything but 80px+ display.
- Don't use green backgrounds — Wise uses green for buttons only.
- Don't use `scale(1.05)` on non-button elements.