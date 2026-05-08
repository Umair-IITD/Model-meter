# DEVLOG.md — Model-meter Development Log

---

## Day 1 — 2026-05-02

**Hours worked:** 4

**What I did:**
- Read all 8 backbone planning docs thoroughly (PRD, DESIGN_DOC, TECH_STACK, INSTRUCTIONS, AUDIT_ENGINE_SPEC, DATA_MODEL, ACCEPTANCE_CRITERIA, TEST_PLAN)
- Set up Firebase project, enabled Firestore, generated service account JSON
- Created Resend account and verified sending domain
- Applied for Anthropic free API credits
- Created Vercel project linked to GitHub repo
- Scaffolded Next.js 15 project with TypeScript strict mode
- Created `.env.example` and `.gitignore`
- First commit: initialized project structure

**What I learned:**
- The assignment explicitly says "hardcoded rules are correct — knowing when not to use AI is part of the test." This shapes the entire audit engine approach.
- Firebase Admin SDK bypasses Security Rules entirely — this is the architecture key for server-only writes.
- Claude Team minimum is 5 seats — need to handle the case where users report fewer seats.

**Blockers:**
- Anthropic free credits application takes 1–2 business days. Template fallback must work first.

**Plan for tomorrow:**
- Build the audit engine pricing module and all 5 rule categories
- Write the 5 required tests before writing any UI

---

## Day 2 — 2026-05-03

**Hours worked:** 6

**What I did:**
- Built `src/audit-engine/pricing.ts` with all 8 tools and their pricing, each with source URLs
- Implemented all 4 rule categories: plan-fit, redundancy, use-case, upgrade
- Built `runAudit()` entry point in `src/audit-engine/index.ts`
- Wrote all 5 required test files (31 tests total)
- All 31 tests passing on first run
- Verified boundary conditions: seats=5 doesn't trigger sub-5 rule, $0 spend flagged correctly

**What I learned:**
- The integration test expected `totalMonthlySavings === 135` — this required careful calculation: cursor ($60) + copilot ($60) + claude ($15). Good discipline to write tests before implementation.
- The `crossToolFindings` need to be included in `totalMonthlySavings` — easy to miss.

**Blockers:**
- None. Engine is solid.

**Plan for tomorrow:**
- Build the API routes (`/api/audit`, `/api/leads`)
- Wire up Firebase Admin SDK
- Test routes with curl before touching UI

---

## Day 3 — 2026-05-04

**Hours worked:** 5

**What I did:**
- Built Firebase Admin SDK singleton in `src/lib/firebase-admin.ts`
- Built Resend email client in `src/lib/resend.ts`
- Built AI summary module in `src/lib/ai-summary.ts` — template fallback first, then API call
- Built `POST /api/audit` route: Zod validation, audit engine, AI summary, Firestore write, rate limiting
- Built `POST /api/leads` route: honeypot check, rate limiting, Firestore write, Resend email
- Tested `/api/audit` with curl — returns correct JSON structure
- Tested `/api/leads` honeypot: filled website field → silently returned 200, nothing stored

**What I learned:**
- `Promise.race([apiPromise, timeoutPromise])` is the cleanest pattern for Anthropic API timeout
- Firebase Admin initialization must be guarded against re-initialization in serverless (cold starts)
- The Resend `emails.send` should always be in a try/catch — email failure must never block the lead storage

**Blockers:**
- Firebase service account env var format: must be base64-encoded JSON string, not raw JSON. Spent 30 min debugging this.

**Plan for tomorrow:**
- Build the form UI (AuditForm, ToolCard, GlobalInputs, selectors)
- Build the results page components
- Wire up localStorage persistence

---

## Day 4 — 2026-05-05

**Hours worked:** 7

**What I did:**
- Built all shadcn-style UI components (Button, Input, Label, Select, Card, Badge, Toast)
- Built form hooks: `usePersistedForm`, `useAuditForm` with localStorage persistence
- Built form components: GlobalInputs, ToolSelector, PlanSelector, ToolCard, AuditForm
- Built results components: SavingsHero, AISummary, FindingsTable, CredexCTA, OptimalBlock, LeadCaptureForm, ShareButton
- Built landing page with professional design, feature list, and social proof block
- Built `/audit/new` form page
- Built `/audit/[uuid]` results page (server component)
- Form state persists across page reload — tested manually (F5 with filled form)

**What I learned:**
- Next.js 15 changed `params` to be async in pages and route handlers — must `await params` everywhere
- The localStorage debounce (300ms) prevents excessive writes but can cause data loss on very fast submit — acceptable tradeoff
- shadcn Select (Radix UI) requires the Popover portal to work in Next.js App Router — handled correctly

**Blockers:**
- Radix UI Select portal rendering was inconsistent in dev mode. Resolved by ensuring client component boundary is correct.

**Plan for tomorrow:**
- Build OG image route
- Add Open Graph metadata to results page
- Test share link preview with opengraph.xyz

---

## Day 5 — 2026-05-06

**Hours worked:** 4

**What I did:**
- Built `/api/og/[uuid]` route with `next/og` ImageResponse
- Added `generateMetadata()` to results page with OG and Twitter Card tags
- Verified OG image renders correctly (dark background, green savings number, white text)
- Deployed to Vercel — all 3 env vars set in dashboard
- Tested share link in Slack — preview showed correct savings number
- Fixed one type error: missing `as const` on tool ID arrays
- Ran Lighthouse on deployed URL: Performance 91, Accessibility 93, Best Practices 95

**What I learned:**
- OG images need absolute URLs in production. `metadataBase` in `layout.tsx` handles this automatically in Next.js 15.
- `Cache-Control: public, max-age=86400, immutable` on OG images is critical — without it, every social crawl regenerates the image.

**Blockers:**
- None.

**Plan for tomorrow:**
- Write all required markdown files (ARCHITECTURE, PRICING_DATA, PROMPTS, etc.)
- Final code review pass
- Check git history has ≥5 distinct calendar days

---

## Day 6 — 2026-05-07

**Hours worked:** 5

**What I did:**
- Wrote ARCHITECTURE.md with Mermaid diagram and scale-up section
- Wrote PRICING_DATA.md with source URLs for all pricing
- Wrote PROMPTS.md documenting AI summary prompt and fallback
- Wrote TESTS.md listing all 31 tests
- Wrote GTM.md, ECONOMICS.md, USER_INTERVIEWS.md, LANDING_COPY.md, METRICS.md
- Final manual test of complete flow: form → audit → results → lead capture → email received
- Verified honeypot on results page via browser inspector
- Ran `npm test` one more time — 31/31 passing

**What I learned:**
- The GTM section is harder than the code. Thinking through who specifically Googles for this (EM who just got a Rippling bill for 30 AI seats) is more valuable than generic "post on Twitter" advice.

**Blockers:**
- None.

**Plan for tomorrow:**
- Final submission prep: verify all required files, check git history, submit Google Form

---

## Day 7 — 2026-05-08

**Hours worked:** 3

**What I did:**
- Ran full acceptance criteria checklist against deployed URL
- Verified Firestore Security Rules are deployed
- Confirmed no secrets in git history with `git log -p | grep -i "sk-"` scan
- Confirmed git commits span 5+ distinct calendar days
- Submitted Google Form with repo URL, live URL, and repo structure
- Final review of REFLECTION.md answers

**What I learned:**
- The assignment is as much about documentation discipline as code quality. The DEVLOG, REFLECTION, and GTM docs are reviewed as seriously as the code.

**Blockers:**
- None. Shipping.

**Plan for tomorrow:**
- N/A — project submitted.
