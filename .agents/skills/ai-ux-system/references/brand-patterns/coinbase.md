# Brand Pattern: Coinbase

## Lessons & Core Philosophy
Coinbase's design system is a masterclass in trust-first fintech design — where every pixel communicates "your money is safe here." The visual language is built on a foundation of Coinbase Blue (`#0052FF`) as the singular action color, deployed against a clean white (`#FFFFFF`) or near-black (`#181D26`) canvas. The design philosophy mirrors traditional banking's gravitas but strips away the clutter, leaving only clarity, hierarchy, and trust signals.

The typography uses a custom geometric sans-serif (Inter as the open-source equivalent) with a pragmatic weight system: 600 for headings, 500 for UI emphasis, 400 for body. There's no decorative flourish — weight and scale do the work. The color system is ruthlessly minimal: one primary blue, semantic greens/reds for money states, and a comprehensive neutral scale. This isn't a brand that wants to be "fun" — it wants to be invisible until you need it, then absolutely clear.

What distinguishes Coinbase is its trust architecture: security badges, regulatory callouts, insurance notices, and "FDIC insured" messaging are not tucked away — they're integrated into the visual rhythm. The card system uses subtle borders (`#E0E4EB`) and minimal shadow (`0px 1px 3px rgba(0,0,0,0.08)`) — depth without drama. The border-radius is a consistent 12px, creating a cohesive container language.

### Key Characteristics
- Singular action color: Coinbase Blue (`#0052FF`)
- Trust-first: Security badges, insurance, regulatory badges integrated into UI rhythm
- Clean neutral scale: 10-step grays from `#FFFFFF` to `#181D26`
- Semantic money colors: Green for in/up, Red for out/down — never decorative
- Consistent 12px radius on all containers
- Subtle elevation: `0px 1px 3px rgba(0,0,0,0.08)` — no drama
- Inter font family (600/500/400 weight system)
- Data-dense but scannable: tables, cards, lists all follow same grid

---

## Detailed Specifications

### Color Palette & Roles

**Primary Brand**
- Coinbase Blue (`#0052FF`): Primary CTA, links, active states, brand moments
- Blue 50 (`#E8F0FE`): Hover backgrounds, subtle accents
- Blue 100 (`#D0E0FE`): Pressed states

**Neutral Scale (10 Steps)**
| Token | Hex | Use |
|-------|-----|-----|
| Neutral 0 | `#FFFFFF` | Page background (light), card surfaces (dark) |
| Neutral 50 | `#F8F9FA` | Subtle section backgrounds |
| Neutral 100 | `#F0F2F5` | Card backgrounds, input backgrounds |
| Neutral 200 | `#E0E4EB` | Borders, dividers, disabled borders |
| Neutral 300 | `#C9CED9` | Placeholder text, secondary borders |
| Neutral 400 | `#A0A8B8` | Tertiary text, icon strokes |
| Neutral 500 | `#717A8C` | Secondary text, meta labels |
| Neutral 600 | `#4C5467` | Body text (dark mode) |
| Neutral 700 | `#2D333F` | Headings (dark mode) |
| Neutral 800 | `#1D222D` | Primary text (dark mode) |
| Neutral 900 | `#181D26` | Page background (dark), highest contrast text |

**Semantic Money Colors**
- Green 500 (`#00A651`): Money in, positive balances, success, up trends
- Green 50 (`#E6F7EE`): Green backgrounds
- Red 500 (`#F03E3E`): Money out, negative balances, errors, down trends
- Red 50 (`#FEF2F2`): Red backgrounds
- Amber 500 (`#F5A623`): Pending, warning, neutral changes
- Amber 50 (`#FFF8E1`): Amber backgrounds

**Surface & Interaction**
- Surface Light: `#FFFFFF` (cards, modals, sheets)
- Surface Dark: `#1D222D` (cards, modals, sheets)
- Overlay: `rgba(24, 29, 38, 0.6)` (modal backdrops)
- Focus Ring: `#0052FF` at 2px, 2px offset
- Disabled: Neutral 200 BG, Neutral 400 text

### Typography Rules

**Font Family:** `Inter` (system-ui fallback)
- Headings: Inter 600
- UI Emphasis: Inter 500
- Body: Inter 400

**Hierarchy:**
| Role | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| H1 / Page Title | 32px | 600 | 1.25 | Page headers |
| H2 / Section | 24px | 600 | 1.33 | Section headers |
| H3 / Card Title | 20px | 600 | 1.40 | Card titles, feature heads |
| H4 / Sub-section | 18px | 600 | 1.44 | Sub-sections |
| Body Large | 18px | 400 | 1.56 | Lead paragraphs |
| Body | 16px | 400 | 1.50 | Standard body |
| Body Small | 14px | 400 | 1.43 | Meta, descriptions |
| Label / Button | 14px | 500 | 1.43 | Buttons, form labels |
| Caption | 12px | 400 | 1.33 | Timestamps, fine print |
| Overline | 11px | 600 | 1.45 | Section labels, tags |

**Principles:**
- Weight hierarchy is strict: 600 for hierarchy, 500 for interactive, 400 for reading.
- No decorative weights. No italics in UI.
- Line-heights are generous for financial data readability.
- Tabular numerals (`font-variant-numeric: tabular-nums`) for ALL money amounts.

### Component Stylings

**Buttons**
| Variant | BG | Text | Border | Radius | Padding | Use |
|---------|-----|------|--------|--------|---------|-----|
| Primary | `#0052FF` | `#FFFFFF` | none | 12px | 12px 24px | Primary CTA |
| Primary Hover | `#0041CC` | `#FFFFFF` | — | — | — | — |
| Primary Pressed | `#003399` | `#FFFFFF` | — | — | — | — |
| Secondary | `#FFFFFF` | `#0052FF` | `1px solid #0052FF` | 12px | 12px 24px | Secondary actions |
| Ghost | Transparent | `#0052FF` | none | 12px | 12px 24px | Tertiary |
| Destructive | `#F03E3E` | `#FFFFFF` | none | 12px | 12px 24px | Delete, revoke |
| Disabled | `#E0E4EB` | `#A0A8B8` | — | — | — | — |

**Cards**
- BG: `#FFFFFF` (light) / `#1D222D` (dark)
- Border: `1px solid #E0E4EB` (light) / `#2D333F` (dark)
- Radius: 12px
- Shadow: `0px 1px 3px rgba(0,0,0,0.08)` (light) / `0px 1px 3px rgba(0,0,0,0.3)` (dark)
- Padding: 24px

**Inputs**
- BG: `#FFFFFF` / `#1D222D`
- Border: `#E0E4EB` / `#2D333F`
- Focus: `2px solid #0052FF` ring, border `#0052FF`
- Radius: 12px
- Padding: 12px 16px
- Label: 14px, 500, `#181D26` / `#FFFFFF`

**Typography for Money**
- Always tabular numerals: `font-variant-numeric: tabular-nums`
- Positive: Green 500 (`#00A651`)
- Negative: Red 500 (`#F03E3E`)
- Neutral: Neutral 700/300
- Currency symbol: Same color as amount, no space (`$1,234.56`)
- Decimals: Always 2 places for fiat, 8 for crypto

**Navigation**
- Top bar: 56px height, sticky, `#FFFFFF` / `#181D26`
- Logo: 32px, Coinbase Blue
- Links: 14px, 500, Neutral 600/300
- User menu: Avatar (32px) + dropdown

**Data Tables**
- Header: 12px, 600, Neutral 500, uppercase, letter-spacing 0.5px
- Row hover: Neutral 50 / Neutral 100
- Borders: Neutral 200 horizontal only
- Padding: 12px 16px
- Money columns: Right-aligned, tabular-nums, semantic colors

**Trust Signals (Integrated, Not Tacked On)**
- "FDIC Insured" badge in card headers
- "2FA Enabled" pill in settings
- "Insured up to $250k" in onboarding flow
- Security checkmarks in auth flows
- Regulatory licenses in footer (not hidden)

---

## Trade-offs
- **Pros:** Instant trust perception. Scannable financial data. Consistent across web/mobile. Accessible contrast. Semantic color = zero confusion on money direction.
- **Cons:** Visually conservative. Blue-heavy can feel monochrome. No room for brand personality through color. Data-dense screens can feel dense.

---

## What NOT to Copy
- **Don't use Coinbase Blue (`#0052FF`) as your brand color** — it's the "fintech default" now.
- **Don't use tabular-nums only for money** — use for ALL numbers in data contexts.
- **Don't skip semantic money colors** — green/red for direction is a UX law in finance, not a suggestion.
- **Don't use decorative shadows** — Coinbase elevation is `0px 1px 3px` max.
- **Don't mix border-radius** — 12px everywhere creates container unity.
- **Don't use decorative illustrations** — Coinbase uses product screenshots and icons only.

---

## Agent Prompt Guide

**Quick Colors:**
- Primary: `#0052FF`
- Background Light: `#FFFFFF`
- Background Dark: `#181D26`
- Card Light: `#FFFFFF`
- Card Dark: `#1D222D`
- Border Light: `#E0E4EB`
- Border Dark: `#2D333F`
- Text Primary Light: `#181D26`
- Text Primary Dark: `#FFFFFF`
- Positive: `#00A651`
- Negative: `#F03E3E`
- Focus: `#0052FF` (2px ring)

**Prompts:**
- "Create a portfolio card: white background, 1px `#E0E4EB` border, 12px radius. Header: 'Total Balance' 14px 500 `#717A8C`. Amount: `$42,351.28` 32px 600 tabular-nums `#181D26`. 24h change: `+2.4%` 14px 500 `#00A651`."
- "Design a trade confirmation modal: white surface, 12px radius. Header: 'Buy Bitcoin' 20px 600. Amount input: 12px radius, `#E0E4EB` border, tabular-nums. Fee row: `Fee` 14px 400 `#717A8C` | `$2.45` 14px 500 tabular-nums `#181D26`. Total: `Total` 16px 500 | `$4,002.45` 20px 600 tabular-nums. Primary CTA: `#0052FF` 12px radius 'Confirm Purchase'."
- "Build a price chart card: white bg, 12px radius, `#E0E4EB` border. Title 16px 600. Sparkline SVG stroke `#0052FF` (up) or `#F03E3E` (down). Current price 24px 600 tabular-nums. 24h change pill: 12px 500, Green 50 bg / Green 500 text, 8px radius."
- "Create a security settings row: left icon 20px, label 16px 500 `#181D26`, description 14px 400 `#717A8C`, right: toggle or 'Enabled' pill 12px 500 Green 500 text Green 50 bg 8px radius."
- "Design a deposit address card: dark surface `#1D222D`, 12px radius. Label 'BTC Address' 12px 500 `#A0A8B8`. Address `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` 14px 400 mono `#FFFFFF` with copy button 12px radius Ghost variant."

---

## Trade-offs
- High trust = low visual excitement
- Blue = expected in finance, not differentiating
- Dark mode requires careful border contrast tuning
- Tabular-nums requires font support

---

## What NOT to Copy
- Don't copy the exact blue — it's the industry standard, not a differentiator.
- Don't skip tabular-nums — it's a trust signal.
- Don't use rounded corners other than 12px — consistency IS the design.
- Don't add decorative gradients — fintech trust = flat, clean, predictable.