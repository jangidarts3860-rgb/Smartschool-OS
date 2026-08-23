---
name: content-design-v2
description: Senior Content Designer. Bridges UX writing + information architecture + content strategy. Use for: content models, IA, taxonomy, content strategy, content governance, localization strategy, content audit, structured content, design system content. Trigger: "content model", "IA banao", "taxonomy", "content strategy", "content audit", "structured content", "localization", "content governance", "design system content", "content model", "information architecture".
version: 2.0
---
# Content Design v2 — Senior Content Designer

> **Scope:** Not just "writing." This is **Content Architecture** — IA, taxonomy, content models, governance, localization strategy.
> **Trigger:** "IA banao", "content model", "taxonomy", "content strategy", "content audit", "structured content", "localization strategy"

---

## Content Design vs UX Writing

| UX Writing | Content Design |
|------------|----------------|
| Microcopy (buttons, errors) | Content models + IA + taxonomy + microcopy |
| Screen-level | System-level + screen-level |
| "What words?" | "What content, where, why, how structured?" |

---

## Phase 1: Content Strategy

### Content Vision
```
[Product] content helps [User] [do X] by being [Clear / Trustworthy / Actionable / Delightful].
```

### Content Principles (3-5)
```
1. [Principle] — [Application]
2. [Principle] — [Application]
...
```

### Voice & Tone (Per Context)
| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Encouraging, simple | "You're 2 steps away from your first order" |
| Error | Empathetic, specific | "OTP expired. Request a new one" |
| Success | Celebratory, next-step | "Payment done! 🎉 Track your order" |
| Empty | Encouraging, actionable | "No orders yet. Find something you'll love 🛒" |
| Legal/Compliance | Plain language | "We use your location to show nearby restaurants" |

---

## Phase 2: Information Architecture (IA)

### IA Audit (Existing Product)
```
CURRENT STATE:
- Total screens: [N]
- Orphan screens: [List]
- Duplicate content: [List]
- Inconsistent labels: [List]
- Missing states: [Empty / Error / Loading per screen]
- IA depth: [Max levels — keep ≤3 for primary flows]
```

### Sitemap Principles
```
- Organize by USER MENTAL MODEL (not dev logic)
- Primary job completable in ≤3 taps from home
- Every screen has entry AND exit path
- No dead ends (every screen has ≥1 exit)
- Language selection at root (India requirement)
```

### Navigation Patterns by Product Type
| Product Type | Primary Nav | Secondary Nav |
|--------------|-------------|---------------|
| E-commerce | Home / Categories / Cart / Profile | Filters / Sort / Wishlist |
| FinTech | Home / Pay / Invest / Profile | Accounts / Cards / Settings |
| Food Delivery | Home / Orders / Offers / Profile | Cuisines / Filters / Support |
| EdTech | Learn / Progress / Library / Profile | Courses / Downloads / Settings |
| Social | Feed / Explore / Create / Profile | Notifications / Messages / Settings |

---

## Phase 3: Content Models (Structured Content)

### Content Type Definition
```
CONTENT TYPE: [Name, e.g., "Restaurant Card"]
PURPOSE: [What it communicates]
WHERE USED: [Screens / Components]
FIELDS:
  - field_name: [Type] — [Required?] — [Constraints] — [Example]
  - field_name: [Type] — [Required?] — [Constraints] — [Example]
VARIANTS: [List — e.g., "Compact / Detailed / Promotional"]
RELATIONSHIPS: [Links to other content types]
LOCALIZATION: [Fields needing translation + character limits]
```

### Example: Restaurant Card
```
CONTENT TYPE: Restaurant Card
PURPOSE: Help user decide to order
WHERE USED: Home feed, Search results, Category page
FIELDS:
  - name: String — Required — Max 40 chars — "Biryani Blues"
  - cuisine_tags: Array[String] — Required — 2-4 items — ["Biryani", "North Indian"]
  - rating: Decimal — Required — 0.0-5.0, 1 decimal — 4.3
  - review_count: Integer — Required — "1,234 reviews"
  - delivery_time: String — Required — "25-30 min"
  - offer_badge: String — Optional — "50% OFF up to ₹100"
  - image_url: URL — Required — 16:9 aspect, 400px min width
  - is_veg: Boolean — Required — true/false
  - price_for_two: Integer — Optional — "₹300 for two"
VARIANTS: Compact (list) / Detailed (grid) / Promotional (hero)
RELATIONSHIPS: → Restaurant Detail Page → Menu Items
LOCALIZATION: name (translate), cuisine_tags (translate), offer_badge (translate)
```

---

## Phase 4: Taxonomy & Metadata

### Controlled Vocabularies
```
CUISINE TAXONOMY:
- North Indian
  - Punjabi
  - Mughlai
  - Awadhi
- South Indian
  - Tamil
  - Kerala
  - Andhra
...

DIETARY TAGS (controlled):
- Veg / Non-Veg / Vegan / Jain / Gluten-Free / Keto
- No free-text tags — prevents "veg", "veg.", "vegetarian" chaos
```

### Metadata Schema (Per Content Type)
```
METADATA FIELDS (auto-populated where possible):
- content_id: UUID
- content_type: [enum]
- locale: [en-IN, hi-IN, ta-IN...]
- status: [draft / review / published / archived]
- created_by: [user_id]
- created_at: [timestamp]
- updated_at: [timestamp]
- published_at: [timestamp]
- tags: [controlled taxonomy IDs]
- seo_title: [max 60 chars]
- seo_description: [max 160 chars]
- social_image: [URL]
- accessibility_alt: [required for images]
```

---

## Phase 5: Localization Strategy (India-First)

### Locale Hierarchy
```
Tier 1 (Must have): en-IN, hi-IN
Tier 2 (High value): ta-IN, te-IN, bn-IN, mr-IN, gu-IN, kn-IN, ml-IN, pa-IN, or-IN
Tier 3 (Niche): as-IN, ur-IN, ks-IN, sd-IN...
```

### Translation Workflow
```
1. Source content in en-IN (source of truth)
2. Lock content → send to translation
3. Human translation + review (native speaker)
4. QA in-context (Figma + device)
5. Publish per locale
6. Monitor locale-specific metrics
```

### Hindi-Specific Rules
```
- Devanagari script (Noto Sans Devanagari)
- Line-height ≥ 1.6 (complex scripts)
- Containers: +30% width buffer
- Numbers: Indian format (1,00,000) but keep ₹ symbol
- Technical terms: Keep English (OTP, UPI, PIN, KYC)
- Hinglish option for Tier 2/3 informal: "OTP daal do"
```

---

## Phase 6: Content Audit Template

```
CONTENT AUDIT — [Product] — [Date]

SCREEN: [Screen Name / ID]
CONTENT TYPE: [Type from model]
CURRENT STATE:
  - Copy: [Current text]
  - Issues: [List — unclear / inconsistent / missing / outdated]
  - Missing states: [Empty / Error / Loading / Success]
  - Localization gaps: [Missing locales]
  - Accessibility: [Missing alt text / aria-labels]

RECOMMENDATION:
  - New copy: [Proposed]
  - Variant needed: [Yes/No]
  - Locale action: [Translate / Adapt / Create new]
  - Priority: [Critical / High / Medium / Low]

EFFORT: [S / M / L]
OWNER: [Writer / Designer / PM]
```

---

## Phase 7: Content Governance

### RACI for Content
| Activity | Writer | Designer | PM | Eng | Legal |
|----------|--------|----------|----|-----|-------|
| Content strategy | R | C | A | I | C |
| Content model | R | C | A | C | I |
| Microcopy | R | C | I | I | I |
| Translation | R | C | A | I | C |
| Legal copy | C | I | A | I | R |
| Publish | C | C | A | R | I |

### Content Style Guide (Living Doc)
```
- Voice & tone per context
- Word list (preferred / avoid)
- Capitalization rules
- Number/currency/date formats per locale
- Abbreviations glossary
- Error message patterns
- Empty state patterns
- CTA patterns
- Accessibility requirements
- Component-specific copy specs
```

---

## Content Handoff to Design (What Writers Give Designers)

```
CONTENT HANDOFF PACKAGE:
□ All screen copy (final, approved)
□ Character counts for constrained areas
□ Hindi/English/Hinglish variants
□ Error/empty/success variants per screen
□ Character count limits for truncation rules
□ Dynamic content rules (pluralization, variables)
□ Accessibility notes (alt text, aria-labels)
```