import type { AuditInput, ToolFinding, ToolInput } from '@/lib/schemas';

// Upgrade-to-save rules: when overage spend exceeds upgrade cost.
// Paradoxically, spending MORE on a higher plan eliminates metered overage charges.

type UpgradeRule = {
  id: string;
  applies: (tool: ToolInput, input: AuditInput) => boolean;
  generate: (tool: ToolInput) => Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'>;
};

const upgradeRules: UpgradeRule[] = [
  {
    id: 'upgrade-cursor-pro-over-spend',
    applies: (tool) =>
      tool.toolId === 'cursor' &&
      tool.planId === 'pro' &&
      tool.monthlySpend > 60, // Only worth it if spend already exceeds Pro+ price
    generate: (tool) => {
      const savings = tool.monthlySpend - 60;
      return {
        recommendedAction: 'upgrade',
        recommendedPlan: 'Pro+ ($60/mo)',
        projectedMonthlySpend: 60,
        projectedMonthlySavings: savings,
        ruleId: 'upgrade-cursor-pro-over-spend',
        reason:
          'Your Cursor Pro usage is exceeding the base credit pool. Upgrading to Pro+ ($60/month) provides 3x the usage credits, likely eliminating metered overage charges.',
        estimatedSavings: false,
      };
    },
  },
];

export function applyUpgradeRules(
  tool: ToolInput,
  input: AuditInput
): Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'> | null {
  const applicableRules = upgradeRules.filter((r) => r.applies(tool, input));
  if (applicableRules.length === 0) return null;

  return applicableRules
    .map((r) => r.generate(tool))
    .sort((a, b) => b.projectedMonthlySavings - a.projectedMonthlySavings)[0];
}
