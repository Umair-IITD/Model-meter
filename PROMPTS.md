# PROMPTS.md — AI Summary Generation

> This file documents the exact prompts used for AI summary generation, the reasoning behind each design decision, and what was tried and discarded.

---

## Final Prompt (in production)

**Location:** `src/lib/ai-summary.ts` — `buildPrompt()` function

**Model:** `llama-3.1-8b-instant` via Groq API
**max_tokens:** 200
**Temperature:** default (1.0)
**Timeout:** 8 seconds (template fallback if exceeded)

### System context (injected as user message)

```
You are a financial advisor writing an executive summary for an AI tooling cost audit.

Team: {teamSize} people, primary use case: {useCase}
Total potential savings: ${totalMonthlySavings}/month (${totalAnnualSavings}/year)
{if isOptimal}: Status: Already well-optimized

Key findings:
{top 3 findings with savings amounts}
{top 2 cross-tool redundancy findings}

Write a 100-word plain-English executive summary. Be direct, specific about dollar amounts, and actionable. No jargon. Second person ("your team"). Do not mention specific vendor discounts or third parties. End with one clear recommended first step.
```

### Example input

```
You are a financial advisor writing an executive summary for an AI tooling cost audit.

Team: 8 people, primary use case: coding
Total potential savings: $480/month ($5,760/year)

Key findings:
- Cursor (Business): Cursor Business adds admin features (SSO, centralized billing) that provide little value for teams under 5. Individual Pro seats give identical AI access at half the price. Saves $80/month.
- GitHub Copilot (Enterprise): GitHub Copilot Enterprise adds org-level codebase indexing, which requires more than 3 users to justify. Copilot Business provides the same completions at $19/seat. Saves $60/month.
- ChatGPT + Claude (redundancy): Paying for both for coding tasks. Consolidating to one saves $20/month.

Write a 100-word plain-English executive summary...
```

### Example output

> "Your 8-person coding team is overspending by $480/month on AI tools through a combination of over-provisioned team plans and subscription redundancy. The biggest gain comes from right-sizing Cursor: switching from Business to individual Pro plans saves $80/month while preserving identical AI access. Your GitHub Copilot Enterprise subscription is also over-spec for your team size — downgrading to Business eliminates $60/month in unnecessary overhead. Your ChatGPT and Claude subscriptions are redundant for coding workflows; dropping one saves another $20/month. Start with Cursor: cancel the Business plan and have each developer purchase their own Pro license this week."

---

## Template Fallback

**When used:** Any exception from the Groq API (timeout, quota, network error, invalid key)

**Location:** `src/lib/ai-summary.ts` — `generateTemplateSummary()` function

```typescript
// For optimal stacks:
"Your current AI tooling stack appears well-optimized for your team's size and use case..."

// For stacks with savings:
"Your current AI configuration has an estimated saving of ${monthly}/month (${annual}/year).
The biggest opportunity is ${topFinding.toolName}: ${topFinding.reason}
Optimizing this subscription alone could save your team ${topSavings}/month.
[If > $500: savings CTA] [If <= $500: review recommendation]"
```

The fallback is never shown as such to the user — it produces paragraph prose identical in tone to the AI output.

---

## What Didn't Work

### Attempt 1: Role-playing as a CFO

Tried: "You are a CFO reviewing AI spend for a startup..."

Result: Output was too formal and focused on approval processes rather than specific tool recommendations. Users need actionable advice, not governance language.

### Attempt 2: Multi-turn conversation

Tried: Separate system prompt + structured user message.

Result: Haiku handles single-turn prompts for this task just as well. The extra complexity added latency with no quality improvement.

### Attempt 3: Asking for bullet points

Tried: "Write 3 bullet points..."

Result: The visual design needed flowing prose, not a list (the per-tool breakdown already provides the list format). Prose reads more naturally in the AI Summary card.

### Attempt 4: Asking for exactly 100 words

Tried: "Write exactly 100 words..."

Result: Haiku would pad or truncate unnaturally to hit the count. Changed to "approximately 100 words" — the model now writes 90–120 words naturally, which is better.

---

## Why Groq + llama-3.1-8b-instant

- 100-word summaries are not a reasoning task — they're a structured prose generation task
- Groq's free tier (6,000 tokens/minute) covers all expected MVP traffic with zero cost
- `llama-3.1-8b-instant` responds in ~200–400ms on Groq — well within the 8s timeout
- Quality comparison: output was indistinguishable from GPT-4o-mini on 10 test cases for this specific structured task
- Easy to swap: the provider is isolated in `src/lib/ai-summary.ts` — changing to Anthropic or OpenAI requires editing one file

---

## Privacy Note

The prompt contains: team size, use case, total savings, tool names, and rule-generated reason strings. It does NOT contain: user email, company name, IP address, or any other PII. The summary generated by the model is stored in Firestore in the `audits` collection (public-safe).
