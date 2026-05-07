# TEST_PLAN.md — Model-meter Testing Strategy

> Minimum: 5 passing tests covering the audit engine. Reviewers will run `npm test`. They must pass from a fresh `npm ci`.

---

## Testing Stack

- **Unit/integration tests:** Vitest (`npm test`)
- **Type checking:** `tsc --noEmit` (`npm run type-check`)
- **Linting:** ESLint (`npm run lint`)
- **Manual testing:** localhost + deployed URL

No E2E tests required for MVP (Playwright/Cypress are overkill for a 7-day build). Manual testing of the full flow is sufficient.

---

## Test File Structure

```
src/
  audit-engine/
    __tests__/
      plan-fit.test.ts        # Category 1 rules
      redundancy.test.ts      # Category 2 cross-tool rules
      use-case.test.ts        # Category 4 use-case alignment rules
      integration.test.ts     # Full runAudit() with multiple tools
      edge-cases.test.ts      # Boundary conditions, optimal cases
```

---

## Required Test Cases (Minimum 5, All Must Pass)

### Test 1 — Plan Fit: Cursor Business small team
**File:** `plan-fit.test.ts`
**Input:**
```typescript
{
  teamSize: 3,
  useCase: 'coding',
  tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 }]
}
```
**Expected:**
```typescript
findings[0].ruleId === 'plan-fit-sub5-cursor-business'
findings[0].recommendedAction === 'downgrade'
findings[0].projectedMonthlySavings === 60   // 20 × 3
result.totalMonthlySavings === 60
result.totalAnnualSavings === 720
result.isOptimal === false
```

---

### Test 2 — Redundancy: ChatGPT Plus + Claude Pro for coding
**File:** `redundancy.test.ts`
**Input:**
```typescript
{
  teamSize: 1,
  useCase: 'coding',
  tools: [
    { toolId: 'chatgpt', planId: 'plus', monthlySpend: 20, seats: 1 },
    { toolId: 'claude', planId: 'pro', monthlySpend: 20, seats: 1 },
  ]
}
```
**Expected:**
```typescript
// CrossToolFinding present
result.crossToolFindings.length >= 1
result.crossToolFindings[0].ruleId === 'redundant-chatgpt-plus-claude-pro-coding'
result.crossToolFindings[0].projectedMonthlySavings === 20
result.totalMonthlySavings >= 20
```

---

### Test 3 — Optimal: User already on correct plan
**File:** `edge-cases.test.ts`
**Input:**
```typescript
{
  teamSize: 10,
  useCase: 'coding',
  tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 400, seats: 10 }]
}
```
**Expected:**
```typescript
findings[0].recommendedAction === 'optimal'
findings[0].projectedMonthlySavings === 0
result.totalMonthlySavings === 0
result.isOptimal === true
// No false savings claimed
```

---

### Test 4 — Use Case: API direct with data use case
**File:** `use-case.test.ts`
**Input:**
```typescript
{
  teamSize: 2,
  useCase: 'data',
  tools: [{ toolId: 'anthropic-api', planId: 'opus', monthlySpend: 500, seats: 1 }]
}
```
**Expected:**
```typescript
findings[0].ruleId === 'use-case-api-data-extraction'
findings[0].recommendedAction === 'switch'
findings[0].projectedMonthlySavings > 0
findings[0].estimatedSavings === true
// Reason mentions the cost differential
findings[0].reason.includes('Flash') || findings[0].reason.includes('50x')
```

---

### Test 5 — Integration: Full audit with 3 tools, correct totals
**File:** `integration.test.ts`
**Input:**
```typescript
{
  teamSize: 3,
  useCase: 'coding',
  tools: [
    { toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 },    // should flag: saves $60
    { toolId: 'github-copilot', planId: 'enterprise', monthlySpend: 117, seats: 3 }, // should flag: saves $60
    { toolId: 'claude', planId: 'team', monthlySpend: 75, seats: 3 },          // should flag: saves $15
  ]
}
```
**Expected:**
```typescript
result.findings.length === 3
result.totalMonthlySavings === 135  // 60 + 60 + 15 (verify against actual rule output)
result.totalAnnualSavings === 1620
result.isOptimal === false
// Each finding has required fields
result.findings.every(f => f.ruleId && f.reason && f.recommendedAction)
```

---

## Additional Test Cases (Write These After the 5 Required)

### Edge Case: Zero spend on paid plan
**Scenario:** User enters $0 for Cursor Pro
**Expected:** Engine flags inconsistency, returns neutral finding, does NOT claim savings

### Edge Case: Solo user on team plan
**Scenario:** 1 seat on Claude Team
**Expected:** Triggers `plan-fit-solo-team-plan`, correct savings calculation

### Edge Case: All tools already optimal (large team)
**Scenario:** 20 seats on Cursor Business
**Expected:** `isOptimal === true`, `totalMonthlySavings === 0`

### Edge Case: API direct tool (no seats)
**Scenario:** Anthropic API with coding use case, reasonable spend
**Expected:** No seat-based rules fire, only use-case rules apply

### Edge Case: Enterprise plan flag for unknown pricing
**Scenario:** Claude Enterprise
**Expected:** Returns informational finding with no specific savings claimed (pricing is custom)

### Boundary: Sub-5 threshold exactly at 5
**Scenario:** Cursor Business with seats = 5
**Expected:** Rule does NOT fire (5 is not less than 5)

### Boundary: Sub-5 threshold at 4
**Scenario:** Cursor Business with seats = 4
**Expected:** Rule fires

---

## What NOT to Test

- External API calls (Anthropic, Resend, Firestore) — these are integration concerns, not unit test concerns. Mock them in tests that need to verify behavior around them.
- UI rendering — visual regression is out of scope for MVP.
- Exact Lighthouse scores — manual check before submission.
- Transactional email delivery — trust Resend's test mode.

---

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "lint": "next lint"
  }
}
```

---

## How Reviewers Will Run Tests

```bash
git clone [repo]
cd model-meter
npm ci           # clean install
npm run lint     # must pass
npm run type-check  # must pass
npm test         # must pass — all tests green
```

Your tests must pass from a clean `npm ci` with no special environment setup. The audit engine tests must not require any environment variables (no API keys in the test path).
