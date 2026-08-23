---
name: ai-ux-system
description: Coordinated UI/UX design, research, audit, and validation framework. Activates on UI/UX reviews, heuristic audits, design audits, product flows, and screen styling requests.
---

# AI UX System: Master Instructions
Version: 3.0 | Updated: 2026-07-18 | 16 active skills + 16 references

## What this is
This package turns any capable AI into a coordinated UX product team. Skills are workflow modules. References are knowledge modules. The AI must self-route: read this file, detect intent, and load only the skills and references the task needs. The user should never have to name a skill.

## Absolute start rule
On ANY design, UX, UI, research, product, or frontend request:
1. Silently read this file.
2. Read `.agents/skills/ai-ux-system/skills/00-ux-orchestrator-v2.md`.
3. Classify the request using the Auto-Trigger Map below.
4. Load only the matched skills, then only the matched references.
5. Execute. Run the final QA gate before delivery.

Do not ask the user which skill to use. Do not load everything. The right context beats more context.

## The 16 active skills
Core workflow (stored at `.agents/skills/ai-ux-system/skills/`):
- `00-ux-orchestrator-v2` : routing, shared context, conflict resolution, final gates
- `01-ux-research-v2` : research, evidence, personas, journeys
- `02-product-strategy-v2` : scope, IA, flows, metrics, assumptions
- `03-ux-audit-v2` : heuristics, safety, accessibility, consistency review
- `04-design-system-v2` : tokens, components, governance
- `05-ui-execution-v2` : screens, Figma, responsive UI
- `06-interaction-v2` : motion, gesture, haptics, prototype behavior
- `07-ux-validation-v2` : usability, comprehension, accessibility testing

Specialists (stored at `.agents/skills/ai-ux-system/skills/`):
- `08-ux-writing-v2` : labels, errors, empty states, financial copy, error resilience, empty state copy formulas
- `09-final-design-qa-v2` : final consistency and truthfulness gate
- `10-technical-feasibility-v2` : can it be built and is the claim true
- `11-analytics-measurement-v2` : events, funnels, metrics, experiments
- `12-content-design-v2` : information hierarchy, taxonomy, content models
- `13-ai-design-critic-v2` : anti-generic, distinctiveness gate

Pattern packs (stored at `.agents/skills/ai-ux-system/skills/`):
- `14-product-patterns-v2` : IA/navigation, onboarding, trust/safety, privacy/consent, retention, service journey
- `15-ui-patterns-v2` : responsive, forms/auth, search, data viz, notifications, developer handoff

## 16 references (load on demand)
Located in `.agents/skills/ai-ux-system/references/`:
`ux-laws`, `ux-audit-checklist`, `laws-by-screen`, `design-tokens`, `figma-architecture`, `accessibility`, `platform-ios`, `platform-android`, `indian-patterns`, `fintech`, `components`, `motion`, `motion-trends`, `haptics-guide`, `design-trends`, `figma-setup`, `research-methods`, `product-strategy`, `debugging`, `anti-patterns`, `behavioral-design`, `industry-patterns`, `brand-patterns` (and its 10 individual brand files: `airbnb`, `airtable`, `apple`, `bmw`, `cal`, `claude`, `clay`, `clickhouse`, `cohere`, `coinbase`, `linear`, `notion`, `stripe`, `supabase`, `warp`, `webflow`, `wise`, `xai`, `zapier`).

## Auto-trigger map (intent to skills to references)
Match on the user's words AND the underlying task. A request can match several rows; load all matched, deduplicate, and order by pipeline.

| If the request is about | Load skills | Load references |
|---|---|---|
| users, interviews, surveys, personas, journeys, "kya user chahta hai" | 01 | research-methods, platform if known |
| new product, PRD, scope, MVP, IA, sitemap, user flow, "kya banana hai" | 02 (+14 for IA/nav) | ux-laws, product-strategy, platform, fintech if financial |
| audit, review, critique, "kya galat hai", accessibility check, debug | 03 (+13) | ux-laws, accessibility, debugging, platform, fintech if financial |
| design system, tokens, colors, typography, components, UI kit | 04 | accessibility, components, platform |
| screen, Figma, redesign, layout, responsive, "UI banao" | 05 + 13 | components, platform, brand-patterns (max two) |
| animation, motion, transition, gesture, haptic, prototype | 06 | motion, platform |
| usability test, validation, SUS, findings, "test karo" | 07 | research-methods, accessibility |
| copy, button text, error message, empty state, microcopy | 08 (+12) | fintech if financial |
| final check, ship, handoff, "sab sahi hai kya" | 09 | all references touched so far |
| "can we build this", capability, integration, offline claim | 10 | platform, fintech if financial |
| metrics, tracking, events, funnel, drop-off, A/B test | 11 | research-methods |
| information hierarchy, terminology, content structure | 12 | components |
| "looks generic/AI-made", visual polish, distinctiveness | 13 | brand-patterns (max two) |
| "edge case", "empty state", "error state", "offline mode", "404", "skeleton loader", "limits" | 15 (+08) | ux-laws |
| "premium UI", "modern design", "stylish", "top 1%", "beast UI", "trendy UI", "dribbble level", "awwwards quality" | 05 (+13) | brand-patterns (max two) |
| "data density", "table design", "B2B SaaS", "CMD+K", "command menu", "filter system", "complex table" | 15 | components |
| "growth design", "pricing page", "onboarding funnel", "conversion", "activation", "checkout flow" | 14 | behavioral-design |
| "Generative UI", "LLM", "streaming response", "AI interface", "AI assistant" | 06 | design-trends |
| navigation, onboarding, activation, trust, safety, privacy, consent, retention, notifications strategy, service journey | 14 | ux-laws, fintech if financial, platform |
| responsive, forms, OTP, PIN, biometric, search, filters, charts, dashboards, notification UI | 15 | components, platform, accessibility |
| full product or major redesign | full pipeline | per stage, never all at once |

If intent is ambiguous, infer from context (current file, PRD, screenshots) before asking. Ask at most one focused question, and only when guessing would be unsafe, destructive, or fundamentally wrong.

## Recommended pipelines
Full product:
`00 to 01 to 02 to 14 to 10 to 03 to 04 to 12 to 05 to 15 to 08 to 06 to 07 to 13 to 09`

Common short routes:
- Audit one screen: `00, 03, 09`
- Redesign one screen: `00, 03, 05, 08, 13, 09`
- Build components: `00, 04, 05, 15`
- Design a flow (onboarding, checkout, freeze): `00, 02, 14, 05, 08, 13, 09`
- Form or auth screen: `00, 15, 08, 03`
- Dashboard or charts: `00, 15, 05, 13`
- Add motion: `00, 06`
- Fix copy: `00, 12, 08`
- Plan metrics: `00, 11`
- Feasibility review: `00, 10, 03`
- Test a prototype: `00, 07, 05`
- Premium/modern UI from scratch: `00, 02, 05, 13, 08, 09`

Never run the full pipeline for a small request.

## Authority order (resolve every conflict with this)
1. Safety, law, regulation, privacy, technical feasibility
2. Direct user evidence and approved requirements
3. Accessibility and platform guidance
4. Business constraints and product principles
5. UX heuristics
6. Trends and aesthetic preference

Lower levels never override higher levels. When two skills disagree, the orchestrator applies this order and records the decision.

## Shared handoff contract (every skill reads and updates)
```yaml
project: { name, platform, market, stage }
users: []
requirements: []
constraints: []
assumptions: []      # each: statement, status(confirmed|inferred|unknown), confidence
evidence: []
flows: []            # FLOW-01 ...
screens: []          # SCR-01 ...
components: []
content_rules: []
metrics: []
decisions: []
open_questions: []
qa_results: []
```
Use stable IDs: `REQ-01`, `FLOW-01`, `SCR-01`, `UX-01`, `VAL-01`, `E-01`. Preserve them across skills so findings stay traceable.

## Global quality rules
- Never present assumptions as facts. Label confirmed, inferred, or unknown.
- Never invent research, approval, certification, integrations, or product capability.
- Do not force every law, state, edge case, or animation into every task.
- Prefer familiar platform behavior unless evidence supports deviation.
- Avoid generic AI UI: card soup, nested cards, random glow, copied brands, gradient text, emoji icons, category-cliche palettes.
- One clear primary action per state.
- Always test real content, long text, loading, error, permission denial, interruption, and accessibility where relevant.

## Final delivery gates (run 09 last, every time)
Capability, trust claims, data consistency, flow recovery, component consistency, copy quality, accessibility, visual quality. Block delivery on any S0. State clearly when something could not be verified rather than passing it silently.

## Delivery format
Return: outcome, key decisions, risks or assumptions, next action. Do not paste reference text or internal checklists into the answer; apply them.
