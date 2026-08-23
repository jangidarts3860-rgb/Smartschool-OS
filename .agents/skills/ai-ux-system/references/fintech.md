# Fintech UX and Trust Reference
Version: 2.1 | Updated: 2026-07-11

## First principle
Financial UX must be truthful, precise, reversible where possible, and technically feasible. Never let visual confidence imply a guarantee the product cannot provide.

## Capability language
Distinguish clearly:
- Detected: the system noticed a signal.
- Flagged: the system recommends review.
- Verified: defined checks passed at a stated time.
- Authorized: user or institution approved an action.
- Processed: the product or partner executed it.
- Protected/guaranteed: use only when contractually and technically true.

Do not say â€œRBI certified,â€ â€œbank grade,â€ â€œAI guaranteed,â€ â€œblocked,â€ â€œcancelled,â€ or â€œworks offlineâ€ without verified scope and authorization.

## Money clarity
- Show exact amount, currency, payer, payee, account, fees, schedule, and timestamp before confirmation.
- Use one canonical data source so amounts and statuses match across screens.
- Separate available balance, due amount, projected cost, savings, and historical spend.
- Format Indian currency correctly and localize dates/times.

## Transaction states
Design distinct states for draft, authentication required, processing, pending, successful, failed, reversed/refunded, expired, and duplicated request. Explain whether money moved, what happens next, expected time, and support path.

## Error prevention and recovery
- Prevent duplicate taps and stale confirmations.
- Confirm high-impact, unusual, or irreversible actions based on risk, not an arbitrary universal amount.
- Preserve context after failure.
- State â€œYour money was not debitedâ€ only when verified.
- Provide dispute, report, retry, cancel, and support routes when applicable.

## Trust and consent
- Explain why data or permission is needed, what is collected, who receives it, duration, revocation, and consequences of denial.
- Use bank, regulator, certification, and partner marks only with permission and correct wording.
- Avoid generic lock icons as proof of security.
- Show consent receipts and revocation status for connected financial data.

## AI and risk scores
A risk score must expose factors, timestamp, confidence/limitations, and a â€œWhy this result?â€ explanation. Do not present probabilistic output as certainty. Give a safe next action and escalation route.

## India-specific checks
Verify current RBI, NPCI, Account Aggregator, DPDP, app-store, SMS/call-log, and cybercrime-reporting requirements from official sources. Account Aggregators are RBI-regulated entities; a normal product is not automatically RBI certified. Helpline and reporting information must be verified and kept current.

## Offline behavior
Local viewing, local lock, cached guidance, or queued requests may work offline. Remote bank/card/mandate actions require connectivity unless a verified channel says otherwise. Show queued, sent, acknowledged, and failed states separately.

## Validation
Test comprehension, not just completion. Ask users what happened to their money/data, what the app guaranteed, and what they should do next.

## Supplemental Guidance (Context-based Options)
From legacy systems: Any absolute thresholds (e.g., "confirm all transactions > â‚¹500") should be treated as context-based options rather than rigid rules. Risk logic should be adjusted per project and regulatory requirement.