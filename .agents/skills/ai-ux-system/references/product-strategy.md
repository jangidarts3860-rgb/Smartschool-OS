# Product Strategy — Frameworks & Templates

> Strategic foundations for Define & Ideate phases. Used by ux-research-architect, define-ideate, ux-workflow-automator.
> Version: 3.0 | Updated: 2026-07-12

---

## Competitive Audit Framework

### Direct Competitors (Same User, Same Job)
| App | Strengths | Weaknesses | UX Patterns | Gap/Opportunity |
|-----|-----------|------------|-------------|-----------------|
| Comp 1 | [what they do well] | [what they do badly] | [nav, onboarding, payment] | [what they haven't solved] |
| Comp 2 | | | | |
| Comp 3 | | | | |

### Indirect Competitors (Different Product, Same User Habit)
- e.g., For fintech app → WhatsApp Pay, Google Pay habits
- Map user mental models from these

### Pattern Analysis
```
INDUSTRY STANDARDS (All do X) → Follow (Jakob's Law)
INDUSTRY MISTAKES (All fail at Y) → Your Opportunity
ONE THING NO ONE DOES WELL → Your Differentiator
```

### Positioning Statement
> "We are the only [product] that [unique value] for [user] who [situation]"

---

## Persona Template (Indian Market Optimized)

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 PERSONA CARD                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Name:         [Real Indian name for city/region]                │
│ Age:          [Exact — not a range]                             │
│ Location:     [City, State — Tier 1/2/3]                        │
│ Occupation:   [Specific role + company size]                    │
│ Income:       [Monthly approximate — affects WTP]               │
│ Device:       [Exact model — e.g., Redmi Note 12, 4GB RAM]      │
│ OS:           [Android version]                                 │
│ Network:      [4G/5G/patchy/2G]                                 │
│ Language:     [Primary + Secondary]                             │
│ Apps Used:    [3-5 daily apps — reveals mental models]          │
├─────────────────────────────────────────────────────────────────┤
│ GOALS                                                          │
│ Functional:  [Exact task they want to DO]                       │
│ Social:      [How they want to be SEEN doing it]                │
│ Emotional:   [How they want to FEEL after]                      │
├─────────────────────────────────────────────────────────────────┤
│ FRUSTRATIONS (with current solutions)                           │
│ • [Specific pain — not generic "too slow"]                      │
│ • [Specific friction — with evidence/reason]                    │
│ • [Unmet need — what no one has solved yet]                     │
├─────────────────────────────────────────────────────────────────┤
│ TECH BEHAVIOR                                                   │
│ Comfort:        Low / Med / High + [evidence]                   │
│ Price Tolerance: Low / Med / High + [evidence]                  │
│ Trust Level:    Skeptical / Neutral / Trusting                  │
│ Decision Speed: Impulsive / Deliberate                          │
├─────────────────────────────────────────────────────────────────┤
│ A DAY IN THEIR LIFE                                             │
│ [2-3 sentences — exactly when + where they'd use this product] │
├─────────────────────────────────────────────────────────────────┤
│ KEY QUOTE                                                       │
│ "[What they'd actually say — in their voice, their language]"  │
├─────────────────────────────────────────────────────────────────┤
│ DESIGN IMPLICATIONS (Most Important)                            │
│ • UI Decision 1: [Specific — e.g., "OTP must auto-read"]       │
│ • UI Decision 2: [Specific constraint from behavior/device]     │
│ • UI Decision 3: [Specific must-have feature]                   │
│ • Dealbreaker: [What would make them uninstall]                 │
├─────────────────────────────────────────────────────────────────┤
│ ASSUMPTION FLAGS                                                │
│ [A1] [A2] — which assumptions from log apply here              │
└─────────────────────────────────────────────────────────────────┘
```

> **Apps Used Daily Field:** If persona uses Swiggy → expects real-time tracking. If PhonePe → expects UPI-first. Their apps = their mental model = your design baseline.

---

## Design Principles (Define Before HMW)

```
DESIGN PRINCIPLES FOR [Product Name]

Principle 1 — [Short Name, e.g., "Trust First"]
"[Statement — what we ALWAYS do / NEVER do]"
Example in practice: [Concrete UI example]
Anti-example: [What violates this]

Principle 2 — [Short Name]
"[Statement]"
Example: [Concrete UI example]
Anti-example: [What violates this]

Principle 3 — [Short Name]
...
```

> **Why this prevents failures:** When designers disagree → principles resolve it. "Option A violates Principle 2, Option B aligns → we go with B." No politics, no guessing.

---

## HMW (How Might We) — 3 Zoom Levels

```
NARROW HMW — Specific Friction
"How might we [specific action] for [exact user segment]
 so that [specific measurable outcome]?"

MEDIUM HMW — Core Product Problem ← PRIMARY
"How might we [core action] for [user]
 so that [meaningful outcome]?"

BROAD HMW — Bigger Vision
"How might we [ambitious action] for [user]
 so that [transformational outcome]?"
```

**Testability Check:** For each HMW ask: *"How would we know we solved this?"*
If you can't answer → rewrite until measurable.

> Narrow = Feature. Medium = Product. Broad = Mission. Always execute from Medium.

---

## Jobs To Be Done (JTBD)

```
"When [situation], I want to [motivation], so I can [outcome]."

Functional: [Practical task]
Social:     [How they want to be perceived]
Emotional:  [How they want to feel]
```

### Competing Jobs Map
> "What else is this user 'hiring' to do the same job?"
> Indirect competitors = competing jobs

---

## Success Metrics (Define NOW — Not After Launch)

```
PRIMARY METRIC (North Star)
• [The ONE number that best measures if we solved the HMW]
  Example: "% users who complete first transaction within 7 days"

SECONDARY METRICS
• Activation: [e.g., "% users who complete onboarding"]
• Retention:  [e.g., "Day 30 retention rate"]
• Satisfaction: [e.g., "SUS score ≥ 70" or "App store rating ≥ 4.2"]
• Task Success: [e.g., "% users who complete checkout without error"]

GUARDRAIL METRICS (Must NOT Get Worse)
• [e.g., "Support tickets must not increase"]
• [e.g., "Onboarding drop-off must not exceed 40%"]

ANTI-METRICS (What We Explicitly DON'T Optimize)
• [e.g., "We don't optimize for session length — we want task efficiency"]
```

> **Why define in Define phase:** Metrics shape design decisions. "Optimize for task completion" → minimalist UI. "Optimize for discovery" → richer browsing.

---

## Sitemap / Information Architecture

```
[App Name] — [Version: MVP / Full]
├─ 0. Onboarding
│  ├─ 0.1 Splash (2s max → auto-navigate)
│  ├─ 0.2 Language Selection — ALWAYS for Tier 2/3
│  ├─ 0.3 Value Prop (1 screen — why should I care?)
│  ├─ 0.4 Sign Up / Login
│  │  ├─ Phone + OTP (PRIMARY — Indian standard)
│  │  ├─ Google Sign In (secondary)
│  │  └─ Guest / Explore First (if applicable)
│  └─ 0.5 Personalization (1 question max — don't overwhelm)
├─ 1. Home / Dashboard
│  └─ [Structure based on PRIMARY USER JOB]
├─ 2. [Core Feature 1 — name by USER TASK, not system name]
├─ 3. [Core Feature 2]
├─ 4. Search / Discovery (if needed)
├─ 5. Notifications
│  └─ [Notification types + settings]
├─ 6. Profile / Account
│  ├─ 6.1 Personal Info
│  ├─ 6.2 Preferences / Settings
│  ├─ 6.3 Help & Support
│  └─ 6.4 Logout
└─ 7. Payment (if applicable)
   ├─ UPI — ALWAYS PRIMARY
   ├─ Saved Methods
   └─ Transaction History

SUMMARY:
Total Screens:          [N]
Bottom Nav Tabs (≤4):   [Tab 1 | Tab 2 | Tab 3 | Tab 4]
MVP Screens:            [Minimum to test core job]
Phase 2 Screens:        [Post-MVP additions]
```

### IA Validation Checklist
- [ ] Primary job completable in ≤3 taps from Home?
- [ ] Every screen reachable in ≤4 taps from anywhere?
- [ ] Nav structure matches USER mental model (not developer logic)?
- [ ] "Back" always works predictably?

---

## User Journey Map

```
STAGE:      AWARENESS → CONSIDER → DECISION → ONBOARD → HABIT → ADVOCATE
ACTION:     [What user does]
THINKING:   [What they're thinking]
FEELING:    [😤 Frustrated → 😐 Neutral → 😊 Delighted]
PAIN POINT: [What goes wrong]
OPPORTUNITY:[Design opportunity]
METRIC:     [What to measure]
```

### After Mapping → Identify
1. **Top 3 Friction Moments** (highest pain) → Design priorities
2. **Peak Moment** (where to create delight) → Peak-End Rule
3. **Drop-off Risk Moments** → Where to add trust signals / reassurance

---

## User Flow (With Risk Markers)

```
FLOW NAME: [e.g., "First Purchase"]
PERSONA:   [Name]
SUCCESS:   [How we know this flow worked]
RISK:      High / Medium / Low

HAPPY PATH:
[START]
  ↓
[Screen A] → [Action]
  ↓
⬥ [Decision: condition?]
  YES ↓        NO ↓
[Screen B]  [Screen C]
  ↓              ↓
[Screen D] ←────── (rejoin)
  ↓
[✓ Success State]
  ↓
[END]

EDGE CASES — DESIGN ALL:
• Network failure at [Step X] → [Show: cached data / retry / offline msg]
• User returns after 10 min → [Resume state / Restart?]
• Input validation fails → [Empathetic error + fix guidance]
• External service down → [Graceful degradation]
• First time vs Returning user → [Different experience?]

⚠️ RISK FLAGS:
• [Step X] — HIGH DROP-OFF RISK — reason + mitigation
• [Step Y] — TRUST FRICTION POINT — add [trust signal]
• [Step Z] — ASSUMPTION [A2] — validate before designing
```

---

## Notification & Permission Strategy (India-Sensitive)

### Permissions Matrix
| Permission | Why Needed | When to Ask | If Denied |
|------------|------------|-------------|-----------|
| Notifications | [reason] | After first value | Graceful fallback |
| Location | [reason] | When feature used | Manual entry |
| Contacts | [reason] | Only when needed | Skip option |
| Camera | [reason] | In-context only | Upload option |

### Notification Types
| Type | Example Copy | Frequency | User Control |
|------|--------------|-----------|--------------|
| Transactional | "₹1,500 credited" | Per event | Cannot disable |
| Reminder | "Continue your course" | 1/day max | Can disable |
| Marketing | "New offer for you" | 2/week max | Can disable |

### Rules
- [ ] Never ask permissions at app open
- [ ] Always explain WHY before requesting
- [ ] "Maybe later" must work — and be respected permanently

---

## Content Strategy / UX Writing Framework

### Product Voice
```
[3 adjectives — e.g., "Warm, Direct, Encouraging"]
NOT: "Professional, Innovative, Dynamic" (vague)
```

### Voice DO's / DON'Ts
| DO's | DON'Ts |
|------|--------|
| [Specific example of right tone] | [What to avoid] |
| [Specific example] | [What to avoid] |

### Critical Copy Decisions
| UI Element | Copy Formula | Example |
|------------|--------------|---------|
| Primary CTA | Verb + Noun | "Pay ₹1,299" |
| Error | What + Why + Fix | "OTP expired. Request a new one" |
| Empty State | Explain + Encourage | "No orders yet. Find something you'll love 🛒" |
| Success | Confirm + Next Step | "Payment done! 🎉 Track your order" |
| Onboarding Step | Benefit-led | "Set your goal" → "Complete profile" |

### Bilingual Rules (India)
- Technical terms STAY English: OTP, UPI, EMI, PIN
- Action/emotional copy in Hindi for Tier 2/3
- NEVER auto-translate — always human-verified Hindi
- Hindi text 30% wider → all containers tested

---

## Feature Prioritization (MoSCoW + Effort)

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

## Accessibility Plan (Define Now — Not Later)

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
• Hindi/regional: [Which scripts must render correctly?]
```

---

## Pre-Mortem (Do Before Handoff)

```
PRE-MORTEM: [Product Name]

TOP 5 WAYS THIS COULD FAIL:

1. [Most likely failure]
   Cause: [Root cause]
   Prevention: [Design/product decision that mitigates]
   Early Signal: [What metric would warn us early?]

2. [Second most likely]
   Cause: [Root cause]
   Prevention: [Mitigation]
   Early Signal: [Warning metric]

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

## Define-Ideate Quality Checklist

### Define Phase
- [ ] Assumption log created — critical ones flagged
- [ ] Competitive analysis done — differentiator identified
- [ ] Persona has DESIGN IMPLICATIONS (not just demographics)
- [ ] HMW is testable — you know how to measure success
- [ ] Design principles defined (3-5)
- [ ] Success metrics + North Star defined
- [ ] JTBD covers all 3 layers (functional/social/emotional)

### Ideate Phase
- [ ] Sitemap reflects USER mental model (not developer logic)
- [ ] Primary job completable in ≤3 taps from Home
- [ ] User journey top 3 frictions identified
- [ ] ALL flows include edge cases (not just happy path)
- [ ] MoSCoW has "Won't have" section
- [ ] Content voice defined — bilingual rules set
- [ ] Notification/permission strategy planned
- [ ] Accessibility requirements documented
- [ ] Pre-mortem completed

**If any item unchecked → Complete it before handoff.**