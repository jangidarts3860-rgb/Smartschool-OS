# Brand Pattern: Stripe

## Lessons & Core Philosophy
Stripe's design is the gold standard for "developer-first" aesthetics — a visual language that communicates "we understand APIs" before you read a word. The design philosophy is **precision as beauty**: every pixel serves a functional purpose, every animation communicates state, every color has a semantic meaning. There is zero decoration.

The color system is built on a **purple-to-blue gradient spectrum** (`#635BFF` → `#0066FF`) as the brand anchor, deployed against a **near-white canvas (`#FAFAFA`)** with **deep navy text (`#0B0F19`)**. This isn't "dark mode" — it's a deliberate choice to reduce eye strain for developers staring at dashboards all day while maintaining the crisp contrast needed for data density.

The typography uses a custom font family (Inter as the accessible equivalent) with a **mathematical scale**: body at 14px/1.5, headings at 20px/24px/28px/36px/48px with weight 600. Code uses JetBrains Mono at 13px. The type scale is rigid — no arbitrary sizes.

What makes Stripe distinctive is its **component density without clutter**: tables, forms, and dashboards pack massive information into scannable layouts using a **4px base grid** (not 8px). Borders are 1px, `#E2E8F0`. Radius is 6px on buttons, 8px on cards, 4px on inputs. Shadows are non-existent on cards — elevation is communicated through **surface layering** (white cards on `#FAFAFA` canvas) and **subtle borders**.

The motion language is **instantaneous**: 100ms transitions, no easing curves that feel "bouncy." Tooltips appear in 50ms. Dropdowns in 80ms. Page transitions are 150ms with a subtle fade. This speed communicates "engineering excellence" — the UI never feels like it's waiting on you.

### Key Characteristics
- Canvas: `#FAFAFA` (warm off-white), Text: `#0B0F19` (deep navy)
- Brand gradient: Purple `#635BFF` → Blue `#0066FF` (accents, CTAs, focus)
- Inter + JetBrains Mono — mathematical type scale
- 4px base grid (not 8px) — high information density
- 1px borders `#E2E8F0` — elevation via borders, not shadows
- Radius: 4px inputs, 6px buttons, 8px cards
- Zero shadows on cards — elevation via surface layering
- Motion: 50–150ms, instant feel
- Code-first: mono everywhere for technical content
- Semantic colors only: Green (success), Red (error), Amber (pending), Blue (info)

---

## Detailed Specifications

### Color Palette & Roles

**Brand Gradient**
- Purple: `#635BFF` (primary brand)
- Blue: `#0066FF` (interactive, links, focus)
- Gradient: `linear-gradient(135deg, #635BFF 0%, #0066FF 100%)`

**Light Mode (Primary)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#FAFAFA` | Page background |
| Surface | `#FFFFFF` | Cards, modals, sheets |
| Border | `#E2E8F0` | Card borders, input borders, dividers |
| Border Strong | `#CBD5E1` | Hover borders, focus |
| Text Primary | `#0B0F19` | Headings, body |
| Text Secondary | `#475569` | Descriptions, meta |
| Text Muted | `#94A3B8` | Placeholders, disabled, timestamps |
| Text Inverse | `#FFFFFF` | On brand gradient |
| Accent Primary | `#635BFF` | Primary CTA, brand moments |
| Accent Hover | `#534BE8` | — |
| Accent Pressed | `#423AE0` | — |
| Focus Ring | `#635BFF` at 2px, 2px offset | Accessibility |
| Success | `#10B981` | Positive, completed |
| Success BG | `#ECFDF5` | — |
| Error | `#EF4444` | Negative, destructive |
| Error BG | `#FEF2F2` | — |
| Warning | `#F59E0B` | Pending, caution |
| Warning BG | `#FFFBEB` | — |
| Info | `#3B82F6` | Neutral info, links |

**Dark Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#0B0F19` |
| Surface | `#1E293B` |
| Border | `#334155` |
| Text Primary | `#F1F5F9` |
| Text Secondary | `#94A3B8` |
| Text Muted | `#64748B` |
| Accent Primary | `#818CF8` |

### Typography Rules

**Font Families:**
- UI: `Inter` (system-ui fallback)
- Code: `JetBrains Mono` / `SF Mono` / `Menlo`

**Hierarchy (Mathematical Scale):**
| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display | 48px | 600 | 1.15 | -0.02em | Marketing hero |
| H1 | 36px | 600 | 1.20 | -0.015em | Page titles |
| H2 | 28px | 600 | 1.25 | -0.01em | Section headers |
| H3 | 20px | 600 | 1.35 | -0.005em | Card titles |
| H4 | 16px | 600 | 1.40 | 0 | Sub-sections |
| Body Large | 16px | 400 | 1.55 | 0 | Lead text |
| Body | 14px | 400 | 1.50 | 0 | **Default** |
| Body Small | 13px | 400 | 1.45 | 0 | Dense UI |
| Label / Button | 13px | 500 | 1.45 | 0.01em | Buttons, form labels |
| Caption | 12px | 400 | 1.40 | 0 | Meta, timestamps |
| Code / Mono | 13px | 400 | 1.55 | 0 | Inline code, IDs, keys |
| Code Small | 12px | 400 | 1.50 | 0 | Inline code small |

**Principles:**
- Mathematical type:**
- Mathematical scale: 14px base, 1.125 ratio
- Weight 600 for hierarchy, 500 for interactive, 400 for reading
- Tabular numerals (`font-variant-numeric: tabular-nums`) for ALL numbers
- Mono for ALL technical content: API keys, webhook IDs, amounts, codes

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Height |
|---------|----|------|--------|--------|---------|--------|
| Primary | `#635BFF` | `#FFFFFF` | none | 6px | 8px 16px | 40px |
| Primary Hover | `#534BE8` | — | — | — | — | — |
| Primary Pressed | `#423AE0` | — | — | — | — | — |
| Secondary | `#FFFFFF` | `#0B0F19` | `1px solid #E2E8F0` | 6px | 8px 16px | 40px |
| Secondary Hover | `#F8FAFC` | — | — | — | — | — |
| Ghost | Transparent | `#475569` | none | 6px | 8px 16px | 40px |
| Ghost Hover | `#F1F5F9` | `#0B0F19` | — | — | — | — |
| Destructive | `#EF4444` | `#FFFFFF` | none | 6px | 8px 16px | 40px |
| Icon Only | Transparent | `#64748B` | none | 6px | 10px | 40px |

**Inputs**
- BG: `#FFFFFF` / `#1E293B`
- Border: `#E2E8F0` / `#334155`
- Focus: Border `#635BFF`, Ring `0 0 0 2px rgba(99,91,255,0.2)`
- Radius: 6px
- Padding: 10px 12px
- Text: `#0B0F19` / `#F1F5F9`
- Placeholder: `#94A3B8` / `#64748B`
- Label: 13px 500, `#0B0F19` / `#F1F5F9`
- Help text: 12px 400 `#647489` / `#94A3B8`
- Error: Border `#EF4444`, Text `#EF4444`

**Cards**
- BG: `#FFFFFF` / `#1E293B`
- Border: `1px solid #E2E8F0` / `#334155`
- Radius: 8px
- Padding: 24px
- NO shadow
- Hover: Border `#CBD5E1` / `#475569`

**Tables (Data Dense)**
- Row height: 40px (compact) / 48px (default)
- Header: 12px 600 `#64748B`, BG `#F8FAFC` / `#0B0F19`
- Row hover: BG `#F8FAFC` / `#1E293B`
- Borders: Horizontal only, `#E2E8F0` / `#334155`
- Padding: 12px 16px
- Money: Right-align, tabular-nums, semantic colors
- Code/IDs: Mono 13px

**Forms**
- Field spacing: 24px vertical
- Inline validation: Error appears below field, 12px `#EF4444`
- Required: Asterisk in label, 13px 500
- Disabled: BG `#F1F5F9` / `#0B0F19`, Text `#94A3B8`

**Navigation**
- Top bar: 56px, `#FFFFFF` / `#1E293B`, Border bottom `1px solid #E2E8F0`
- Logo: 28px, `#635BFF` gradient text
- Links: 13px 500 `#475569` / `#94A3B8`
- Active: `#0B0F19` / `#F1F5F9`, underline 2px `#635BFF`

**Modals / Dialogs**
- Backdrop: `rgba(15,23,42,0.6)` / `rgba(0,0,0,0.7)`
- Surface: `#FFFFFF` / `#1E293B`
- Border: `1px solid #E2E8F0` / `#334155`
- Radius: 12px
- Shadow: `0 20px 40px rgba(15,23,42,0.15)` / `0 20px 40px rgba(0,0,0,0.5)`
- Padding: 24px
- Focus trap: Yes

**Tooltips / Popovers**
- BG: `#0B0F19` / `#1E293B`
- Border: `1px solid #1E293B` / `#334155`
- Radius: 6px
- Padding: 8px 12px
- Text: 13px 400 `#F1F5F9` / `#FFFFFF`
- Arrow: 6px
- Show delay: 50ms, Hide delay: 100ms

**Badges / Status Pills**
- Radius: 9999px (full pill)
- Padding: 2px 8px
- Font: 11px 500
- Variants: Default (gray), Blue (info), Green (success), Red (error), Amber (warning), Purple (beta)

---

## Trade-offs
- **Pros:** Scans instantly. Feels fast. Developer trust signal. Accessible. Scales to massive data density.
- **Cons:** Can feel cold/clinical. Purple-blue gradient is common in fintech/devtools. No visual "delight" moments. Requires Inter + JetBrains Mono for fidelity.

---

## What NOT to Copy
- **Don't copy the exact purple-blue gradient** — it's the "Stripe default" now.
- **Don't use 4px base grid** unless you're building data-dense dev tools.
- **Don't skip tabular-nums** — it's a trust signal.
- **Don't use shadows on cards** — Stripe elevation is border + surface only.
- **Don't use 8px base grid** — Stripe's density requires 4px.
- **Don't use decorative illustrations** — Stripe uses product screenshots and code.

---

## Agent Prompt Guide

**Quick Colors (Light):**
- Canvas: `#FAFAFA`
- Surface: `#FFFFFF`
- Text: `#0B0F19` / `#475569`
- Border: `#E2E8F0`
- Accent: `#635BFF` / `#0066FF`
- Success: `#10B981`
- Error: `#EF4444`
- Focus: `#635BFF` (2px ring)

**Prompts:**
- "Create a Stripe-style pricing table: 3 columns, `#FFFFFF` cards, `1px solid #E2E8F0` border, 8px radius. Header: plan name 16px 600, price 36px 600 tabular-nums `#0B0F19`, interval 14px 400 `#64748B`. Features: 14px 400 `#475569` with checkmark 16px `#10B981`. CTA: Primary `#635BFF` 6px radius 40px height."
- "Design a webhook dashboard row: 44px height, hover `#F8FAFC`. Columns: Event (mono 13px `#0B0F19`), Status pill (Green 10B981 bg `#ECFDF5` text 11px 500), URL mono 13px `#64748B`, Attempts 13px tabular-nums, Timestamp 12px `#94A3B8`, Actions: ghost button 13px 500."
- "Build a payment detail card: `#FFFFFF` bg, `1px solid #E2E8F0` border, 8px radius. Header: `pi_3Mx...` mono 13px `#64748B`. Amount: `$42.50` 24px 600 tabular-nums `#0B0F19`. Status: Green pill. Metadata grid: 14px 400 label / 13px 500 mono value."
- "Create an API key input: `#FFFFFF` bg, `#E2E8F0` border, 6px radius. Prefix `sk_live_` mono 13px `#0B0F19` non-editable. Editable portion mono 13px. Copy button: ghost 32px height. Error state: border `#EF4444`, helper text 12px `#EF4444`."
- "Design a webhook retry timeline: vertical line `#E2E8F0` left. Dots 10px: attempted `#0066FF`, succeeded `#10B981`, failed `#EF4444`. Time mono 12px `#94A3B8`. Error message 13px `#EF4444` mono."

---

## Trade-offs
- Developer trust = visual restraint
- Density = cognitive load for non-technical users
- Purple gradient = category standard, not differentiator
- Instant motion = no "personality" in motion

---

## What NOT to Copy
- Don't copy the exact gradient — it's the industry default.
- Don't use 4px grid for consumer products.
- Don't skip mono font for technical content.
- Don't add shadows to cards — Stripe's "no shadow" is intentional.
- Don't use 8px base spacing for data density.