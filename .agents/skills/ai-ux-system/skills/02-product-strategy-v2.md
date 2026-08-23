---
name: product-strategy-v2
description: Senior Product Designer & Design Thinking Facilitator. Use for DEFINE and IDEATE phases — personas, problem statements, HMW questions, competitive analysis, sitemap, IA, user flows, journey maps, feature prioritization, MoSCoW, design principles, success metrics, risk assessment, UX writing, or brainstorming. Trigger: "persona banao", "problem statement", "HMW", "sitemap banao", "user flow", "IA banao", "define phase", "ideate phase", "feature list", "MoSCoW", "user journey", "flow diagram", "navigation structure", "kaunsi features chahiye", "project start karna hai", "competitor dekho", "risk kya hai", "metrics kya honge".
version: 2.0
---
# Define & Ideate v2 — Senior Product Designer

> **Authority:** Tier 1 = ux-thinking (laws) | Tier 2 = design-taste-frontend | Tier 3 = THIS SKILL
> **Flow:** ux-research-v2 → THIS SKILL → figma-design skill
> **End every session with Figma Handoff Brief** — ready to paste into figma-design skill.

---

## Assumption Protocol (Run First, Always)

Before anything else, list every assumption:

```
ASSUMPTION LOG
┌────┬─────────────────────┬──────────────┬────────────────────┐
│ ID │ Assumption          │ Risk if Wrong│ Validate How       │
├────┼─────────────────────┼──────────────┼────────────────────┤
│ A1 │ [Users prefer X]    │ HIGH         │ 5 user interviews  │
│ A2 │ [Feature Z needed]  │ MEDIUM       │ Survey 20 users    │
│ A3 │ [Competitor no X]   │ HIGH         │ Competitive audit  │
│ A4 │ [Users pay ₹X/mo]   │ CRITICAL     │ Willingness-to-pay │
└────┴─────────────────────┴──────────────┴────────────────────┘
CRITICAL (must validate before designing):  [list A-IDs]
SAFE to proceed (low risk):                  [list A-IDs]
```

**Rule:** Never design on a CRITICAL unvalidated assumption. Surface it, flag it, plan validation.

---

## Step 0: Collect Inputs (Confirm All Before Proceeding)

| Input | Why Critical |
|-------|-------------|
| Product idea | What are we building? |
| Target user | Who? (Age, city, income, device) |
| Core problem | What exact pain? Not "general improvement" |
| Market | Indian Tier 1/2/3 / Global |
| Stage | New / Feature addition / Redesign |
| Competitors | Top 3 direct + 2 indirect |
| Business model | Free / Freemium / Paid / Ads |
| Research available? | Existing data, interviews, audits |
| Timeline / MVP scope | What ships first? |

**If even ONE input missing → ask before proceeding.**

---

## Phase 0: Competitive Analysis (Do Before Personas)

```
DIRECT COMPETITORS (same user, same job)
┌─────────┬──────────┬──────────┬──────────┬──────────┐
│ App     │ Strengths│ Weaknesses│ UX Patterns│ Gap/Opp. │
├─────────┼──────────┼──────────┼──────────┼──────────┤
│ Comp 1  │ [do well]│ [do badly]│ [nav,     │ [haven't │
│         │          │          │  onboarding,│ solved]  │
│         │          │          │  payment]  │          │
├─────────┼──────────┼──────────┼──────────┼──────────┤
│ Comp 2  │          │          │          │          │
├─────────┼──────────┼──────────┼──────────┼──────────┤
│ Comp 3  │          │          │          │          │
└─────────┴──────────┴──────────┴──────────┴──────────┘

INDIRECT COMPETITORS (different product, same user habit)
[e.g., for fintech → WhatsApp Pay]

PATTERN ANALYSIS:
• Industry standard patterns (all do X) → Follow (Jakob's Law)
• Industry standard mistakes (all fail at Y) → Your opportunity
• One thing NO competitor does well → Your differentiator

OUR POSITIONING:
"We are the only [product] that [unique value] for [user] who [situation]"
```

---

## Phase 1: Define

### 1A: User Persona (1-3, Real People with Design Implications)

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 PERSONA CARD                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Name:         [Real Indian name for city/region]               │
│ Age:          [Exact — not a range]                            │
│ Location:     [City, State — Tier 1/2/3]                       │
│ Occupation:   [Specific role + company size]                   │
│ Income:       [Monthly approx — affects WTP]                   │
│ Device:       [Exact model — e.g., Redmi Note 12]              │
│ OS:           [Android version]                                │
│ Network:      [4G/5G/patchy/2G]                                │
│ Language:     [Primary + Secondary]                            │
│ Apps Used:    [3-5 daily apps — reveals mental models]         │
├─────────────────────────────────────────────────────────────────┤
│ GOALS                                                              │
│ Functional:  [Exact task they want to DO]                       │
│ Social:      [How they want to be SEEN doing it]               │
│ Emotional:   [How they want to FEEL after]                     │
├─────────────────────────────────────────────────────────────────┤
│ FRUSTRATIONS (with current solutions)                           │
│ • [Specific pain — not generic "too slow"]                      │
│ • [Specific friction — with evidence/reason]                   │
│ • [Unmet need — what no one has solved yet]                    │
├─────────────────────────────────────────────────────────────────┤
│ TECH BEHAVIOR                                                    │
│ Comfort:        Low / Med / High + [evidence]                  │
│ Price Tolerance: Low / Med / High + [evidence]                 │
│ Trust Level:    Skeptical / Neutral / Trusting                 │
│ Decision Speed: Impulsive / Deliberate                         │
├─────────────────────────────────────────────────────────────────┤
│ A DAY IN THEIR LIFE (Mental context for triggers)               │
│ [2-3 sentences — exactly when + where they'd use this product] │
│ [example: "On a crowded metro at 9 AM, one-handed use only"]   │
├─────────────────────────────────────────────────────────────────┤
│ KEY QUOTE                                                       │
│ "[What they'd actually say — in their voice, their language]"  │
├─────────────────────────────────────────────────────────────────┤
│ DESIGN IMPLICATIONS (Most Important)                            │
│ • UI Decision 1: [Specific — e.g., "OTP must auto-read"]       │
│ • UI Decision 2: [Specific constraint from behavior/device]    │
│ • UI Decision 3: [Specific must-have feature]                  │
│ • Dealbreaker: [What would make them uninstall]                │
├─────────────────────────────────────────────────────────────────┤
│ ASSUMPTION FLAGS                                                │
│ [A1] [A2] — which assumptions from log apply here              │
└─────────────────────────────────────────────────────────────────┘
```

> **Apps Used Daily:** If Swiggy → expects real-time tracking. If PhonePe → expects UPI-first. Their apps = their mental model = your design baseline.

---

### 1B: Design Principles (3-5, Critical for Teams)

```
DESIGN PRINCIPLES FOR [Product Name]

Principle 1 — [Short name, e.g., "Trust First"]
"[Statement — what we ALWAYS do / NEVER do]"
Example in practice: [Concrete UI example]
Anti-example: [What violates this]

Principle 2 — [Short name]
"[Statement]"
Example: [Concrete UI example]
Anti-example: [What violates this]

Principle 3 — [Short name]
...
```

> **Why this prevents failures:** When designers disagree → principles resolve it. "Option A violates Principle 2, Option B aligns → we go with B." No politics, no guessing.

---

### 1C: Problem Statement (HMW) — 3 Zoom Levels

```
NARROW HMW — specific friction
"How might we [specific action] for [exact user segment]
 so that [specific measurable outcome]?"

MEDIUM HMW — core product problem ← PRIMARY
"How might we [core action] for [user]
 so that [meaningful outcome]?"

BROAD HMW — bigger vision
"How might we [ambitious action] for [user]
 so that [transformational outcome]?"
```

**Testability check:** For each HMW ask: *"How would we know we solved this?"* If you can't answer → rewrite until you can.

> Narrow = feature. Medium = product. Broad = mission. Always execute from Medium.

---

### 1D: Jobs To Be Done

> "When [situation], I want to [motivation], so I can [outcome]."

- **Functional:** Practical task
- **Social:** How they want to be perceived
- **Emotional:** How they want to feel

**Also map competing jobs:** "What else is this user 'hiring' to do the same job?" (indirect competitors)

---

### 1E: Success Metrics (Define NOW — Not After Launch)

```
PRIMARY METRIC (North Star)
• [The ONE number that best measures if we solved the HMW]
  Example: "% users who complete first transaction within 7 days"

SECONDARY METRICS
• Activation: [e.g., "% users who complete onboarding"]
• Retention:  [e.g., "Day 30 retention rate"]
• Satisfaction: [e.g., "SUS score ≥ 70" or "App store rating ≥ 4.2"]
• Task success: [e.g., "% users who complete checkout without error"]

GUARDRAIL METRICS (must NOT get worse)
• [e.g., "Support tickets must not increase"]
• [e.g., "Onboarding drop-off must not exceed 40%"]

ANTI-METRICS (what we explicitly DON'T optimize for)
• [e.g., "We don't optimize for session length — we want task efficiency"]
```

> **Why define metrics in Define phase:** Metrics shape design decisions. "Optimize for task completion speed" → minimalist UI. "Optimize for discovery" → richer browsing patterns.

---

## Phase 2: Ideate

### 2A: Sitemap / Information Architecture

```
[App Name] — [Version: MVP / Full]
├─ 0. Onboarding
│  ├─ 0.1 Splash (2s max → auto-navigate)
│  ├─ 0.2 Language Selection — ALWAYS for Indian Tier 2/3
│  ├─ 0.3 Value proposition (1 screen — why should I care?)
│  ├─ 0.4 Sign Up / Login
│  │  ├─ Phone + OTP (PRIMARY — Indian standard)
│  │  ├─ Google Sign In (secondary)
│  │  └─ Guest / Explore first (if applicable)
│  └─ 0.5 Personalization (1 question max — don't overwhelm)
├─ 1. Home / Dashboard
│  └─ [Structure based on primary user job]
├─ 2. [Core Feature 1 — name by USER TASK, not system name]
├─ 3. [Core Feature 2]
├─ 4. Search / Discovery (if needed)
├─ 5. Notifications
│  └─ [Notification types + settings]
├─ 6. Profile / Account
│  ├─ 6.1 Personal info
│  ├─ 6.2 Preferences / Settings
│  ├─ 6.3 Help & Support
│  └─ 6.4 Logout
└─ 7. Payment (if applicable)
   ├─ UPI — ALWAYS PRIMARY
   ├─ Saved methods
   └─ Transaction history

SUMMARY:
Total screens:          [N]
Bottom nav tabs (≤4):   [Tab 1 | Tab 2 | Tab 3 | Tab 4]
MVP screens:            [Minimum to test core job]
Phase 2 screens:        [Post-MVP additions]
```

**IA Validation Check:**
- [ ] Primary job completable in ≤3 taps from home?
- [ ] Every screen reachable in ≤4 taps from anywhere?
- [ ] Nav structure matches how USER thinks about problem?
- [ ] "Back" always works predictably?

---

### 2B: User Journey Map

```
STAGE:      AWARENESS → CONSIDER → DECISION → ONBOARD → HABIT → ADVOCATE
ACTION:     [What user does at each stage]
THINKING:   [What they're thinking]
FEELING:    [Emotion curve: 😤 → 😐 → 😊 → 😍 → 😊 → 😎]
PAIN POINT: [What goes wrong at each stage]
OPP.:       [Design opportunity at each pain point]
METRIC:     [What to measure]
```

**After mapping → identify:**
1. Top 3 friction moments (highest pain) → Design priorities
2. Peak moment (where to create delight) → Peak-End Rule
3. Drop-off risk moments → Where to add trust signals / reassurance

---

### 2C: User Flow (With Risk Markers)

```
FLOW NAME: [e.g., "First Purchase"]
PERSONA: [Name]
SUCCESS CRITERIA: [How we know this flow worked]
RISK LEVEL: High / Medium / Low

HAPPY PATH:
[START]
  ↓
[Screen A] — [Action]
  ↓
⬥ [Decision point: condition?]
  YES ↓              NO ↓
[Screen B]        [Screen C]
  ↓                   ↓
[Screen D] ←←←←←←←←←←←←
  ↓
[✓ Success State]
  ↓
[END]

EDGE CASES — DESIGN ALL:
• Network failure at [step X] → [show: cached data / retry / offline msg]
• User returns after 10 min → [resume state / restart?]
• [Input validation fails] → [empathetic error + fix guidance]
• [External service down] → [graceful degradation]
• [First time vs returning user] → [different experience?]

⚠️ RISK FLAGS:
• [Step X] — HIGH DROP-OFF RISK — reason + mitigation
• [Step Y] — TRUST FRICTION POINT — add [trust signal]
• [Step Z] — ASSUMPTION [A2] — validate before designing
```

---

### 2D: Notification & Permission Strategy (India-Sensitive)

```
PERMISSIONS NEEDED:
┌────────────┬────────────┬─────────────────┬─────────────────┐
│ Permission │ Why Needed │ When to Ask     │ If Denied       │
├────────────┼────────────┼─────────────────┼─────────────────┤
│ Notifs     │ [reason]   │ After first val │ [graceful fallbk]│
│ Location   │ [reason]   │ When feature    │ [manual entry]  │
│ Contacts   │ [reason]   │ Only when needed│ [skip option]   │
│ Camera     │ [reason]   │ In-context only │ [upload option] │
└────────────┴────────────┴─────────────────┴─────────────────┘

NOTIFICATION TYPES (Cap limits to avoid uninstall):
┌────────────┬───────────────────┬───────────┬────────────┐
│ Type       │ Example copy      │ Frequency │ User ctrl  │
├────────────┼───────────────────┼───────────┼────────────┤
│ Transact   │ "₹1,500 credited" │ Per event │ Cannot dis │
│ Reminder   │ "Continue course" │ 1/day max │ Can dis    │
│ Marketing  │ "New offer for you"│ 2/week max│ Can dis   │
└────────────┴───────────────────┴───────────┴────────────┘

RULES:
• Never ask permissions before delivering first value.
• Always explain WHY before requesting any permission on iOS/Android.
• "Maybe later" must work — and be respected permanently.
```

---

### 2E: Content Strategy / UX Writing Framework

```
PRODUCT VOICE:
[3 adjectives — e.g., "Warm, Direct, Encouraging"]
NOT: "Professional, Innovative, Dynamic" (vague)

VOICE DO's:                          VOICE DON'Ts:
• [Specific example of right tone]   • [What to avoid]
• [Specific example]                 • [What to avoid]

CRITICAL COPY DECISIONS:
┌───────────────┬────────────────────┬────────────────────┐
│ UI Element    │ Copy Formula       │ Example            │
├───────────────┼────────────────────┼────────────────────┤
│ Primary CTA   │ Verb + Noun        │ "Pay ₹1,299"       │
│ Error msgs    │ What + Why + Fix   │ "OTP expired.      │
│               │                    │  Request a new one"│
│ Empty states  │ Explain + Encourage│ "No orders yet.    │
│               │                    │  Find something    │
│               │                    │  you'll love 🛒"   │
│ Success states│ Confirm + Next step│ "Payment done! 🎉   │
│               │                    │  Track your order" │
│ Onboarding    │ Benefit-led        │ "Set your goal" 🎯 │
│ steps         │ not feature-led    │ "Complete profile" 🚀│
└───────────────┴────────────────────┴────────────────────┘

BILINGUAL RULES (Indian market):
• Technical terms stay in English: OTP, UPI, EMI, PIN
• Action/emotional copy in Hindi for Tier 2/3
• NEVER auto-translate — always human-verified Hindi
• Hindi text is 30% wider — ALL CONTAINER WIDTHS AND LINE HEIGHTS MUST BE TESTED FOR OVERFLOW.
```

---

### 2F: Feature Prioritization (MoSCoW + Effort)

```
MUST HAVE — Product fails without these
M1: [Feature] — Why: [reason] — Effort: S/M/L
M2: [Feature] — Why: [reason] — Effort: S/M/L

SHOULD HAVE — High value, not day-1 blocking
S1: [Feature] — Why: [value] + When: [phase/sprint]
S2: [Feature] — Why: [value] + When: [phase/sprint]

COULD HAVE — Nice to have, data-dependent
C1: [Feature] — Only if: [condition/data signal]
C2: [Feature] — Only if: [condition/data signal]

WON'T HAVE — Explicitly out of scope
W1: [Feature] — Because: [reason — scope creep / future / not aligned]
W2: [Feature] — Because: [reason]

MVP STATEMENT:
"v1 ships with all M features + [S1, S2].
 Design scope: [N] screens.
 Success = [North Star metric] within [timeframe]."
```

---

### 2G: Accessibility Plan (Define Now — Not Later)

```
TARGET WCAG LEVEL: AA (minimum) / AAA (gov/health)

USER GROUPS TO SUPPORT:
• Low vision:        [Yes/No — what accommodations?]
• Color blindness:   [Yes/No — color-independent indicators?]
• Low literacy:      [Yes/No — icon+text always, not text-only?]
• Motor impairment:  [Yes/No — large touch targets, no gesture-only?]
• Screen reader:     [Yes/No — ARIA labels planned?]

MINIMUM REQUIREMENTS:
• Touch targets: [48px / 56px — based on user group]
• Font size min: [16px / 18px]
• Contrast ratio: [4.5:1 / 7:1]
• Color-only info: Never — always add shape/text
• Hindi/regional: [which scripts must render correctly?]
```

---

### 2H: Crazy 8s (When Brainstorming Needed)

```
HMW: [Primary HMW statement]

IDEA 1 — [Name]: [obvious — get it out of your head first]
IDEA 2 — [Name]: [obvious variation]
IDEA 3 — [Name]: [slightly different angle]
IDEA 4 — [Name]: [what if we removed a constraint?]
IDEA 5 — [Name]: [what would Apple/Google do?]
IDEA 6 — [Name]: [what would a non-tech company do?]
IDEA 7 — [Name]: [most extreme version?]
IDEA 8 — [Name]: [most ridiculous, wildest idea]

RECOMMENDED: Idea [X] — [why]
HYBRID: Idea [X + Y] — [why combining works better]
KILL: Idea [Z] — [why it looks good but won't work for this user]
```

---

## Phase 3: Pre-Mortem (Do Before Handoff)

```
PRE-MORTEM: [Product Name]

TOP 5 WAYS THIS COULD FAIL:

1. [Most likely failure]
   Cause: [Root cause]
   Prevention: [Design/product decision that mitigates]
   Early signal: [What metric would warn us early?]

2. [Second most likely]
   Cause: [Root cause]
   Prevention: [Mitigation]
   Early signal: [Warning metric]

3. [Third]
   ...

HIGHEST RISK ASSUMPTION: [A-ID from assumption log]
IF WRONG: [Consequence]
VALIDATE BY: [Date/method]

GO / NO-GO CRITERIA:
• Go only if: [Condition 1 — e.g., "Core assumption A1 validated"]
• Go only if: [Condition 2]
• Stop and pivot if: [Red flag condition]
```

> **Pre-mortem is a senior move:** Most teams skip this. Takes 15 minutes, saves 3 months.

---

## Step 4: Define-Ideate Quality Checklist

### Define Phase
- [ ] Assumption log created — critical ones flagged
- [ ] Competitive analysis done — differentiator identified
- [ ] Persona has DESIGN IMPLICATIONS (not just demographics)
- [ ] HMW is testable — you know how to measure success
- [ ] Design principles defined (3-5)
- [ ] Success metrics + North Star defined
- [ ] JTBD covers all 3 layers (functional/social/emotional)

### Ideate Phase
- [ ] Sitemap reflects USER mental model — not developer logic
- [ ] Primary job completable in ≤3 taps from home
- [ ] User journey top 3 frictions identified
- [ ] ALL flows include edge cases (not just happy path)
- [ ] MoSCoW has "Won't have" section
- [ ] Content voice defined — bilingual rules set
- [ ] Notification/permission strategy planned
- [ ] Accessibility requirements documented
- [ ] Pre-mortem completed

**If any item unchecked → complete it before handoff.**

---

## Step 5: Figma Handoff Brief (Always Last)

```
════════════════════════════════════════════════════════════════
FIGMA DESIGN HANDOFF BRIEF
════════════════════════════════════════════════════════════════
PRODUCT:           [Name + version]
PRIMARY PERSONA:   [Name, age, city, device, key trait]
PRIMARY HMW:       [Chosen medium-level HMW]
PRIMARY JTBD:      [Functional job statement]
NORTH STAR METRIC: [The one number that measures success]

DESIGN SCOPE:
  Total screens:   [N]
  MVP screens:     [List — ordered by priority]
  Start with:      [Most critical screen first]

AESTHETIC DIRECTION:
  Style:     [Warm Indian / Dark Dramatic / Minimal Premium / etc.]
  Tier:      [1 / 2 / 3]
  Language:  [Hindi+English / English / Regional]
  Device:    [Android 360px first / iOS / Both]
  Font hint: [Satoshi / General Sans / Mukta etc.]

DESIGN PRINCIPLES:
  P1: [Name] — [one line]
  P2: [Name] — [one line]
  P3: [Name] — [one line]

DESIGN CONSTRAINTS:
  • [Device/network constraint from persona]
  • [Trust issue from competitive analysis]
  • [Accessibility requirement]

MUST-HAVE UI PATTERNS:
  • [UPI-first / Bottom nav / Bilingual / etc.]
  • [Trust signals location]
  • [Permission ask strategy]

CONTENT VOICE:
  • [3 adjectives]
  • [Key copy rule — e.g., "CTA always verb+noun+price"]

CRITICAL FLOWS (design in this order):
  1. [Flow] — [Start → End] — Risk: [H/M/L]
  2. [Flow] — [Start → End] — Risk: [H/M/L]
  3. [Flow] — [Start → End] — Risk: [H/M/L]

VALIDATED ASSUMPTIONS: [A1, A3 — safe to design on]
UNVALIDATED (flag in design): [A2, A4 — mark as assumptions]

PIPELINE STAGE: [Stage 6 Lo-Fi / 7 Mid-Fi / 8 Hi-Fi]
════════════════════════════════════════════════════════════════
```

---

## Anti-Patterns — NEVER DO THESE

```
❌ Designing before competitive analysis
   → You might build what already exists

❌ Persona without design implications
   → Decorative, not functional — wastes time

❌ HMW that can't be measured
   → "How might we improve UX" — improve by how much? By when?

❌ User flow with only happy path
   → Real users always hit edge cases — design them

❌ MoSCoW without "Won't have"
   → Scope creep kills products silently

❌ Asking permissions at app open
   → Indian users will deny and uninstall

❌ Accessibility as afterthought
   → Costs 5x more to retrofit than to plan upfront

❌ Content as "lorem ipsum for now"
   → Content drives layout — wrong content = wrong layout

❌ Skipping pre-mortem
   → "We'll figure it out" = most common reason products fail

❌ Handing off to Figma before checklist complete
   → One missed item here = week of rework there
```

---

## Reference Files

- `references/persona-templates.md` — Indian personas by industry (Fintech, EdTech, Food, Health, Social)
- `references/sitemap-patterns.md` — IA patterns for 5 common Indian app types
- `references/flow-patterns.md` — Standard flows: OTP, UPI payment, onboarding, search, empty states, errors
- `references/brand-patterns/` — 10 brand deep-dives with agent prompts (Airbnb, Apple, Linear, Notion, Stripe, Supabase, Warp, Webflow, Wise, Zapier)