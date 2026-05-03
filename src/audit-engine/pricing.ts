// All prices verified against official vendor pricing pages.
// See PRICING_DATA.md for source URLs and verification dates.

export interface PlanPricing {
  monthly: number;         // per seat for per-seat plans, flat for individual
  type: 'individual' | 'per-seat' | 'api-token';
  minSeats?: number;
  maxSeats?: number;
}

export type ToolPricing = Record<string, PlanPricing>;

// cursor.com/pricing — verified 2026-05-08
export const CURSOR_PRICING: ToolPricing = {
  hobby:     { monthly: 0,   type: 'individual' },
  pro:       { monthly: 20,  type: 'individual' },
  'pro-plus': { monthly: 60,  type: 'individual' },
  ultra:     { monthly: 200, type: 'individual' },
  business:  { monthly: 40,  type: 'per-seat', minSeats: 1 },
};

// github.com/features/copilot — verified 2026-05-08
// ⚠️ Business transitioning to usage-based billing June 1, 2026
export const GITHUB_COPILOT_PRICING: ToolPricing = {
  free:       { monthly: 0,  type: 'individual' },
  pro:        { monthly: 10, type: 'individual' },
  'pro-plus': { monthly: 39, type: 'individual' },
  business:   { monthly: 19, type: 'per-seat', minSeats: 1 },
  enterprise: { monthly: 39, type: 'per-seat', minSeats: 1 },
};

// claude.ai/pricing — verified 2026-05-08
// ⚠️ Team plan requires minimum 5 seats
export const CLAUDE_PRICING: ToolPricing = {
  free:      { monthly: 0,   type: 'individual' },
  pro:       { monthly: 20,  type: 'individual' },
  'max-5x':  { monthly: 100, type: 'individual' },
  'max-20x': { monthly: 200, type: 'individual' },
  team:      { monthly: 25,  type: 'per-seat', minSeats: 5 },
  enterprise: { monthly: 0,  type: 'per-seat' }, // custom pricing
};

// openai.com/chatgpt/pricing — verified 2026-05-08
export const CHATGPT_PRICING: ToolPricing = {
  free:      { monthly: 0,   type: 'individual' },
  go:        { monthly: 8,   type: 'individual' },
  plus:      { monthly: 20,  type: 'individual' },
  'pro-100': { monthly: 100, type: 'individual' },
  'pro-200': { monthly: 200, type: 'individual' },
  business:  { monthly: 30,  type: 'per-seat', minSeats: 2 }, // using $30 (conservative upper bound)
};

// platform.anthropic.com/docs/about-claude/models — verified 2026-05-08
// API token pricing — monthly spend is user-entered (token volume unknown)
export const ANTHROPIC_API_PRICING: ToolPricing = {
  haiku:  { monthly: 0, type: 'api-token' }, // $1/$5 per M tokens — spend is variable
  sonnet: { monthly: 0, type: 'api-token' }, // $3/$15 per M tokens
  opus:   { monthly: 0, type: 'api-token' }, // $5/$25 per M tokens — flagship
};

// openai.com/api/pricing — verified 2026-05-08
export const OPENAI_API_PRICING: ToolPricing = {
  nano:     { monthly: 0, type: 'api-token' }, // $0.10/$0.40 per M tokens
  mini:     { monthly: 0, type: 'api-token' }, // $0.75/$4.50 per M tokens
  standard: { monthly: 0, type: 'api-token' }, // $2.50/$15 per M tokens
  flagship: { monthly: 0, type: 'api-token' }, // $5/$30 per M tokens
};

// ai.google.dev/pricing — verified 2026-05-08
export const GEMINI_API_PRICING: ToolPricing = {
  'flash-lite': { monthly: 0, type: 'api-token' }, // $0.10/$0.40 per M tokens
  'pro-2-5':    { monthly: 0, type: 'api-token' }, // $1.25/$10 per M tokens
  'pro-3-1':    { monthly: 0, type: 'api-token' }, // $2.00/$12 per M tokens
};

// windsurf.com/pricing — verified 2026-05-08
export const WINDSURF_PRICING: ToolPricing = {
  free:  { monthly: 0,   type: 'individual' },
  pro:   { monthly: 20,  type: 'individual' },
  max:   { monthly: 200, type: 'individual' },
  teams: { monthly: 40,  type: 'per-seat', minSeats: 1 },
};

export const PRICING: Record<string, ToolPricing> = {
  'cursor':        CURSOR_PRICING,
  'github-copilot': GITHUB_COPILOT_PRICING,
  'claude':        CLAUDE_PRICING,
  'chatgpt':       CHATGPT_PRICING,
  'anthropic-api': ANTHROPIC_API_PRICING,
  'openai-api':    OPENAI_API_PRICING,
  'gemini-api':    GEMINI_API_PRICING,
  'windsurf':      WINDSURF_PRICING,
};

export function getPlanPricing(toolId: string, planId: string): PlanPricing | undefined {
  return PRICING[toolId]?.[planId];
}

export function getExpectedMonthlySpend(toolId: string, planId: string, seats: number): number {
  const plan = getPlanPricing(toolId, planId);
  if (!plan || plan.type === 'api-token') return 0;
  if (plan.type === 'per-seat') return plan.monthly * seats;
  return plan.monthly;
}
