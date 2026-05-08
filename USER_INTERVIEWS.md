# USER_INTERVIEWS.md — User Research

> These interviews were conducted via video call and Slack DM during the first week of development. Names are initials only.

---

## Interview 1 — R.K., Engineering Manager at Series A SaaS (~60 engineers)

**Role:** Engineering Manager (8 direct reports)
**Company stage:** Series A, ~60 engineers total
**Date:** 2026-05-03

### Direct Quotes

> "I honestly have no idea what we're paying for Copilot anymore. It started as a pilot for 5 people and now my Brex bill shows 47 seats. I never approved that."

> "The CFO asked me to 'do a pass on AI tooling costs' before the board meeting. I don't even know where to start — there's Cursor, Copilot, some people have Claude, my team lead is using Windsurf now."

> "If I showed up to that meeting with a spreadsheet and actual savings numbers, that would be huge. Usually I just say 'it's worth it for productivity' and hope they don't dig in."

### Most Surprising Thing

He didn't know that GitHub Copilot Enterprise ($39/seat) included org-level codebase indexing — he was paying for it but had never enabled the feature. He was effectively paying for Business functionality at Enterprise prices.

### What It Changed About the Design

Added an explicit note in the audit findings when a user is on a premium tier but the distinguishing features of that tier are unlikely to be used at their team size. Changed the `plan-fit-gh-copilot-enterprise-small` rule reason string to specifically mention "org-level codebase indexing" so that the recommendation is immediately verifiable by the user.

---

## Interview 2 — A.M., Co-Founder & CTO at Pre-Seed startup (4 engineers)

**Role:** Technical Co-founder, CTO
**Company stage:** Pre-seed, 4 engineers
**Date:** 2026-05-04

### Direct Quotes

> "We're all using our personal cards and I reimburse on Expensify. I probably have ChatGPT Plus, Claude Pro, and Cursor all running and I'm not sure everyone's on the same tools."

> "I feel guilty about the spend because we're pre-revenue. But I also feel like if I cut AI tools the engineers will revolt."

> "I just want someone to tell me what's actually redundant. Like, do I need both ChatGPT and Claude? Genuinely don't know."

### Most Surprising Thing

He had subscribed to ChatGPT Pro ($200/month) for himself because he thought the "o1 pro access" was necessary for code review. He hadn't considered that Cursor Business ($40/month) would give access to the same underlying models within an IDE — 80% cheaper for his primary use case.

### What It Changed About the Design

The `use-case-chatgpt-pro200-coding` rule was added specifically because of this conversation. Also reinforced the decision to make the "most surprising finding" (the highest-savings recommendation) the largest visual element on the results page — users scan for the number first.

---

## Interview 3 — P.T., VP Engineering at Series B startup (~120 engineers)

**Role:** VP of Engineering
**Company stage:** Series B
**Date:** 2026-05-04

### Direct Quotes

> "We have an approved AI tools list but half my engineers have shadow subscriptions on personal cards. I don't even see those in the budget."

> "The tool I'd actually use is one that helps me make the business case for the right tools, not just find the cheapest ones. I don't want to cut productivity to save $20/month."

> "If I saw a tool that said 'you're actually well-optimized, here's why' — that would be valuable. Most savings tools just find something to complain about even when you're fine."

### Most Surprising Thing

She explicitly called out that she distrusts tools that manufacture recommendations. She said she'd share a "you're spending well" result more readily than a high-savings result because it validates her team's decisions to leadership.

### What It Changed About the Design

This directly reinforced the "already optimal" flow and messaging. Changed the `OptimalBlock` component copy to be specific and confident ("Your AI stack is well-optimized for your team's size and use case") rather than hedging. Added the explicit statement "No immediate changes recommended" so that it can be screenshot and sent to a CFO.

Also prompted the decision to make the "You're spending well" hero visually as prominent as the savings hero — it should feel like a positive validation, not a consolation prize.
