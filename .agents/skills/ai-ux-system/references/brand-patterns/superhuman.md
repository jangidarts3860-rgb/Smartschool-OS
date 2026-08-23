# Brand Pattern: Superhuman

## Lessons & Core Philosophy
Superhuman's design feels like opening a luxury envelope — predominantly white, immaculately clean, with a single dramatic gesture of color that commands attention. The design philosophy is **maximum confidence through minimum decoration**: every pixel earns its place, nothing is merely decorative. 

The color system is built on a **deep purple gradient hero** (`#1B1938` twilight wash) that contrasts against a **predominantly pure white content canvas (`#FFFFFF`)**, with **charcoal ink text (`#292827`)** to keep typography warm. **Lavender Glow (`#CBB7FB`)** serves as the sole interactive accent color (a soft, approachable purple).

The typography is the true signature: **Super Sans VF**, a custom variable font with unconventional weight stops (460, 540, 600, 700) that sit between traditional font weight categories (e.g., weight 460 is slightly heavier than regular but lighter than medium, creating a confident reading rhythm). Display line-heights are ultra-tight (**0.96**), compressing headlines into dense, powerful blocks, while body text uses a relaxed **1.50** line-height.

The layout uses a **minimal border-radius scale** — only **8px and 16px** are used (no micro-rounding, no pill shapes). Elevation is communicated primarily through border containment (**1px solid `#DCD7D3`**) and opacity layering rather than heavy drop shadows.

### Key Characteristics
- Canvas: `#FFFFFF` (pure white), Text: `#292827` (charcoal ink)
- Hero gradient base: `#1B1938` (deep twilight purple)
- Lavender Glow `#CBB7FB` as the singular interactive accent
- Super Sans VF variable font with non-standard weights (460/540/600/700)
- Tension between tight display line-height (0.96) and relaxed body line-height (1.50)
- Minimal border-radius scale: only 8px (buttons) and 16px (cards)
- 1px borders `#DCD7D3` (Parchment Border) instead of shadows
- Opacity layering for hierarchy on dark surfaces (95% white for primary, 80% for secondary)

---

## Detailed Specifications

### Color Palette & Roles

**Brand & Interactive**
- Mysteria Purple: `#1B1938` (deep twilight purple for hero backgrounds)
- Lavender Glow: `#CBB7FB` (primary accent, focus highlights, active states)
- Amethyst Link: `#714CB6` (in-content links, underlined)

**Light Mode (Primary Canvas)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#FFFFFF` | Page background |
| Surface | `#FFFFFF` | Content sections, card bases |
| Border | `#DCD7D3` | Card borders, dividers (Parchment Border) |
| Text Primary | `#292827` | Headings, body text (Charcoal Ink) |
| Button CTA | `#E9E5DD` | Primary button background (Warm Cream) |
| Button Text | `#292827` | Primary button text |

**Dark Surfaces (Hero Layering)**
| Token | Hex/RGBA | Use |
|-------|----------|-----|
| Canvas Dark | `#1B1938` | Deep purple base |
| Border Dark | `rgba(255, 255, 255, 0.2)` | Ghost borders on dark bg |
| Text Primary Dark | `rgba(255, 255, 255, 0.95)` | Primary white text |
| Text Secondary Dark | `rgba(255, 255, 255, 0.8)` | Secondary white text |

---

### Typography Rules

**Font Families:**
- Marketing & Product: `Super Sans VF` (variable font)
- Fallbacks: `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- Product UI (alternates): `Messina Sans` / `Messina Serif` / `Messina Mono`

**Hierarchy & Scales:**
| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display Hero | 64px | 540 | 0.96 | 0 | Headline block |
| Section Display | 48px | 460 | 0.96 | -1.32px | Section intros |
| Feature Title | 28px | 540 | 1.14 | -0.63px | Feature blocks |
| Card Heading | 22px | 460 | 0.76 | -0.315px | Compressed card titles |
| Body | 16px | 460 | 1.50 | 0 | **Default Body** |
| Button / UI Bold | 16px | 700 | 1.00 | 0 | Primary CTA labels |
| UI Semibold | 16px | 600 | 1.00 | 0 | Nav links, secondary |
| Caption | 14px | 500 | 1.20 | -0.315px | Meta, small labels |

**Key Typographic Principles:**
- **Non-standard weights:** 460 (between Regular 400 and Medium 500) and 540 (between Medium 500 and Semibold 600) create a unique, editorial texture.
- **Display Compression:** Tight `0.96` line-height collapases display titles into dense typographic blocks.
- **Large Text Tracking:** Negative letter-spacing is applied exclusively to display sizes (e.g., -1.32px on 48px text), while body text tracking is kept at 0.

---

### Component Stylings

**Buttons**
- **Warm Cream Button:** `#E9E5DD` background with `#292827` text, 8px radius, no border. Used as the signature primary action.
- **Dark Button:** `#292827` background with `#FFFFFF` text, 8px radius.
- **Ghost/Text Link:** Transparent background with underline decoration, using `#714CB6` for links or `#292827` for secondary actions.
- **Hover:** Muted brightness or opacity shift. No saturated hover states.

**Cards & Containers**
- **Content Card:** Pure white background, `1px solid #DCD7D3` border, 16px border-radius.
- **Hero Card:** Semi-transparent border (`rgba(255, 255, 255, 0.2)`) on `#1B1938` background.
- **Shadows:** Avoid drop shadows. Visual depth is created by 1px borders and contrasting background changes.

**Navigation**
- **Header:** Sticky nav bar. Transparent on hero gradient, transitioning to solid white on scroll.
- **Nav Links:** 16px, weight 460, `#292827` text.
- **Nav CTA:** Warm Cream `#E9E5DD` button with 8px radius.

---

### Spacing & Layout
- **Base Grid:** 8pt spacing system.
- **Spacers:** 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 80px.
- **Whitespace Philosophy:** Confident emptiness. Large sections of empty white space signal luxury and premium positioning.
- **Border Radius:** Only two sizes allowed in the entire system:
  - **8px:** Buttons, badges, and small inline elements.
  - **16px:** Cards, mockups, and large layout containers.
  - No micro-rounding (2px/4px) and no pill rounding (50%+).

---

### Depth & Elevation
- **Level 0 (Flat):** White background `#FFFFFF` for the page canvas.
- **Level 1 (Border):** `1px solid #DCD7D3` (Parchment Border) for card wrappers.
- **Level 2 (Hero Depth):** `rgba(255,255,255,0.2)` borders on twilight purple `#1B1938` background.
- **Elevation Rules:** Use surface borders instead of drop shadows. Let large product screenshots create natural depth.

---

## What NOT to Copy
- **Do not use saturated primary CTAs** (e.g., pure blue or green buttons). Superhuman uses warm cream `#E9E5DD` to feel understated.
- **Do not mix border-radius values.** Strictly stick to the 8px/16px scale.
- **Do not use loose display line-heights.** Display headlines must remain highly compressed (0.96–1.14) to maintain the brand's architectural feel.

---

## Agent Prompt Guide
- *"Create a Superhuman-style feature section: pure white background. Headline: 48px Super Sans VF weight 460, line-height 0.96, tracking -1.32px. Feature cards: white background, `1px solid #DCD7D3` border, 16px radius, no shadow. Card content: body text 16px weight 460 line-height 1.50."*
- *"Design a landing page hero: Twilight background `#1B1938`. Center title: 64px Super Sans VF weight 540, line-height 0.96, white text. Primary CTA: Warm Cream button `#E9E5DD`, 8px radius, Charcoal Ink `#292827` text."*
