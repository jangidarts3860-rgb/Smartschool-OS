# Brand Pattern: Webflow

## Lessons & Core Philosophy
Webflow's design is a **visual development environment disguised as a website** — it demonstrates its own product by being built with it. The design philosophy: **"code is design, design is code"** — the interface doesn't just look like a design tool, it IS a design tool that outputs production code.

The visual language is **clean, technical, and confidently monochromatic** with a single brand accent: **Webflow Blue `#4353FF`** (a vibrant purple-blue). The canvas is pure white (`#FFFFFF`) with a sophisticated neutral scale. Dark mode is a first-class citizen: `#0F1117` canvas, `#1A1D23` surfaces.

Typography uses a **custom geometric sans (Inter as public equivalent)** with a **distinctive trait: generous letter-spacing on headings (+0.02em to +0.04em)** paired with **tight line-heights (1.1–1.2)** — creating headlines that feel architectural, precise, "built." Body text is 16px/1.6 for readability.

What makes Webflow distinctive: **the Designer UI is the product marketing**. Every marketing page demonstrates the Designer's capabilities: interactions, CMS, animations, responsive breakpoints. The marketing site IS the demo. The component library (Navbar, Slider, Form, Lightbox) is documented with live, editable examples.

### Key Characteristics
- Canvas: `#FFFFFF` / `#0F1117`
- Brand Blue: `#4353FF` (singular accent)
- Inter font with architectural letter-spacing (+0.02em to +0.04em on headings)
- Clean neutral scale: 10 steps from `#FFFFFF` to `#0F1117`
- 8px base grid, 4px borders, 6px radius buttons, 8px cards
- Zero shadows on cards — elevation via 1px borders
- Live, editable component examples on marketing pages
- Interactions/animations demonstrated live on marketing pages
- CMS/Editor/Hosting demonstrated in-context

---

## Detailed Specifications

### Color Palette & Roles

**Light Mode**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#FFFFFF` | Page background |
| Surface | `#FAFAFA` | Section backgrounds |
| Surface Elevated | `#FFFFFF` | Cards, modals |
| Border Subtle | `#E8E8E8` | Dividers, table borders |
| Border Default | `#E0E0E0` | Input borders, card borders |
| Border Strong | `#D0D0D0` | Hover borders |
| Text Primary | `#1A1A1A` | Headings, body |
| Text Secondary | `#6B6B6B` | Descriptions, meta |
| Text Muted | `#9E9E9E` | Placeholders, disabled |
| Blue Primary | `#4353FF` | Primary CTA, links, focus |
| Blue Hover | `#3641E6` | — |
| Blue Pressed | `#2D35D1` | — |
| Blue Light | `#EEEEFF` | Badge backgrounds |
| Green | `#00B456` | Success, published |
| Green Light | `#E8F5EE` | — |
| Red | `#E83E3E` | Error, delete |
| Red Light | `#FFE8E8` | — |
| Amber | `#FFB800` | Warning, draft |
| Amber Light | `#FFF8E1` | — |

**Dark Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#0F1117` |
| Surface | `#1A1D23` |
| Surface Elevated | `#242830` |
| Border Subtle | `#2D3139` |
| Border Default | `#3A3F4A` |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#B0B4BE` |
| Text Muted | `#7A7F8C` |
| Blue Primary | `#6B77FF` |

### Typography Rules

**Font Family:** `Inter` (system-ui fallback). Webflow uses a custom variant but Inter is the public equivalent.

**Hierarchy:**
| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display | 56px | 600 | 1.10 | +0.04em | Hero headlines |
| H1 | 40px | 600 | 1.15 | +0.03em | Page titles |
| H2 | 32px | 600 | 1.20 | +0.02em | Section headers |
| H3 | 24px | 600 | 1.25 | +0.015em | Card titles |
| H4 | 20px | 600 | 1.30 | +0.01em | Sub-sections |
| Body Large | 18px | 400 | 1.60 | 0 | Lead paragraphs |
| Body | 16px | 400 | 1.60 | 0 | Default |
| Body Small | 14px | 400 | 1.55 | 0 | Dense UI |
| Label / Button | 14px | 500 | 1.50 | +0.01em | Buttons, form labels |
| Caption | 12px | 400 | 1.50 | 0 | Meta, timestamps |
| Code | 13px | 400 | 1.55 | 0 | Inline code |

**Principles:**
- Headlines: generous positive tracking (+0.015em to +0.04em) — architectural, precise
- Body: 1.6 line-height — generous for reading
- Weight 600 for hierarchy, 500 for interactive, 400 for reading
- Code: `JetBrains Mono` / `SF Mono` at 13px

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Height |
|---------|----|------|--------|--------|---------|--------|
| Primary | `#4353FF` | `#FFFFFF` | none | 6px | 12px 24px | 44px |
| Primary Hover | `#3641E6` | — | — | — | — | — |
| Primary Pressed | `#2D35D1` | — | — | — | — | — |
| Secondary | `#FFFFFF` | `#4353FF` | `1px solid #4353FF` | 6px | 12px 24px | 44px |
| Ghost | Transparent | `#4353FF` | none | 6px | 12px 24px | 44px |
| Destructive | `#E83E3E` | `#FFFFFF` | none | 6px | 12px 24px | 44px |

**Inputs**
- BG: `#FFFFFF` / `#1A1D23`
- Border: `#E0E0E0` / `#3A3F4A`
- Focus: Border `#4353FF`, Ring `0 0 0 3px rgba(67,83,255,0.2)`
- Radius: 6px
- Padding: 10px 14px
- Label: 14px 500 `#1A1A1A` / `#FFFFFF`

**Cards / Panels**
- BG: `#FFFFFF` / `#1A1D23`
- Border: `1px solid #E0E0E0` / `#2D3139`
- Radius: 8px
- Padding: 24px
- NO shadow — elevation via border + surface layering

**Navigation (Top Bar)**
- Height: 64px
- BG: `#FFFFFF` / `#0F1117`
- Border bottom: `1px solid #E0E0E0` / `#2D3139`
- Logo: 32px, Blue `#4353FF`
- Links: 14px 500 `#6B6B6B` / `#B0B4BE`
- CTA: Primary button

**Designer UI (The Product)**
- Canvas: `#FFFFFF` / `#0F1117`
- Panels: `#FAFAFA` / `#1A1D23`
- Borders: `#E8E8E8` / `#2D3139`
- Selected element: `#4353FF` outline `2px`
- Guides: `#4353FF` dashed
- Breakpoints: Top bar, 14px 500 `#6B6B6B` / `#B0B4BE`

**Interactions Panel (Live Demo)**
- Trigger cards: Hover → preview animation
- Timeline: Visual keyframes, scrubbable
- Easing picker: Live curve editor

---

## Trade-offs
- **Pros:** Product markets itself. Live demos = trust. Clean, technical aesthetic appeals to designers/developers.
- **Cons:** Blue-heavy = generic risk. Minimal shadows = flatness risk. Dense feature set = complex onboarding.

---

## What NOT to Copy
- **Don't use `#4353FF` as your brand blue** — it's the "Webflow blue" (like Stripe purple).
- **Don't skip the live demos** — Webflow's marketing IS the product.
- **Don't use shadows for elevation** — Webflow uses borders.
- **Don't use tight line-height on body** — 1.6 is essential for readability.
- **Don't skip the architectural letter-spacing on headings** — it's the visual signature.

---

## Agent Prompt Guide

**Quick Colors (Light):**
- Canvas: `#FFFFFF`
- Surface: `#FAFAFA`
- Border: `#E0E0E0`
- Text: `#1A1A1A` / `#6B6B6B`
- Blue: `#4353FF`
- Success: `#00B456`
- Error: `#E83E3E`

**Prompts:**
- "Create a Webflow-style hero: `#FFFFFF` canvas, H1 40px 600 `#1A1A1A` letter-spacing +0.03em. Subtitle 18px 400 `#6B6B6B` 1.6 lh. Dual CTA: Primary `#4353FF` 6px radius, Ghost `#4353FF` text 1px border. Below: live Designer iframe demo."
- "Design a component card: `#FFFFFF` bg, `1px solid #E0E0E0` border, 8px radius. Title 20px 600 +0.02em tracking. Description 16px 400 `#6B6B6B`. Live demo button: Primary `#4353FF`. 'View in Designer' ghost link."
- "Build a pricing table: `#FAFAFA` section bg. Cards: `#FFFFFF` bg, `1px #E0E0E0` border, 8px radius. Feature list: 16px 400 `#1A1A1A` with check `#4353FF`. CTA: Primary on recommended, Ghost on others."
- "Design the Webflow navbar: 64px, `#FFFFFF`, bottom border `1px #E0E0E0`. Logo: `Webflow` 20px 600 `#4353FF`. Links 14px 500 `#6B6B6B`. CTA: Primary `#4353FF` 6px radius. Dark mode: `#0F1117` bg, `#2D3139` border."
- "Create a live interaction demo card: `#FAFAFA` bg, `#E0E0E0` border. Hover: shows animation preview. 'Try in Designer' button Primary. 'View Code' Ghost."

---

## Trade-offs
- Product-led marketing = high dev effort for marketing site
- Single accent = limited emotional range
- Border-only elevation = can feel flat on complex layouts
- Live demos = performance budget pressure

---

## What NOT to Copy
- Don't copy the exact blue — it's the "Webflow blue."
- Don't use shadows for elevation — Webflow uses 1px borders.
- Don't use tight line-height on body — 1.6 is mandatory.
- Don't skip architectural letter-spacing on headlines.
- Don't make marketing pages static — Webflow's are live.