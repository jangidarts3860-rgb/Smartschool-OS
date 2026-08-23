---
name: ux-orchestrator-v2
description: Routes UX work to the minimum required specialist skills, maintains shared project context, detects conflicts, and runs final quality gates. Use for multi-stage product work.
version: 2.0
---
# UX Orchestrator v2 — Complete Workflow Engine

## Purpose
Coordinate the full UX pipeline: Research → Strategy → Audit → Design System → Execution → Interaction → Validation. Maintains shared project contract, detects cross-skill conflicts, runs final gates.

---

## Global Memory Tracker (Run on EVERY Task Start)

Before executing any design task, the Orchestrator MUST establish the current project context to ensure absolute consistency across AI sessions.

**Step 1. Read Project Brief (Context Check)**
Search for a `uiux-brief.md` file in the user's project by checking these paths in order:
1. `doc/uiux-brief.md`
2. `docs/uiux-brief.md`
3. `uiux-brief.md` (root folder)

- *If found:* Actively extract the project name, platform, target users, preferred tone, and constraints. Use this to guide all decisions.
- *If not found:* Proceed normally using Assumption Mode.

**Step 2. Read or Create Design Memory (Continuity Check)**
Design consistency requires tracking established tokens and patterns. Check the project root for `design-memory.json`.
- *If it exists:* Read it. You MUST enforce the tokens and patterns defined here. NEVER invent new hex colors or contradictory patterns if they exist in memory, unless specifically asked to update them.
- *If it does NOT exist:* Create `design-memory.json` in the root using the schema below based on the current context or brief.

**Step 3. Update Memory (Post-Task Action)**
Before ending your turn, if you created new color tokens, typography rules, or established a new structural pattern (e.g., "All modals use bottom sheets on mobile"), you MUST automatically append them to `design-memory.json` and update the `last_updated` date.

### `design-memory.json` Template Schema
```json
{
  "project_name": "Project Name (from brief or inferred)",
  "theme_mode": "light | dark | dark-first | system",
  "tokens": {
    "colors": {
      "primary": "token/Tailwind class (e.g., bg-indigo-600)",
      "surface": "e.g., bg-slate-900",
      "text_main": "e.g., text-slate-100",
      "accent": "e.g., text-emerald-400"
    },
    "typography": {
      "font_family": "e.g., Inter, sans-serif",
      "heading_weight": "e.g., font-bold",
      "body_size": "e.g., text-sm"
    },
    "borders": {
      "radius": "e.g., rounded-xl",
      "border_color": "e.g., border-slate-800"
    }
  },
  "established_patterns": [
    "List structural rules AI should remember across sessions here",
    "e.g., Primary CTAs are always full-width on mobile",
    "e.g., Empty states must feature comfort text + action button"
  ],
  "last_updated": "YYYY-MM-DD"
}
```

---

## Phase Pipeline (Run Only What's Needed)

| Phase | Skill | Trigger | Output |
|-------|-------|---------|--------|
| 1. Research | `01-ux-research-v2` | "user research", "persona", "interview", "competitor analysis" | Evidence, personas, journey maps |
| 2. Strategy | `02-product-strategy-v2` | "define scope", "HMW", "MoSCoW", "sitemap", "user flow" | IA, flows, metrics, assumptions |
| 3. Audit | `03-ux-audit-v2` | "UX audit", "heuristic review", "accessibility check", "dark pattern scan" | Severity-ranked issues |
| 4. Design System | `04-design-system-v2` | "design tokens", "component library", "Figma variables", "style guide" | Token JSON, component specs |
| 5. Execution | `05-ui-execution-v2` | "design screen", "Figma wireframe", "high-fidelity", "component", "UI design" | Figma frames, specs, handoff |
| 6. Interaction | `06-interaction-v2` | "animate", "prototype", "motion", "gesture", "haptic", "transition", "generative ui", "ai interaction" | Motion specs, Figma prototype, AI streaming layout |
| 7. Validation | `07-ux-validation-v2` | "usability test", "test plan", "SUS", "iteration", "A/B test" | Test scripts, findings, fixes |

---

## Project Contract (Shared YAML — All Skills Read/Write)

```yaml
project:
  name: ""
  platform: "mobile | web | cross-platform"
  market: "india-tier1 | india-tier2 | india-tier3 | global"
  stage: "discovery | define | design | validate | handoff"
users: []              # Personas from research
requirements: []       # Functional + non-functional
constraints: []        # Technical, legal, brand, budget
assumptions: []        # {id, statement, risk, validation_plan, status}
evidence: []           # Research findings, analytics, competitor data
flows: []              # User flows with edge cases
screens: []            # Screen inventory with states
components: []         # Component inventory with variants
decisions: []          # {id, decision, rationale, law_ref, status}
open_questions: []     # Blockers needing resolution
qa_results: []         # Audit + validation results
```

**Rule:** Every assumption/decision must have `status: confirmed | inferred | unknown` and `confidence: high | medium | low`.

---

## Operating Modes

### Quick (1 screen / focused critique)
- Run: 1 specialist + Final Gates
- Time: ~30 min

### Standard (Feature / Flow)
- Run: Strategy → Audit → Execution → Validation
- Time: ~2-4 hours

### Full (New Product / Major Redesign)
- Run: Complete Pipeline (all 7 phases)
- Time: ~1-2 weeks

---

## Authority Order (Updated for External Skills)

When conflict occurs, apply this priority order (highest wins):

1. **Tier 1 — Core Supreme Authority** ([ai-ux-system](file:///c:/Users/Dell/Downloads/guardia-ai/.agents/skills/ai-ux-system/))
   - `ux-laws` (37 laws + conflict hierarchy) — **OVERRIDES EVERYTHING**
   - `accessibility` (WCAG 2.2 AA/AAA) — **NON-NEGOTIABLE**
   - `design-tokens` (3-layer token system) — **SINGLE SOURCE OF TRUTH**
   - `indian-patterns` (UPI, bilingual spacing, Tier 2/3 devices) — **MARKET REALITY**
   - `platform-specific` (iOS/Android HIG / Web) — **PLATFORM RULES**
   - Core skills (00-15) — **EXECUTION LOGIC**

2. **Tier 2 — External Execution Libraries** ([external/](file:///c:/Users/Dell/Downloads/guardia-ai/.agents/skills/external/))
   - `uiux-pro-max` → Component specs, style database, QA checklist
   - `frontend-design` → React/Tailwind code patterns, code quality
   - `prototype` → Figma prototyping, motion specs, handoff
   - `web-design-guidelines` → Vercel's compliance rules

**RULE:** External skills provide **code implementation details, visual patterns, and design templates**. They NEVER decide laws, tokens, spacing rules, or accessibility criteria.

### Conflict Resolution Examples:
- External skill says: *"Use 4px border-radius"* → Core `design-tokens` says 8px → **Core Wins**.
- External skill says: *"Purple gradient CTA"* → Core `accessibility` contrast check fails → **Core Wins**.
- External skill says: *"No skeleton loading for async"* → Core `ux-laws` (Doherty) requires skeleton → **Core Wins**.

**Document every conflict resolution** in `project.decisions[]`.

---

## External Skill Detection & Loading

### When to Load External Skills
| Trigger keywords in user request | Load From External |
|----------------------------------|-------------------|
| "React component", "Tailwind class", "HTML/CSS code" | `frontend-design`, `uiux-pro-max` |
| "Figma prototype", "Smart Animate", "interaction spec" | `prototype`, `interaction-v2` |
| "Vercel compliance", "web guidelines audit" | `web-design-guidelines` |
| "Style database", "component QA checklist" | `uiux-pro-max` |

### Loading & Install Protocol
1. **Detect need** from user request + current pipeline stage.
2. **Check if installed:** Check folder existence at `.agents/skills/external/<skill-name>/`
3. **If not installed:** Invoke `find-skills` to dynamically search and install into `.agents/skills/external/<skill-name>/` via:
   ```bash
   npx skills add <repository-url> --skill <skill-name> --dest .agents/skills/external/
   ```
4. **Load skill + its references** (tagging context as `tier: external`).
5. **Apply Core Authority Filter** on all generated files/outputs.

### Core Authority Filter (Run on EVERY external output)
BEFORE outputting any code or design details suggested by an external skill, verify:
1. Does it violate **ux-laws**? (e.g. Hick's law nav items >5?) → REJECT & cite law.
2. Does it violate **accessibility**? (e.g. touch targets <44px or text contrast <4.5:1?) → REJECT & cite WCAG rule.
3. Does it violate **design-tokens**? (e.g. hardcoded hex codes or spacing values?) → REJECT & rewrite using core tokens.
4. Does it violate **indian-patterns**? (e.g. UPI flow deviations or bilingual text truncation?) → REJECT & correct.
5. Does it violate **platform-specific** conventions? (e.g. iOS notch overlay or Web margins?) → REJECT & correct.
6. **PASS** → Use as implementation detail only.

## Phase Execution Logic

### Phase 1: Research (01-ux-research-v2)
```
IF user asks: "research plan", "persona", "interview", "competitor", "journey map"
THEN: Run 01-ux-research-v2
OUTPUT: Populate project.users[], project.evidence[], project.assumptions[]
```

### Phase 2: Strategy (02-product-strategy-v2)
```
IF user asks: "define scope", "HMW", "MoSCoW", "sitemap", "user flow", "IA", "success metrics"
THEN: Run 02-product-strategy-v2
REQUIRES: project.users[], project.evidence[] (from Phase 1 or Assumption Mode)
OUTPUT: Populate project.requirements[], project.flows[], project.screens[], project.decisions[]
```

### Phase 3: Audit (03-ux-audit-v2)
```
IF user asks: "UX audit", "heuristic review", "accessibility", "dark pattern", "WCAG"
THEN: Run 03-ux-audit-v2
REQUIRES: project.screens[] or live product URL
OUTPUT: Populate project.qa_results[] with severity-ranked issues
```

### Phase 4: Design System (04-design-system-v2)
```
IF user asks: "design tokens", "component library", "Figma variables", "style guide"
THEN: Run 04-design-system-v2
REQUIRES: project.platform, project.market, aesthetic personality (from 05)
OUTPUT: design-tokens.md, component-specs.md, Figma variables setup guide
```

### Phase 5: Execution (05-ui-execution-v2)
```
IF user asks: "design screen", "wireframe", "Figma", "high-fidelity", "component"
THEN: Run 05-ui-execution-v2
REQUIRES: project.flows[], project.screens[], design system tokens (Phase 4)
OUTPUT: Figma frames, design specs, handoff package
```

### Phase 6: Interaction (06-interaction-v2)
```
IF user asks: "animate", "prototype", "motion", "gesture", "haptic", "transition"
THEN: Run 06-interaction-v2
REQUIRES: project.screens[] with states (from Phase 5)
OUTPUT: Motion specs, Figma prototype links, Lottie/Rive handoff
```

### Phase 7: Validation (07-ux-validation-v2)
```
IF user asks: "usability test", "test plan", "SUS", "iteration", "A/B test"
THEN: Run 07-ux-validation-v2
REQUIRES: project.flows[], project.screens[] (prototype or live)
OUTPUT: Test scripts, rainbow sheet, iteration brief, stakeholder report
```

---

## Assumption Mode (Default)

**Never ask for every input.** Proceed with Assumption Mode:
1. Infer missing context from available data
2. Label every inference: `status: inferred, confidence: medium`
3. Add to `project.assumptions[]` with validation plan
4. Flag in output: **"ASSUMED: [what] — validate before handoff"**

**Only ask when:**
- Missing info would make result unsafe, destructive, or fundamentally wrong
- Legal/regulatory/financial claims need verification
- Platform choice (iOS vs Android vs Web) changes everything

---

## Final Gates (Run Before Every Delivery)

| Gate | Check | Fail Action |
|------|-------|-------------|
| **Capability** | Can product actually do what UI promises? | Halt — verify with engineering |
| **Trust** | Legal, security, certification, privacy, financial claims verified? | Halt — get sign-off |
| **Consistency** | Names, prices, dates, statuses, actions match across all artifacts? | Fix before delivery |
| **Flow** | No dead ends; back, cancel, interruption, recovery work? | Fix before delivery |
| **Accessibility** | WCAG 2.2 AA (web) + platform native guidance? | Fix before delivery |
| **Visual Quality** | No card soup, mixed icon styles, random glow, copied brand identity? | Fix before delivery |
| **Evidence** | Observed findings separated from assumptions? | Label clearly |
| **Validation** | Core tasks have measurable pass criteria? | Define before delivery |

---

## Delivery Format (Every Response)

Return ONLY what helps the current decision:

1. **Outcome** — What was produced
2. **Key Decisions** — With law/evidence rationale
3. **Risks/Assumptions** — Explicitly flagged
4. **Next Artifact/Action** — Concrete next step

**Never dump internal checklists unless requested.**

---

## Integration with Legacy Depth

This orchestrator coordinates skills that now contain deep legacy content:

- **01-ux-research-v2** ← `ux-research-architect.md` (screener templates, interview guides, synthesis)
- **02-product-strategy-v2** ← `define-ideate.md` (persona templates, HMW, MoSCoW, flows, edge cases)
- **03-ux-audit-v2** ← `ux-thinking.md` (37 laws, 8-layer audit, conflict hierarchy)
- **04-design-system-v2** ← `design-system.md` (3-layer tokens, 5-tier components, Figma setup)
- **05-ui-execution-v2** ← `figma-design.md` (5Q protocol, aesthetic personalities, pipeline stages)
- **06-interaction-v2** ← `interaction-prototyping.md` (spring physics, micro-interactions, Figma directives)
- **07-ux-validation-v2** ← `ux-test.md` (test methods, scripts, rainbow sheets, iteration briefs)
- **08-ux-writing-v2** ← `define-ideate.md` Step 2E (content strategy, bilingual rules, copy formulas)
- **09-final-design-qa-v2** ← `ui-ux-pro-max.md` (pre-delivery checklist, visual/interaction/a11y/performance)
- **10-technical-feasibility-v2** ← `design-system.md` Phase 5 (token JSON/CSS, component anatomy for devs)
- **14-product-patterns-v2** ← `awesome-design.md`, `growth-design-and-activation.md` (brand pattern deep-dives, onboarding steps, value pricing pop, payment trusts, friction control)
- **15-ui-patterns-v2** ← `ui-ux-pro-max.md`, `data-density-and-tables.md`, `edge-and-error-states.md` (50+ styles, layout patterns, component specs, Grid heights, filter chips, keyboard shortcuts, CMD+K panels, Empty states, error flows, offline UI, data limits)

---

## Quick Reference: When to Use What

| User Says | Run Skill |
|-----------|-----------|
| "User research karo", "persona banao", "interview questions" | 01-ux-research-v2 |
| "Scope define karo", "HMW", "MoSCoW", "sitemap", "user flow" | 02-product-strategy-v2 |
| "UX audit", "heuristic review", "accessibility check", "dark pattern" | 03-ux-audit-v2 |
| "Design tokens", "component library", "Figma variables" | 04-design-system-v2 |
| "Screen design karo", "Figma wireframe", "high-fidelity", "Premium visual", "stylish UI", "top 1% UI", "beast UI", "modern design" | 05-ui-execution-v2 |
| "Animate", "prototype", "motion", "gesture", "haptic", "Generative UI", "streaming response", "AI chat", "prompt design" | 06-interaction-v2 |
| "Usability test", "test plan", "SUS", "iterate" | 07-ux-validation-v2 |
| "Copy likho", "error message", "empty state", "bilingual" | 08-ux-writing-v2 |
| "Final QA", "pre-delivery check", "visual quality" | 09-final-design-qa-v2 |
| "Dev handoff", "token JSON", "CSS variables", "component anatomy" | 10-technical-feasibility-v2 |
| "Stripe/Apple jaisa", "brand pattern", "design inspiration", "onboarding funnel", "pricing tiers", "conversion metrics", "checkout" | 14-product-patterns-v2 |
| "Button style", "layout pattern", "card variant", "dashboard", "empty state", "error state", "offline mode", "validation flow", "edge case", "data density", "table design", "B2B SaaS", "command menu", "advanced filter" | 15-ui-patterns-v2 |