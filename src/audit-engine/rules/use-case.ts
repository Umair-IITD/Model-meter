import type { AuditInput, ToolFinding, ToolInput } from '@/lib/schemas';

// Use-case alignment rules: wrong tool tier for the job.
// Triggers when a user pays for a flagship model for a task that a cheaper model handles just as well.

type UseCaseRule = {
  id: string;
  applies: (tool: ToolInput, input: AuditInput) => boolean;
  generate: (tool: ToolInput) => Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'>;
};

const FLAGSHIP_API_PLANS = new Set(['opus', 'flagship', 'sonnet', 'standard']);

const useCaseRules: UseCaseRule[] = [
  {
    id: 'use-case-api-data-extraction',
    applies: (tool, input) =>
      ['anthropic-api', 'openai-api'].includes(tool.toolId) &&
      FLAGSHIP_API_PLANS.has(tool.planId) &&
      input.useCase === 'data' &&
      tool.monthlySpend > 0,
    generate: (tool) => {
      const estimatedSavings = Math.floor(tool.monthlySpend * 0.95);
      return {
        recommendedAction: 'switch',
        recommendedPlan: 'Gemini Flash-Lite API',
        projectedMonthlySavings: estimatedSavings,
        ruleId: 'use-case-api-data-extraction',
        reason:
          'Data extraction and classification tasks don\'t require flagship reasoning models. Google Gemini Flash-Lite is ~50x cheaper per token than Claude Opus/GPT-5.5 for structured data tasks with no meaningful quality difference.',
        estimatedSavings: true,
      };
    },
  },
  {
    id: 'use-case-chatgpt-pro200-coding',
    applies: (tool, input) =>
      tool.toolId === 'chatgpt' &&
      tool.planId === 'pro-200' &&
      input.useCase === 'coding',
    generate: (tool) => {
      const seats = tool.seats;
      const cursorCost = 40 * seats;
      const savings = Math.max(0, 200 - cursorCost);
      return {
        recommendedAction: 'switch',
        recommendedPlan: `Cursor Business ($40/seat × ${seats})`,
        projectedMonthlySpend: cursorCost,
        projectedMonthlySavings: savings,
        ruleId: 'use-case-chatgpt-pro200-coding',
        reason:
          "ChatGPT Pro's premium is primarily for deep research and reasoning tasks. For coding workflows, Cursor Business ($40/seat) provides Claude, GPT-4, and other models within an IDE at a fraction of the cost.",
        estimatedSavings: false,
      };
    },
  },
];

export function applyUseCaseRules(
  tool: ToolInput,
  input: AuditInput
): Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'> | null {
  const applicableRules = useCaseRules.filter((r) => r.applies(tool, input));
  if (applicableRules.length === 0) return null;

  const findings = applicableRules.map((r) => ({
    finding: r.generate(tool),
  }));

  return findings.sort(
    (a, b) => b.finding.projectedMonthlySavings - a.finding.projectedMonthlySavings
  )[0].finding;
}
