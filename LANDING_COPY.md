# LANDING_COPY.md — Landing Page Copy

## Hero Headline

**Primary (≤10 words):**
> Is your team overpaying for AI tools?

**Alternative tested:**
> Find out in 60 seconds if your AI spend is optimized.

The primary is used because it's a question that creates immediate pattern-match recognition for the target user. The alternative was tested and felt less provocative.

---

## Subheadline (≤25 words)

> Audit your startup's AI tool spend in 60 seconds. Get a per-tool savings breakdown — free, no login required.

---

## Primary CTA Copy

**Button text:** `Audit My AI Spend`

**Supporting copy below button:** "Takes about 60 seconds · Results shown instantly"

**Why this wording:** "Audit" is authoritative and finance-appropriate. "My AI Spend" is possessive — it creates immediate personalization before the user has entered anything. Tested alternatives: "Find My Savings" (too vague), "Run Free Audit" (too generic).

---

## Social Proof Block

> ⚠️ Note: These are illustrative scenarios based on typical audit findings, not real customer testimonials. Labelled as such on the landing page.

- **Series A SaaS team, 12 engineers:** "Identified $2,400/month in redundant AI subscriptions — Cursor Business + GitHub Copilot Enterprise both over-provisioned for team size."

- **Pre-seed startup, 4 engineers:** "Consolidated from 3 overlapping subscriptions (ChatGPT Pro + Claude Pro + Cursor) to Cursor Business alone. Saves $480/month."

- **15-person engineering team:** "Switched from Anthropic Opus API for data tasks to Gemini Flash-Lite. Same output quality, $1,200/month less."

---

## FAQ — 5 Real Questions

**Q: How does the audit engine know the right price?**

A: Every price in the engine is sourced from the official vendor pricing page and cited in our PRICING_DATA documentation. We update it with every release. If you're on a negotiated or enterprise contract with different pricing, use your actual monthly spend as the input — the engine always uses your entered spend as the baseline.

**Q: Do I need to log in or create an account?**

A: No. You fill in the form, get your results, and optionally enter your email to receive the report. The entire audit works without any account. Your email is never required to see results.

**Q: What does Credex get out of this?**

A: If your audit identifies savings over $500/month, a Credex advisor may reach out to help you capture those savings through discounted AI credits. The tool genuinely works even if you never talk to Credex — but high-savings users often find that Credex's credit reselling can get them below even the optimized plan pricing.

**Q: How accurate are the savings estimates?**

A: Very accurate for seat-based plans (Cursor Business, GitHub Copilot, Claude Team, etc.) where the math is exact. Less precise for API-based tools (Anthropic API, OpenAI API) where your token volume is unknown — those savings are marked as "estimated" and we flag the assumption.

**Q: Is my data safe? Who can see my audit?**

A: Your audit is stored by UUID. If you share the link, anyone with the link can see the tool names, plans, and savings numbers — but never your email, company name, or role (those are stored separately and never appear in the public audit page). We never sell or share your data.
