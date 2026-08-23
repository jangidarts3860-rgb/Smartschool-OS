# Brand Pattern: Zapier

## Lessons & Core Philosophy
Zapier's website radiates **warm, approachable professionalism** — it rejects the cold monochrome minimalism of developer tools in favor of a cream-tinted canvas (`#FFFEFB`) that feels like unbleached paper, the digital equivalent of a well-organized notebook. The near-black (`#201515`) text has a faint reddish-brown warmth, creating an atmosphere more human than mechanical. This is automation designed to feel effortless, not technical.

The typographic system is a deliberate interplay of three distinct personalities. **Degular Display** — a geometric, wide-set display face — handles hero-scale headlines at 56–80px with medium weight (500) and extraordinarily tight line-heights (0.90), creating headlines that compress vertically like stacked blocks. **Inter** serves as the workhorse for everything else, from section headings to body text and navigation, with fallbacks to Helvetica and Arial. **GT Alpina**, an elegant thin-weight serif with aggressive negative letter-spacing (-1.6px to -1.92px), makes occasional appearances for softer editorial moments. This three-font system gives Zapier the ability to shift register — from bold and punchy (Degular) to clean and functional (Inter) to refined and literary (GT Alpina).

The brand's signature **orange (`#FF4F00`)** is unmistakable — a vivid, saturated red-orange that sits precisely between traffic-cone urgency and sunset warmth. It's used sparingly but decisively: primary CTA buttons, active state underlines, accent borders. Against the warm cream background, this orange creates a color relationship that feels energetic without being aggressive.

### Key Characteristics
- Warm cream canvas (`#FFFEFB`) — organic, paper-like warmth
- Near-black with reddish undertone (`#201515`) — text that breathes
- Degular Display for hero headlines at 0.90 line-height — compressed, impactful
- Inter as universal UI font across all functional typography
- GT Alpina for editorial accents — thin-weight serif with extreme negative tracking
- Zapier Orange (`#FF4F00`) as single accent — vivid, warm, sparingly applied
- Warm neutral palette: borders `#C5C0B1`, muted text `#939084`, surface tints `#ECEAE3`
- 8px base spacing with generous CTA padding (20px 24px)
- Border-forward design: `1px solid` borders in warm grays define structure over shadows
- Inset box-shadow for tab underlines (orange/sand)

---

## Detailed Specifications

### Color Palette & Roles

**Primary**
- Zapier Black (`#201515`): Primary text, headings, dark button backgrounds — warm near-black with reddish undertones
- Cream White (`#FFFEFB`): Page background, card surfaces, light button fills
- Off-White (`#FFFDFA`): Secondary background surface, subtle alternate

**Brand Accent**
- Zapier Orange (`#FF4F00`): Primary CTA buttons, active underline indicators, accent borders

**Neutral Scale**
- Dark Charcoal (`#36342E`): Secondary text, footer text, strong borders (70% opacity variant)
- Warm Gray (`#939084`): Tertiary text, muted labels, timestamps
- Sand (`#C5C0B1`): **Primary border color**, hover state backgrounds, divider lines — the backbone of Zapier's structural elements
- Light Sand (`#ECEAE3`): Secondary button backgrounds, light borders, subtle card surfaces
- Mid Warm (`#B5B2AA`): Alternate border tone

**Interactive**
- Orange CTA (`#FF4F00`): Primary action buttons, active tab underlines
- Dark CTA (`#201515`): Secondary dark buttons, sand hover state
- Light CTA (`#ECEAE3`): Tertiary/ghost buttons, sand hover state
- Link Default (`#201515`): Standard link color, matching body text
- Hover Underline: Links remove `text-decoration: underline` on hover (inverse pattern)

**Overlay & Surface**
- Semi-transparent Dark (`rgba(45,45,46,0.5)`): Overlay button variant, backdrop-like elements
- Pill Surface (`#FFFEFB`): White pill buttons with sand borders

**Shadows & Depth**
- Inset Underline (`rgb(255,79,0) 0px -4px 0px 0px inset`): Active tab indicator — orange underline using inset box-shadow
- Hover Underline (`rgb(197,192,177) 0px -4px 0px 0px inset`): Inactive tab hover — sand-colored underline

### Typography Rules

**Font Families**
- Display: `Degular Display` — wide geometric display face for hero headlines
- Primary: `Inter`, fallbacks: `Helvetica, Arial`
- Editorial: `GT Alpina` — thin-weight serif for editorial moments
- System: `Arial` — fallback for form elements and system UI

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero XL | Degular Display | 80px (5.00rem) | 500 | 0.90 (tight) | normal | Maximum impact |
| Display Hero | Degular Display | 56px (3.50rem) | 500 | 0.90-1.10 (tight) | 0-1.12px | Primary hero headlines |
| Display Hero SM | Degular Display | 40px (2.50rem) | 500 | 0.90 (tight) | normal | Smaller hero variant |
| Display Button | Degular Display | 24px (1.50rem) | 600 | 1.00 (tight) | 1px | Large CTA button text |
| Section Heading | Inter | 48px (3.00rem) | 500 | 1.04 (tight) | normal | Major section titles |
| Editorial Heading | GT Alpina | 48px (3.00rem) | 250 | normal | -1.92px | Thin editorial headlines |
| Editorial Sub | GT Alpina | 40px (2.50rem) | 300 | 1.08 (tight) | -1.6px | Editorial subheadings |
| Sub-heading LG | Inter | 36px (2.25rem) | 500 | normal | -1px | Large sub-sections |
| Sub-heading | Inter | 32px (2.00rem) | 400 | 1.25 (tight) | normal | Standard sub-sections |
| Sub-heading MD | Inter | 28px (1.75rem) | 500 | normal | normal | Medium sub-headings |
| Card Title | Inter | 24px (1.50rem) | 600 | normal | -0.48px | Card headings |
| Body Large | Inter | 20px (1.25rem) | 400-500 | 1.00-1.20 (tight) | -0.2px | Feature descriptions |
| Body Emphasis | Inter | 18px (1.13rem) | 600 | 1.00 (tight) | normal | Emphasized body |
| Body | Inter | 16px (1.00rem) | 400-500 | 1.20-1.25 | -0.16px | Standard reading text |
| Body Semibold | Inter | 16px | 600 | 1.16 (tight) | normal | Strong labels |
| Button | Inter | 16px | 600 | normal | normal | Standard buttons |
| Button SM | Inter | 14px (0.88rem) | 600 | normal | normal | Small buttons |
| Caption | Inter | 14px (0.88rem) | 500 | 1.25-1.43 | normal | Labels, metadata |
| Caption Upper | Inter | 14px | 600 | normal | 0.5px | Uppercase section labels |
| Micro | Inter | 12px (0.75rem) | 600 | 0.90-1.33 | 0.5px | Tiny labels, often uppercase |
| Micro SM | Inter | 13px (0.81rem) | 500 | 1.00-1.54 | normal | Small metadata text |

**Principles:**
- Three-font system, clear roles: Degular Display commands attention at hero scale only. Inter handles everything functional. GT Alpina adds editorial warmth sparingly.
- Compressed display: Degular at 0.90 line-height creates vertically compressed headline blocks that feel modern and architectural.
- Weight as hierarchy signal: Inter uses 400 (reading), 500 (navigation/emphasis), 600 (headings/CTAs). Degular uses 500 (display) and 600 (buttons). GT Alpina uses 250-300 (thin editorial).
- Uppercase for labels: Section labels and micro-categorization use `text-transform: uppercase` with 0.5px letter-spacing.
- Negative tracking for elegance: GT Alpina uses -1.6px to -1.92px letter-spacing for its thin-weight editorial headlines.

### Component Stylings

**Buttons**
| Variant | BG | Text | Padding | Radius | Border | Use |
|---------|----|------|---------|--------|--------|-----|
| Primary Orange | `#FF4F00` | `#FFFEFB` | 8px 16px | 4px | `1px solid #FF4F00` | Primary CTA ("Start free with email", "Sign up free") |
| Primary Dark | `#201515` | `#FFFEFB` | 20px 24px | 8px | `1px solid #201515` | Large secondary CTA |
| Light / Ghost | `#ECEAE3` | `#36342E` | 20px 24px | 8px | `1px solid #C5C0B1` | Tertiary actions, filter buttons |
| Pill Button | `#FFFEFB` | `#36342E` | 0px 16px | 20px | `1px solid #C5C0B1` | Tag-like selections, filter pills |
| Overlay Semi-transparent | `rgba(45,45,46,0.5)` | `#FFFEFB` | — | 20px | — | Video play buttons, floating actions |

**Tab / Navigation (Inset Shadow)**
- Background: transparent
- Text: `#201515`
- Padding: 12px 16px
- Active: `box-shadow: rgb(255,79,0) 0px -4px 0px 0px inset`
- Hover: `box-shadow: rgb(197,192,177) 0px -4px 0px 0px inset`

**Cards & Containers**
- BG: `#FFFEFB`
- Border: `1px solid #C5C0B1` (warm sand border)
- Radius: 5px (standard), 8px (featured)
- No shadow elevation — borders define containment

**Inputs & Forms**
- BG: `#FFFEFB`
- Text: `#201515`
- Border: `1px solid #C5C0B1`
- Radius: 5px
- Focus: Border `#FF4F00` (orange)
- Placeholder: `#939084`

**Navigation**
- Clean horizontal nav on cream background
- Zapier logotype left-aligned, 104x28px
- Links: Inter 16px weight 500, `#201515` text
- CTA: Orange button ("Start free with email")
- Tab navigation uses inset box-shadow underline technique

**Image Treatment**
- Product screenshots with `1px solid #C5C0B1` border
- Rounded corners: 5-8px
- Dashboard/workflow screenshots prominent in feature sections
- Light gradient backgrounds behind hero content

**Distinctive Components**

**Workflow Integration Cards**
- Display connected app icons in pairs
- Arrow or connection indicator between apps
- Sand border containment
- Inter weight 500 for app names

**Stat Counter**
- Large display number using Inter 48px weight 500
- Muted description below in `#36342E`
- Used for social proof metrics

**Social Proof Icons**
- Circular icon buttons: 14px radius
- Sand border: `1px solid #C5C0B1`
- Used for social media follow links in footer

---

## Trade-offs
- **Pros:** Warm, human, approachable — rare in automation. Three-font system gives range. Orange CTA is unmistakable. Border-first = grounded, tangible.
- **Cons:** Three fonts = licensing/complexity. Cream canvas = harder contrast compliance. Orange = polarizing. Degular tight leading = readability risk at small sizes.

---

## What NOT to Copy
- **Don't use `#FF4F00` as your brand orange** — it's Zapier's signature.
- **Don't use Degular Display for body text** — it's display-only.
- **Don't use pure white (`#FFFFFF`) or pure black (`#000000`)** — Zapier's palette is warm-shifted.
- **Don't apply box-shadow elevation to cards** — Zapier uses borders (`1px solid #C5C0B1`).
- **Don't use Degular Display for UI elements** — it's display-only.
- **Don't ignore the warm neutral system** — borders `#C5C0B1`, text `#36342E`, surfaces `#ECEAE3` are a cohesive system.
- **Don't use standard tab underlines** — Zapier uses inset box-shadow (`inset 0 -4px`).

---

## Agent Prompt Guide

**Quick Colors:**
- CTA: `#FF4F00`
- Background: `#FFFEFB`
- Heading: `#201515`
- Body: `#36342E`
- Border: `#C5C0B1`
- Muted: `#939084`

**Prompts:**
- "Create a Zapier hero: `#FFFEFB` bg. Headline 56px Degular Display weight 500, line-height 0.90, `#201515`. Subtitle 20px Inter 400, `#36342E`, line-height 1.20. Orange CTA (`#FF4F00`, 4px radius, 8px 16px) + Dark button (`#201515`, 8px radius, 20px 24px)."
- "Design a workflow integration card: `#FFFEFB` bg, `1px solid #C5C0B1` border, 5px radius. Two app icons side-by-side with arrow connector. App names 16px Inter 500 `#201515`."
- "Build tab navigation: transparent bg, Inter 16px 500 `#201515`, padding 12px 16px. Active: `inset 0 -4px 0 0 #FF4F00`. Hover: `inset 0 -4px 0 0 #C5C0B1`."
- "Design a pricing card: `#FFFEFB` bg, `1px solid #C5C0B1` border, 5px radius. Title 24px Inter 600 `-0.48px` tracking. Price 48px Inter 500. CTA: Dark button `#201515` 8px radius 20px 24px padding."
- "Create Zapier-style footer: `#201515` bg. Text `#FFFEFB`. Links `#C5C0B1` hover `#FFFEFB`. Social icons: 14px radius circles, `#C5C0B1` border. Logotype 104x28px."

---

## Trade-offs
- Warmth = trust, but harder contrast compliance
- Three fonts = licensing/performance cost
- Orange CTA = high visibility, but polarizing
- Border-first = grounded feel, but less "modern/airy"
- Degular tight leading = impact, but accessibility risk at small sizes

---

## What NOT to Copy
- Don't copy the exact orange — it's Zapier's signature.
- Don't use Degular for body text — display only.
- Don't use pure white/black — warm shift is the identity.
- Don't add shadows to cards — borders only.
- Don't use standard tab underlines — inset box-shadow is the signature.