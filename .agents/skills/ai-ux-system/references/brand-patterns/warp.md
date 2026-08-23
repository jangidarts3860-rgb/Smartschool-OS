# Brand Pattern: Warp

## Lessons & Core Philosophy
Warp's design is a **terminal reimagined as a modern app** — it takes the command line out of the 1980s and gives it the polish of a 2024 native application. The design philosophy: **the terminal is not a legacy tool, it's a power tool that deserves modern UX**. 

The visual language is built on a **deep, warm dark canvas** (`#1E1E1E` / `#1A1A2E`) with **electric accent colors** — a signature cyan (`#00D4FF`), magenta (`#FF00FF`), and amber (`#FFB800`) that map to terminal semantics: cyan for output, magenta for errors, amber for warnings. The light mode is a clean warm white (`#FEFEFE`) with deep navy text.

Typography is a **monospace-first** approach: `JetBrains Mono` for everything code/terminal, `Inter` for UI chrome. The key insight: **the terminal IS the content** — the UI gets out of the way. Blocks are the organizing primitive: each command + output = a block, collapsible, searchable, shareable.

What makes Warp distinctive: **AI command suggestions inline**, **block-based history with natural language search**, **modern input editing** (multi-cursor, selections), **shareable workflows**. The design doesn't just reskin the terminal — it restructures the mental model.

### Key Characteristics
- Default dark: `#1E1E1E` / `#1A1A2E` warm charcoal
- Semantic accent palette: Cyan `#00D4FF` (output), Magenta `#FF00FF` (error), Amber `#FFB800` (warn), Green `#00FF88` (success)
- Light mode: `#FEFEFE` canvas, `#0A0A0A` text
- Fonts: `JetBrains Mono` (terminal/code), `Inter` (UI)
- 8px radius on blocks, 6px on inputs, 4px on badges
- Hairline borders: `#333333` / `#E0E0E0`
- Subtle elevation: `0 4px 16px rgba(0,0,0,0.3)` dark / `0 4px 16px rgba(0,0,0,0.08)` light
- Blocks as atomic units: command + output = collapsible unit
- AI suggestions inline, ghost text
- Modern input: multi-cursor, selections, vim mode optional

---

## Detailed Specifications

### Color Palette & Roles

**Dark Mode (Default)**
| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#1E1E1E` | Terminal background |
| Canvas Alt | `#1A1A2E` | Sidebar, panels |
| Surface | `#252530` | Blocks, cards, modals |
| Surface Hover | `#2D2D3A` | Block hover |
| Border | `#333333` | Block borders, dividers |
| Border Focus | `#00D4FF` | Input focus, active block |
| Text Primary | `#E0E0E0` | Terminal output, body |
| Text Secondary | `#A0A0A0` | Comments, meta |
| Text Muted | `#6A6A6A` | Placeholders, line numbers |
| Cyan | `#00D4FF` | Output, links, primary accent |
| Magenta | `#FF00FF` | Errors, destructive |
| Amber | `#FFB800` | Warnings, pending |
| Green | `#00FF88` | Success, completed |
| Red | `#FF4444` | Errors, delete |
| Purple | `#BB86FC` | AI suggestions, AI mode |

**Light Mode**
| Token | Hex |
|-------|-----|
| Canvas | `#FEFEFE` |
| Surface | `#FFFFFF` |
| Border | `#E0E0E0` |
| Text Primary | `#1A1A2E` |
| Text Secondary | `#6A6A7A` |
| Cyan | `#0099CC` |
| Magenta | `#CC00CC` |
| Amber | `#CC8800` |
| Green | `#00AA55` |

### Typography Rules

**Font Families:**
- Terminal/Code: `JetBrains Mono` (system fallback: `ui-monospace, SFMono-Regular, Menlo`)
- UI: `Inter` (system-ui fallback)

**Hierarchy:**
| Role | Font | Size | Weight | Line Height | Use |
|------|------|------|--------|-------------|-----|
| Terminal Output | JetBrains Mono | 13px | 400 | 1.6 | Command output |
| Terminal Input | JetBrains Mono | 14px | 400 | 1.5 | Command entry |
| UI Heading | Inter | 20px | 600 | 1.3 | Section headers |
| UI Body | Inter | 13px | 400 | 1.5 | Descriptions |
| UI Label | Inter | 12px | 500 | 1.4 | Form labels |
| Button | Inter | 13px | 500 | 1.4 | Buttons |
| Caption | Inter | 11px | 400 | 1.4 | Meta, timestamps |
| Block Header | Inter | 12px | 500 | 1.4 | Block metadata |
| Code Inline | JetBrains Mono | 12px | 400 | 1.5 | Inline code |
| AI Suggestion | JetBrains Mono | 13px | 400 | 1.5 | Ghost text `#6A6A6A` |

### Component Stylings

**Terminal Blocks (Atomic Unit)**
- Container: `#252530` bg, `1px solid #333333` border, `8px` radius
- Padding: `12px 16px`
- Gap: `8px` between blocks
- Header: `12px 500` `#A0A0A0`, shows: `$` prompt, command, exit code, duration
- Input line: `JetBrains Mono 14px`, `#E0E0E0` text, `#00D4FF` cursor
- Output: `JetBrains Mono 13px`, `#E0E0E0`, line-height 1.6
- Error output: `#FF4444` text
- Collapsed: Shows only header, `▶` expand icon `#6A6A6A`

**Input (Command Entry)**
- BG: `#1A1A2E`, Border: `1px solid #333333`, Focus: `#00D4FF`
- Radius: 6px, Padding: `10px 14px`
- Font: `JetBrains Mono 14px`
- Multi-cursor: `#00D4FF` secondary cursors
- Selection: `rgba(0, 212, 255, 0.3)`
- AI Suggestion: Ghost text `#6A6A6A`, Tab to accept

**Sidebar**
- Width: 280px (expanded) / 56px (collapsed)
- BG: `#1A1A2E`, Border right: `1px solid #333333`
- Items: `Inter 13px 400` `#A0A0A0`, padding `10px 16px`
- Active: BG `#252530`, Text `#00D4FF`, Left border `3px solid #00D4FF`
- Sections: `Inter 11px 600` `#6A6A6A` uppercase, letter-spacing 0.5px

**Command Palette / Search**
- Modal: `#252530` bg, `#333333` border, `12px` radius
- Input: `JetBrains Mono 14px`, `#00D4FF` focus ring
- Results: `Inter 13px`, `#E0E0E0`, highlight match `#00D4FF`
- Sections: `Inter 11px 600` `#6A6A6A` uppercase
- Shortcuts: `JetBrains Mono 11px` `#6A6A6A` right-aligned

**AI Command Suggestions**
- Inline ghost text: `JetBrains Mono 13px` `#6A6A6A`
- Accept: Tab → inserts, text becomes `#E0E0E0`
- Inline explanation: Popover `#252530`, `JetBrains Mono 12px`, `#A0A0A0`

**Blocks (Collapsible Units)**
- Each command+output = block
- Header: `$ command` (cyan prompt), exit code badge, duration
- Expand/collapse: Chevron `#6A6A6A` → `#00D4FF` on hover
- Copy button: Top-right, ghost, appears on hover
- Share: Generates `warp.dev/b/...` link

**Workflows (Shareable Scripts)**
- Card: `#252530` bg, `#333333` border, `8px` radius
- Title: `Inter 14px 600` `#E0E0E0`
- Description: `13px 400` `#A0A0A0`
- Tags: `#00D4FF` bg `rgba(0,212,255,0.1)` text, `4px` radius
- Run button: Primary cyan

**Settings / Preferences**
- Sections: `Inter 12px 600` `#6A6A6A` uppercase
- Toggles: `16px` width, `#333333` track, `#00D4FF` thumb
- Inputs: Standard dark inputs
- Code font selector: Preview with `JetBrains Mono` sample

### Layout Principles

**Spacing:** 8px base
- Block gap: 8px
- Block internal: 12px
- Sidebar item: 10px 16px
- Modal padding: 24px

**Layout:**
- 3-pane: Sidebar (280px) | Terminal (flex) | AI Panel (320px, optional)
- Terminal: Full height, blocks stack vertically
- Input: Fixed bottom, 72px height
- Responsive: < 1024px → sidebar collapses, AI panel becomes bottom sheet

---

## Trade-offs
- **Pros:** Terminal feels modern, not legacy. Blocks = mental model upgrade. AI inline = workflow acceleration. Dark default = dev credibility.
- **Cons:** Dense for beginners. Light mode feels like an afterthought. Dense info = high cognitive load initially. Monospace everywhere can feel monolithic.

---

## What NOT to Copy
- **Don't default to light mode** — Warp users expect dark.
- **Don't use standard 16px body text** — terminal density needs 13px mono.
- **Don't hide the prompt** — `$` prompt is orientation.
- **Don't use standard input fields** — terminal input needs multi-cursor, vim keys, AI ghost.
- **Don't use standard cards** — blocks are the atomic unit, not cards.
- **Don't use standard command palette** — Warp's is terminal-native (fuzzy, history-aware).

---

## Agent Prompt Guide

**Quick Colors (Dark):**
- Canvas: `#1E1E1E`
- Block: `#252530`
- Border: `#333333`
- Text: `#E0E0E0` / `#A0A0A0`
- Cyan: `#00D4FF`
- Magenta: `#FF00FF`
- Amber: `#FFB800`
- Green: `#00FF88`

**Prompts:**
- "Create a Warp terminal block: `#252530` bg, `1px solid #333333` border, 8px radius. Header: `JetBrains Mono 12px 500` `#A0A0A0` showing `❯ npm run dev` with cyan prompt `❯`. Output: `JetBrains Mono 13px 400` `#E0E0E0` line-height 1.6. Duration badge: `13px 500` `#6A6A6A` `2.3s`. Exit code 0: green dot `#00FF88`."
- "Design Warp command input: `#1A1A2E` bg, `1px solid #333333` border, 6px radius, `JetBrains Mono 14px` `#E0E0E0` text. Cyan cursor `#00D4FF` blinking. Ghost AI suggestion `JetBrains Mono 13px` `#6A6A6A` `run dev --watch`. Tab accepts."
- "Build Warp sidebar: 280px, `#1A1A2E` bg, right border `1px solid #333333`. Sections: `Inter 11px 600` `#6A6A6A` uppercase. Items: `Inter 13px 400` `#A0A0A0` padding `10px 16px`. Active: `#252530` bg, `#00D4FF` text, left border `3px solid #00D4FF`."
- "Create AI suggestion inline: `JetBrains Mono 13px` `#6A6A6A` ghost text `npm run dev --watch`. Tab to accept. Hover explanation popover: `#252530` bg, `JetBrains Mono 12px` `#A0A0A0`."
- "Design a workflow card: `#252530` bg, `#333333` border, 8px radius. Title `Inter 14px 600` `#E0E0E0`. Desc `13px 400` `#A0A0A0`. Tags: `#00D4FF` bg `rgba(0,212,255,0.1)` text `Inter 11px 500` 4px radius. Run button: cyan primary."

---

## Trade-offs
- Terminal-native = learning curve for GUI users
- Dense = power user efficiency, beginner overwhelm
- Monospace everywhere = visual monotony risk
- AI features = privacy/compute considerations

---

## What NOT to Copy
- Don't copy the exact cyan/magenta/amber palette — it's Warp's semantic signature.
- Don't use monospace for body text unless you're a terminal.
- Don't copy the block model unless you're building a terminal/log viewer.
- Don't default to light mode for developer tools.