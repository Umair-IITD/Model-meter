# AUDIT_ENGINE_SPEC.md — Audit Engine Specification

> This is the most important implementation document. A finance-literate person must be able to read this and agree with the logic.

---

## Principles

1. **Conservative:** Only claim savings that are clearly supported by the pricing data. When uncertain, claim less.
2. **Traceable:** Every savings figure must trace to a named rule with a formula.
3. **Honest:** If a tool is already on the optimal plan, return "optimal" with $0 savings. Never manufacture savings.
4. **Use-case aware:** The same plan can be optimal for one use case and wasteful for another.
5. **No AI in the calc path:** Every rule is deterministic logic. AI is only used for the summary paragraph.

---

## Input Schema

```typescript
interface AuditInput {
  teamSize: number;
  useCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
  tools: ToolInput[];
}

interface ToolInput {
  toolId: ToolId;           // e.g. 'cursor', 'github-copilot'
  planId: string;           // e.g. 'pro', 'business'
  monthlySpend: number;     // user-entered USD — may differ from listed price
  seats: number;            // 1 for individual plans
}
```

---

## Output Schema

```typescript
interface AuditResult {
  totalMonthlySavings: number;    // sum of all finding.projectedMonthlySavings
  totalAnnualSavings: number;     // totalMonthlySavings × 12
  isOptimal: boolean;             // true if totalMonthlySavings < 5
  findings: ToolFinding[];
  crossToolFindings: CrossToolFinding[];  // redundancy rules across tools
}

interface ToolFinding {
  toolId: string;
  toolName: string;
  currentPlan: string;
  currentMonthlySpend: number;    // from input
  recommendedAction: 'downgrade' | 'upgrade' | 'optimal' | 'switch';
  recommendedPlan?: string;
  projectedMonthlySpend?: number;
  projectedMonthlySavings: number;  // 0 if 'optimal'
  ruleId: string;                   // which rule produced this finding
  reason: string;                   // one-sentence explanation
}

interface CrossToolFinding {
  toolIds: string[];
  recommendedAction: 'consolidate' | 'drop-one';
  projectedMonthlySavings: number;
  ruleId: string;
  reason: string;
}
```

---

## Pricing Reference

> These are the prices that inform rule thresholds. ALL must be verified before submission and cited in PRICING_DATA.md.

### Cursor
| Plan | Monthly | Type |
|------|---------|------|
| Hobby | $0 | Individual |
| Pro | $20 | Individual |
| Pro+ | $60 | Individual |
| Ultra | $200 | Individual |
| Business | $40/seat | Per-seat |

### GitHub Copilot
| Plan | Monthly | Type |
|------|---------|------|
| Free | $0 | Individual |
| Pro | $10 | Individual |
| Pro+ | $39 | Individual |
| Business | $19/seat | Per-seat (usage-based from June 1, 2026) |
| Enterprise | $39/seat | Per-seat |

> ⚠️ **Flag in PRICING_DATA.md:** GitHub Copilot Business is transitioning to usage-based "AI Credits" billing effective June 1, 2026. The $19/seat figure is the base rate; actual cost may vary. Treat Business/Enterprise Copilot cost comparisons as "estimated" in audit output.

### Claude (claude.ai web)
| Plan | Monthly | Type |
|------|---------|------|
| Free | $0 | Individual |
| Pro | $20 | Individual ($17/mo annual) |
| Max (5x) | $100 | Individual |
| Max (20x) | $200 | Individual |
| Team | $25/seat | Per-seat (min 5 seats) |
| Enterprise | Custom | Per-seat (custom; rumored 70-seat min — do not use this in rules unless verified) |

> ⚠️ **Claude Team minimum:** 5 seats. If a user reports 3 seats on Claude Team, the rule fires correctly — they cannot actually be on Team with fewer than 5. Note this inconsistency in the finding output.

### ChatGPT (openai.com)
| Plan | Monthly | Type |
|------|---------|------|
| Free | $0 | Individual |
| Go | $8 | Individual (ad-supported) |
| Plus | $20 | Individual |
| Pro ($100) | $100 | Individual |
| Pro ($200) | $200 | Individual |
| Business | $25–30/seat | Per-seat (min 2 seats) |

### Anthropic API Direct
Token-based. Not seat-based. Rules for this tool focus on model selection for the use case.

| Model | Input $/M tokens | Output $/M tokens |
|-------|-----------------|-------------------|
| Claude Opus 4.x | $5.00 | $25.00 |
| Claude Sonnet 4.x | $3.00 | $15.00 |
| Claude Haiku 4.x | $1.00 | $5.00 |

> Source: platform.claude.com — verify on day of submission.

### OpenAI API Direct
Token-based.

| Model | Input $/M tokens | Output $/M tokens |
|-------|-----------------|-------------------|
| GPT-5.5 | $5.00 | $30.00 |
| GPT-5.4 | $2.50 | $15.00 |
| GPT-5.4 Mini | $0.75 | $4.50 |
| GPT-4.1 Nano | $0.10 | $0.40 |

> Source: openai.com/pricing — verify on day of submission.

### Google Gemini API
| Model | Input $/M tokens | Output $/M tokens |
|-------|-----------------|-------------------|
| Gemini 3.1 Pro (≤200k ctx) | $2.00 | $12.00 |
| Gemini 3.1 Pro (>200k ctx) | $4.00 | $18.00 |
| Gemini 2.5 Pro | $1.25 | $10.00 |
| Gemini Flash-Lite | $0.10 | $0.40 |

> Source: ai.google.dev/pricing — verify on day of submission.

### Windsurf (windsurf.com)
| Plan | Monthly | Type |
|------|---------|------|
| Free | $0 | Individual |
| Pro | $20 | Individual |
| Max | $200 | Individual |
| Teams | $40/seat | Per-seat |

### v0.dev (v0.dev/pricing)
| Plan | Monthly | Type |
|------|---------|------|
| Free | $0 | Individual ($5 credits) |
| Premium | $20 | Individual ($20 credits) |
| Team | $30/seat | Per-seat |
| Business | $100/seat | Per-seat |

---

## Rule Definitions

### Category 1: Plan-Fit Rules (Same Vendor, Right-Sizing)

---

**Rule ID:** `plan-fit-sub5-cursor-business`
**Trigger:** `toolId === 'cursor' && planId === 'business' && seats < 5`
**Reasoning:** Cursor Business ($40/seat) vs Cursor Pro ($20/seat) — the business plan adds centralized billing and SAML/SSO. For teams under 5, these admin features provide no meaningful value. All model access is identical.
**Action:** Downgrade to Pro (individual, each member buys own seat)
**Savings formula:** `(40 - 20) × seats = 20 × seats` per month
**Reason string:** `"Cursor Business adds admin features (SSO, centralized billing) that provide little value for teams under 5. Individual Pro seats give identical AI access at half the price."`

---

**Rule ID:** `plan-fit-sub5-claude-team`
**Trigger:** `toolId === 'claude' && planId === 'team' && seats < 5`
**Reasoning:** Claude Team requires a 5-seat minimum. If user reports fewer than 5 seats, this is either misconfigured or they're paying for unused seats.
**Action:** Downgrade to Claude Pro (individual)
**Savings formula:** `(25 - 20) × seats` + note about minimum seat policy
**Reason string:** `"Claude Team requires a minimum of 5 seats. For [N] users, individual Pro plans ($20/user) provide the same model access without the minimum seat overhead."`

---

**Rule ID:** `plan-fit-sub3-chatgpt-business`
**Trigger:** `toolId === 'chatgpt' && planId === 'business' && seats <= 2`
**Reasoning:** ChatGPT Business adds workspace admin features. For 1–2 users, Plus plans are identical in model access.
**Action:** Downgrade to Plus (individual)
**Savings formula:** `(30 - 20) × seats` per month (using $30 as Business price; verify exact figure)
**Reason string:** `"ChatGPT Business adds team admin features that aren't needed for [N] users. ChatGPT Plus ($20/user) provides the same GPT-5 access without the overhead."`

---

**Rule ID:** `plan-fit-solo-team-plan`
**Trigger:** `seats === 1 && planId in ['team', 'business', 'enterprise']`
**Applies to:** cursor, claude, chatgpt
**Reasoning:** Any team/business plan with 1 seat is pure waste on administrative overhead.
**Action:** Downgrade to individual Pro
**Savings formula:** `currentMonthlySpend - individual_pro_price_for_tool`
**Reason string:** `"[Tool] [Plan] is a team product. With 1 user, you're paying for admin overhead with no benefit. The individual Pro plan provides the same AI capabilities."`

---

**Rule ID:** `plan-fit-gh-copilot-enterprise-small`
**Trigger:** `toolId === 'github-copilot' && planId === 'enterprise' && seats <= 3`
**Reasoning:** GitHub Copilot Enterprise ($39/seat) adds codebase indexing and enterprise security. For 1–3 users, Business ($19/seat) or Pro ($10) is adequate.
**Action:** Downgrade to Business or Pro
**Savings formula:** `(39 - 19) × seats` (to Business) or `(39 - 10) × seats` (to Pro for ≤2 users)
**Reason string:** `"GitHub Copilot Enterprise adds org-level codebase indexing, which requires more than 3 users to justify the cost. Copilot Business at $19/seat provides the same completions and chat."`

---

### Category 2: Redundancy Rules (Cross-Tool)

These are `CrossToolFinding` objects. They fire when two tools are simultaneously present in the input.

---

**Rule ID:** `redundant-chatgpt-plus-claude-pro-coding`
**Trigger:** Both `chatgpt (plus)` and `claude (pro)` in input, `useCase === 'coding'`
**Reasoning:** Both provide access to frontier models for coding tasks. A multi-model IDE (Cursor or Windsurf at $20/seat) lets you access both Claude and GPT through one subscription.
**Action:** Consolidate — switch to Cursor Pro ($20/seat) for both models
**Savings formula:** `(20 + 20) - 20 = 20` per seat per month
**Reason string:** `"Paying for both ChatGPT Plus and Claude Pro for coding gives you two separate interfaces for the same underlying models. Cursor Pro ($20/seat) includes both Claude and GPT-4 access within a single coding environment."`

---

**Rule ID:** `redundant-chatgpt-plus-claude-pro-writing`
**Trigger:** Both `chatgpt (plus)` and `claude (pro)` in input, `useCase === 'writing'`
**Reasoning:** For writing use cases, one frontier model subscription is typically sufficient. Recommend keeping the one better suited for the task.
**Action:** Drop one — recommend Claude Pro for writing (subjective; acknowledge this)
**Savings formula:** `20` per month
**Reason string:** `"Most writing workflows don't require two frontier model subscriptions. Claude is generally preferred for long-form writing and editing; dropping ChatGPT Plus saves $20/month with no meaningful capability loss for writing tasks."`

---

**Rule ID:** `redundant-cursor-windsurf-coding`
**Trigger:** Both `cursor` and `windsurf` in input, `useCase === 'coding'`
**Reasoning:** Both are AI-native IDEs with overlapping capabilities. Teams rarely need both.
**Action:** Drop Windsurf, keep Cursor (or vice versa — recommend based on seats/plan)
**Savings formula:** `windsurf_monthly_spend`
**Reason string:** `"Cursor and Windsurf are competing AI-native IDEs with substantially overlapping capabilities. Consolidating to one saves the full cost of the second subscription."`

---

### Category 3: Upgrade-to-Save Rules

---

**Rule ID:** `upgrade-cursor-pro-over-spend`
**Trigger:** `toolId === 'cursor' && planId === 'pro' && monthlySpend > 40`
**Reasoning:** If a Cursor Pro user is reporting >$40/month spend, they are paying for overages at metered rates. Cursor Pro+ ($60) provides 3x the credit pool.
**Action:** Upgrade to Pro+ ($60)
**Savings formula:** `monthlySpend - 60` (only applies if monthlySpend > 60; between $40–60, it's breakeven)
**Reason string:** `"Your Cursor Pro usage is exceeding the base credit pool. Upgrading to Pro+ ($60/month) provides 3x the usage credits, likely eliminating metered overage charges."`

---

### Category 4: Use-Case Alignment Rules

These compare the tool's model tier to the use case's actual requirements.

---

**Rule ID:** `use-case-api-data-extraction`
**Trigger:** `toolId in ['anthropic-api', 'openai-api'] && planId involves flagship model && useCase === 'data'`
**Reasoning:** Data extraction, classification, and simple summarization tasks don't require frontier reasoning models. Gemini Flash-Lite ($0.10/$0.40 per million tokens) is 50x cheaper than Claude Opus or GPT-5.5 for equivalent output on structured tasks.
**Action:** Switch to Gemini API (Flash-Lite) for batch data tasks
**Savings formula:** Estimate based on `monthlySpend × 0.95` (conservative — actual savings depend on token volume)
**Reason string:** `"Data extraction and classification tasks don't require flagship reasoning models. Google Gemini Flash-Lite is 50x cheaper per token than Claude Opus/GPT-5.5 for structured data tasks with no meaningful quality difference."`
> ⚠️ **Assumption flagged:** Savings are estimated conservatively because we don't know the user's token volume. State this in the finding.

---

**Rule ID:** `use-case-chatgpt-pro200-coding`
**Trigger:** `toolId === 'chatgpt' && planId === 'pro-200' && useCase === 'coding'`
**Reasoning:** ChatGPT Pro ($200) is designed for heavy research, deep analysis, and o1 pro access. For coding tasks, Cursor Business ($40/seat) provides model access through Cursor's IDE integration at 80% lower cost.
**Action:** Switch to Cursor Business
**Savings formula:** `200 - (40 × seats)` (if seats = 1: saves $160)
**Reason string:** `"ChatGPT Pro's premium is primarily for deep research and reasoning tasks. For coding workflows, Cursor Business ($40/seat) provides Claude, GPT-4, and other models within an IDE at a fraction of the cost."`

---

### Category 5: Enterprise Scaling Warning

This is a warning, not a savings finding. It doesn't contribute to `totalMonthlySavings`.

---

**Rule ID:** `scale-warning-claude-team-approaching-limit`
**Trigger:** `toolId === 'claude' && planId === 'team' && seats >= 100`
**Reasoning:** Claude Team has a 150-seat maximum before forced Enterprise transition, which removes bundled usage and bills per token. Enterprise costs can be 3–10x higher per user for active engineering teams.
**Action:** Informational warning
**Savings:** $0 (proactive risk warning)
**Reason string:** `"Your team is approaching the Claude Team plan's 150-seat limit. Enterprise transition removes bundled usage and switches to token-based billing, which can significantly increase costs for high-activity engineering teams. Consider planning ahead with a Credex consultation."`

---

## Rule Priority and Conflict Resolution

When multiple rules apply to the same tool:
1. Select the rule producing the highest `projectedMonthlySavings`
2. Return only that one finding per tool (don't stack multiple recommendations)
3. Exception: scale warnings are always shown in addition to any other finding

When cross-tool redundancy rules and per-tool plan-fit rules conflict:
- Apply the cross-tool rule first (it produces higher savings)
- Do not also recommend a plan downgrade on a tool that the redundancy rule says to drop entirely

---

## "Already Optimal" Determination

Return `recommendedAction: 'optimal'` when:
- The tool is on the lowest viable plan for the given use case and team size
- No redundancy rule applies
- No upgrade-to-save rule applies
- User-entered spend matches expected plan price (or is lower — don't flag lower spend)

Set `isOptimal: true` on the full `AuditResult` when:
- `totalMonthlySavings < 5` (threshold: under $5/month is noise, not actionable)

The results page must display "You're spending well" messaging when `isOptimal === true`.

---

## Estimation Transparency

For rules that use estimated savings (e.g., API token volume estimates):
- Include `estimatedSavings: true` flag in the finding
- The UI renders estimated savings with a `~` prefix: "~$X/month estimated savings"
- Include the assumption: "Based on estimated [assumption]"

Never present estimated savings as exact figures.

---

## Testing the Engine

For each rule, the test file must include:
1. A case where the rule fires and savings are correct
2. A case where the rule does NOT fire (boundary condition)
3. An assertion that `ruleId` matches the expected rule

Example:
```typescript
describe('plan-fit-sub5-cursor-business', () => {
  it('fires when seats < 5', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 }]
    });
    expect(result.findings[0].ruleId).toBe('plan-fit-sub5-cursor-business');
    expect(result.findings[0].projectedMonthlySavings).toBe(60); // 20 × 3
  });

  it('does NOT fire when seats >= 5', () => {
    const result = runAudit({
      teamSize: 6,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 240, seats: 6 }]
    });
    expect(result.findings[0].recommendedAction).toBe('optimal');
  });
});
```
