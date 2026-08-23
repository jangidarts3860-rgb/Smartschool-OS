# Brand Pattern: Linear

## Lessons & Core Philosophy
Linear's design is a masterclass in "dark mode as default" executed with surgical precision — a design system that treats darkness not as an inversion but as the native canvas for a developer tool. The entire experience lives on a near-black canvas (`#0D0D0D` / `#000000`) with a singular accent: Linear Blue (`#5E6AD2`) — a muted, sophisticated violet-blue that reads as "technical precision" rather than "marketing energy." 

The typography uses a custom geometric sans (Inter as the accessible equivalent) with a distinctive trait: **tight, compressed tracking on headlines** (letter-spacing -0.02em to -0.04em) paired with **generous, relaxed body line-height (1.6–1.7)**. This contrast — compressed headlines that feel like code, relaxed body that reads like documentation — creates a rhythm that developers instantly recognize as "built for us."

The component language is uncompromisingly minimal: **zero border-radius on inputs and buttons** (or 4px max), **hairline borders** (`1px solid #1E1E1E` / `#2D2D2D`), **zero shadows** on cards — depth is created entirely through the contrast between the canvas (`#0D0D0D`) and elevated surfaces (`#161616`, `#1E1E1E`). This is the "terminal aesthetic" elevated to a design system: monospace-adjacent, high information density, zero decoration.

What makes Linear distinctive is its **motion restraint**: transitions are 120–150ms, cubic-bezier(0.2, 0, 0, 1) — fast, linear, no bounce. The sidebar collapses with a 150ms transform. Modals fade in 120ms. Tooltips appear in 80ms. Everything feels instant, because developers hate waiting.

### Key Characteristics
- Native dark mode: `#0D0D0D` canvas, `#161616`/`#1E1E1E` elevated surfaces
- Single accent: Linear Blue (`#5E6AD2`) — muted violet-blue, never neon
- Inter font with compressed headlines (-0.02em to -0.04em tracking) + relaxed body (1.6–1.7 line-height)
- Zero/4px radius — sharp, technical, terminal-like
- Hairline borders: `1px solid #1E1E1E` (on dark) / `#E5E7EB` (on light)
- Zero shadows on cards — elevation via surface contrast only
- Ultra-fast motion: 80–150ms, cubic-bezier(0.2, 0, 0, 1)
- Monospace for code, IDs, keys — Inter for UI
- Keyboard-first: every action accessible via shortcuts
- Information density: compact tables, dense lists, scannable density

---

## Detailed Specifications

### Color Palette & Roles

**Dark Mode (Default)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#0D0D0D` | Page background |
| Surface 1 | `#161616` | Sidebar, header, primary containers |
| Surface 2 | `#1E1E1E` | Cards, modals, dropdowns, elevated |
| Surface 3 | `#262626` | Hover states, pressed |
| Border Subtle | `#1E1E1E` | Card borders, dividers |
| Border Default | `#2D2D2D` | Input borders, focused |
| Border Strong | `#3D3D3D` | Focus rings (with blue) |
| Text Primary | `#FFFFFF` | Headings, body |
| Text Secondary | `#A0A0A0` | Descriptions, meta, timestamps |
| Text Muted | `#6A6A6A` | Placeholders, disabled, labels |
| Accent Blue | `#5E6AD2` | Primary CTA, links, active states, focus |
| Accent Blue Hover | `#6E7AE0` | Hover |
| Accent Blue Pressed | `#4D5ABC` | Active |
| Green | `#34D399` | Success, positive, online |
| Red | `#F87171` | Error, destructive, offline |
| Amber | `#FBBF24` | Warning, pending, draft |
| Purple | `#A78BFA` | AI features, magic actions |

**Light Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#FAFAFA` |
| Surface 1 | `#FFFFFF` |
| Surface 2 | `#F5F5F5` |
| Surface 3 | `#EEEEEE` |
| Border Subtle | `#E5E7EB` |
| Border Default | `#D1D5DB` |
| Border Strong | `#9CA3AF` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Text Muted | `#9CA3AF` |
| Accent Blue | `#5E6AD2` |

### Typography Rules

**Font Family:** `Inter` (system-ui fallback), `JetBrains Mono` / `SF Mono` for code

**Hierarchy:**
| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display / Hero | 40px | 600 | 1.15 | -0.03em | Marketing hero |
| H1 / Page Title | 28px | 600 | 1.25 | -0.02em | Page titles |
| H2 / Section | 22px | 600 | 1.30 | -0.015em | Section headers |
| H3 / Card Title | 16px | 600 | 1.40 | -0.01em | Card titles, list items |
| Body Large | 16px | 400 | 1.70 | 0 | Lead paragraphs |
| Body | 14px | 400 | 1.65 | 0 | Standard body |
| Body Small | 13px | 400 | 1.60 | 0 | Dense UI text |
| Label / Button | 13px | 500 | 1.50 | 0.01em | Buttons, form labels |
| Caption | 12px | 400 | 1.50 | 0 | Meta, timestamps |
| Mono / Code | 13px | 400 | 1.60 | 0 | IDs, keys, code blocks |
| Mono Small | 12px | 400 | 1.50 | 0 | Inline code |

**Principles:**
- Headlines compressed (tracking -0.01em to -0.03em) — feels like code
- Body relaxed (1.6–1.7 line-height) — reads like documentation
- Weight 600 for hierarchy, 500 for interactive, 400 for reading
- Mono for ALL technical content: IDs, keys, hashes, JSON, SQL, CLI

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Height |
|---------|-----|------|--------|--------|---------|--------|
| Primary | `#5E6AD2` | `#FFFFFF` | none | 4px | 8px 16px | 36px |
| Primary Hover | `#6E7AE0` | — | — | — | — | — |
| Primary Pressed | `#4D5ABC` | — | — | — | — | — |
| Secondary | `#1E1E1E` | `#FFFFFF` | `1px solid #2D2D2D` | 4px | 8px 16px | 36px |
| Secondary Hover | `#262626` | — | — | — | — | — |
| Ghost | Transparent | `#A0A0A0` | none | 4px | 8px 16px | 36px |
| Ghost Hover | `#1E1E1E` | `#FFFFFF` | — | — | — | — |
| Destructive | `#DC2626` | `#FFFFFF` | none | 4px | 8px 16px | 36px |

**Inputs**
- BG: `#161616` (dark) / `#FFFFFF` (light)
- Border: `#2D2D2D` / `#D1D5DB`
- Focus: Border `#5E6AD2`, Ring `0 0 0 2px rgba(94,106,210,0.3)`
- Radius: 4px
- Padding: 8px 12px
- Text: `#FFFFFF` / `#111827`
- Placeholder: `#6A6A6A` / `#9CA3AF`
- Mono font for API keys, IDs, tokens

**Cards**
- BG: `#161616` / `#FFFFFF`
- Border: `1px solid #1E1E1E` / `#E5E7EB`
- Radius: 6px
- Padding: 16px
- NO shadow — elevation via surface contrast

**Tables / Lists**
- Row height: 40px (compact) / 48px (comfortable)
- Hover: BG `#1E1E1E` / `#F9FAFB`
- Borders: Horizontal only, `#1E1E1E` / `#E5E7EB`
- Padding: 12px 16px
- Mono for IDs, keys, codes

**Sidebar / Navigation**
- Width: 260px (expanded), 72px (collapsed)
- BG: `#161616` / `#FFFFFF`
- Border right: `1px solid #1E1E1E` / `#E5E7EB`
- Items: 13px, 400, `#A0A0A0` / `#6B7280`
- Active: BG `#1E1E1E` / `#F3F4F6`, Text `#FFFFFF` / `#111827`, Left border `2px solid #5E6AD2`
- Icons: 18px, stroke 2px

**Modals / Sheets**
- Backdrop: `rgba(0,0,0,0.6)` / `rgba(0,0,0,0.4)`
- BG: `#1E1E1E` / `#FFFFFF`
- Border: `1px solid #2D2D2D` / `#E5E7EB`
- Radius: 8px
- Shadow: `0 4px 24px rgba(0,0,0,0.4)` / `0 4px 24px rgba(0,0,0,0.15)`

**Tooltips / Popovers**
- BG: `#1E1E1E` / `#1F2937`
- Border: `1px solid #2D2D2D` / `#E5E7EB`
- Radius: 6px
- Padding: 8px 12px
- Text: 13px, 400
- Arrow: 6px

**Badges / Pills**
- Radius: 9999px (full pill)
- Padding: 2px 8px
- Font: 11px, 500
- Variants: Default (gray), Blue, Green, Red, Amber, Purple

---

## Trade-offs
- **Pros:** Feels instantly familiar to developers. High information density without clutter. Fast motion respects user time. Dark mode default saves battery on OLED. Zero visual noise.
- **Cons:** Can feel cold/sterile to non-technical users. Low visual hierarchy without color variety. Sharp corners can feel harsh. Requires Inter/JetBrains Mono for fidelity.

---

## What NOT to Copy
- **Don't copy the dark-mode-only default** unless your audience is 90%+ technical.
- **Don't use 4px radius everywhere** — it's a specific "terminal" aesthetic choice.
- **Don't use zero shadows** unless your elevation system is purely surface-contrast based.
- **Don't use Inter without tabular-nums** for data — Linear uses it everywhere.
- **Don't copy the 150ms motion** if your users aren't power users who value speed over delight.
- **Don't use hairline borders** on light mode without testing contrast — they can disappear.

---

## Agent Prompt Guide

**Quick Colors (Dark):**
- Canvas: `#0D0D0D`
- Surface: `#161616` / `#1E1E1E`
- Border: `#1E1E1E` / `#2D2D2D`
- Text: `#FFFFFF` / `#A0A0A0` / `#6A6A6A`
- Accent: `#5E6AD2`
- Success: `#34D399`
- Error: `#F87171`

**Prompts:**
- "Create a dark-mode issue card: `#161616` bg, `1px solid #1E1E1E` border, 6px radius. Title 16px 600 `#FFFFFF`. Meta: `#6A6A6A` 13px mono for ID. Tags: pill pills 11px 500. Actions: ghost buttons 13px 500."
- "Design a dark sidebar: 260px wide, `#161616` bg, right border `1px solid #1E1E1E`. Nav items 13px 400 `#A0A0A0`, 40px height. Active: `#1E1E1E` bg, `#FFFFFF` text, left border `2px solid #5E6AD2`. Collapsed: 72px, icons only."
- "Build a dark modal: backdrop `rgba(0,0,0,0.6)`, surface `#1E1E1E`, border `1px solid #2D2D2D`, 8px radius. Title 16px 600. Body 14px 400 1.65 lh. Primary btn: `#5E6AD2` 4px radius. Secondary: ghost."
- "Create a linear-style issue list row: 44px height, hover `#1E1E1E`. Checkbox 18px. ID mono 12px `#6A6A6A`. Title 14px 500. Labels: pills 11px 500. Assignee avatar 24px. Updated: mono 12px `#6A6A6A`."
- "Design a dark command palette: `#1E1E1E` bg, `#2D2D2D` border, 8px radius. Input: `#161616` bg, `#2D2D2D` border, mono 14px. Results: 13px 400, mono for shortcuts. Highlight: `#262626` bg."

---

## Trade-offs
- Developer-first = alienating for non-technical stakeholders
- Dark default = accessibility risk if not tested
- Mono font for code = licensing / fallback considerations
- Zero shadows = elevation ambiguity on complex screens

---

## What NOT to Copy
- Don't default to dark mode for consumer products.
- Don't use 4px radius on consumer-facing buttons.
- Don't remove all shadows without a surface-contrast system.
- Don't use 150ms transitions for user-facing delight moments.
- Don't use mono font for body text.