---
name: analytics-measurement-v2
description: Senior Product Analyst. Defines success metrics, North Star, guardrails, experiment design, A/B test framework, post-launch tracking, funnel analysis, cohort analysis. Trigger: "metrics define karo", "North Star", "A/B test", "funnel analysis", "cohort analysis", "experiment design", "post-launch tracking", "success metrics", "KPI", "guardrail metrics".
version: 2.0
---
# Analytics & Measurement v2 — Senior Product Analyst

> **Hierarchy:** Tier 1 = ux-thinking | Tier 2 = design-taste-frontend | Tier 3 = THIS SKILL
> **When to use:** Define metrics BEFORE design. Track AFTER launch. Experiment for decisions.

---

## Metric Hierarchy (Define in Order)

### 1. North Star Metric (The ONE Number)
> The single metric that best captures core value delivered to users.
> **Format:** "[Action] per [User] per [Time]"
> **Examples:**
> - FinTech: "Successful transactions per active user per month"
> - Food Delivery: "Completed orders per user per week"
> - EdTech: "Lessons completed per learner per month"
> - Social: "Daily active users who send ≥1 message"

### 2. Primary Metrics (3-5 max)
> Directly tied to North Star. Move these → North Star moves.
> - Activation: % users completing [key action] within [time]
> - Retention: Day 1 / Day 7 / Day 30 retention
> - Engagement: [Core action] per session
> - Monetization: Revenue per paying user / ARPU

### 3. Guardrail Metrics (Must NOT Get Worse)
> Safety rails. If these regress → stop/rollback.
> - Support ticket volume
> - App crash rate
> - Onboarding drop-off rate
> - Payment failure rate
> - Page load time (LCP)

### 4. Anti-Metrics (Explicitly NOT Optimized)
> "We don't optimize for X because it conflicts with [value]."
> - Session length (we want task efficiency, not time-on-site)
> - Page views (we want task completion)
> - Notification opens (we want meaningful engagement)

---

## Metric Definition Template (For Every Metric)

```
METRIC: [Name]
DEFINITION: [Precise formula — SQL-ready]
UNIT: [Count / Rate / Duration / Currency]
DATA SOURCE: [Event name / Table / API]
FREQUENCY: [Real-time / Daily / Weekly]
SEGMENTATION: [By user type / Channel / Device / Region]
TARGET: [Baseline → Target by date]
OWNER: [Team / Person]
```

---

## Funnel Analysis Framework

### Standard Funnel (Every Product)
```
VISITOR → SIGNUP → ACTIVATION → HABIT → PAY/REFER
   │         │          │          │        │
   │         │          │          │        └─ Referral rate
   │         │          │          └─ Day 30 retention
   │         │          └─ Core action completed
   │         └─ OTP verified / Account created
   └─ Landing page view
```

### Funnel Health Checks
| Stage | Healthy Conversion | Warning Signs |
|-------|-------------------|---------------|
| Visitor → Signup | 15-25% (varies) | <10% = friction in value prop |
| Signup → Activation | 40-60% | <30% = onboarding broken |
| Activation → Habit | 20-40% Day 30 | <15% = no value retention |
| Habit → Pay/Refer | 5-15% | <3% = monetization/viral broken |

---

## Experiment Design (A/B Test Framework)

### Test Definition
```
TEST NAME: [Descriptive]
HYPOTHESIS: "If we [change], then [metric] will [increase/decrease] by [%] because [reason]."
PRIMARY METRIC: [Single metric that determines winner]
GUARDRAIL METRICS: [List — must not regress]
MINIMUM DETECTABLE EFFECT: [%] — smallest meaningful change
SAMPLE SIZE: [Calculated — use calculator]
DURATION: [Minimum 2 weeks / 1 business cycle]
SEGMENTATION: [New vs Returning / Platform / Region]
```

### Test Quality Gates
- [ ] Sample size calculated (not guessed)
- [ ] Random assignment verified (SRM check)
- [ ] No contamination between variants
- [ ] Guardrails defined + monitored
- [ ] Pre-registered (no p-hacking)
- [ ] Statistical significance threshold set (95% CI)

### Indian Market Experiment Notes
- **Tier 2/3 users:** May need larger samples (higher variance)
- **Network variance:** 3G/4G affects load-time experiments
- **Language:** Test Hindi vs English copy separately
- **Festivals/Sales:** Avoid testing during Diwali, Big Billion Days

---

## Cohort Analysis Framework

### Retention Cohorts
```
COHORT: [Signup week/month]
WEEK 0: 100%
WEEK 1: [%] — Early activation
WEEK 2: [%] — Value realization
WEEK 4: [%] — Habit formation
WEEK 12: [%] — Long-term retention
```

### Cohort Comparison Questions
- Do Hindi-onboarded users retain better than English?
- Does UPI-first payment flow improve Day 7 retention?
- Do users from referral channel have higher LTV?

---

## Post-Launch Tracking Dashboard

### Real-Time (Hourly)
- Active users now
- Core action rate (per min)
- Error rate / Crash rate
- API latency (p50, p95, p99)

### Daily
- DAU / MAU / DAU:MAU ratio
- Signups / Activations / Payments
- Funnel conversion rates (each stage)
- Top errors / Crash reports

### Weekly
- Retention curves (Day 1, 7, 30)
- Feature adoption (% users using X)
- Cohort retention heatmap
- NPS / CSAT trend
- Experiment results

### Monthly
- LTV / CAC by channel
- Churn analysis (why users leave)
- Power user analysis (top 10%)
- Competitive benchmarking

---

## Indian Market Benchmarks (2024-25)

| Metric | FinTech | Food Delivery | E-commerce | EdTech | Social |
|--------|---------|---------------|------------|--------|--------|
| Day 1 Retention | 25-35% | 30-40% | 20-30% | 25-35% | 40-50% |
| Day 7 Retention | 15-25% | 20-30% | 10-20% | 15-25% | 25-35% |
| Day 30 Retention | 10-20% | 15-25% | 5-15% | 10-20% | 15-25% |
| Activation Rate | 40-55% | 50-65% | 30-45% | 40-55% | 50-65% |
| Payment Success | 85-92% | 80-90% | 75-85% | 80-90% | N/A |
| CAC (₹) | 150-400 | 80-200 | 100-300 | 200-500 | 50-150 |
| LTV:CAC | 3:1+ | 3:1+ | 3:1+ | 3:1+ | 5:1+ |

> **Use as reference only.** Your baseline = your truth.

---

## Anti-Patterns

```
❌ Vanity metrics as North Star (DAU, page views, session length)
❌ No guardrails defined → "growth at all costs"
❌ A/B test without sample size calc → false positives
❌ Testing during Diwali/Big Billion Days → skewed data
❌ Ignoring segment differences (Tier 1 vs Tier 3)
❌ Post-hoc rationalization ("test failed but we learned...")
❌ Measuring everything → analyzing nothing
❌ No pre-test registration → p-hacking risk
```