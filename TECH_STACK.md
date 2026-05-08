# TECH_STACK.md — Model-meter Technology Decisions

> Every choice is justified. Trade-offs are explicit. Firebase rationale is addressed per subsystem.

---

## Final Recommended Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Firebase Firestore |
| Auth | None (no login required) |
| AI | Anthropic API (`claude-haiku-4-5`) |
| Email | Resend |
| OG Images | `@vercel/og` (next/og) |
| Form state | localStorage (custom hook) |
| Validation | Zod |
| Testing | Vitest + Testing Library |
| Linting | ESLint + Prettier |
| CI | GitHub Actions |
| Deployment | Vercel |
| Rate limiting | In-memory Map (MVP); Upstash KV if needed |

---

## Framework: Next.js 15 (App Router)

**Why:** The assignment requires shareable URLs with Open Graph previews. Next.js 15 App Router provides the cleanest path to this with:
- `next/og` (ImageResponse) for dynamic OG image generation at `/api/og/[uuid]` — built-in, zero additional dependencies
- Server Components for the results page: fetch Firestore data server-side, no client-side loading states for the main content
- Route Handlers for `/api/audit` and `/api/leads`
- Native TypeScript support
- Vercel deployment is one-click

**Why not Vue/Svelte/SolidJS:** All are acceptable per the assignment constraints. Next.js is chosen because OG image generation support is the most mature and the Vercel deployment pipeline removes deployment friction. For a 7-day build, removing friction matters.

**Why not vanilla:** The routing complexity (dynamic `[uuid]` segments, API routes, metadata API) makes vanilla significantly harder to maintain cleanly within the timeline.

---

## Language: TypeScript (Strict)

**Why:** Assignment says "TypeScript strongly preferred." `tsconfig` with `"strict": true`. No plain JavaScript files in `src/`. Type safety in the audit engine prevents silent savings calculation bugs.

---

## Styling: Tailwind CSS + shadcn/ui

**Why Tailwind:** Utility-first, no CSS file sprawl, tree-shaken in production. Passes Lighthouse Best Practices.

**Why shadcn/ui:** Radix UI primitives underneath — keyboard accessible, screen-reader compatible out of the box. This is the path of least resistance to hitting Lighthouse Accessibility ≥ 90. Components are copied into the repo (not a runtime dependency), so they're fully customizable.

**Why not MUI or Mantine:** Heavier bundle, less control over design language. Model-meter should look like a precision financial tool, not an admin dashboard.

---

## Database: Firebase Firestore

**Rationale (per subsystem):**

### Audit storage (`audits` collection)
**Firebase is appropriate here.** Requirements: write once on audit creation, read many times (every page load of `/audit/[uuid]`). Firestore's real-time capabilities are not needed — but the generous free tier (50K reads/day, 20K writes/day on Spark plan) is sufficient for a 7-day demo. The document model maps cleanly to the audit result object.

**Alternative considered: Supabase PostgreSQL.** Supabase would be fine here and the research brief recommends it. Firebase is chosen instead because: (1) the Firebase Admin SDK integrates more cleanly with Next.js Route Handlers for server-side writes when you don't want to expose connection strings, (2) Firebase's free Spark plan has no credit card requirement (important for a student build), (3) client-side reads from Firestore work without a server hop for the results page if needed. **Trade-off:** Firestore has weaker querying than PostgreSQL. For this use case (fetch by UUID, no complex queries), this is irrelevant.

### Lead storage (`leads` collection)
**Firebase is appropriate here.** Leads are write-once, read by Credex team later via Firebase console. No joins needed. Firestore is fine.

### Rate limiting
**Firebase is NOT used here.** Firestore is not appropriate for rate limiting — the read/write costs make it expensive for high-frequency checks, and it lacks atomic increment + expiry semantics. Rate limiting is implemented as an in-memory Map in the Next.js serverless function. **Limitation:** In-memory state doesn't persist across Vercel cold starts or across concurrent instances. For a 7-day demo with low traffic, this is acceptable. Document this trade-off explicitly in ARCHITECTURE.md and REFLECTION.md.

**Alternative if needed:** Upstash Redis (Vercel KV) — one `npm install @vercel/kv` and a few env vars. Add this in Day 5 if time permits.

### Sessions / Auth
**Not applicable.** No login. No session storage.

---

## AI: Anthropic API — `claude-haiku-4-5`

**Why Haiku, not Sonnet or Opus?** The task is generating a 100-word summary from structured JSON. This is a simple prose generation task, not a reasoning task. Haiku is faster (lower latency on the results page), cheaper (important if Credex actually launches this), and the quality difference for this use case is negligible. If free API credits are limited, Haiku stretches them further.

**Why Anthropic, not OpenAI?** Assignment says "Anthropic API preferred." Apply for free credits on Day 1.

**Fallback:** If no API key is available, the template fallback must work correctly. Build and test the fallback first, then layer in the real API call. Never let an API dependency block shipping.

---

## Email: Resend

**Why Resend over Postmark/SES?** Resend has the cleanest Next.js/React integration, a generous free tier (3,000 emails/month), and the API is the simplest of the three. `@resend/node` is one import. For a 7-day build, this matters.

**Why not Postmark:** Equally good, slightly more setup friction. Either is fine — choose Resend.

**Why not SES:** AWS credential management is overkill for this scope. SES is the right choice at scale, not for a 7-day MVP.

---

## OG Images: `@vercel/og` (next/og)

**Why:** Built into Next.js. Zero additional infrastructure. Dynamic image generation at the edge with JSX. Exactly what the assignment requires: unique OG preview per audit UUID showing the savings number.

**Usage:**
```typescript
// app/api/og/[uuid]/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(req, { params }) {
  const audit = await getAudit(params.uuid);
  return new ImageResponse(
    <div style={{ /* OG image design */ }}>
      <span>This audit found ${audit.totalAnnualSavings.toLocaleString()}/year in savings</span>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

---

## Form State: localStorage (Custom Hook)

**Why not URL params (nuqs):** Multi-tool form state (8 tools × 3 fields = 24 field values) creates unwieldy URLs. localStorage is the right tool for "persist a complex form across reloads."

**Why not React state only:** Reloads lose state. Assignment explicitly requires persistence across reloads.

**Implementation:**
```typescript
// hooks/usePersistedForm.ts
function usePersistedForm<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  
  return [state, setState] as const;
}
```

---

## Validation: Zod

**Why:** TypeScript-first schema validation. Used for:
- Validating `POST /api/audit` request body
- Validating `POST /api/leads` request body
- Parsing Firestore documents back to typed objects

Single source of truth for data shapes shared between client and server via `lib/schemas.ts`.

---

## Testing: Vitest + Testing Library

**Why Vitest over Jest:** Faster, native ESM support, compatible with the Vite toolchain that Next.js 15 uses internally. Assignment requires ≥5 tests that "actually run" — reviewers will run `npm test`.

**Why Testing Library:** For any UI component tests (e.g., form renders correctly). Not the focus — the focus is unit testing the audit engine.

**Test file locations:**
```
src/audit-engine/__tests__/
  plan-fit.test.ts
  redundancy.test.ts
  use-case.test.ts
  integration.test.ts
  edge-cases.test.ts
```

---

## Linting: ESLint + Prettier

**Config:** `next/core-web-vitals` + TypeScript rules + Prettier for formatting. No custom rules beyond defaults. Consistency matters, custom rules waste time.

**CI enforcement:** `npm run lint` fails the CI pipeline on any error.

---

## CI: GitHub Actions

**File:** `.github/workflows/ci.yml`

**Triggers:** `push` to `main`, `pull_request` to `main`

**Steps:**
1. `npm ci`
2. `npm run lint`
3. `npm run type-check` (`tsc --noEmit`)
4. `npm test` (Vitest)

**Must show green checks on latest commit.** This is checked programmatically in the review.

---

## Deployment: Vercel

**Why:** One-click deployment from GitHub, native Next.js support, edge functions for OG image generation, automatic preview deployments per branch, free hobby tier sufficient for demo traffic. The assignment mentions "Vercel, Netlify, Cloudflare Pages, Render, Fly.io" — Vercel is the obvious choice for Next.js.

**Environment variables configured in Vercel dashboard:**
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT` (base64-encoded service account JSON)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Alternatives Rejected

| Alternative | Rejected Because |
|-------------|-----------------|
| Supabase | Firebase chosen instead — no credit card for free tier, slightly simpler Auth-less setup. Either is correct. |
| Remix | Less mature OG image tooling, smaller ecosystem for this use case |
| Planetscale / Turso | SQL is overkill for this document-shaped data with no relational queries |
| Upstash Redis (for primary storage) | Redis is not a document store; ill-suited for audit result shape |
| Clerk | No auth needed — adding Clerk would be gold-plating |
| tRPC | Adds abstraction without clear benefit at this scale |
| React Query / TanStack | Overkill for this number of data fetching points |
| Puppeteer for OG | next/og is 10x simpler and handles the same requirement |
