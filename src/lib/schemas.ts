import { z } from 'zod';

// ─── Tool IDs ────────────────────────────────────────────────────────────────

export const ToolId = z.enum([
  'cursor',
  'github-copilot',
  'claude',
  'chatgpt',
  'anthropic-api',
  'openai-api',
  'gemini-api',
  'windsurf',
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
  toolName: z.string(),
  currentPlan: z.string(),
  currentMonthlySpend: z.number(),
  recommendedAction: RecommendedAction,
  recommendedPlan: z.string().optional(),
  projectedMonthlySpend: z.number().optional(),
  projectedMonthlySavings: z.number(),
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

export const AuditApiRequest = AuditInput;

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

export const LeadApiRequest = z.object({
  auditId: z.string().uuid(),
  email: z.string().email(),
  companyName: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  teamSize: z.number().int().min(1).max(100000).optional(),
  honeypot: z.string().default(''),
});

export type LeadApiRequest = z.infer<typeof LeadApiRequest>;

// ─── Firestore Documents ──────────────────────────────────────────────────────

export const AuditDocument = z.object({
  createdAt: z.date(),
  useCase: z.enum(['coding', 'writing', 'data', 'research', 'mixed']),
  teamSize: z.number(),
  tools: z.array(ToolInput),
  findings: z.array(ToolFinding),
  crossToolFindings: z.array(CrossToolFinding),
  totalMonthlySavings: z.number(),
  totalAnnualSavings: z.number(),
  isOptimal: z.boolean(),
  summary: z.string(),
});

export type AuditDocument = z.infer<typeof AuditDocument>;

export const LeadDocument = z.object({
  auditId: z.string().uuid(),
  email: z.string().email(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.number().optional(),
  createdAt: z.date(),
  totalMonthlySavings: z.number(),
  highSavings: z.boolean(),
});

export type LeadDocument = z.infer<typeof LeadDocument>;

// ─── Pricing Table ────────────────────────────────────────────────────────────

export const PlanType = z.enum(['individual', 'per-seat', 'usage-based', 'api-token']);

export const PlanDefinition = z.object({
  planId: z.string(),
  planName: z.string(),
  monthly: z.number(),
  type: PlanType,
  minSeats: z.number().optional(),
  maxSeats: z.number().optional(),
  notes: z.string().optional(),
});

export type PlanDefinition = z.infer<typeof PlanDefinition>;

export const ToolDefinition = z.object({
  toolId: ToolId,
  toolName: z.string(),
  category: z.enum(['ide', 'chat', 'api', 'design']),
  plans: z.array(PlanDefinition),
  sourceUrl: z.string().url(),
  verifiedDate: z.string(),
});

export type ToolDefinition = z.infer<typeof ToolDefinition>;
