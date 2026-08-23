# Brand Pattern: Clay

## Lessons & Core Philosophy
Clay's website is a warm, playful celebration of color that treats B2B data enrichment like a craft rather than an enterprise chore. The design language is built on a foundation of warm cream backgrounds (`#FAF9F7`) and oat-toned borders (`#DAD4C8`, `#EEE9DF`) that give every surface the tactile quality of handmade paper. Against this artisanal canvas, a vivid swatch palette explodes with personality — Matcha green, Slushie cyan, Lemon gold, Ube purple, Pomegranate pink, Blueberry navy, and Dragonfruit magenta — each named like flavors at a juice bar, not colors in an enterprise UI kit.

The typography is anchored by Roobert, a geometric sans-serif with character, loaded with an extensive set of OpenType stylistic sets (`"ss01"`, `"ss03"`, `"ss10"`, `"ss11"`, `"ss12"`) that give the text a distinctive, slightly quirky personality. At display scale (80px, weight 600), Roobert uses aggressive negative letter-spacing (-3.2px) that compresses headlines into punchy, billboard-like statements. Space Mono serves as the monospace companion for code and technical labels, completing the craft-meets-tech duality.

What makes Clay truly distinctive is its hover micro-animations: buttons on hover rotate slightly (`rotateZ(-8deg)`), translate upward (`translateY(-80%)`), change background to a contrasting swatch color, and cast a hard offset shadow (`rgb(0,0,0) -7px 7px`). This playful hover behavior — where a button literally tilts and jumps on interaction — creates a sense of physical delight that's rare in B2B software. Combined with generously rounded containers (24px–40px radius), dashed borders alongside solid ones, and a multi-layer shadow system that includes inset highlights, Clay feels like a design system that was made by people who genuinely enjoy making things.

### Key Characteristics
- Warm cream canvas (`#FAF9F7`) with oat-toned borders (`#DAD4C8`) — artisanal, not clinical
- Named swatch palette: Matcha, Slushie, Lemon, Ube, Pomegranate, Blueberry, Dragonfruit
- Roobert font with 5 OpenType stylistic sets — quirky geometric character
- Playful hover animations: `rotateZ(-8deg)` + `translateY(-80%)` + hard offset shadow
- Space Mono for code and technical labels
- Generous border radius: 24px cards, 40px sections, 1584px pills
- Mixed border styles: solid + dashed in the same interface
- Multi-layer shadow with inset highlight: `0px 1px 1px` + `-1px inset` + `-0.5px`

---

## Detailed Specifications

### Color Palette & Roles

**Primary**
- Clay Black (`#000000`): Text, headings, pricing card text
- Pure White (`#FFFFFF`): Card backgrounds, button backgrounds, inverse text
- Warm Cream (`#FAF9F7`): Page background — the warm, paper-like canvas

**Swatch Palette — Named Colors**

**Matcha (Green)**
- Matcha 300 (`#84E7A5`): Light green accent
- Matcha 600 (`#078A52`): Mid green
- Matcha 800 (`#02492A`): Deep green for dark sections

**Slushie (Cyan)**
- Slushie 500 (`#3BD3FD`): Bright cyan accent
- Slushie 800 (`#0089AD`): Deep teal

**Lemon (Gold)**
- Lemon 400 (`#F8CC65`): Warm pale gold
- Lemon 500 (`#FBBC41`): Primary gold
- Lemon 700 (`#D08A11`): Deep amber
- Lemon 800 (`#9D6A09`): Dark amber

**Ube (Purple)**
- Ube 300 (`#C1B0FF`): Soft lavender
- Ube 800 (`#43089F`): Deep purple
- Ube 900 (`#32037D`): Darkest purple

**Pomegranate (Pink/Red)**
- Pomegranate 400 (`#FC7981`): Warm coral-pink

**Blueberry (Navy Blue)**
- Blueberry 800 (`#01418D`): Deep navy

**Neutral Scale (Warm)**
- Warm Silver (`#9F9B93`): Secondary/muted text, footer links
- Warm Charcoal (`#55534E`): Tertiary text, dark muted links
- Dark Charcoal (`#333333`): Link text on light backgrounds

**Surface & Border**
- Oat Border (`#DAD4C8`): Primary border — warm, cream-toned structural lines
- Oat Light (`#EEE9DF`): Secondary lighter border
- Cool Border (`#E6E8EC`): Cool-toned border for contrast sections
- Dark Border (`#525A69`): Border on dark sections
- Light Frost (`#EFF1F3`): Subtle button background (at 0% opacity on hover)

**Badges**
- Badge Blue Bg (`#F0F8FF`): Blue-tinted badge surface
- Badge Blue Text (`#3859F9`): Vivid blue badge text

**Focus & Shadows**
- Focus Ring (`rgb(20, 110, 245) solid 2px`): Accessibility focus indicator
- Clay Shadow (`rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset, rgba(0,0,0,0.05) 0px -0.5px 1px`): Multi-layer with inset highlight — the signature
- Hard Offset (`rgb(0,0,0) -7px 7px`): Hover state — playful hard shadow

### Typography Rules

**Font Families**
- Primary: `Roobert`, fallback: `Arial`
- Monospace: `Space Mono`
- OpenType Features: `"ss01"`, `"ss03"`, `"ss10"`, `"ss11"`, `"ss12"` on all Roobert text (display uses all 5; body/UI uses `"ss03"`, `"ss10"`, `"ss11"`, `"ss12"`)

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Roobert | 80px (5.00rem) | 600 | 1.00 (tight) | -3.2px | All 5 stylistic sets |
| Display Secondary | Roobert | 60px (3.75rem) | 600 | 1.00 (tight) | -2.4px | All 5 stylistic sets |
| Section Heading | Roobert | 44px (2.75rem) | 600 | 1.10 (tight) | -0.88px to -1.32px | All 5 stylistic sets |
| Card Heading | Roobert | 32px (2.00rem) | 600 | 1.10 (tight) | -0.64px | All 5 stylistic sets |
| Feature Title | Roobert | 20px (1.25rem) | 600 | 1.40 | -0.4px | All 5 stylistic sets |
| Sub-heading | Roobert | 20px (1.25rem) | 500 | 1.50 | -0.16px | 4 stylistic sets (no ss01) |
| Body Large | Roobert | 20px (1.25rem) | 400 | 1.40 | normal | 4 stylistic sets |
| Body | Roobert | 18px (1.13rem) | 400 | 1.60 (relaxed) | -0.36px | 4 stylistic sets |
| Body Standard | Roobert | 16px (1.00rem) | 400 | 1.50 | normal | 4 stylistic sets |
| Body Medium | Roobert | 16px | 500 | 1.20–1.40 | -0.16px to -0.32px | 4–5 stylistic sets |
| Button | Roobert | 16px (1.00rem) | 500 | 1.50 | -0.16px | 4 stylistic sets |
| Button Large | Roobert | 24px (1.50rem) | 400 | 1.50 | normal | 4 stylistic sets |
| Button Small | Roobert | 12.8px (0.80rem) | 500 | 1.50 | -0.128px | 4 stylistic sets |
| Nav Link | Roobert | 15px (0.94rem) | 500 | 1.60 (relaxed) | normal | 4 stylistic sets |
| Caption | Roobert | 14px (0.88rem) | 400 | 1.50–1.60 | -0.14px | 4 stylistic sets |
| Small | Roobert | 12px (0.75rem) | 400 | 1.50 | normal | 4 stylistic sets |
| Uppercase Label | Roobert | 12px (0.75rem) | 600 | 1.20 (tight) | 1.08px | `text-transform: uppercase`, 4 sets |
| Badge | Roobert | 9.6px | 600 | — | — | Pill badges |

**Principles:**
- Five stylistic sets as identity: The combination of `"ss01"`, `"ss03"`, `"ss10"`, `"ss11"`, `"ss12"` on Roobert creates a distinctive typographic personality. `ss01` is reserved for headings and emphasis — body text omits it, creating a subtle hierarchy through glyph variation.
- Aggressive display compression: -3.2px at 80px, -2.4px at 60px — the most compressed display tracking alongside the most generous body spacing (1.60 line-height), creating dramatic contrast.
- Weight 600 for headings, 500 for UI, 400 for body: Clean three-tier system where each weight has a strict role.
- Uppercase labels with positive tracking: 12px uppercase at 1.08px letter-spacing creates the systematic wayfinding pattern.

### Component Stylings

**Buttons**

**Primary (Transparent with Hover Animation)**
- Background: transparent (`rgba(239, 241, 243, 0)`)
- Text: `#000000`
- Padding: 6.4px 12.8px
- Border: none (or `1px solid #717989` for outlined variant)
- Hover: background shifts to swatch color (e.g., `#434346`), text to white, `rotateZ(-8deg)`, `translateY(-80%)`, hard shadow `rgb(0,0,0) -7px 7px`
- Focus: `rgb(20, 110, 245) solid 2px` outline

**White Solid**
- Background: `#FFFFFF`
- Text: `#000000`
- Padding: 6.4px
- Hover: oat-200 swatch color, animated rotation + shadow
- Use: Primary CTA on colored sections

**Ghost Outlined**
- Background: transparent
- Text: `#000000`
- Padding: 8px
- Border: `1px solid #717989`
- Radius: 4px
- Hover: dragonfruit swatch color, white text, animated rotation

**Cards & Containers**
- Background: `#FFFFFF` on cream canvas
- Border: `1px solid #DAD4C8` (warm oat) or `1px dashed #DAD4C8`
- Radius: 12px (standard cards), 24px (feature cards/images), 40px (section containers/footer)
- Shadow: `rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset, rgba(0,0,0,0.05) 0px -0.5px 1px`
- Colorful section backgrounds using swatch palette (matcha, slushie, ube, lemon)

**Inputs & Forms**
- Text: `#000000`
- Border: `1px solid #717989`
- Radius: 4px
- Focus: `rgb(20, 110, 245) solid 2px` outline

**Navigation**
- Sticky top nav on cream background
- Roobert 15px weight 500 for nav links
- Clay logo left-aligned
- CTA buttons right-aligned with pill radius
- Border bottom: `1px solid #DAD4C8`
- Mobile: hamburger collapse at 767px

**Image Treatment**
- Product screenshots in white cards with oat borders
- Colorful illustrated sections with swatch background colors
- 8px–24px radius on images
- Full-width colorful section backgrounds

**Distinctive Components**

**Swatch Color Sections**
- Full-width sections with swatch-colored backgrounds (matcha green, slushie cyan, ube purple, lemon gold)
- White text on dark swatches, black text on light swatches
- Each section tells a distinct product story through its color

**Playful Hover Buttons**
- Rotate -8deg + translate upward on hover
- Hard offset shadow (`-7px 7px`) instead of soft blur
- Background transitions to contrasting swatch color
- Creates a physical, toy-like interaction quality

**Dashed Border Elements**
- Dashed borders (`1px dashed #DAD4C8`) alongside solid borders
- Used for secondary containers and decorative elements
- Adds a hand-drawn, craft-like quality

### Layout Principles

**Spacing System**
- Base unit: 8px
- Scale: 1px, 2px, 4px, 6.4px, 8px, 12px, 12.8px, 16px, 18px, 20px, 24px

**Grid & Container**
- Max content width centered
- Feature sections alternate between white cards and colorful swatch backgrounds
- Card grids: 2–3 columns on desktop
- Full-width colorful sections break the grid
- Footer with generous 40px radius container

**Whitespace Philosophy**
- Warm, generous breathing: The cream background provides a warm rest between content blocks. Spacing is generous but not austere — it feels inviting, like a well-set table.
- Color as spatial rhythm: The alternating swatch-colored sections create visual rhythm through hue rather than just whitespace. Each color section is its own "room."
- Craft-like density inside cards: Within cards, content is compact and well-organized, contrasting with the generous outer spacing.

**Border Radius Scale**
| Radius | Use |
|--------|-----|
| Sharp (4px) | Ghost buttons, inputs |
| Standard (8px) | Small cards, images, links |
| Badge (11px) | Tag badges |
| Card (12px) | Standard cards, buttons |
| Feature (24px) | Feature cards, images, panels |
| Section (40px) | Large sections, footer, containers |
| Pill (1584px) | CTAs, pill-shaped buttons |

### Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, cream canvas | Page background |
| Clay Shadow (Level 1) | `rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset, rgba(0,0,0,0.05) 0px -0.5px 1px` | Cards, buttons — multi-layer with inset highlight |
| Hover Hard (Level 2) | `rgb(0,0,0) -7px 7px` | Hover state — playful hard offset shadow |
| Focus (Level 3) | `rgb(20, 110, 245) solid 2px` | Keyboard focus ring |

**Shadow Philosophy:**
Clay's shadow system is uniquely three-layered: a downward cast (`0px 1px 1px`), an upward inset highlight (`0px -1px 1px inset`), and a subtle edge (`0px -0.5px 1px`). This creates a "pressed into clay" quality where elements feel both raised AND embedded — like a clay tablet where content is stamped into the surface. The hover hard shadow (`-7px 7px`) is deliberately retro-graphic, referencing print-era drop shadows and adding physical playfulness.

**Decorative Depth**
- Full-width swatch-colored sections create dramatic depth through color contrast
- Dashed borders add visual texture alongside solid borders
- Product illustrations with warm, organic art style

---

## Trade-offs
- **Pros:** Unmistakably warm and human for B2B. Swatch palette makes sections memorable. Playful hover states create delight. Craft paper metaphor is cohesive.
- **Cons:** Swatch colors can overwhelm if not carefully balanced. Playful hover may feel too casual for conservative enterprises. Roobert is a custom font (licensing). Dashed borders + solid borders = visual complexity risk. Cream background requires high-quality images to avoid looking "dirty."

---

## What NOT to Copy
- **Don't use cool gray backgrounds** — the warm cream (`#FAF9F7`) is non-negotiable.
- **Don't use neutral gray borders** (`#CCC`, `#DDD`) — always use the warm oat tones (`#DAD4C8`).
- **Don't mix more than 2 swatch colors in the same section** — each section owns its color.
- **Don't skip the OpenType stylistic sets** — they define Roobert's character.
- **Don't use subtle hover effects** — the rotation + hard shadow IS the signature interaction.
- **Don't use small border radius (<12px) on feature cards** — the generous rounding is structural.
- **Don't use standard shadows (blur-based)** — Clay uses hard offset and multi-layer inset.
- **Don't forget the uppercase labels with 1.08px tracking** — they're the wayfinding system.

---

## Agent Prompt Guide

**Quick Color Reference:**
- Background: Warm Cream (`#FAF9F7`)
- Text: Clay Black (`#000000`)
- Secondary text: Warm Silver (`#9F9B93`)
- Border: Oat Border (`#DAD4C8`)
- Green accent: Matcha 600 (`#078A52`)
- Cyan accent: Slushie 500 (`#3BD3FD`)
- Gold accent: Lemon 500 (`#FBBC41`)
- Purple accent: Ube 800 (`#43089F`)
- Pink accent: Pomegranate 400 (`#FC7981`)

**Example Component Prompts:**
- "Create a hero on warm cream (`#FAF9F7`) background. Headline at 80px Roobert weight 600, line-height 1.00, letter-spacing -3.2px, OpenType 'ss01 ss03 ss10 ss11 ss12', black text. Subtitle at 20px weight 400, line-height 1.40, `#9F9B93` text. Two buttons: white solid pill (12px radius) and ghost outlined (4px radius, 1px solid `#717989`)."
- "Design a colorful section with Matcha 800 (`#02492A`) background. Heading at 44px Roobert weight 600, letter-spacing -1.32px, white text. Body at 18px weight 400, line-height 1.60, `#84E7A5` text. White card inset with oat border (`#DAD4C8`), 24px radius."
- "Build a button with playful hover: default transparent background, black text, 16px Roobert weight 500. On hover: background `#434346`, text white, transform rotateZ(-8deg) translateY(-80%), hard shadow `rgb(0,0,0) -7px 7px`."
- "Create a card: white background, 1px solid `#DAD4C8` border, 24px radius. Shadow: `rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset`. Title at 32px Roobert weight 600, letter-spacing -0.64px."
- "Design an uppercase label: 12px Roobert weight 600, text-transform uppercase, letter-spacing 1.08px, OpenType 'ss03 ss10 ss11 ss12'."

**Iteration Guide:**
- Start with warm cream (`#FAF9F7`) — never cool white.
- Swatch colors are for full sections, not small accents — go bold with matcha, slushie, ube.
- Oat borders (`#DAD4C8`) everywhere — dashed variants for decoration.
- OpenType stylistic sets are mandatory — they make Roobert look like Roobert.
- Hover animations are the signature — rotation + hard shadow, not subtle fades.
- Generous radius: 24px cards, 40px sections — nothing looks sharp or corporate.
- Three weights: 600 (headings), 500 (UI), 400 (body) — strict roles.

---

## Trade-offs
- **Pros:** Warm, approachable B2B aesthetic. Distinctive personality. Color-coded sections aid navigation. Playful interactions create brand recall.
- **Cons:** Custom font licensing. Swatch system requires discipline. Playful hovers may feel unprofessional to conservative buyers. Dashed + solid borders = visual noise risk.

---

## What NOT to Copy
- Don't use cool white or cool gray backgrounds — cream warmth is the identity.
- Don't use neutral gray borders — always oat.
- Don't skip OpenType features — Roobert looks generic without them.
- Don't make hover effects subtle — the rotation + hard shadow is the signature.
- Don't use small radius on feature cards — generous rounding is structural.