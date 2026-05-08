# TESTS.md — Test Suite Documentation

## How to Run

```bash
npm test              # Run all tests (must pass from a clean npm ci)
npm run test:watch    # Watch mode during development
npm run test:coverage # Coverage report
npm run type-check    # TypeScript strict type checking
npm run lint          # ESLint
```

All tests are in `src/audit-engine/__tests__/`. They test the audit engine only — no external API calls, no Firestore, no mocking of external services.

---

## Test Files

### `src/audit-engine/__tests__/plan-fit.test.ts`

Tests Category 1 rules: same-vendor right-sizing.

| Test | Rule | Input | Expected |
|---|---|---|---|
| Cursor Business 3 seats fires | `plan-fit-sub5-cursor-business` | cursor, business, $120, 3 seats | saves $60, action=downgrade |
| Cursor Business 5 seats does NOT fire | `plan-fit-sub5-cursor-business` | cursor, business, $200, 5 seats | action=optimal |
| Cursor Business 4 seats fires | `plan-fit-sub5-cursor-business` | cursor, business, $160, 4 seats | saves $80 |
| Claude Team 3 seats fires | `plan-fit-sub5-claude-team` | claude, team, $75, 3 seats | saves $15 |
| GH Copilot Enterprise 3 seats fires | `plan-fit-gh-copilot-enterprise-small` | github-copilot, enterprise, $117, 3 seats | saves $60 |
| GH Copilot Enterprise 5 seats doesn't fire | `plan-fit-gh-copilot-enterprise-small` | github-copilot, enterprise, $195, 5 seats | action=optimal |
| Solo on Cursor Business | `plan-fit-sub5-cursor-business` | cursor, business, $40, 1 seat | saves $20 |

### `src/audit-engine/__tests__/redundancy.test.ts`

Tests Category 2 rules: cross-tool redundancy.

| Test | Rule | Input | Expected |
|---|---|---|---|
| ChatGPT Plus + Claude Pro for coding | `redundant-chatgpt-plus-claude-pro-coding` | both + useCase=coding | crossToolFinding, saves $20 |
| Same tools, NOT coding | none | both + useCase=data | coding rule absent |
| ChatGPT + Claude for writing | `redundant-chatgpt-plus-claude-pro-writing` | both + useCase=writing | drop-one, saves $20 |
| Cursor + Windsurf for coding | `redundant-cursor-windsurf-coding` | both + useCase=coding | drop-one, saves windsurf spend |

### `src/audit-engine/__tests__/use-case.test.ts`

Tests Category 4 rules: wrong tool for the job.

| Test | Rule | Input | Expected |
|---|---|---|---|
| Anthropic Opus for data | `use-case-api-data-extraction` | anthropic-api, opus, $500, data | switch to Flash-Lite, estimated savings |
| OpenAI flagship for data | `use-case-api-data-extraction` | openai-api, flagship, $300, data | estimatedSavings=true |
| Haiku for data (already optimal) | none | anthropic-api, haiku, $50, data | action=optimal |
| Opus for coding (no rule) | none | anthropic-api, opus, $200, coding | no data extraction rule |
| ChatGPT Pro $200 for coding | `use-case-chatgpt-pro200-coding` | chatgpt, pro-200, $200, coding | switch, saves $160 |

### `src/audit-engine/__tests__/integration.test.ts`

Tests the full `runAudit()` function end-to-end with multiple tools.

| Test | Input | Expected |
|---|---|---|
| 3-tool audit total savings | cursor+gh-copilot+claude, 3 seats | totalMonthlySavings=135, annual=1620 |
| Cursor finding correct | cursor business 3 seats | ruleId=plan-fit-sub5-cursor-business, saves $60 |
| GH Copilot finding correct | gh enterprise 3 seats | ruleId=plan-fit-gh-copilot-enterprise-small, saves $60 |
| Claude finding correct | claude team 3 seats | ruleId=plan-fit-sub5-claude-team, saves $15 |
| Single tool audit works | chatgpt plus | findings.length=1, valid result |

### `src/audit-engine/__tests__/edge-cases.test.ts`

Tests boundary conditions and special cases.

| Test | Scenario | Expected |
|---|---|---|
| Large team optimal | cursor business 10 seats | optimal=true, savings=0 |
| Individual plan optimal | cursor pro 1 seat | optimal=true |
| GH Copilot pro optimal | github-copilot pro | optimal=true |
| Zero spend on paid plan | cursor pro $0 | data-inconsistency rule, no savings |
| Free plan always optimal | cursor hobby $0 | optimal=true |
| API tool no seat rules | anthropic-api coding | no plan-fit rules fire |
| OpenAI nano optimal | openai-api nano coding | optimal=true |
| isOptimal threshold | under $5 savings | isOptimal=true |
| Cursor pro overspend $90 | cursor pro $90 coding | upgrade-cursor-pro-over-spend, saves $30 |
| Cursor pro not overspend $50 | cursor pro $50 | no upgrade rule |

---

## Coverage Summary

```
Test Files  5 passed (5)
Tests       31 passed (31)
```

All 5 required tests from the assignment specification pass:
1. ✅ `plan-fit: cursor business with 3 seats → downgrade to pro` (plan-fit.test.ts)
2. ✅ `redundancy: chatgpt-plus + claude-pro coding → flag consolidation` (redundancy.test.ts)
3. ✅ `optimal: user already on correct plan → zero savings` (edge-cases.test.ts)
4. ✅ `use-case: anthropic api direct with data → recommend gemini flash` (use-case.test.ts)
5. ✅ `integration: full audit with 3 tools → correct total savings` (integration.test.ts)

---

## What Is NOT Tested

- External API calls (Anthropic, Resend, Firestore) — these are integration concerns
- UI rendering — visual regression is out of MVP scope
- Rate limiting — in-memory state is environment-dependent
- Honeypot filtering — server-side behavior tested manually via curl

These are documented as manual test cases in the acceptance criteria.
