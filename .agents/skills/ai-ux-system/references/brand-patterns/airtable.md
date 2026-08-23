# Brand Pattern: Airtable

## Lessons & Core Philosophy
Airtable's website is a clean, enterprise-friendly platform that communicates "sophisticated simplicity" through a white canvas with deep navy text (`#181D26`) and Airtable Blue (`#1B61C9`) as the primary interactive accent. The Haas font family (display + text variants) creates a Swiss-precision typography system with positive letter-spacing throughout — a subtle but distinctive choice that makes text feel open and breathable rather than compressed.

The design operates on semantic theme tokens (`--theme_*`) rather than raw values, making it a true design system. Shadows carry a blue tint (`rgba(45,127,249,0.28)`) that reinforces the brand color even in depth. The border-radius scale is pragmatic: 2px for small elements, 12px for buttons, 16px for cards, 24px for sections, 32px for large containers, 50% for circles — a clear, hierarchical scale that maps directly to component size.

### Key Characteristics
- White canvas with deep navy text (`#181D26`)
- Airtable Blue (`#1B61C9`) as primary CTA and link color
- Haas + Haas Groot Disp dual font system
- Positive letter-spacing on body text (0.08px–0.28px) — rare and distinctive
- 12px radius buttons, 16px–32px for cards
- Multi-layer blue-tinted shadow: `rgba(45,127,249,0.28) 0px 1px 3px`
- Semantic theme tokens: `--theme_*` CSS variable naming

---

## Detailed Specifications

### Color Palette & Roles

**Primary**
- Deep Navy (`#181D26`): Primary text
- Airtable Blue (`#1B61C9`): CTA buttons, links
- White (`#FFFFFF`): Primary surface

**Semantic**
- Spotlight (`rgba(249,252,255,0.97)`): `--theme_button-text-spotlight`
- Success Green (`#006400`): `--theme_success-text`
- Weak Text (`rgba(4,14,32,0.69)`): `--theme_text-weak`
- Secondary Active (`rgba(7,12,20,0.82)`): `--theme_button-text-secondary-active`

**Neutral**
- Dark Gray (`#333333`): Secondary text
- Mid Blue (`#254FAD`): Link/accent blue variant
- Border (`#E0E2E6`): Card borders
- Light Surface (`#F8FAFC`): Subtle surface

**Shadows**
- Blue-tinted: `rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 0px 2px, rgba(45,127,249,0.28) 0px 1px 3px, rgba(0,0,0,0.06) 0px 0px 0px 0.5px inset`
- Soft: `rgba(15,48,106,0.05) 0px 0px 20px`

### Typography Rules

**Font Families**
- Primary: `Haas`, fallbacks: `-apple-system, system-ui, Segoe UI, Roboto`
- Display: `Haas Groot Disp`, fallback: `Haas`

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Display Hero | Haas | 48px | 400 | 1.15 | normal |
| Display Bold | Haas Groot Disp | 48px | 900 | 1.50 | normal |
| Section Heading | Haas | 40px | 400 | 1.25 | normal |
| Sub-heading | Haas | 32px | 400–500 | 1.15–1.25 | normal |
| Card Title | Haas | 24px | 400 | 1.20–1.30 | 0.12px |
| Feature | Haas | 20px | 400 | 1.25–1.50 | 0.1px |
| Body | Haas | 18px | 400 | 1.35 | 0.18px |
| Body Medium | Haas | 16px | 500 | 1.30 | 0.08–0.16px |
| Button | Haas | 16px | 500 | 1.25–1.30 | 0.08px |
| Caption | Haas | 14px | 400–500 | 1.25–1.35 | 0.07–0.28px |

**Principles:**
- Positive letter-spacing on body text (0.08px–0.28px) — rare and distinctive, makes text feel open and breathable.
- Display uses Haas 400 (regular) and 900 (black) — weight IS the hierarchy.
- Button text at 500 weight, slightly expanded tracking (0.08px).

### Component Stylings

**Buttons**
- Primary Blue: `#1B61C9`, white text, 16px 24px padding, 12px radius.
- White: White BG, `#181D26` text, 12px radius, 1px border white.
- Cookie Consent: `#1B61C9` BG, 2px radius (sharp).

**Cards**
- Border: `1px solid #E0E2E6`
- Radius: 16px–24px

**Inputs**
- Standard Haas styling with blue focus ring.

### Layout
- Spacing: 1–48px (8px base)
- Radius: 2px (small), 12px (buttons), 16px (cards), 24px (sections), 32px (large), 50% (circles)

### Depth
- Blue-tinted multi-layer shadow system
- Soft ambient: `rgba(15,48,106,0.05) 0px 0px 20px`

### Responsive
- Breakpoints: 425–1664px (23 breakpoints)

---

## Trade-offs
- **Pros:** Clean, professional, enterprise-ready. Semantic tokens make theming easy. Blue-tinted shadows are distinctive. Swiss precision feels trustworthy.
- **Cons:** Can feel sterile or corporate. Positive letter-spacing on body text is unusual and may feel loose to users accustomed to tighter systems. Limited color personality — almost entirely blue/white/navy.

---

## What NOT to Copy
- **Don't copy the positive letter-spacing blindly** — it works for Airtable's Swiss aesthetic but can hurt readability in dense data tables.
- **Don't use their exact blue** (`#1B61C9`) without checking contrast on your surfaces — test on dark mode too.
- **Don't skip the semantic token system** — the `--theme_*` naming is what makes this a system, not just a palette.

---

## Agent Prompt Guide

**Quick Color Reference:**
- Text: Deep Navy (`#181D26`)
- CTA: Airtable Blue (`#1B61C9`)
- Background: White (`#FFFFFF`)
- Border: `#E0E2E6`
- Secondary: Mid Blue (`#254FAD`)
- Shadow: Blue-tinted (`rgba(45,127,249,0.28)`)

**Example Component Prompts:**
- "Create a CTA button: Airtable Blue (`#1B61C9`) background, white text, 12px radius, 16px 24px padding, Haas 16px weight 500, line-height 1.25, letter-spacing 0.08px."
- "Design a card: white background, 1px solid `#E0E2E6` border, 24px radius, internal padding 24px. Title at 24px Haas weight 400, letter-spacing 0.12px."
- "Build a form input: Haas 16px weight 400, border `#E0E2E6`, 12px radius. Focus ring: blue-tinted multi-layer shadow."
- "Design a cookie consent banner: `#1B61C9` background, 2px radius, white text, 16px Haas weight 500."

**Iteration Guide:**
- Use Haas + Haas Groot Disp — the dual font system IS the identity.
- Positive letter-spacing (0.08–0.28px) on body text is non-negotiable.
- Blue-tinted shadows on interactive elements — never neutral gray.
- 12px radius on buttons, 16–32px on cards — the scale maps to component size.
- Semantic tokens (`--theme_*`) for everything — no raw hex in components.