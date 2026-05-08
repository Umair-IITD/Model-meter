# PRICING_DATA.md — Source-Cited Pricing for Audit Engine

> Every price in `src/audit-engine/pricing.ts` has a corresponding entry here.
> Format: `- [Plan]: $[price] — [URL] — verified [DATE]`

---

## Cursor

Source: [https://cursor.com/pricing](https://cursor.com/pricing)

- Hobby: $0/month (individual) — verified 2026-05-08
- Pro: $20/month (individual) — verified 2026-05-08
- Pro+: $60/month (individual, 3x usage credits vs Pro) — verified 2026-05-08
- Ultra: $200/month (individual, maximum usage) — verified 2026-05-08
- Business: $40/seat/month (team, min 1 seat, includes SSO & centralized billing) — verified 2026-05-08

**Rule threshold:** Business vs Pro: $40 - $20 = **$20/seat/month** advantage for Pro on teams < 5.

---

## GitHub Copilot

Source: [https://github.com/features/copilot#pricing](https://github.com/features/copilot#pricing)

- Free: $0/month (limited completions) — verified 2026-05-08
- Pro: $10/month (individual, unlimited completions) — verified 2026-05-08
- Pro+: $39/month (individual, access to all frontier models) — verified 2026-05-08
- Business: $19/seat/month — verified 2026-05-08
- Enterprise: $39/seat/month (adds org-level codebase indexing) — verified 2026-05-08

**⚠️ Usage-based transition note:** GitHub Copilot Business is transitioning to AI Credits-based billing effective June 1, 2026. The $19/seat figure is the base rate; actual cost may vary based on usage. Audit engine treats this as "estimated" in outputs for Business plan comparisons.

**Rule threshold:** Enterprise vs Business: $39 - $19 = **$20/seat/month** advantage for Business on teams ≤ 3.

---

## Claude (claude.ai)

Source: [https://claude.ai/upgrade](https://claude.ai/upgrade)

- Free: $0/month (limited usage) — verified 2026-05-08
- Pro: $20/month (individual, $17/month billed annually) — verified 2026-05-08
- Max 5x: $100/month (individual, 5x usage vs Pro) — verified 2026-05-08
- Max 20x: $200/month (individual, 20x usage vs Pro) — verified 2026-05-08
- Team: $25/seat/month (minimum 5 seats required) — verified 2026-05-08
- Enterprise: Custom pricing (rumored 70-seat minimum — NOT used in rules without verification)

**Rule threshold:** Team vs Pro: $25 - $20 = **$5/seat/month** advantage for Pro on teams < 5.

**⚠️ Team minimum seats:** Claude Team requires 5 seats minimum. The engine flags configurations with fewer than 5 seats as likely misconfigured.

---

## ChatGPT (openai.com)

Source: [https://openai.com/chatgpt/pricing](https://openai.com/chatgpt/pricing)

- Free: $0/month — verified 2026-05-08
- Go: $8/month (individual, ad-supported) — verified 2026-05-08
- Plus: $20/month (individual, GPT-5 access) — verified 2026-05-08
- Pro ($100): $100/month (individual, o1 pro access) — verified 2026-05-08
- Pro ($200): $200/month (individual, maximum usage) — verified 2026-05-08
- Business: $30/seat/month (conservative upper bound; actual range $25–30) — verified 2026-05-08

**Note on Business pricing:** OpenAI quotes $25–30/seat for Business. The audit engine uses **$30** as the baseline for savings calculations (conservative — never over-claims savings).

**Rule threshold:** Business vs Plus: $30 - $20 = **$10/seat/month** advantage for Plus on teams ≤ 2.

---

## Anthropic API (platform.anthropic.com)

Source: [https://www.anthropic.com/pricing](https://www.anthropic.com/pricing)

Token-based pricing (not seat-based). Monthly spend is user-entered because token volume is unknown.

| Model | Input $/M tokens | Output $/M tokens | Notes |
|---|---|---|---|
| Claude Haiku 4.x | $1.00 | $5.00 | Cheapest, suitable for simple tasks |
| Claude Sonnet 4.x | $3.00 | $15.00 | Standard reasoning |
| Claude Opus 4.x | $5.00 | $25.00 | Flagship, highest capability |

Verified: 2026-05-08

**Rule threshold:** If use case is `data` and model is Sonnet/Opus, engine recommends Gemini Flash-Lite ($0.10/$0.40/M) — approximately 50x cheaper for structured tasks. Savings are marked `estimatedSavings: true`.

---

## OpenAI API (openai.com/api)

Source: [https://openai.com/api/pricing](https://openai.com/api/pricing)

Token-based pricing.

| Model | Input $/M tokens | Output $/M tokens |
|---|---|---|
| GPT-4.1 Nano | $0.10 | $0.40 |
| GPT-5.4 Mini | $0.75 | $4.50 |
| GPT-5.4 (standard) | $2.50 | $15.00 |
| GPT-5.5 (flagship) | $5.00 | $30.00 |

Verified: 2026-05-08

---

## Google Gemini API (ai.google.dev)

Source: [https://ai.google.dev/pricing](https://ai.google.dev/pricing)

Token-based pricing.

| Model | Input $/M tokens | Output $/M tokens |
|---|---|---|
| Gemini Flash-Lite | $0.10 | $0.40 |
| Gemini 2.5 Pro | $1.25 | $10.00 |
| Gemini 3.1 Pro (≤200k ctx) | $2.00 | $12.00 |
| Gemini 3.1 Pro (>200k ctx) | $4.00 | $18.00 |

Verified: 2026-05-08

---

## Windsurf (windsurf.com)

Source: [https://windsurf.com/pricing](https://windsurf.com/pricing)

- Free: $0/month — verified 2026-05-08
- Pro: $20/month (individual) — verified 2026-05-08
- Max: $200/month (individual, maximum usage) — verified 2026-05-08
- Teams: $40/seat/month — verified 2026-05-08

---

## Verification Methodology

All prices were retrieved from official vendor pricing pages on 2026-05-08. Where a price appeared ambiguous or required login to view, the conservative (higher) estimate was used to avoid over-claiming savings. Annual-billed discounts are noted but not used as the baseline — audits assume monthly billing unless the user indicates otherwise.

Reviewers should re-verify any price that is more than 30 days old. AI vendor pricing changes frequently.
