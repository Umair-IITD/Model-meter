import type { AuditInput, ToolFinding, ToolInput } from '@/lib/schemas';
import { TOOL_NAMES } from '@/lib/tool-plans';

// Plan-fit rules: right-sizing within the same vendor.
// Fires when a team plan is used for a team too small to justify the overhead.

type PlanFitRule = {
  id: string;
  applies: (tool: ToolInput, input: AuditInput) => boolean;
  generate: (tool: ToolInput) => Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'>;
};

const planFitRules: PlanFitRule[] = [
  {
    id: 'plan-fit-sub5-cursor-business',
    applies: (tool) =>
      tool.toolId === 'cursor' &&
      tool.planId === 'business' &&
      tool.seats < 5,
    generate: (tool) => ({
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/seat)',
      projectedMonthlySpend: 20 * tool.seats,
      projectedMonthlySavings: 20 * tool.seats, // (40 - 20) × seats
      ruleId: 'plan-fit-sub5-cursor-business',
      reason:
        'Cursor Business adds admin features (SSO, centralized billing) that provide little value for teams under 5. Individual Pro seats give identical AI access at half the price.',
      estimatedSavings: false,
    }),
  },
  {
    id: 'plan-fit-sub5-claude-team',
    applies: (tool) =>
      tool.toolId === 'claude' &&
      tool.planId === 'team' &&
      tool.seats < 5,
    generate: (tool) => ({
      recommendedAction: 'downgrade',
      recommendedPlan: 'Pro ($20/seat)',
      projectedMonthlySpend: 20 * tool.seats,
      projectedMonthlySavings: 5 * tool.seats, // (25 - 20) × seats
      ruleId: 'plan-fit-sub5-claude-team',
      reason: `Claude Team requires a minimum of 5 seats. For ${tool.seats} users, individual Pro plans ($20/user) provide the same model access without the minimum seat overhead.`,
      estimatedSavings: false,
    }),
  },
  {
    id: 'plan-fit-sub3-chatgpt-business',
    applies: (tool) =>
      tool.toolId === 'chatgpt' &&
      tool.planId === 'business' &&
      tool.seats <= 2,
    generate: (tool) => ({
      recommendedAction: 'downgrade',
      recommendedPlan: 'Plus ($20/seat)',
      projectedMonthlySpend: 20 * tool.seats,
      projectedMonthlySavings: 10 * tool.seats, // (30 - 20) × seats
      ruleId: 'plan-fit-sub3-chatgpt-business',
      reason: `ChatGPT Business adds team admin features that aren't needed for ${tool.seats} users. ChatGPT Plus ($20/user) provides the same GPT-5 access without the overhead.`,
      estimatedSavings: false,
    }),
  },
  {
    id: 'plan-fit-gh-copilot-enterprise-small',
    applies: (tool) =>
      tool.toolId === 'github-copilot' &&
      tool.planId === 'enterprise' &&
      tool.seats <= 3,
    generate: (tool) => ({
      recommendedAction: 'downgrade',
      recommendedPlan: tool.seats <= 2 ? 'Pro ($10/mo)' : 'Business ($19/seat)',
      projectedMonthlySpend: tool.seats <= 2 ? 10 * tool.seats : 19 * tool.seats,
      projectedMonthlySavings:
        tool.seats <= 2
          ? 29 * tool.seats  // (39 - 10) × seats
          : 20 * tool.seats, // (39 - 19) × seats
      ruleId: 'plan-fit-gh-copilot-enterprise-small',
      reason:
        "GitHub Copilot Enterprise adds org-level codebase indexing, which requires more than 3 users to justify the cost. Copilot Business at $19/seat provides the same completions and chat.",
      estimatedSavings: false,
    }),
  },
  {
    id: 'plan-fit-solo-team-plan',
    applies: (tool) =>
      tool.seats === 1 &&
      ['team', 'business', 'enterprise'].includes(tool.planId) &&
      ['cursor', 'claude', 'chatgpt', 'github-copilot', 'windsurf'].includes(tool.toolId),
    generate: (tool) => {
      const individualProPrices: Record<string, number> = {
        cursor: 20,
        claude: 20,
        chatgpt: 20,
        'github-copilot': 10,
        windsurf: 20,
      };
      const individualPrice = individualProPrices[tool.toolId] ?? 20;
      const savings = Math.max(0, tool.monthlySpend - individualPrice);
      const toolName = TOOL_NAMES[tool.toolId as keyof typeof TOOL_NAMES] ?? tool.toolId;
      return {
        recommendedAction: 'downgrade',
        recommendedPlan: 'Individual Pro',
        projectedMonthlySpend: individualPrice,
        projectedMonthlySavings: savings,
        ruleId: 'plan-fit-solo-team-plan',
        reason: `${toolName} ${tool.planId} is a team product. With 1 user, you're paying for admin overhead with no benefit. The individual Pro plan provides the same AI capabilities.`,
        estimatedSavings: false,
      };
    },
  },
  {
    id: 'scale-warning-claude-team-approaching-limit',
    applies: (tool) =>
      tool.toolId === 'claude' &&
      tool.planId === 'team' &&
      tool.seats >= 100,
    generate: (_tool) => ({
      recommendedAction: 'optimal', // warning, not a savings finding
      projectedMonthlySavings: 0,
      ruleId: 'scale-warning-claude-team-approaching-limit',
      reason:
        "Your team is approaching the Claude Team plan's 150-seat limit. Enterprise transition removes bundled usage and switches to token-based billing, which can significantly increase costs for high-activity engineering teams. Consider planning ahead with a Credex consultation.",
      estimatedSavings: false,
    }),
  },
];

export function applyPlanFitRules(
  tool: ToolInput,
  input: AuditInput
): Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'> | null {
  // Don't apply if spend is $0 for a paid plan — could be inconsistent data
  if (tool.monthlySpend === 0 && tool.planId !== 'free' && tool.planId !== 'hobby') {
    return null;
  }

  const applicableRules = planFitRules.filter((r) => r.applies(tool, input));
  if (applicableRules.length === 0) return null;

  const findings = applicableRules.map((r) => ({
    rule: r,
    finding: r.generate(tool),
  }));

  // Select highest savings rule (scale warnings are additive — handled separately)
  const savingsRules = findings.filter((f) => f.finding.projectedMonthlySavings > 0);
  const warnings = findings.filter((f) => f.finding.projectedMonthlySavings === 0 && f.rule.id.startsWith('scale-'));

  if (savingsRules.length === 0 && warnings.length > 0) {
    return warnings[0].finding;
  }

  if (savingsRules.length === 0) return null;

  const best = savingsRules.sort(
    (a, b) => b.finding.projectedMonthlySavings - a.finding.projectedMonthlySavings
  )[0];

  return best.finding;
}
