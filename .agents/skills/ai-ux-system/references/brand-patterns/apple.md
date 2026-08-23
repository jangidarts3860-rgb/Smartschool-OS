# Brand Pattern: Apple

## Lessons & Core Philosophy
Apple's website is a masterclass in controlled drama — vast expanses of pure black and near-white serve as cinematic backdrops for products that are photographed as if they were sculptures in a gallery. The design philosophy is reductive to its core: every pixel exists in service of the product, and the interface itself retreats until it becomes invisible. This is not minimalism as aesthetic preference; it is minimalism as reverence for the object.

The typography anchors everything. San Francisco (SF Pro Display for large sizes, SF Pro Text for body) is Apple's proprietary typeface, engineered with optical sizing that automatically adjusts letterforms depending on point size. At display sizes (56px), weight 600 with a tight line-height of 1.07 and subtle negative letter-spacing (-0.28px) creates headlines that feel machined rather than typeset — precise, confident, and unapologetically direct. At body sizes (17px), the tracking loosens slightly (-0.374px) and line-height opens to 1.47, creating a reading rhythm that is comfortable without ever feeling slack.

The color story is starkly binary. Product sections alternate between pure black (`#000000`) backgrounds with white text and light gray (`#F5F5F7`) backgrounds with near-black text (`#1D1D1F`). This creates a cinematic pacing — dark sections feel immersive and premium, light sections feel open and informational. The only chromatic accent is Apple Blue (`#0071E3`), reserved exclusively for interactive elements: links, buttons, and focus states. This singular accent color in a sea of neutrals gives every clickable element unmistakable visibility.

### Key Characteristics
- SF Pro Display/Text with optical sizing — letterforms adapt automatically to size context
- Binary light/dark section rhythm: black (`#000000`) alternating with light gray (`#F5F5F7`)
- Single accent color: Apple Blue (`#0071E3`) reserved exclusively for interactive elements
- Product-as-hero photography on solid color fields — no gradients, no textures, no distractions
- Extremely tight headline line-heights (1.07-1.14) creating compressed, billboard-like impact
- Full-width section layout with centered content — the viewport IS the canvas
- Pill-shaped CTAs (980px radius) creating soft, approachable action buttons
- Generous whitespace between sections allowing each product moment to breathe

## Detailed Specifications

### Color Palette & Roles

**Primary**
- Pure Black (`#000000`): Hero section backgrounds, immersive product showcases
- Light Gray (`#F5F5F7`): Alternate section backgrounds, informational areas
- Near Black (`#1D1D1F`): Primary text on light backgrounds, dark button fills

**Interactive**
- Apple Blue (`#0071E3`): `--sk-focus-color`, primary CTA backgrounds, focus rings — THE ONLY chromatic color
- Link Blue (`#0066CC`): `--sk-body-link-color`, inline text links
- Bright Blue (`#2997FF`): Links on dark backgrounds

**Text**
- White (`#FFFFFF`): Text on dark backgrounds, button text on blue/dark CTAs
- Near Black (`#1D1D1F`): Primary body text on light backgrounds
- Black 80% (`rgba(0,0,0,0.8)`): Secondary text, nav items on light backgrounds
- Black 48% (`rgba(0,0,0,0.48)`): Tertiary text, disabled states, carousel controls

**Surface & Dark Variants**
- Dark Surface 1 (`#272729`): Card backgrounds in dark sections
- Dark Surface 2 (`#262628`): Subtle surface variation in dark contexts
- Dark Surface 3 (`#28282A`): Elevated cards on dark backgrounds
- Dark Surface 4 (`#2A2A2D`): Highest dark surface elevation
- Dark Surface 5 (`#242426`): Deepest dark surface tone

**Button States**
- Button Active (`#EDEDF2`): Active/pressed state for light buttons
- Button Default Light (`#FAFAFC`): Search/filter button backgrounds
- Overlay (`rgba(210,210,215,0.64)`): Media control scrims, overlays
- White 32% (`rgba(255,255,255,0.32)`): Hover state on dark modal close buttons

**Shadows**
- Card Shadow: `rgba(0,0,0,0.22) 3px 5px 30px 0px` — soft, diffused elevation

### Typography Rules

**Font Family**
- Display: `SF Pro Display`, fallbacks: `SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif`
- Body: `SF Pro Text`, fallbacks: `SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif`
- SF Pro Display used at 20px and above; SF Pro Text optimized for 19px and below.

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | SF Pro Display | 56px (3.50rem) | 600 | 1.07 (tight) | -0.28px | Product launch headlines |
| Section Heading | SF Pro Display | 40px (2.50rem) | 600 | 1.10 (tight) | normal | Feature section titles |
| Tile Heading | SF Pro Display | 28px (1.75rem) | 400 | 1.14 (tight) | 0.196px | Product tile headlines |
| Card Title | SF Pro Display | 21px (1.31rem) | 700 | 1.19 (tight) | 0.231px | Bold card headings |
| Sub-heading | SF Pro Display | 21px | 400 | 1.19 (tight) | 0.231px | Regular card headings |
| Nav Heading | SF Pro Text | 34px (2.13rem) | 600 | 1.47 | -0.374px | Large navigation headings |
| Sub-nav | SF Pro Text | 24px (1.50rem) | 300 | 1.50 | normal | Light sub-navigation text |
| Body | SF Pro Text | 17px (1.06rem) | 400 | 1.47 | -0.374px | Standard reading text |
| Body Emphasis | SF Pro Text | 17px | 600 | 1.24 (tight) | -0.374px | Emphasized body, labels |
| Button Large | SF Pro Text | 18px (1.13rem) | 300 | 1.00 (tight) | normal | Large button text, light weight |
| Button | SF Pro Text | 17px (1.06rem) | 400 | 2.41 (relaxed) | normal | Standard button text |
| Link | SF Pro Text | 14px (0.88rem) | 400 | 1.43 | -0.224px | Body links, "Learn more" |
| Caption | SF Pro Text | 14px | 400 | 1.29 (tight) | -0.224px | Secondary text, descriptions |
| Caption Bold | SF Pro Text | 14px | 600 | 1.29 (tight) | -0.224px | Emphasized captions |
| Micro | SF Pro Text | 12px (0.75rem) | 400 | 1.33 | -0.12px | Fine print, footnotes |
| Micro Bold | SF Pro Text | 12px | 600 | 1.33 | -0.12px | Bold fine print |
| Nano | SF Pro Text | 10px (0.63rem) | 400 | 1.47 | -0.08px | Legal text, smallest size |

**Principles:**
- Optical sizing as philosophy: SF Pro automatically switches between Display and Text optical sizes. Display versions have wider letter spacing and thinner strokes for large sizes; Text versions are tighter and sturdier for small sizes.
- Weight restraint: Scale spans 300 (light) to 700 (bold) but most text lives at 400 (regular) and 600 (semibold). Weight 300 appears only on large decorative text. Weight 700 is rare, used only for bold card titles.
- Negative tracking at all sizes: Unlike most systems that only track headlines, Apple applies subtle negative letter-spacing even at body sizes (-0.374px at 17px, -0.224px at 14px, -0.12px at 12px).
- Extreme line-height range: Headlines compress to 1.07 while body text opens to 1.47, and some button contexts stretch to 2.41.

### Component Stylings

**Buttons**
- Primary Blue (CTA): BG `#0071E3`, Text `#FFFFFF`, Padding `8px 15px`, Radius `8px`, Border `1px solid transparent`, Font SF Pro Text 17px weight 400. Hover: brightens. Active: `#EDEDF2` background. Focus: `2px solid #0071E3` outline.
- Primary Dark: BG `#1D1D1F`, Text `#FFFFFF`, Padding `8px 15px`, Radius `8px`. Use: Secondary CTA.
- Pill Link (Learn More / Shop): Transparent BG, Text `#0066CC` (light) or `#2997FF` (dark), Radius `980px` (full pill), Border `1px solid #0066CC`. Font SF Pro Text 14-17px. Hover: underline. Use: "Learn more" and "Shop" links.
- Filter/Search Button: BG `#FAFAFC`, Text `rgba(0,0,0,0.8)`, Padding `0px 14px`, Radius `11px`, Border `3px solid rgba(0,0,0,0.04)`. Focus: `2px solid #0071E3` outline.
- Media Control: BG `rgba(210,210,215,0.64)`, Text `rgba(0,0,0,0.48)`, Radius `50%` (circular). Active: scale(0.9). Focus: `2px solid #0071E3` outline, white bg, black text.

**Cards & Containers**
- BG: `#F5F5F7` (light) or `#272729`–`#2A2A2D` (dark). Border: none (borders rare). Radius: 5px-8px. Shadow: `rgba(0,0,0,0.22) 3px 5px 30px 0px` for elevated product cards. Content: centered, generous padding. Hover: no standard hover — cards static, links within interactive.

**Navigation**
- BG: `rgba(0,0,0,0.8)` with `backdrop-filter: saturate(180%) blur(20px)` (translucent dark glass). Height: 48px. Text: `#FFFFFF` at 12px weight 400. Active: underline on hover. Logo: Apple logomark (SVG) centered or left, 17x48px. Mobile: collapses to hamburger with full-screen overlay.

**Image Treatment**
- Products on solid-color fields (black or white) — no backgrounds, no context, just the object.
- Full-bleed section images spanning entire viewport width.
- Product photography at extremely high resolution with subtle shadows.
- Lifestyle images confined to rounded-corner containers (12px+ radius).

### Layout Principles
- Spacing: 8px base, scale: 2px, 4px, 5px, 6px, 7px, 8px, 9px, 10px, 11px, 14px, 15px, 17px, 20px, 24px. Notable: dense at small sizes (2-11px) with 1px increments.
- Grid: Max content width ~980px. Hero: full-viewport-width sections with centered content block. Product grids: 2-3 column layouts within centered container. Single-column for hero moments.
- Whitespace: Cinematic breathing room — each product section occupies full viewport height. Whitespace between products = pause between scenes. Vertical rhythm through color blocks (black, `#F5F5F7`, white).
- Radius Scale: 5px (micro), 8px (standard), 11px (comfortable), 12px (large), 980px (full pill), 50% (circle).

### Shadow Philosophy
Apple uses shadow extremely sparingly. Primary shadow (`3px 5px 30px` with 0.22 opacity) is soft, wide, offset — mimicking diffused studio light. Most elements have NO shadow; elevation comes from background color contrast.

---

## Trade-offs
- **Pros:** Unmatched product focus, premium perception, clear visual hierarchy, timeless aesthetic, accessibility-focused (single accent color ensures contrast).
- **Cons:** Requires exceptional product photography. Can feel cold or sterile if not balanced with warmth. No room for brand personality through color. High production cost for imagery.

---

## What NOT to Copy
- **Don't introduce additional accent colors** — the entire chromatic budget is spent on blue.
- **Don't use heavy shadows or multiple shadow layers** — Apple's shadow system is one soft diffused shadow or nothing.
- **Don't use borders on cards or containers** — Apple almost never uses visible borders.
- **Don't apply wide letter-spacing to SF Pro** — it is designed to run tight at every size.
- **Don't use weight 800 or 900** — maximum is 700 (bold), and even that is rare.
- **Don't add textures, patterns, or gradients to backgrounds** — solid colors only.
- **Don't make the navigation opaque** — the glass blur effect is essential to the Apple web experience.
- **Don't center-align body text** — Apple body copy is left-aligned; only headlines center.
- **Don't use rounded corners larger than 12px on rectangular elements** (980px is for pills only).
- **Don't use SF Pro Display below 20px or SF Pro Text above 19px** — respect the optical sizing boundary.

---

## Agent Prompt Guide

**Quick Color Reference:**
- Primary CTA: Apple Blue (`#0071E3`)
- Page Background (Light): `#F5F5F7`
- Page Background (Dark): `#000000`
- Heading Text (Light): `#1D1D1F`
- Heading Text (Dark): `#FFFFFF`
- Body Text: `rgba(0,0,0,0.8)` on light, `#FFFFFF` on dark
- Link (Light BG): `#0066CC`
- Link (Dark BG): `#2997FF`
- Focus Ring: `#0071E3`
- Card Shadow: `rgba(0,0,0,0.22) 3px 5px 30px 0px`

**Example Component Prompts:**
- "Create a hero section on black background. Headline at 56px SF Pro Display weight 600, line-height 1.07, letter-spacing -0.28px, color white. One-line subtitle at 21px SF Pro Display weight 400, line-height 1.19, color white. Two pill CTAs: 'Learn more' (transparent bg, white text, 1px solid white border, 980px radius) and 'Buy' (Apple Blue #0071E3 bg, white text, 8px radius, 8px 15px padding)."
- "Design a product card: #F5F5F7 background, 8px border-radius, no border, no shadow. Product image top 60% of card on solid background. Title at 28px SF Pro Display weight 400, letter-spacing 0.196px, line-height 1.14. Description at 14px SF Pro Text weight 400, color rgba(0,0,0,0.8). 'Learn more' and 'Shop' links in #0066CC at 14px."
- "Build the Apple navigation: sticky, 48px height, background rgba(0,0,0,0.8) with backdrop-filter: saturate(180%) blur(20px). Links at 12px SF Pro Text weight 400, white text. Apple logo left, links centered, search and bag icons right."
- "Create an alternating section layout: first section black bg with white text and centered product image, second section #F5F5F7 bg with #1D1D1F text. Each section near full-viewport height with 56px headline and two pill CTAs below."
- "Design a 'Learn more' link: text #0066CC on light bg or #2997FF on dark bg, 14px SF Pro Text, underline on hover. After the text, include a right-arrow chevron character (>). Wrap in a container with 980px border-radius for pill shape when used as a standalone CTA."

**Iteration Guide:**
- Every interactive element gets Apple Blue (`#0071E3`) — no other accent colors.
- Section backgrounds alternate: black for immersive moments, `#F5F5F7` for informational moments.
- Typography optical sizing: SF Pro Display at 20px+, SF Pro Text below — never mix.
- Negative letter-spacing at all sizes: -0.28px at 56px, -0.374px at 17px, -0.224px at 14px, -0.12px at 12px.
- The navigation glass effect (translucent dark + blur) is non-negotiable — it defines the Apple web experience.
- Products always appear on solid color fields — never on gradients, textures, or lifestyle backgrounds in hero modules.
- Shadow is rare and always soft: `3px 5px 30px 0.22 opacity` or nothing at all.
- Pill CTAs use 980px radius — this creates the signature Apple rounded-rectangle-that-looks-like-a-capsule shape.