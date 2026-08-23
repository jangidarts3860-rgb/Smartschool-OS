# Brand Pattern: Notion

## Lessons & Core Philosophy
Notion's design is a masterclass in "software as a document" — the entire interface feels like a single, infinite canvas where every element is a block that can be typed, dragged, nested, and transformed. The visual language is deliberately quiet: a warm off-white canvas (`#FAFAF9`), near-black text (`#191919`), and a single accent color (Notion Yellow `#FACC15` / `#EAB308`) used exclusively for links, hover states, and the brand logo. There are no gradients, no shadows, no rounded corners beyond 4px — the design gets out of the way so your thinking doesn't have to.

The typography uses a custom font family (Inter as the accessible equivalent) with a distinctive trait: **body text at 15px with 1.6 line-height** — slightly larger and more generous than typical web apps, optimizing for long-form reading and writing. Headlines use negative letter-spacing (-0.02em) for a tight, editorial feel. The type scale is minimal: essentially just 4 sizes (12px, 14px, 15px, 20px, 28px, 40px) with weight as the primary hierarchy tool.

What makes Notion distinctive is its **block-based mental model made visual**: every paragraph, heading, list, image, embed, database is a block with a drag handle (`⋮⋮`) on hover. The UI reveals itself progressively — minimal chrome until you interact. The sidebar is a collapsible tree of pages, not a navigation bar. There are no "screens" in the traditional sense — just nested pages inside pages.

### Key Characteristics
- Warm off-white canvas (`#FAFAF9`) — not sterile white
- Near-black text (`#191919`) — warm, not harsh
- Single accent: Notion Yellow (`#FACC15` / `#EAB308`) — links, hover, brand
- Inter font with editorial spacing: body 15px/1.6, headlines tight (-0.02em)
- Zero shadows, zero gradients, 4px max radius
- Block-based UI: everything is a block with drag handle on hover
- Sidebar = page tree, not navigation bar
- Minimal chrome: UI reveals on interaction
- 12px base spacing unit (not 8px)

---

## Detailed Specifications

### Color Palette & Roles

**Light Mode (Primary)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#FAFAF9` | Page background |
| Surface | `#FFFFFF` | Cards, modals, popovers, hover |
| Border Subtle | `#E9E9E7` | Dividers, table borders |
| Border Default | `#DADAD6` | Input borders, hover |
| Border Strong | `#C9C9C5` | Focus rings (with yellow) |
| Text Primary | `#191919` | Headings, body |
| Text Secondary | `#6B6B66` | Descriptions, meta, timestamps |
| Text Muted | `#9A9A96` | Placeholders, disabled |
| Accent Yellow | `#FACC15` | Links, hover, brand, focus ring |
| Accent Yellow Hover | `#EAB308` | Link hover, button hover |
| Accent Yellow Pressed | `#CA8A04` | Active |
| Red | `#E03E3E` | Error, destructive |
| Green | `#2E7D32` | Success, done |
| Blue | `#1E6BB8` | Info, mentions |
| Purple | `#9333EA` | Database properties, relations |

**Dark Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#1B1B1A` |
| Surface | `#262625` |
| Border Subtle | `#3A3A38` |
| Border Default | `#4A4A48` |
| Border Strong | `#5A5A58` |
| Text Primary | `#F5F5F4` |
| Text Secondary | `#A8A8A4` |
| Text Muted | `#7A7A78` |
| Accent Yellow | `#FACC15` |
| Accent Yellow Hover | `#EAB308` |

### Typography Rules

**Font Family:** `Inter` (system-ui fallback). Notion uses a custom variant but Inter is the public equivalent.

**Hierarchy:**
| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| H1 / Page Title | 28px | 600 | 1.30 | -0.02em | Page titles |
| H2 | 24px | 600 | 1.35 | -0.015em | Section headings |
| H3 | 20px | 600 | 1.40 | -0.01em | Sub-sections |
| H4 / Inline Heading | 16px | 600 | 1.50 | 0 | Block headings |
| Body Large | 16px | 400 | 1.65 | 0 | Lead text |
| Body | 15px | 400 | 1.60 | 0 | **Default body** |
| Body Small | 14px | 400 | 1.55 | 0 | Dense UI, comments |
| Caption | 12px | 400 | 1.50 | 0 | Timestamps, meta |
| Button / Label | 14px | 500 | 1.50 | 0 | Buttons, form labels |
| Mono / Code | 13px | 400 | 1.60 | 0 | Inline code, formulas |
| Mono Small | 12px | 400 | 1.50 | 0 | Inline mono small |

**Principles:**
- Body at 15px / 1.6 — optimized for reading/writing long-form
- Headlines tight (-0.01em to -0.02em) — editorial density
- Weight is hierarchy: 600 for headings, 500 for interactive, 400 for reading
- Mono for all code, formulas, inline math

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Height |
|---------|----|------|--------|--------|---------|--------|
| Primary | `#EAB308` | `#191919` | none | 4px | 8px 16px | 36px |
| Primary Hover | `#FACC15` | — | — | — | — | — |
| Primary Pressed | `#CA8A04` | — | — | — | — | — |
| Secondary | `#FFFFFF` | `#191919` | `1px solid #DADAD6` | 4px | 8px 16px | 36px |
| Secondary Hover | `#FAFAF9` | — | — | — | — | — |
| Ghost | Transparent | `#6B6B66` | none | 4px | 8px 16px | 36px |
| Ghost Hover | `#FAFAF9` | `#191919` | — | — | — | — |
| Destructive | `#E03E3E` | `#FFFFFF` | none | 4px | 8px 16px | 36px |

**Inputs**
- BG: `#FFFFFF` / `#262625`
- Border: `#DADAD6` / `#4A4A48`
- Focus: Border `#EAB308`, Ring `0 0 0 2px rgba(234,179,8,0.3)`
- Radius: 4px
- Padding: 8px 12px
- Text: `#191919` / `#F5F5F4`
- Placeholder: `#9A9A96` / `#7A7A78`

**Cards / Containers**
- BG: `#FFFFFF` / `#262625`
- Border: `1px solid #E9E9E7` / `#3A3A38`
- Radius: 8px
- Padding: 16px
- NO shadow

**Tables / Databases**
- Row height: 40px (compact) / 48px (comfortable)
- Header: BG `#FAFAF9`, Text `#6B6B66`, 13px 600
- Row hover: `#FAFAF9` / `#262625`
- Borders: Horizontal only, `#E9E9E7` / `#3A3A38`
- Property pills: 4px radius, 2px 8px padding

**Sidebar**
- Width: 260px (expanded), 60px (collapsed)
- BG: `#FAFAF9` / `#1B1B1A`
- Border right: `1px solid #E9E9E7` / `#3A3A38`
- Page titles: 13px 400, `#191919` / `#F5F5F4`
- Active: BG `#FFFFFF` / `#262625`, Left border `2px solid #EAB308`
- Icons: 18px, stroke 2px

**Modals / Popovers**
- Backdrop: `rgba(0,0,0,0.4)` / `rgba(0,0,0,0.6)`
- BG: `#FFFFFF` / `#262625`
- Border: `1px solid #E9E9E7` / `#3A3A38`
- Radius: 12px
- Shadow: `0 8px 32px rgba(0,0,0,0.12)` / `0 8px 32px rgba(0,0,0,0.4)`

**Drag Handles / Block Controls**
- Visible on hover of any block
- Icon: `⋮⋮` (6 dots), 16px, `#C9C9C5` / `#5A5A58`
- Hover: BG `#FAFAF9` / `#262625`, Radius 4px

**Page Header**
- Icon/Emoji: 40px
- Title: 28px 600, `#191919`
- Description: 15px 400, `#6B6B66`
- Cover image: Full width, 16:9, optional

### Layout Principles

**Spacing:** 12px base unit
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Page padding: 96px horizontal (centered, max 900px for text)

**Grid:** Single column for writing, multi-column for databases/boards

**Whitespace:** Generous — writing needs breathing room. Line-height 1.6 on body creates natural vertical rhythm.

---

## Trade-offs
- **Pros:** Incredible writing experience. Block model is intuitive. Minimal chrome = focus. Scales from personal notes to company wikis.
- **Cons:** Can feel "empty" at first glance. No traditional navigation = learning curve. Limited visual hierarchy without color. Mobile editing is constrained.

---

## What NOT to Copy
- **Don't copy the empty-state minimalism** without the block model — it looks broken without the interaction.
- **Don't use `#FAFAF9` canvas** without the warm text (`#191919`) — it looks dingy.
- **Don't use Notion Yellow as a background** — it's a link/accent only.
- **Don't copy the 12px base spacing** if your product is data-dense — it's for writing.
- **Don't copy the sidebar-as-page-tree** if your product has traditional navigation.

---

## Agent Prompt Guide

**Quick Colors (Light):**
- Canvas: `#FAFAF9`
- Surface: `#FFFFFF`
- Text: `#191919` / `#6B6B66`
- Border: `#E9E9E7` / `#DADAD6`
- Accent: `#FACC15` / `#EAB308`

**Prompts:**
- "Create a Notion-style page: `#FAFAF9` canvas, max-width 900px centered. Title 28px 600 `#191919`. Description 15px 400 `#6B6B66`. Cover image full-width 16:9. Empty block placeholder: `⋮⋮` drag handle on hover, 15px 400 `Type / for commands` in `#9A9A96`."
- "Design a database view: Header row `#FAFAF9` bg, 13px 600 `#6B6B66`. Rows 40px, hover `#FAFAF9`. Property pills: 4px radius, 2px 8px, 12px 500. Text property: 15px 400. Date: 13px 400 `#6B6B66`."
- "Build a Notion-style sidebar: 260px, `#FAFAF9` bg, right border `1px solid #E9E9E7`. Page titles 13px 400 `#191919`. Nested indent 24px. Active page: `#FFFFFF` bg, left border `2px solid #EAB308`. Collapsed: 60px, icons only."
- "Create a block hover state: On block hover, show drag handle `⋮⋮` left margin -36px, 16px `#C9C9C5`. Block BG `#FAFAF9`, 4px radius. Click: show block menu (popover)."
- "Design a callout block: Border-left `3px solid #EAB308`, BG `#FAFAF9`, 8px radius. Icon 20px. Title 15px 600. Body 15px 400. Icon color matches border."

---

## Trade-offs
- Writing-first = not dashboard-first
- Minimal chrome = discoverability challenges
- Single accent = limited visual hierarchy
- Page-tree nav = not for app-like workflows