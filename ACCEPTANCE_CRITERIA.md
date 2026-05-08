# ACCEPTANCE_CRITERIA.md — Submission Checklist

> Run through this list before submitting. Every item must pass.

---

## Hard Rejections (Automatic Rejection if Failed)

- [ ] Git commits exist on **5 or more distinct calendar days** within the 7-day window
  ```bash
  git log --pretty=format:"%ad" --date=short | sort -u | wc -l
  # Must output >= 5
  ```
- [ ] Submission made on time (≤7 days from release date)
- [ ] Google Form submitted with all 4 items (repo URL, live URL, repo structure, git history)
- [ ] Public GitHub repo (not private)
- [ ] Live deployed URL reachable (not localhost)
- [ ] `DEVLOG.md` has exactly 7 entries (one per day, including days off)
- [ ] `USER_INTERVIEWS.md` contains 3 real conversations (not fabricated)
- [ ] No secrets in the repository (no API keys, no `.env` files committed)
- [ ] All required files present at repo root (exact names, exact format)
- [ ] No website builders used (Wix, Webflow, Framer, Bubble)
- [ ] TypeScript used (justified if plain JS)

---

## Required Files at Repo Root (Check Filenames Exactly)

- [ ] `README.md`
- [ ] `ARCHITECTURE.md`
- [ ] `DEVLOG.md`
- [ ] `REFLECTION.md`
- [ ] `TESTS.md`
- [ ] `.github/workflows/ci.yml`
- [ ] `PRICING_DATA.md`
- [ ] `PROMPTS.md`
- [ ] `GTM.md`
- [ ] `ECONOMICS.md`
- [ ] `USER_INTERVIEWS.md`
- [ ] `LANDING_COPY.md`
- [ ] `METRICS.md`

---

## README.md Requirements

- [ ] 2–3 sentence summary of what you built and who it's for
- [ ] 3+ screenshots OR a 30-second screen recording (YouTube/Loom link)
- [ ] Quick start: install, run locally, deploy
- [ ] "Decisions" section with 5 trade-offs you made and why
- [ ] Link to the deployed URL

---

## ARCHITECTURE.md Requirements

- [ ] Mermaid system diagram (renders inline on GitHub)
- [ ] Data flow description: input → audit → result
- [ ] Stack justification
- [ ] "What would change for 10K audits/day" section

---

## DEVLOG.md Requirements

- [ ] Entry for every day 1–7
- [ ] Uses exact format: `## Day N — YYYY-MM-DD`, `**Hours worked:**`, `**What I did:**`, `**What I learned:**`, `**Blockers:**`, `**Plan for tomorrow:**`
- [ ] Entries written during the week, not backdated (git history verifies this)
- [ ] Days off noted honestly with reason

---

## REFLECTION.md Requirements

- [ ] All 5 questions answered
- [ ] Each answer is 150–400 words
- [ ] Q1: specific bug with hypotheses, what you tried, what worked
- [ ] Q2: decision reversed mid-week with reasoning
- [ ] Q3: what you'd build in week 2
- [ ] Q4: AI tool usage, what you didn't trust, one specific AI error you caught
- [ ] Q5: self-ratings 1–10 with one-sentence reason each

---

## TESTS.md Requirements

- [ ] Lists every automated test: filename, coverage, how to run
- [ ] Minimum 5 tests covering the audit engine
- [ ] Tests actually run: `npm test` executes them
- [ ] Tests pass with zero failures

---

## CI Requirements

- [ ] `.github/workflows/ci.yml` exists
- [ ] Triggers on `push` to `main`
- [ ] Runs lint, type-check, and tests
- [ ] **Green check on latest commit** (visible at github.com/[repo]/actions)

---

## PRICING_DATA.md Requirements

- [ ] Every pricing number in the audit engine has a source entry
- [ ] Format: `## [Tool]` then `- [Plan]: $[price] — [URL] — verified [DATE]`
- [ ] All source URLs point to official vendor pricing pages
- [ ] Dates are within the submission week

---

## PROMPTS.md Requirements

- [ ] Full system prompt for AI summary generation
- [ ] Full user prompt template
- [ ] Why you wrote it this way
- [ ] What you tried that didn't work

---

## GTM.md Requirements

- [ ] Exact target user: specific job title + company stage (not "startups")
- [ ] What they Google right before they'd want this tool
- [ ] Where they hang out online (specific subreddits, Slack groups, Discord)
- [ ] How to get first 100 users in 30 days with $0 paid (specific, not "post on Twitter")
- [ ] The "unfair distribution channel"
- [ ] What week-1 traction looks like (specific numbers)
- [ ] 300–700 words

---

## ECONOMICS.md Requirements

- [ ] What a converted lead is worth to Credex (with reasoning)
- [ ] CAC at each GTM channel
- [ ] Conversion rate math: audit → consultation → purchase
- [ ] What's required for $1M ARR in 18 months (math shown)
- [ ] 300–700 words

---

## USER_INTERVIEWS.md Requirements

- [ ] 3 real conversations
- [ ] Each: name/initials, role, company stage
- [ ] Each: 3+ direct quotes
- [ ] Each: most surprising thing they said
- [ ] Each: what it changed about your design
- [ ] 150–300 words per interview

---

## LANDING_COPY.md Requirements

- [ ] Hero headline (≤10 words)
- [ ] Subheadline (≤25 words)
- [ ] Primary CTA copy
- [ ] Social proof block (mocked is fine, labelled as mocked)
- [ ] FAQ — 5 real Q&As

---

## METRICS.md Requirements

- [ ] Single North Star metric with justification
- [ ] 3 input metrics
- [ ] What to instrument first
- [ ] Pivot trigger number
- [ ] 200–500 words

---

## MVP Feature Acceptance

### Feature 1: Input Form
- [ ] All 8 required tools present (Cursor, GitHub Copilot, Claude, ChatGPT, Anthropic API, OpenAI API, Gemini, Windsurf or v0)
- [ ] Per-tool: plan selector, monthly spend, seats
- [ ] Global: team size, use case
- [ ] Form state persists across page reload (test: fill form, hit F5, data still there)
- [ ] "Add tool" functionality works

### Feature 2: Audit Engine
- [ ] Per-tool findings with named recommendations
- [ ] Savings calculations are mathematically correct
- [ ] No LLM in the calculation path
- [ ] Source-cited pricing numbers
- [ ] 5+ tests pass

### Feature 3: Results Page
- [ ] Total monthly + annual savings shown prominently (above the fold)
- [ ] Per-tool breakdown visible
- [ ] Credex CTA shown when savings > $500/mo
- [ ] "You're spending well" shown when savings < $100/mo or isOptimal = true
- [ ] Page is visually polished (screenshot-worthy)

### Feature 4: AI Summary
- [ ] ~100-word summary appears on results page
- [ ] Template fallback works when API fails (test by invalidating API key temporarily)
- [ ] No visible error when fallback is used

### Feature 5: Lead Capture + Storage
- [ ] Email capture form appears on results page, below audit results
- [ ] Submission stores to Firestore `leads` collection
- [ ] Transactional email sent to user
- [ ] Honeypot field present in DOM (inspect element to verify)
- [ ] Rate limiting active on `/api/leads`
- [ ] PII NOT present in `audits` collection (check Firestore directly)

### Feature 6: Shareable URL
- [ ] `/audit/[uuid]` loads correctly
- [ ] Page renders PII-free (no email, company, role visible)
- [ ] OG image renders: paste URL into `https://www.opengraph.xyz/` and verify
- [ ] Twitter Card meta tags present (check via View Source)

---

## Deployment Checks

- [ ] Live URL opens in a fresh incognito browser
- [ ] All 6 MVP features work on deployed URL (not just localhost)
- [ ] No console errors on the results page
- [ ] Lighthouse mobile scores:
  - [ ] Performance ≥ 85
  - [ ] Accessibility ≥ 90
  - [ ] Best Practices ≥ 90
- [ ] HTTPS (not HTTP)
- [ ] No "localhost" references in deployed build

---

## Code Quality Checks

- [ ] No `any` TypeScript types
- [ ] No secrets in codebase (grep for API keys, passwords)
- [ ] All environment variables documented in `.env.example`
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run type-check` passes with zero errors
- [ ] Conventional Commits format used throughout
- [ ] Commit messages are descriptive (no "update", "fix", "wip")

---

## Bonus Features (Only After MVP Works)

- [ ] PDF export of audit report
- [ ] Embeddable widget (`<script>` tag)
- [ ] Benchmark mode (industry average comparison)
- [ ] Referral codes
- [ ] Blog post / Twitter thread for launch

**Do not attempt bonus features until all 6 MVP features work end-to-end on the deployed URL.**
