# METRICS.md — Product Metrics Framework

## North Star Metric

**Total monthly savings identified across all completed audits (cumulative, rolling 30-day)**

**Why this metric:** Model-meter is a FinOps tool used episodically, not daily. DAU or WAU metrics would be misleading — a user who runs one audit and saves $1,200/month has gotten enormous value and will never need to open the app again. The right measure is the aggregate financial impact the tool has created. This metric: (1) rewards accuracy of the audit engine over vanity completions, (2) aligns with Credex's core value proposition (actual savings captured), and (3) scales with real usage rather than bot traffic or revisit games.

**How to calculate:** Sum of `totalMonthlySavings` across all `audits` documents created in the last 30 days.

**North Star target at 90 days:** $500,000/month identified across all audits.

---

## Input Metrics (3)

### 1. Audits Completed per Week

**Why:** Direct measure of top-of-funnel health. An audit "completed" means the user reached the results page (not just opened the form). Measures product discovery and form completion rate.

**Target at 30 days:** 100/week

**Pivot trigger:** If below 20/week at day 30 with distribution channels active, the form UX is broken or the landing page CTA is failing.

### 2. Email Capture Rate

**Why:** The email capture form appears after the audit results. A low capture rate means the value proposition isn't compelling enough to create any further engagement. A high rate means users found the audit worth saving.

**Formula:** `leads submitted / audits completed`

**Target at 30 days:** 15–20%

**Pivot trigger:** Below 8% suggests the email CTA copy is wrong or users are unclear what they get from sharing their email.

### 3. High-Savings Rate (> $500/month)

**Why:** This is the conversion event for Credex's core business. An audit that identifies > $500/month in savings is a qualified lead. If most audits produce < $100/month savings, either: (a) we're not reaching the right users (small teams with little waste), or (b) our pricing data is wrong and we're under-calculating savings.

**Formula:** `audits with totalMonthlySavings > 500 / audits completed`

**Target at 30 days:** 15–20%

**Pivot trigger:** Below 5% at day 45 suggests a targeting problem (too many individual users, not enough team-size audits).

---

## What to Instrument First

1. `audit_completed` event with `{ totalMonthlySavings, toolCount, useCase, teamSize }` — answers the North Star
2. `lead_captured` event with `{ auditId, highSavings }` — answers capture rate
3. `audit_form_abandoned` event when user closes without submitting — identifies friction
4. Page performance: time to results page interactive (target: < 2s)

No need to track individual user journeys without consent. Aggregate metrics answer all key questions at MVP stage.

---

## Pivot Trigger Number

**If fewer than 3 high-savings leads (> $500/month) are captured in the first 30 days**, the GTM strategy needs revision. Possible causes: wrong audience (reaching individuals, not teams), pricing data outdated (rules not firing), or form too complex (users abandoning before submitting).

Three high-savings leads in 30 days is achievable with the Hacker News + Reddit launch strategy at minimum.

---

**Word count:** ~480 words
