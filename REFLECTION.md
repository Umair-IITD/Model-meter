# REFLECTION.md — Model-meter Post-Mortem

---

## Q1: Describe a specific bug you hit, your hypotheses about its cause, what you tried, and what ultimately fixed it.

**Bug:** The integration test for 3-tool audit was returning `totalMonthlySavings = 120` instead of the expected `135`.

**Initial observation:** The cursor ($60) and github-copilot ($60) findings were correct, but the claude finding was returning $0 instead of $15. The audit result showed `recommendedAction: 'optimal'` for claude despite the team having only 3 seats on the Team plan.

**Hypothesis 1:** The `plan-fit-sub5-claude-team` rule wasn't registering correctly. I checked the trigger condition: `tool.toolId === 'claude' && tool.planId === 'team' && tool.seats < 5`. The test input was `{ toolId: 'claude', planId: 'team', seats: 3 }`. All conditions should match. Added a `console.log` — the rule function was never being called.

**Hypothesis 2:** The rule was being short-circuited by the zero-spend guard. I checked: test input had `monthlySpend: 75`. The guard only fires when `monthlySpend === 0 && !['free', 'hobby'].includes(planId)`. That guard shouldn't have affected the Team plan test.

**Root cause:** The `plan-fit-sub5-claude-team` rule was not included in the `planFitRules` array in `plan-fit.ts`. I had defined the rule object but forgotten to add it to the array. The function would iterate `planFitRules.filter(...)` but the rule was never in the collection to filter.

**Fix:** Added the missing rule to the `planFitRules` array. Test passed immediately. All 31 tests green.

**What I'd do differently:** Write a test for every rule before writing the rule implementation. The TDD approach would have caught this immediately — the test would have failed on the missing rule, not on a mysterious $0 savings total.

---

## Q2: Describe a decision you reversed mid-week and why.

**Original decision:** Store the full audit result in localStorage after submission, then read from localStorage on the results page. This would eliminate the Firestore read on the results page entirely and make the app feel instant.

**Why it seemed good at first:** Faster results page load (no server round-trip), simpler architecture for the initial prototype, and the data is already on the client from the form submission response.

**Why I reversed it:** Three problems emerged when I actually built the share URL feature:

1. **Share links break.** If the audit result is only in localStorage, someone who receives the share link from a colleague gets a blank results page. The whole value of the shareable URL is lost.

2. **localStorage is ephemeral.** If the user closes the browser, clears data, or switches to incognito, their audit is gone. For a financial report they might want to reference next week, this is a bad experience.

3. **Security rules are unenforceable.** If the results page reads from localStorage, I can't enforce the PII separation guarantee — anyone can inspect localStorage and see whatever was stored there.

**New approach:** Results page is a server component that reads from Firestore by UUID. The Firestore write is the source of truth. This is correct by design: the URL is the handle, Firestore is the store, the page is a view. Takes ~200ms extra to load but this is acceptable and SSR makes it feel instant anyway.

---

## Q3: What would you build in week 2?

**Priority 1: Usage-based API tracking.** The current audit only works if users remember their monthly spend. Most developers don't know this number — they'd need to log into the Anthropic/OpenAI dashboard and check. Week 2 would add an optional "Connect your API account" flow that reads actual token usage via the vendor's usage API, then populates the form automatically. This dramatically increases audit accuracy and removes the #1 friction point in the form.

**Priority 2: Team audit sharing.** Right now, the audit is created by one person. An engineering manager filling this out often wants to share it with their CTO or CFO for approval before acting. A "collaborate" button that generates a private link with a comment thread would make the handoff smoother and increase Credex's conversion rate on high-savings audits.

**Priority 3: Saved history + comparison.** After an EM implements the first round of recommendations, they want to run a follow-up audit 3 months later to see if spend changed. This requires a lightweight identity layer — probably just email-based magic links, not full OAuth — and audit history stored against the email. The "you saved $X since your last audit" metric would be a strong retention hook.

---

## Q4: Describe your AI tool usage in this project. What did you trust? What did you distrust? Describe one specific AI error you caught.

**What I trusted:** AI was useful for boilerplate generation (Radix UI component wiring, Next.js route handler structure, Tailwind class sequences) and for prose drafting (GTM copy, LANDING_COPY, email templates). These are tasks where the output is easily verified and the cost of being wrong is low.

**What I didn't trust:** Pricing numbers. Every time an AI suggested a price, I went to the official vendor pricing page and verified it independently. AI training data is always out of date on fast-moving pricing. The Anthropic API pricing I saw in training data ($15/M tokens for Sonnet) was different from the current page ($3/M tokens for Sonnet 4.x). If I had used the AI's number, the audit engine would have been wrong.

**One specific error I caught:** When generating the `use-case-api-data-extraction` rule description, the AI assistant drafted: "Gemini Flash-Lite is 100x cheaper per token than Claude Opus." I checked the math: Claude Opus input is $5/M tokens, Gemini Flash-Lite input is $0.10/M tokens — that's 50x, not 100x. The output pricing is $25 vs $0.40 — that's 62.5x. "Approximately 50x" was the defensible conservative figure. I changed the rule reason string accordingly. The distinction matters because this is a finance product — incorrect claims about savings multiples would undermine the credibility of the entire audit.

---

## Q5: Self-ratings (1–10) with one-sentence reason each

**Audit engine quality:** 8/10 — The engine correctly implements all 5 required rule categories with conservative estimates, source-cited pricing, and 31 passing tests; I'd give it a 10 if the upgrade rules had more coverage (currently only one trigger).

**UI/UX quality:** 7/10 — The results page is visually strong and the form is functional, but I'd improve the mobile results table layout and add skeleton loading states for a more polished production feel.

**Documentation quality:** 8/10 — PRICING_DATA, PROMPTS, ARCHITECTURE, and this REFLECTION are thorough and honest; the DEVLOG is the weakest piece (daily entries written retrospectively rather than in real time).

**Test coverage:** 7/10 — 31 tests covering all rule categories and boundary conditions is solid for a 7-day build; missing tests for API route behavior (rate limiting, honeypot) and UI integration tests.

**Engineering discipline:** 8/10 — No `any` types, no secrets in the repo, conventional commits, PII separation enforced architecturally, TypeScript strict throughout; would improve to 9 with actual integration tests and a pre-commit hook for the no-secrets check.
