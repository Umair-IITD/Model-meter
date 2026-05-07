# Model-meter — Free AI Spend Audit Tool

Model-meter is a free web app that audits what a startup or team currently pays for AI tools (Cursor, GitHub Copilot, Claude, ChatGPT, and more), identifies overspend against official vendor pricing, and surfaces actionable recommendations with quantified savings. Built as a lead-generation asset for [Credex](https://credex.ai), which resells discounted AI credits.

**Live URL:** [https://model-meter-git-main-umairs-projects-41aafdb2.vercel.app](https://model-meter-git-main-umairs-projects-41aafdb2.vercel.app)

---

## Screenshots

| Landing Page | Audit Form | Results Page |
|---|---|---|
| ![Landing](docs/screenshots/landing.png) | ![Form](docs/screenshots/form.png) | ![Results](docs/screenshots/results.png) |

> Screenshots taken from the live deployment at the URL above. See the [live app](https://model-meter-git-main-umairs-projects-41aafdb2.vercel.app) for the full interactive experience.

---

## What it does

1. You enter your AI tools, plans, monthly spend, and team size
2. A deterministic audit engine evaluates each tool against official pricing rules
3. You get an instant per-tool breakdown with monthly/annual savings
4. A ~100-word AI summary (Groq llama-3.1-8b-instant, template fallback if API fails) appears
5. Enter your email to get the report — stored in Firestore, email sent via Resend
6. A shareable public URL with Open Graph preview is created for every audit

---

## Quick Start

### Requirements
- Node.js 20+
- A Firebase project (Firestore enabled)
- Groq API key (for AI summaries; template fallback works without it — free at console.groq.com)
- Resend API key (for emails; audits work without it)

### Local development

```bash
git clone https://github.com/your-username/model-meter
cd model-meter
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for all required variables. Key ones:

| Variable | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (required for storage) |
| `GROQ_API_KEY` | AI summary generation via Groq (optional — template fallback works) |
| `RESEND_API_KEY` | Transactional emails (optional — audits work without it) |
| `NEXT_PUBLIC_APP_URL` | Full URL for OG images and email links |

### Run tests

```bash
npm test              # 31 tests, all must pass
npm run type-check    # TypeScript strict check
npm run lint          # ESLint
```

### Deploy to Vercel

Push to GitHub. Import the repo at vercel.com. Set all env vars in the Vercel dashboard. Done.

---

## Decisions

### 1. Rule-based audit engine, not LLM

The audit engine is 100% deterministic rule code (`src/audit-engine/`). No AI in the calculation path. A finance-literate person can read the rules in `plan-fit.ts`, `redundancy.ts`, `use-case.ts`, and `upgrade.ts` and verify every savings figure. This was a deliberate constraint: "knowing when not to use AI is part of the test."

### 2. Firebase over Supabase

Firebase's Spark plan requires no credit card, which matters for a student build. The document model maps cleanly to the audit result object with no joins needed. The Admin SDK bypasses Security Rules, ensuring only our server can write — a clean guarantee that PII never leaks into the public audits collection.

### 3. localStorage for form state, not URL params

Multi-tool form state (8 tools × 3 fields) creates unreadable URLs. localStorage under key `model-meter-form-v1` with a 30-day staleness check is simpler and better UX. Tradeoff: state doesn't survive cross-device sessions, acceptable for a one-time audit flow.

### 4. Groq (llama-3.1-8b-instant) for AI summaries

100-word executive summaries don't require GPT-4-level reasoning — they're structured prose generation. Groq's free tier (with `llama-3.1-8b-instant`) delivers sub-second inference. If the API fails or times out (8s limit), the template fallback produces equally useful output, so AI is additive rather than load-bearing. Easily swappable to any OpenAI-compatible provider.

### 5. In-memory rate limiting for MVP

Per-IP rate limiting uses an in-memory Map rather than Redis/Upstash. Doesn't survive cold starts or concurrent instances. Sufficient for demo traffic. Documented as a scale-up target in ARCHITECTURE.md. Avoids adding another billable service for MVP scope.

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages + API routes
    page.tsx            # Landing page
    audit/new/          # Spend input form
    audit/[uuid]/       # Results page (server component)
    api/audit/          # POST: run audit, store result
    api/leads/          # POST: capture email lead
    api/og/[uuid]/      # GET: dynamic OG image
  audit-engine/         # Core audit logic (pure TypeScript, no external calls)
    index.ts            # runAudit() entry point
    pricing.ts          # All pricing constants with source URLs
    rules/              # Plan-fit, redundancy, use-case, upgrade rules
    __tests__/          # 5 test files, 31 tests
  components/           # React components
    form/               # Spend input form components
    results/            # Audit results page components
    ui/                 # shadcn-style UI primitives
  hooks/                # usePersistedForm, useAuditForm
  lib/                  # firebase-admin, firebase-client, resend, ai-summary, schemas
docs/
  product/              # PRD, design doc, tech stack, implementation guide
  architecture/         # Audit engine spec, data model
  testing/              # Acceptance criteria, test plan
```

Full planning and specification documents are in [`/docs`](./docs/README.md).

---

## Known Limitations

- **Rate limiting is in-memory**: Per-IP limits use a server-side `Map` that resets on each cold start. Effective for low traffic; replace with Upstash Redis (`@vercel/kv`) for production scale. See ARCHITECTURE.md for the one-line upgrade path.
- **API pricing data has a fixed verification date**: Vendor prices are verified as of 2026-05-08. Some prices (especially GitHub Copilot, which is transitioning to usage-based billing June 2026) may drift. See `PRICING_DATA.md` for source URLs.
- **AI summary is best-effort**: If Groq's free tier is rate-limited, the template fallback is used silently. The fallback output is high-quality but not model-generated.
