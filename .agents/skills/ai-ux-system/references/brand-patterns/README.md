# Brand Pattern Library: README
Version: 2.1 | Updated: 2026-07-11

## Purpose
Store inspiration by reusable pattern, not as one giant file containing dozens of brands. This reduces context waste and prevents accidental cloning.

## Suggested folders
```text
brand-patterns/
  typography/
  navigation/
  data-density/
  fintech-trust/
  commerce/
  editorial/
  onboarding/
  empty-states/
  motion/
```

## Reference file template
```yaml
name:
brand:
platform:
pattern:
source_url:
verified_date:
what_to_learn:
what_not_to_copy:
accessibility_risks:
product_fit:
```
Then include a short analysis and only the minimum measurements needed to understand the pattern.

## Loading rule
Load at most two references for one design task. Select by user problem and platform, not by visual popularity. Example: for a fintech risk-result screen, load one `fintech-trust` reference and one `data-density` reference, not Airbnb, Apple, Stripe, and ten dashboards together.

## Copying rules
- Never copy proprietary logos, illustrations, fonts, exact layouts, or brand color systems.
- Learn hierarchy, density, interaction, content structure, and trade-offs.
- Platform conventions and accessibility override brand inspiration.
- Mark outdated references and re-verify time-sensitive platform behavior.

## Quality questions
1. What exact user problem does this pattern solve?
2. What context made it successful?
3. What would fail if copied into our product?
4. Does it meet our content density and accessibility needs?
5. Can our engineering stack implement it reliably?

## Anti-AI-slop filter
Reject references that encourage generic card grids, neon AI palettes, random glass, gradient text, decorative dashboards, fake metrics, or visual novelty without task value.

## Migration from `awesome-design.md`
Split each useful brand section into one or more pattern files. Remove copied token dumps and proprietary font prescriptions. Preserve only verified source, lesson, trade-off, accessibility risk, and copying warning.