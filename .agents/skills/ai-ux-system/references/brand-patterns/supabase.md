# Brand Pattern: Supabase

## Lessons & Core Philosophy
Supabase's design is "PostgreSQL with a great developer experience" made visual — clean, technical, and unapologetically green. The brand color is Supabase Green (`#3ECF8E`) — a vibrant, optimistic emerald that reads as "database alive" rather than "financial growth." The canvas is a deep charcoal (`#0D0D0D` / `#1A1A1A`) for dark mode (default) with a clean white alternative. The design philosophy: **documentation as product** — every pixel serves the developer trying to build.

Typography uses a custom geometric sans (Inter as equivalent) with a pragmatic hierarchy: headings at 600, UI at 500, body at 400. Code uses JetBrains Mono. The standout typographic choice: **SQL keywords in mono, highlighted in green** — making documentation scannable for query patterns.

The component language is ruthlessly functional: **8px radius on everything**, **hairline borders** (`1px solid #2D2D2D` / `#E5E7EB`), **subtle elevation** (`0 4px 12px rgba(0,0,0,0.15)` dark / `0 4px 12px rgba(0,0,0,0.08)` light). No shadows on cards — elevation via surface contrast. The green accent is used **only** for primary CTAs, links, and success states — never decoratively.

What makes Supabase distinctive: **every code block is copyable with one click**, **every SQL query is syntax-highlighted with green keywords**, **every API response shows the exact JSON shape**. The design doesn't just look technical — it *is* technical documentation made interactive.

### Key Characteristics
- Default dark mode: `#0D0D0D` / `#1A1A1A` charcoal
- Single accent: Supabase Green (`#3ECF8E`) — vibrant emerald
- Inter + JetBrains Mono, SQL keywords highlighted in green
- 8px radius on everything — consistent, approachable
- Hairline borders: `#2D2D2D` / `#E5E7EB`
- Subtle elevation only — no heavy shadows
- Green ONLY for CTAs, links, success — never decoration
- Code blocks: copy button, line numbers, SQL green keywords
- API docs: live request builder, real response preview
- Default dark, light mode toggle prominent

---

## Detailed Specifications

### Color Palette & Roles

**Dark Mode (Default)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#0D0D0D` | Page background |
| Surface 1 | `#1A1A1A` | Sidebar, header, primary containers |
| Surface 2 | `#232323` | Cards, modals, dropdowns |
| Surface 3 | `#2D2D2D` | Hover, pressed |
| Border Subtle | `#2D2D2D` | Card borders, dividers |
| Border Default | `#3D3D3D` | Input borders, focused |
| Text Primary | `#FFFFFF` | Headings, body |
| Text Secondary | `#A0A0A0` | Descriptions, meta |
| Text Muted | `#6A6A6A` | Placeholders, disabled |
| Green Primary | `#3ECF8E` | Primary CTA, links, success |
| Green Hover | `#4ED99E` | Hover |
| Green Pressed | `#2EC47E` | Active |
| Green Subtle | `#0D2B1A` | Success backgrounds |
| Red | `#F87171` | Error, destructive |
| Amber | `#FBBF24` | Warning, pending |

**Light Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#FAFAFA` |
| Surface 1 | `#FFFFFF` |
| Surface 2 | `#F5F5F5` |
| Surface 3 | `#EEEEEE` |
| Border Subtle | `#E5E7EB` |
| Border Default | `#D1D5DB` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Text Muted | `#9CA3AF` |
| Green Primary | `#10B981` |
| Green Hover | `#059669` |

### Typography Rules

**Font Family:** `Inter` (system-ui fallback), `JetBrains Mono` for code

**Hierarchy:**
| Role | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| H1 / Hero | 36px | 600 | 1.25 | Landing hero |
| H2 / Page | 28px | 600 | 1.30 | Page titles |
| H3 / Section | 22px | 600 | 1.35 | Section headers |
| H4 / Card | 18px | 600 | 1.40 | Card titles |
| Body Large | 16px | 400 | 1.60 | Lead text |
| Body | 14px | 400 | 1.55 | Standard |
| Body Small | 13px | 400 | 1.50 | Dense UI |
| Label / Button | 13px | 500 | 1.50 | Labels, buttons |
| Caption | 12px | 400 | 1.40 | Meta, timestamps |
| Code / Mono | 13px | 400 | 1.55 | Code blocks, inline code |
| SQL Keyword | 13px | 500 | 1.55 | Color: `#3ECF8E` |

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Height |
|---------|----|------|--------|--------|---------|--------|
| Primary | `#3ECF8E` | `#0D0D0D` | none | 8px | 10px 20px | 40px |
| Primary Hover | `#4ED99E` | — | — | — | — | — |
| Secondary | `#1A1A1A` / `#FFFFFF` | `#3ECF8E` | `1px solid #3ECF8E` | 8px | 10px 20px | 40px |
| Ghost | Transparent | `#3ECF8E` | none | 8px | 10px 20px | 40px |
| Destructive | `#EF4444` | `#FFFFFF` | none | 8px | 10px 20px | 40px |

**Inputs**
- BG: `#1A1A1A` / `#FFFFFF`
- Border: `#3D3D3D` / `#E5E7EB`
- Focus: Border `#3ECF8E`, Ring `0 0 0 2px rgba(62,207,142,0.2)`
- Radius: 8px
- Padding: 10px 14px
- Text: `#FFFFFF` / `#111827`
- Placeholder: `#6A6A6A` / `#9CA3AF`

**Cards**
- BG: `#1A1A1A` / `#FFFFFF`
- Border: `1px solid #2D2D2D` / `#E5E7EB`
- Radius: 12px
- Padding: 24px
- NO shadow

**Code Blocks**
- BG: `#0D0D0D` / `#F5F5F5`
- Border: `1px solid #2D2D2D` / `#E5E7EB`
- Radius: 8px
- Padding: 16px
- Font: `JetBrains Mono` 13px
- Line numbers: optional, `#6A6A6A`
- Copy button: top-right, ghost
- **SQL Keywords**: `#3ECF8E` weight 500
- Strings: `#FBB: `#F87171`
- Comments: `#6A6A6A`
- Numbers: `#FBBF24`

**Tables (Admin / Logs)**
- Row height: 40px
- Header: 12px 600 `#A0A0A0` / `#6B7280`, BG `#1A1A1A` / `#F9FAFB`
- Row hover: `#1A1A1A` / `#F5F5F5`
- Borders: Horizontal only, `#2D2D2D` / `#E5E7EB`
- Padding: 12px 16px
- Mono for IDs, timestamps, codes

**Navigation (Sidebar)**
- Width: 260px (expanded) / 72px (collapsed)
- BG: `#1A1A1A` / `#FFFFFF`
- Border right: `1px solid #2D2D2D` / `#E5E7EB`
- Items: 14px 400 `#A0A0A0` / `#6B7280`
- Active: BG `#232323` / `#F0FDF4`, Text `#3ECF8E`, Left border `3px solid #3ECF8E`

**Modals / Drawers**
- Backdrop: `rgba(0,0,0,0.6)` / `rgba(0,0,0,0.4)`
- Surface: `#1A1A1A` / `#FFFFFF`
- Border: `1px solid #2D2D2D` / `#E5E7EB`
- Radius: 12px
- Shadow: `0 20px 40px rgba(0,0,0,0.4)` / `0 20px 40px rgba(0,0,0,0.1)`

---

## Trade-offs
- **Pros:** Instant "developer tool" credibility. Green = "database alive." Dark default = battery saver. Code-first UX.
- **Cons:** Green can be hard on eyes at night. Dark default may alienate non-devs. Green-only accent limits visual hierarchy.

---

## What NOT to Copy
- **Don't use `#3ECF8E` as your brand green** — it's Supabase's signature.
- **Don't use dark default** unless your audience is 90%+ developers.
- **Don't skip SQL syntax highlighting** — it's the killer feature.
- **Don't use shadows on cards** — Supabase uses surface contrast.
- **Don't use radius other than 8px/12px** — consistency is the system.

---

## Agent Prompt Guide

**Quick Colors (Dark):**
- Canvas: `#0D0D0D`
- Surface: `#1A1A1A` / `#232323`
- Border: `#2D2D2D` / `#3D3D3D`
- Text: `#FFFFFF` / `#A0A0A0` / `#6A6A6A`
- Green: `#3ECF8E`
- Success BG: `#0D2B1A`
- Error: `#EF4444`

**Prompts:**
- "Create a Supabase-style SQL editor: `#0D0D0D` bg, `#1A1A1A` panel, `#2D2D2D` border. Monaco editor theme: keywords `#3ECF8E` bold, strings `#F87171`, comments `#6A6A6A`. Top bar: Run button Primary `#3ECF8E` 8px radius."
- "Design a project card: `#1A1A1A` bg, `1px solid #2D2D2D` border, 12px radius. Name 18px 600. Region 13px 400 `#A0A0A0`. Status: green pill `#0D2B1A` bg `#3ECF8E` text. Footer: mono 12px `#6A6A6A` for ID."
- "Build a table page: `#1A1A1A` card, `#2D2D2D` border. Header 12px 600 `#A0A0A0`. Rows hover `#1A1A1A`. ID mono 13px. Name 14px 500. Size 13px tabular-nums. Actions: ghost btn 13px 500."
- "Create a code block with copy: `#0D0D0D` bg, `#2D2D2D` border, 8px radius. `JetBrains Mono` 13px. Keywords `#3ECF8E` bold. Top-right: copy icon ghost btn. Line numbers optional `#6A6A6A`."
- "Design a database sidebar: 260px, `#1A1A1A` bg, right border `#2D2D2D`. Items 14px 400 `#A0A0A0`. Active: `#232323` bg, `#3ECF8E` text, left border `3px solid #3ECF8E`. Collapse to 72px icons."

---

## Trade-offs
- Dark default = dev credibility, non-dev confusion
- Green-only accent = limited hierarchy
- Code-first = high implementation complexity

---

## What NOT to Copy
- Don't copy the exact green — it's Supabase's signature.
- Don't default to dark for consumer products.
- Don't skip the SQL syntax highlighting — it's the product.
- Don't use radius other than 8px/12px — consistency IS the brand.