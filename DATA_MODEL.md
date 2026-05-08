# DATA_MODEL.md — Model-meter Data Schemas

> Canonical source of truth for all data shapes. TypeScript types are derived from these Zod schemas.

---

## Zod Schemas (src/lib/schemas.ts)

```typescript
import { z } from 'zod';

// ─── Tool IDs ───────────────────────────────────────────────────────────────

export const ToolId = z.enum([
  'cursor',
  'github-copilot',
  'claude',
  'chatgpt',
  'anthropic-api',
  'openai-api',
  'gemini-api',
  'windsurf',
  // 'v0',  // add if implementing
]);

export type ToolId = z.infer<typeof ToolId>;

// ─── Form Input ──────────────────────────────────────────────────────────────

export const ToolInput = z.object({
  toolId: ToolId,
  planId: z.string().min(1),
  monthlySpend: z.number().min(0),
  seats: z.number().int().min(1),
});

export type ToolInput = z.infer<typeof ToolInput>;

export const AuditInput = z.object({
  teamSize: z.number().int().min(1).max(10000),
  useCase: z.enum(['coding', 'writing', 'data', 'research', 'mixed']),
  tools: z.array(ToolInput).min(1).max(20),
});

export type AuditInput = z.infer<typeof AuditInput>;

// ─── Audit Engine Output ─────────────────────────────────────────────────────

export const RecommendedAction = z.enum(['downgrade', 'upgrade', 'optimal', 'switch']);

export const ToolFinding = z.object({
  toolId: z.string(),
  toolName: z.string(),                    // human-readable, e.g. "Cursor"
  currentPlan: z.string(),                 // human-readable, e.g. "Business"
  currentMonthlySpend: z.number(),
  recommendedAction: RecommendedAction,
  recommendedPlan: z.string().optional(),
  projectedMonthlySpend: z.number().optional(),
  projectedMonthlySavings: z.number(),     // 0 if optimal
  ruleId: z.string(),
  reason: z.string(),
  estimatedSavings: z.boolean().default(false),
});

export type ToolFinding = z.infer<typeof ToolFinding>;

export const CrossToolFinding = z.object({
  toolIds: z.array(z.string()),
  recommendedAction: z.enum(['consolidate', 'drop-one']),
  projectedMonthlySavings: z.number(),
  ruleId: z.string(),
  reason: z.string(),
});

export type CrossToolFinding = z.infer<typeof CrossToolFinding>;

export const AuditResult = z.object({
  totalMonthlySavings: z.number(),
  totalAnnualSavings: z.number(),
  isOptimal: z.boolean(),
  findings: z.array(ToolFinding),
  crossToolFindings: z.array(CrossToolFinding),
});

export type AuditResult = z.infer<typeof AuditResult>;

// ─── API Request/Response ─────────────────────────────────────────────────────

// POST /api/audit — request body
export const AuditApiRequest = AuditInput;

// POST /api/audit — response body
export const AuditApiResponse = z.object({
  auditId: z.string().uuid(),
  totalMonthlySavings: z.number(),
  totalAnnualSavings: z.number(),
  isOptimal: z.boolean(),
  findings: z.array(ToolFinding),
  crossToolFindings: z.array(CrossToolFinding),
  summary: z.string(),
  summaryIsAI: z.boolean(),
});

export type AuditApiResponse = z.infer<typeof AuditApiResponse>;

// POST /api/leads — request body
export const LeadApiRequest = z.object({
  auditId: z.string().uuid(),
  email: z.string().email(),
  companyName: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  teamSize: z.number().int().min(1).max(100000).optional(),
  honeypot: z.string().default(''),        // must be empty string to pass
});

export type LeadApiRequest = z.infer<typeof LeadApiRequest>;

// ─── Firestore Documents ──────────────────────────────────────────────────────

// Collection: audits/{uuid}
// Public-safe: no PII
export const AuditDocument = z.object({
  createdAt: z.date(),                     // Firestore Timestamp → Date
  useCase: z.enum(['coding', 'writing', 'data', 'research', 'mixed']),
  teamSize: z.number(),
  tools: z.array(ToolInput),              // input preserved for display
  findings: z.array(ToolFinding),
  crossToolFindings: z.array(CrossToolFinding),
  totalMonthlySavings: z.number(),
  totalAnnualSavings: z.number(),
  isOptimal: z.boolean(),
  summary: z.string(),
  // NO email, companyName, role — those are ONLY in leads collection
});

export type AuditDocument = z.infer<typeof AuditDocument>;

// Collection: leads/{auto-id}
// Private: contains PII — never queried by public routes
export const LeadDocument = z.object({
  auditId: z.string().uuid(),
  email: z.string().email(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.number().optional(),
  createdAt: z.date(),
  totalMonthlySavings: z.number(),        // denormalized for Credex filtering
  highSavings: z.boolean(),               // totalMonthlySavings > 500
});

export type LeadDocument = z.infer<typeof LeadDocument>;

// ─── Pricing Table ────────────────────────────────────────────────────────────

export const PlanType = z.enum(['individual', 'per-seat', 'usage-based', 'api-token']);

export const PlanDefinition = z.object({
  planId: z.string(),
  planName: z.string(),                   // display name
  monthly: z.number(),                    // 0 if free
  type: PlanType,
  minSeats: z.number().optional(),
  maxSeats: z.number().optional(),
  notes: z.string().optional(),           // for caveats, flags
});

export type PlanDefinition = z.infer<typeof PlanDefinition>;

export const ToolDefinition = z.object({
  toolId: ToolId,
  toolName: z.string(),
  category: z.enum(['ide', 'chat', 'api', 'design']),
  plans: z.array(PlanDefinition),
  sourceUrl: z.string().url(),
  verifiedDate: z.string(),               // ISO date string
});

export type ToolDefinition = z.infer<typeof ToolDefinition>;
```

---

## Firestore Security Rules

```javascript
// firestore.rules — deploy with: firebase deploy --only firestore:rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // PUBLIC AUDITS: readable by anyone, writable only via Admin SDK
    match /audits/{auditId} {
      allow read: if true;
      allow create: if false;   // Admin SDK bypasses these rules
      allow update: if false;
      allow delete: if false;
    }

    // LEADS: completely private — no client access
    match /leads/{leadId} {
      allow read: if false;
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

**Why Admin SDK for writes:** Firebase Admin SDK (initialized with a service account) bypasses Firestore Security Rules entirely. By setting all write rules to `false`, we guarantee the only way to write to Firestore is through our Next.js API routes. This prevents any client-side write abuse.

---

## Local Form State (localStorage)

Key: `model-meter-form-v1`
Value: JSON-serialized shape:

```typescript
interface PersistedFormState {
  teamSize: number;
  useCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
  tools: Array<{
    id: string;        // client-side only ID for react key prop
    toolId: string;
    planId: string;
    monthlySpend: number;
    seats: number;
  }>;
  lastUpdated: string; // ISO timestamp — for stale state detection
}
```

**Stale state handling:** If `lastUpdated` is more than 30 days old, discard and start fresh. This prevents stale pricing assumptions from persisting.

---

## Tool → Plan Map (for UI dropdowns)

This map drives the `PlanSelector` component. Must stay in sync with `PRICING` constant in `audit-engine/pricing.ts`.

```typescript
// src/lib/tool-plans.ts
export const TOOL_PLANS: Record<ToolId, { planId: string; planName: string }[]> = {
  'cursor': [
    { planId: 'hobby', planName: 'Hobby (Free)' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'pro-plus', planName: 'Pro+ ($60/mo)' },
    { planId: 'ultra', planName: 'Ultra ($200/mo)' },
    { planId: 'business', planName: 'Business ($40/seat/mo)' },
  ],
  'github-copilot': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($10/mo)' },
    { planId: 'pro-plus', planName: 'Pro+ ($39/mo)' },
    { planId: 'business', planName: 'Business ($19/seat/mo)' },
    { planId: 'enterprise', planName: 'Enterprise ($39/seat/mo)' },
  ],
  'claude': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'max-5x', planName: 'Max 5x ($100/mo)' },
    { planId: 'max-20x', planName: 'Max 20x ($200/mo)' },
    { planId: 'team', planName: 'Team ($25/seat/mo)' },
    { planId: 'enterprise', planName: 'Enterprise (custom)' },
  ],
  'chatgpt': [
    { planId: 'free', planName: 'Free' },
    { planId: 'go', planName: 'Go ($8/mo)' },
    { planId: 'plus', planName: 'Plus ($20/mo)' },
    { planId: 'pro-100', planName: 'Pro ($100/mo)' },
    { planId: 'pro-200', planName: 'Pro ($200/mo)' },
    { planId: 'business', planName: 'Business ($25-30/seat/mo)' },
  ],
  'anthropic-api': [
    { planId: 'haiku', planName: 'Haiku (cheapest)' },
    { planId: 'sonnet', planName: 'Sonnet (standard)' },
    { planId: 'opus', planName: 'Opus (flagship)' },
  ],
  'openai-api': [
    { planId: 'nano', planName: 'GPT-4.1 Nano (cheapest)' },
    { planId: 'mini', planName: 'GPT-5.4 Mini' },
    { planId: 'standard', planName: 'GPT-5.4 (standard)' },
    { planId: 'flagship', planName: 'GPT-5.5 (flagship)' },
  ],
  'gemini-api': [
    { planId: 'flash-lite', planName: 'Flash-Lite (cheapest)' },
    { planId: 'pro-2-5', planName: 'Gemini 2.5 Pro' },
    { planId: 'pro-3-1', planName: 'Gemini 3.1 Pro' },
  ],
  'windsurf': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'max', planName: 'Max ($200/mo)' },
    { planId: 'teams', planName: 'Teams ($40/seat/mo)' },
  ],
};
```
