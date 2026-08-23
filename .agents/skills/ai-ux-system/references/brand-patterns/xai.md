# Brand Pattern: xAI

## Lessons & Core Philosophy
xAI's website is a **masterclass in dark-first, monospace-driven brutalist minimalism** — a design system that feels like it was built by engineers who understand that restraint is the ultimate form of sophistication. The entire experience is anchored to an almost-black background (`#1F2228`) with pure white text (`#FFFFFF`), creating a high-contrast, terminal-inspired aesthetic that signals deep technical credibility. There are no gradients, no decorative illustrations, no color accents competing for attention. This is a site that communicates through absence.

The typographic system is split between two carefully chosen typefaces. **`GeistMono`** (Vercel's monospace font) handles display-level headlines at an extraordinary 320px with weight 300, and also serves as the button typeface in uppercase with tracked-out letter-spacing (1.4px). **`universalSans`** handles all body and secondary heading text with a clean, geometric sans-serif voice. The monospace-as-display-font choice is the defining aesthetic decision — it positions xAI not as a consumer product but as infrastructure, as something built by people who live in terminals.

The spacing system operates on an 8px base grid with values concentrated at the small end (4px, 8px, 24px, 48px), reflecting a dense, information-focused layout philosophy. Border radius is minimal — the site barely rounds anything, maintaining sharp, architectural edges. There are no decorative shadows, no gradients, no layered elevation. Depth is communicated purely through contrast and whitespace.

The color palette is aggressively monochromatic: pure white (`#FFFFFF`) as the singular text color, link color, and all foreground elements. The dark background (`#1F2228`) is a warm near-black with a subtle blue undertone — not pure black, not neutral gray. Interactive states use opacity shifts rather than color changes: hover dims to `rgba(255,255,255,0.5)`, focus uses a blue ring (`rgb(59,130,246)` at 50%). This is the reverse of convention — instead of brightening on hover, xAI dims. It's a distinctive, deliberate choice that reinforces the "dark mode native" identity.

### Key Characteristics
- Pure dark canvas: `#1F2228` (warm near-black with blue undertone)
- Pure white text: `#FFFFFF` — the ONLY text color
- GeistMono at 320px weight 300 — monospace as luxury display
- universalSans for body — clean geometric contrast
- Zero decorative colors — monochromatic white-on-dark
- Opacity-based interaction: hover dims to 0.5, no brightening
- Sharp corners (0px radius default) — brutalist precision
- No shadows, no gradients — elevation via contrast only
- 8px base grid, sparse scale (4, 8, 24, 48)
- Focus ring: `rgb(59,130,246)` at 50% — only blue in system

---

## Detailed Specifications

### Color Palette & Roles

**Dark Mode (Only)**
| Token | Hex | Use |
|-------|-----|-----|
| Background | `#1F2228` | Page canvas — warm near-black |
| Surface Elevated | `rgba(255,255,255,0.03)` | Subtle card backgrounds |
| Surface Hover | `rgba(255,255,255,0.08)` | Hover state for cards |
| Border Default | `rgba(255,255,255,0.1)` | Standard borders |
| Border Strong | `rgba(255,255,255,0.2)` | Emphasized borders, active |
| Focus Ring | `rgb(59,130,246) / 0.5` | Keyboard focus — ONLY blue |
| Text Primary | `#FFFFFF` | All headings, body, labels |
| Text Secondary | `rgba(255,255,255,0.7)` | Descriptions, captions |
| Text Tertiary | `rgba(255,255,255,0.5)` | Muted labels, placeholders |
| Text Quaternary | `rgba(255,255,255,0.3)` | Disabled, timestamps |
| Button Primary BG | `#FFFFFF` | Primary CTA background |
| Button Primary Text | `#1F2228` | Primary CTA text |
| Button Ghost Text | `#FFFFFF` | Ghost button text |
| Button Ghost Border | `rgba(255,255,255,0.2)` | Ghost button border |
| Button Ghost Hover BG | `rgba(255,255,255,0.05)` | Ghost hover |
| Input BG | Transparent / `rgba(255,255,255,0.05)` | Input backgrounds |
| Input Border | `rgba(255,255,255,0.2)` | Input borders |
| Input Focus Ring | `rgb(59,130,246) / 0.5` | Focus |
| Badge BG | Transparent | Monospace tags |
| Badge Border | `rgba(255,255,255,0.2)` | Tag borders |

**Light Mode** (Not officially supported as primary — if needed, invert principles)

### Typography Rules

**Font Families**
- Display / Buttons: `GeistMono`, fallback: `ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New`
- Body / Headings: `universalSans`, fallback: `universalSans Fallback`

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Letter Spacing | Transform | Notes |
|------|------|------|--------|-------------|----------------|-----------|-------|
| Display Hero | GeistMono | 320px (20rem) | 300 | 1.50 | normal | none | Extreme scale, monospace luxury |
| Section Heading | universalSans | 30px (1.88rem) | 400 | 1.20 (tight) | normal | none | Clean sans-serif contrast |
| Body | universalSans | 16px (1rem) | 400 | 1.50 | normal | none | Standard reading text |
| Button | GeistMono | 14px (0.88rem) | 400 | 1.43 | 1.4px | uppercase | Tracked monospace, commanding |
| Label / Caption | universalSans | 14px (0.88rem) | 400 | 1.50 | normal | none | Supporting text |
| Small / Meta | universalSans | 12px (0.75rem) | 400 | 1.50 | normal | none | Timestamps, footnotes |

**Principles:**
- Monospace as display: GeistMono at 320px is the brand statement — fixed-width at extreme scale creates rhythmic, architectural quality
- Light weight at scale: Weight 300 for 320px headline prevents monospace from feeling heavy/brutish
- Uppercase buttons: All button text is uppercase GeistMono with 1.4px letter-spacing — technical, commanding
- Sans-serif for reading: universalSans at 16px/1.5 provides excellent readability for body content
- Two-font clarity: Exactly two typefaces with zero role overlap

### Component Stylings

**Buttons**
| Variant | BG | Text | Padding | Radius | Font | Hover | Active |
|---------|----|------|---------|--------|------|-------|--------|
| Primary (White on Dark) | `#FFFFFF` | `#1F2228` | 12px 24px | 0px | GeistMono 14px 400, uppercase, 1.4px tracking | `rgba(255,255,255,0.9)` bg | — |
| Ghost / Outlined | Transparent | `#FFFFFF` | 12px 24px | 0px | GeistMono 14px 400, uppercase, 1.4px tracking | `rgba(255,255,255,0.05)` bg | — |
| Text Link | None | `#FFFFFF` | None | — | universalSans 16px 400 | `rgba(255,255,255,0.5)` | — |

**Cards & Containers**
- BG: `rgba(255,255,255,0.03)` or transparent
- Border: `1px solid rgba(255,255,255,0.1)`
- Radius: 0px (sharp) or 4px (subtle)
- Shadow: NONE — xAI uses zero box-shadows
- Hover: Border → `rgba(255,255,255,0.2)`

**Navigation**
- BG: `#1F2228` (matches page)
- Brand: White text, left-aligned
- Links: universalSans 14px 400, `#FFFFFF`
- Hover: `rgba(255,255,255,0.5)`
- CTA: White primary button, right-aligned
- Mobile: Hamburger toggle

**Inputs & Forms**
- BG: Transparent or `rgba(255,255,255,0.05)`
- Border: `1px solid rgba(255,255,255,0.2)`
- Radius: 0px (sharp)
- Focus: Ring `rgb(59,130,246) / 0.5`
- Text: `#FFFFFF` 16px universalSans
- Placeholder: `rgba(255,255,255,0.3)`
- Label: `rgba(255,255,255,0.7)` 14px universalSans

**Badges / Tags**
- Monospace Tag: Transparent BG, `1px solid rgba(255,255,255,0.2)` border, 0px radius, GeistMono 12px uppercase, 1px tracking, `#FFFFFF` text, 4px 8px padding

---

## Trade-offs
- **Pros:** Unmistakable technical credibility. Dark-mode native = OLED friendly. Monospace display = instant "engineering brand" signal. Zero decoration = loads fast, feels fast.
- **Cons:** Zero color = accessibility risk (color blindness). Pure white on dark = eye strain risk for some. No light mode = exclusionary. Sharp corners = harsh feel. No visual hierarchy through color = relies entirely on typography/space.

---

## What NOT to Copy
- **Don't copy the pure white-on-dark-only** unless your product IS developer infrastructure.
- **Don't use GeistMono at 320px** unless you have the brand authority to pull it off.
- **Don't use 0px radius** on consumer-facing buttons — it feels hostile.
- **Don't dim on hover** (to 0.5 opacity) unless your brand IS "reverse convention."
- **Don't use pure white text on dark** without testing color blindness.
- **Don't skip light mode** for consumer products.

---

## Agent Prompt Guide

**Quick Colors:**
- Canvas: `#1F2228`
- Text: `#FFFFFF`
- Text Muted: `rgba(255,255,255,0.7)`
- Border: `rgba(255,255,255,0.1)`
- Focus: `rgb(59,130,246)/0.5`
- Primary Btn: `#FFFFFF` bg, `#1F2228` text
- Ghost Btn: Transparent, `rgba(255,255,255,0.2)` border

**Prompts:**
- "Create an xAI hero: `#1F2228` bg. Headline 72px GeistMono weight 300, `#FFFFFF`, centered. Subtitle 18px universalSans 400 `rgba(255,255,255,0.7)` max-width 600px centered. Two buttons: Primary (white bg, `#1F2228` text, 0px radius, GeistMono 14px uppercase 1.4px tracking, 12px 24px padding) and Ghost (transparent, `1px solid rgba(255,255,255,0.2)`, white text, same font)."
- "Design a dark card: transparent or `rgba(255,255,255,0.03)` bg, `1px solid rgba(255,255,255,0.1)` border, 0px radius. Title universalSans 22px 400 `#FFFFFF`. Body universalSans 16px 400 `rgba(255,255,255,0.7)` line-height 1.5. Hover: border `rgba(255,255,255,0.2)`."
- "Build navigation: `#1F2228` bg full-width. Brand left: GeistMono 14px uppercase 1.4px tracking. Links center: universalSans 14px `#FFFFFF` hover `rgba(255,255,255,0.5)`. CTA right: white btn, `#1F2228` text, GeistMono 14px uppercase 1.4px tracking."
- "Create a form: dark bg `#1F2228`. Label universalSans 14px `rgba(255,255,255,0.7)`. Input transparent bg, `1px solid rgba(255,255,255,0.2)` border, 0px radius, white text 16px universalSans. Focus: blue ring `rgb(59,130,246)/0.5`. Placeholder `rgba(255,255,255,0.3)`."
- "Design a monospace tag: transparent bg, `1px solid rgba(255,255,255,0.2)` border, 0px radius, GeistMono 12px uppercase 1px tracking, `#FFFFFF` text, 4px 8px padding."

---

## Trade-offs
- Technical credibility = alienating to non-technical users
- Dark-only = accessibility gaps
- Monospace display = licensing/fallback complexity
- Reverse hover (dim) = violates user expectations
- Monochromatic = limited emotional range

---

## What NOT to Copy
- Don't default to dark-only without light mode.
- Don't use pure white text on dark without color-blind testing.
- Don't use 0px radius on consumer buttons.
- Don't dim on hover unless it's your deliberate brand choice.
- Don't use monospace for body text.