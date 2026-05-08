# INSTRUCTIONS.md — Implementation Guide for Claude Code

> This file is the execution plan. Read PRD.md, DESIGN_DOC.md, TECH_STACK.md, AUDIT_ENGINE_SPEC.md, and DATA_MODEL.md before writing any code. Follow this order exactly.

---

## Pre-Implementation Checklist

Before writing any code:
- [ ] Read all planning documents in this directory
- [ ] Verify pricing data against official vendor URLs (PRICING_DATA.md)
- [ ] Apply for Anthropic free API credits (do this on Day 1)
- [ ] Create Firebase project, enable Firestore, get service account JSON
- [ ] Create Resend account, get API key, verify sending domain
- [ ] Create Vercel project linked to GitHub repo

---

## Implementation Order (Phases)

### Phase 1 — Foundation (Day 1–2)
Goal: Running app skeleton with routing, Firestore connected, CI green.

**Files to create:**
```
.github/workflows/ci.yml
.env.example                     # all env vars, no values
.env.local                       # actual values, git-ignored
next.config.ts
tsconfig.json                    # strict: true
tailwind.config.ts
components.json                  # shadcn config
package.json
src/
  lib/
    firebase-admin.ts            # Admin SDK init (server-side)
    firebase-client.ts           # Client SDK init (browser-side)
    schemas.ts                   # Zod schemas for all data shapes
    resend.ts                    # Resend client init
  app/
    layout.tsx                   # Root layout, fonts, metadata
    page.tsx                     # Landing page (placeholder content)
    audit/
      new/
        page.tsx                 # Form page (placeholder)
      [uuid]/
        page.tsx                 # Results page (placeholder)
    api/
      audit/
        route.ts                 # POST handler (skeleton, returns mock)
      leads/
        route.ts                 # POST handler (skeleton)
      og/
        [uuid]/
          route.tsx              # OG image (skeleton)
```

**Validation gate:** `npm run lint` passes, `npm run type-check` passes, `npm test` runs (even with 0 tests passing), app loads on localhost without errors.

---

### Phase 2 — Audit Engine (Day 2–3)
Goal: The engine is complete, tested, and correct before any UI is wired up.

**Files to create:**
```
src/
  audit-engine/
    index.ts          # runAudit() entry point
    pricing.ts        # PRICING constant — all tools, all plans
    rules/
      plan-fit.ts     # Plan-fit rules (sub-5-user, solo-on-team)
      redundancy.ts   # Cross-tool redundancy rules
      use-case.ts     # Use-case alignment rules
      upgrade.ts      # Upgrade-to-save rules
    types.ts          # AuditInput, AuditResult, ToolFinding types
    __tests__/
      plan-fit.test.ts
      redundancy.test.ts
      use-case.test.ts
      integration.test.ts
      edge-cases.test.ts
PRICING_DATA.md       # Filled in as you build pricing.ts
```

**Rules for building pricing.ts:**
1. Open each official pricing URL in PRICING_DATA.md
2. Verify the number on the live page before adding it to the constant
3. Add a comment with the URL and date: `// $40/seat — https://cursor.com/pricing — verified 2026-05-08`
4. If a price is ambiguous or hidden behind login, use the conservative (higher) estimate and note it

**Rules for writing tests:**
- Each test must import from `audit-engine/index.ts` — no mocking the engine internals
- Use real input shapes (matching the Zod schema)
- Tests must actually assert on the output, not just that the function runs
- Required tests (minimum 5):
  1. `plan-fit: cursor business with 3 seats should recommend downgrade to pro`
  2. `redundancy: chatgpt-plus + claude-pro same use case should flag consolidation`
  3. `optimal: user already on correct plan should return 'optimal' with zero savings`
  4. `use-case: anthropic api direct with data use case should recommend gemini flash`
  5. `integration: full audit with 3 tools returns correct total monthly savings`

**Validation gate:** `npm test` passes all 5 tests. Run `npm test -- --reporter=verbose`.

---

### Phase 3 — API Routes (Day 3)
Goal: `/api/audit` and `/api/leads` work correctly end-to-end.

**`/api/audit` route:**
1. Parse and validate request body with Zod (reject with 400 if invalid)
2. Call `runAudit()` from the engine
3. Generate UUID: `crypto.randomUUID()`
4. Call Anthropic API for summary (wrap in try/catch with 8s timeout)
5. Write to Firestore `audits` collection using Admin SDK
6. Return JSON response

**`/api/leads` route:**
1. Check honeypot field — if non-empty, return `{ success: true }` silently
2. Rate limit check (in-memory Map)
3. Validate email format
4. Write to Firestore `leads` collection
5. Call Resend to send transactional email (wrap in try/catch — don't fail if email fails)
6. Return `{ success: true }`

**Testing these routes:** Use `curl` or a simple test script to verify before wiring up UI.

---

### Phase 4 — Input Form UI (Day 3–4)
Goal: The form page is visually complete and functional.

**Component structure:**
```
src/
  components/
    form/
      AuditForm.tsx           # Main form container (client component)
      ToolCard.tsx            # Single tool entry card
      ToolSelector.tsx        # Dropdown to pick tool
      PlanSelector.tsx        # Dynamic plan options based on tool
      GlobalInputs.tsx        # Team size + use case
    ui/                       # shadcn components (copied here)
```

**Form state hook:**
```typescript
// hooks/useAuditForm.ts
// Wraps usePersistedForm with the audit-specific schema
// Exports: formState, updateTool, addTool, removeTool, reset
```

**Submission flow:**
1. Validate: at least one tool added
2. POST to `/api/audit`
3. On success: `router.push('/audit/' + response.auditId)`
4. On error: show toast error, stay on form

**Do NOT:**
- Use `<form>` with native submit (use button with `onClick` handler)
- Reload the page on submit
- Clear localStorage before the redirect (clear it after results load)

---

### Phase 5 — Results Page UI (Day 4)
Goal: The results page is visually strong, complete, and shareable.

**Component structure:**
```
src/
  components/
    results/
      SavingsHero.tsx          # Big monthly/annual savings numbers
      AISummary.tsx            # Summary paragraph with loading state
      FindingsTable.tsx        # Per-tool breakdown
      CredexCTA.tsx            # Conditional Credex promo block
      OptimalBlock.tsx         # Conditional "You're doing well" block
      LeadCaptureForm.tsx      # Email capture form
      ShareButton.tsx          # Copy URL, show toast
```

**Data fetching:**
- Results page is a Server Component
- Fetch audit from Firestore using Admin SDK (server-side) by UUID
- Pass data as props to client components
- No loading spinner for main content (SSR)

**Conditional rendering logic:**
```typescript
const showCredexCTA = audit.totalMonthlySavings > 500;
const showOptimalBlock = audit.totalMonthlySavings < 100;
// Between 100-500: neither block shown, just standard recommendations
```

**Visual requirements:**
- Total savings must be the largest text on the page (hero section)
- Per-tool breakdown must be scannable at a glance (use a table or cards with clear columns)
- Credex CTA must be visually distinct (different background color)
- Mobile responsive — check on 375px viewport

---

### Phase 6 — OG Images + Metadata (Day 5)
Goal: Sharing the audit URL produces a professional link preview.

**`/api/og/[uuid]/route.tsx`:**
```typescript
import { ImageResponse } from 'next/og';

export async function GET(req, { params }) {
  const audit = await getAuditPublic(params.uuid);
  if (!audit) return new Response('Not found', { status: 404 });
  
  return new ImageResponse(
    // JSX design here — dark bg, white text, savings number prominent
    // See DESIGN_DOC section 2 for spec
    ,
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    }
  );
}
```

**Metadata in results page:**
```typescript
// app/audit/[uuid]/page.tsx
export async function generateMetadata({ params }) {
  const audit = await getAuditPublic(params.uuid);
  return {
    title: `AI Spend Audit — $${audit.totalMonthlySavings}/mo savings identified`,
    description: audit.summary,
    openGraph: {
      images: [{ url: `/api/og/${params.uuid}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  };
}
```

**Test this:** Share the audit URL in Slack or use `https://www.opengraph.xyz/` to verify the preview renders correctly.

---

### Phase 7 — Polish, Docs, and Submission Prep (Day 5–7)
Goal: Everything is shipped, documented, and repo-ready.

**Files to write (required by assignment):**
```
README.md
ARCHITECTURE.md     # condensed from DESIGN_DOC.md + Mermaid diagram
DEVLOG.md           # one entry per day (write daily, not at the end)
REFLECTION.md       # 5 questions, 150-400 words each
TESTS.md            # list of all tests with filenames
PRICING_DATA.md     # source URLs for every price in the engine
PROMPTS.md          # full prompts + reasoning + what didn't work
GTM.md              # go-to-market plan
ECONOMICS.md        # unit economics
USER_INTERVIEWS.md  # 3 real conversations (conduct these Day 1-3)
LANDING_COPY.md     # headline, CTA, FAQ
METRICS.md          # North Star + 3 input metrics
```

**Lighthouse check:**
- Run Lighthouse on the deployed URL
- Target: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- Fix accessibility issues first (they're usually easiest: aria labels, contrast, focus states)

**Git history check:**
```bash
git log --pretty=format:"%ad" --date=short | sort -u | wc -l
# Must output 5 or higher
```

---

## Coding Conventions

### File naming
- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Route handlers: `route.ts` (Next.js convention)
- Test files: `*.test.ts` or `*.test.tsx`

### Imports
- Absolute imports via `@/` alias (configured in tsconfig)
- Group: external libraries → internal libs → components → types
- No barrel files (no `index.ts` re-exporting everything) — they obscure what's actually used

### TypeScript
- `strict: true` in tsconfig
- No `any` types — use `unknown` and narrow
- All function parameters and return types explicitly typed for public functions
- Use `z.infer<typeof Schema>` for Zod-derived types

### Error handling
- Every `async` function that calls external services wrapped in try/catch
- API routes return typed error responses: `{ error: string }` with appropriate HTTP status
- Never return a 500 when a 400 would be more accurate

### Comments
- No comments that explain what the code does (the code should be readable)
- Comments that explain WHY a decision was made are valuable:
  ```typescript
  // Using haiku not sonnet — 100-word summary doesn't need reasoning capability
  // and haiku is 5x cheaper at this token length
  ```

### Commit messages
Use Conventional Commits format. Examples:
```
feat: implement cursor plan-fit rules in audit engine
fix: handle anthropic api timeout gracefully in summary generation
test: add edge case for 0-savings optimal audit result
docs: add pricing sources for github copilot enterprise
chore: configure vercel environment variables
refactor: extract savings calculation to pure function for testability
```

**Do NOT commit:**
```
update
fix
wip
asdf
final
final2
```

---

## Data Model Expectations

See DATA_MODEL.md for full schema. Key points:

- Zod schemas in `src/lib/schemas.ts` are the canonical type definitions
- TypeScript types are derived from Zod schemas (`z.infer<>`)
- Firestore documents match the Zod schemas exactly — no transformation layer
- The `audits` collection is written once, never updated
- The `leads` collection is write-only from the app (read only via Firebase console)

---

## Testing Expectations

- Tests live in `src/audit-engine/__tests__/`
- Run with: `npm test`
- Must pass with zero failures
- Do not mock the audit engine in integration tests — test the real function
- Do not write tests that only check that a function doesn't throw — assert on output values
- The assignment says "We will run them" — they must pass from a fresh `npm ci`

**Test coverage minimum:** The 5 required tests plus any additional tests you write to cover edge cases discovered during development. More is better but correctness beats quantity.

---

## CI Expectations

**`.github/workflows/ci.yml` must:**
- Trigger on `push` to `main` and `pull_request` to `main`
- Run: lint, type-check, test
- Pass on the latest commit (green check visible on GitHub)
- Not require any secrets to run lint/type-check/test (audit engine tests don't hit external APIs)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

---

## Do's and Don'ts for Claude Code

### DO:
- Build the audit engine first, test it, then wire up UI
- Write the fallback summary template before the Anthropic API call
- Test every API route with curl before connecting to the UI
- Check Firestore Security Rules are deployed correctly
- Commit after each meaningful unit of work (not just at end of day)
- Write DEVLOG.md entries daily (set a calendar reminder)
- Conduct user interviews in Days 1–3 (they take time to schedule)
- Run Lighthouse before submission day, not on submission day
- Verify the OG image renders with a real tool (opengraph.xyz)
- Keep the `audits` Firestore collection completely free of PII

### DO NOT:
- Use `any` in TypeScript
- Call the Anthropic API in the audit engine calculation (only for summary)
- Store email or company name in the `audits` collection
- Put API keys in code or commit them
- Use `<form>` with native submit — use `onClick` handlers
- Block the results page on the AI summary (generate it in parallel or accept the latency)
- Manufacture savings when the audit is genuinely optimal
- Use "update", "fix", "wip" as commit messages
- Backdate DEVLOG.md entries (git history will expose this)
- Hardcode any pricing number without a comment citing the source URL

### DO NOT GUESS:
- The exact plan pricing for any tool — verify against official URLs
- How Firestore Security Rules work — read the docs
- Whether a Next.js API route is running server-side or client-side
- Whether env vars are available in client components (they're not, unless prefixed `NEXT_PUBLIC_`)

---

## Anything That Must Not Be Guessed During Implementation

1. **Pricing numbers:** Every number in `pricing.ts` must be verified against an official vendor pricing page on the day of verification. Do not copy from the research brief without checking.

2. **Firestore collection names:** Use exactly `audits` and `leads`. These are referenced in Security Rules and must match.

3. **Env var names:** Use exactly the names in `.env.example`. Any mismatch causes silent failures in production.

4. **OG image dimensions:** Must be exactly 1200×630 for Twitter Cards and Open Graph compatibility.

5. **Honeypot field name:** Use `website` — common enough that bots will fill it, but must not be the name of any real form field.

6. **AI model name for summary:** Use `claude-haiku-4-5-20251001` (check current model string at docs.anthropic.com — model strings change).

7. **UUID format:** Use `crypto.randomUUID()` — do not implement a custom UUID generator.

8. **Firestore Admin SDK initialization:** Must use service account credentials on the server, not the client SDK. Client SDK is for browser-side reads only (and only if Firestore Security Rules allow it).

9. **GitHub Actions Node version:** Use Node 20. Node 18 reaches EOL — don't use it.

10. **shadcn/ui installation:** Run `npx shadcn@latest init` and `npx shadcn@latest add [component]` — do not manually copy component files.
