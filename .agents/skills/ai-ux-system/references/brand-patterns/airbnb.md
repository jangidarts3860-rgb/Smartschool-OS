# Brand Pattern: Airbnb

## Lessons & Core Philosophy
Airbnb relies heavily on a **white canvas** with large, **photography-first** layouts. Their signature typography (Cereal VF) uses negative letter-spacing for a cozy, intimate feel. Depth is created via a specific three-layer shadow stack, and rounding is generous (20px cards, 50% pill buttons). The design operates on a foundation of pure white (`#FFFFFF`) with the iconic Rausch Red (`#FF385C`) — named after Airbnb's first street address — serving as the singular brand accent. The result is a clean, airy canvas where listing photography, category icons, and the red CTA button are the only sources of color.

The typography uses Airbnb Cereal VF — a custom variable font that's warm and approachable, with rounded terminals that echo the brand's "belong anywhere" philosophy. The font operates in a tight weight range: 500 (medium) for most UI, 600 (semibold) for emphasis, and 700 (bold) for primary headings. Slight negative letter-spacing (-0.18px to -0.44px) on headings creates a cozy, intimate reading experience rather than the compressed efficiency of tech companies.

What distinguishes Airbnb is its palette-based token system (`--palette-*`) and multi-layered shadow approach. The primary card shadow uses a three-layer stack (`rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px`) that creates a subtle, warm lift. Combined with generous border-radius (8px–32px), circular navigation controls (50%), and a category pill bar with horizontal scrolling, the interface feels tactile and inviting — designed for browsing, not commanding.

### Key Characteristics
- Pure white canvas with Rausch Red (`#FF385C`) as singular brand accent
- Airbnb Cereal VF — custom variable font with warm, rounded terminals
- Palette-based token system (`--palette-*`) for systematic color management
- Three-layer card shadows: border ring + soft blur + stronger blur
- Generous border-radius: 8px buttons, 14px badges, 20px cards, 32px large elements
- Circular navigation controls (50% radius)
- Photography-first listing cards — images are the hero content
- Near-black text (`#222222`) — warm, not cold
- Luxe Purple (`#460479`) and Plus Magenta (`#92174D`) for premium tiers

## Detailed Specifications

### Color Palette & Roles
**Primary Brand**
- Rausch Red (`#FF385C`): Primary CTA, brand accent, active states
- Deep Rausch (`#E00B41`): Pressed/dark variant of brand red
- Error Red (`#C13515`): Error text on light
- Error Dark (`#B32505`): Error hover

**Premium Tiers**
- Luxe Purple (`#460479`): Airbnb Luxe tier branding
- Plus Magenta (`#92174D`): Airbnb Plus tier branding

**Text Scale**
- Near Black (`#222222`): Primary text — warm, not cold
- Focused Gray (`#3F3F3F`): Focused state text
- Secondary Gray (`#6A6A6A`): Secondary text, descriptions
- Disabled (`rgba(0,0,0,0.24)`): Disabled state
- Link Disabled (`#929292`): Disabled links

**Interactive**
- Legal Blue (`#428BFF`): Legal links, informational
- Border Gray (`#C1C1C1`): Border color for cards and dividers
- Light Surface (`#F2F2F2`): Circular navigation buttons, secondary surfaces

**Surface & Shadows**
- Pure White (`#FFFFFF`): Page background, card surfaces
- Card Shadow: `rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px` (three-layer warm lift)
- Hover Shadow: `rgba(0,0,0,0.08) 0px 4px 12px`

### Typography Rules
**Font Family:** `Airbnb Cereal VF`, fallbacks: `Circular, -apple-system, system-ui, Roboto, Helvetica Neue`

**Hierarchy:**
| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Section Heading | 28px (1.75rem) | 700 | 1.43 | normal |
| Card Heading | 22px (1.38rem) | 600 | 1.18 (tight) | -0.44px |
| Card Heading Medium | 22px | 500 | 1.18 (tight) | -0.44px |
| Sub-heading | 21px (1.31rem) | 700 | 1.43 | normal |
| Feature Title | 20px (1.25rem) | 600 | 1.20 (tight) | -0.18px |
| UI Medium | 16px (1.00rem) | 500 | 1.25 (tight) | normal |
| UI Semibold | 16px | 600 | 1.25 (tight) | normal |
| Button | 16px | 500 | 1.25 (tight) | normal |
| Body / Link | 14px (0.88rem) | 400 | 1.43 | normal |
| Body Medium | 14px | 500 | 1.29 (tight) | normal |
| Caption Salt | 14px | 600 | 1.43 | normal |
| Small | 13px (0.81rem) | 400 | 1.23 (tight) | normal |
| Tag | 12px (0.75rem) | 400–700 | 1.33 | normal |
| Badge | 11px (0.69rem) | 600 | 1.18 (tight) | normal |
| Micro Uppercase | 8px (0.50rem) | 700 | 1.25 (tight) | 0.32px |

**Principles:**
- Warm weight range: 500–700 dominate. No weight 300 or 400 for headings.
- Negative tracking on headings: -0.18px to -0.44px creates intimate, cozy headings.
- "salt" OpenType feature: Stylistic alternates on specific UI elements (badges, captions).
- Variable font precision: Cereal VF enables continuous weight interpolation.

### Component Stylings

**Buttons**
- Primary Dark: BG `#222222`, Text `#FFFFFF`, Padding `0px 24px`, Radius `8px`. Hover: transitions to error/brand accent. Focus: `0 0 0 2px` ring + `scale(0.92)`.
- Circular Nav: BG `#F2F2F2`, Text `#222222`, Radius `50%`. Hover: shadow `rgba(0,0,0,0.08) 0px 4px 12px` + translateX. Active: 4px white border ring. Focus: `scale(0.92)`.

**Cards & Containers**
- BG: `#FFFFFF`, Radius: 14px (badges), 20px (cards/buttons), 32px (large).
- Shadow: Three-layer stack (see above).
- Listing cards: Full-width photography on top, details below.
- Carousel controls: Circular 50% buttons.

**Inputs**
- Search: `#222222` text. Focus: `var(--palette-bg-primary-error)` background tint + `0 0 0 2px` ring.
- Radius: Context-dependent (search bar uses pill-like rounding).

**Navigation**
- White sticky header with centered search.
- Airbnb logo (Rausch Red) left-aligned.
- Category filter pills: horizontal scroll below search.
- Circular nav controls for carousel navigation.
- "Become a Host" text link, avatar/menu right-aligned.

**Image Treatment**
- Listing photography fills card top with generous height.
- Image carousel with dot indicators.
- Heart/wishlist icon overlay on images.
- 8px–14px radius on contained images.

### Layout Principles
- Spacing: 8px base, scale: 2px, 3px, 4px, 6px, 8px, 10px, 11px, 12px, 15px, 16px, 22px, 24px, 32px.
- Grid: Full-width header with centered search, category pill bar horizontal scroll, listing grid responsive 3–5 columns desktop.
- Whitespace: Travel-magazine spacing — generous vertical padding between sections.
- Radius Scale: 4px (subtle), 8px (standard), 14px (badge), 20px (card), 32px (large), 50% (circle).

### Shadow Philosophy
Three-layer shadow system creates warm, natural lift:
1. Layer 1 (`0px 0px 0px 1px` at 0.02 opacity): Ultra-subtle border.
2. Layer 2 (`0px 2px 6px` at 0.04): Soft ambient shadow.
3. Layer 3 (`0px 4px 8px` at 0.1): Primary lift.
Graduated approach creates shadows that feel like natural light rather than CSS effects.

### Responsive Behavior
**Breakpoints:** 61 detected — one of the most granular responsive systems observed.
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | <375px | Single column, compact search |
| Mobile | 375–550px | Standard mobile listing grid |
| Tablet Small | 550–744px | 2-column listings |
| Tablet | 744–950px | Search bar expansion |
| Desktop Small | 950–1128px | 3-column listings |
| Desktop | 1128–1440px | 4-column grid, full header |
| Large Desktop | 1440–1920px | 5-column grid |
| Ultra-wide | >1920px | Maximum grid width |

## Trade-offs
- **Pros:** Feels extremely approachable, premium, and visually light. Encourages leisurely browsing. Warm, human feel.
- **Cons:** High reliance on pristine, high-resolution photography. If user-generated images are poor, the entire design system fails visually. 61 breakpoints = complex maintenance.

## What NOT to Copy
- **Do not copy their exact accent color** (`#FF385C` Rausch Red). Understand the *discipline* of using exactly ONE interactive accent color and keep your backgrounds neutral.
- **Do not use heavy, dark text everywhere.** Airbnb uses `#222222` to keep text warm instead of a harsh `#000000`.
- **Don't use thin font weights (300, 400) for headings** — 500 minimum.
- **Don't apply Rausch Red to backgrounds or large surfaces** — it's an accent only.
- **Don't use sharp corners (0–4px) on cards** — the generous rounding (20px+) is core.
- **Don't introduce additional brand colors** beyond the Rausch/Luxe/Plus system.
- **Don't override the palette token system** — use `--palette-*` variables consistently.

---

## Agent Prompt Guide
**Quick Color Reference:**
- Background: Pure White (`#FFFFFF`)
- Text: Near Black (`#222222`)
- Brand Accent: Rausch Red (`#FF385C`)
- Secondary Text: `#6A6A6A`
- Disabled: `rgba(0,0,0,0.24)`
- Card Border: `rgba(0,0,0,0.02) 0px 0px 0px 1px`
- Card Shadow: Full three-layer stack
- Button Surface: `#F2F2F2`

**Example Component Prompts:**
- "Create a listing card: white background, 20px radius. Three-layer shadow: rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px. Photo area on top (16:10 ratio), details below: 16px Cereal VF weight 600 title, 14px weight 400 description in #6A6A6A."
- "Design search bar: white background, full card shadow, 32px radius on container. Search text at 14px Cereal VF weight 400. Red search button (#FF385C, 50% radius, white icon)."
- "Build category pill bar: horizontal scrollable row. Each pill: 14px Cereal VF weight 600, #222222 text, bottom border on active. Circular prev/next arrows (#F2F2F2 bg, 50% radius)."
- "Create a CTA button: #222222 background, white text, 8px radius, 16px Cereal VF weight 500, 0px 24px padding. Hover: brand red accent."
- "Design a heart/wishlist button: transparent background, 50% radius, white heart icon with dark shadow outline."

**Iteration Guide:**
- Start with white — the photography provides all the color.
- Rausch Red (#FF385C) is the singular accent — use sparingly for CTAs only.
- Near-black (#222222) for text — the warmth matters.
- Three-layer shadows create natural, warm lift — always use all three layers.
- Generous radius: 8px buttons, 20px cards, 50% controls.
- Cereal VF at 500–700 weight — no thin weights for any heading.
- Photography is hero — every listing card is image-first.