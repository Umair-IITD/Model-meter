import type { AuditInput, CrossToolFinding } from '@/lib/schemas';

// Cross-tool redundancy rules: fires when two tools overlap in capabilities.
// Returns CrossToolFinding objects (not per-tool findings).

type RedundancyRule = {
  id: string;
  applies: (input: AuditInput) => boolean;
  generate: (input: AuditInput) => Omit<CrossToolFinding, 'ruleId'>;
};

function hasTool(input: AuditInput, toolId: string, planId?: string): boolean {
  return input.tools.some(
    (t) => t.toolId === toolId && (planId === undefined || t.planId === planId)
  );
}

function getToolSpend(input: AuditInput, toolId: string): number {
  return input.tools.find((t) => t.toolId === toolId)?.monthlySpend ?? 0;
}

const redundancyRules: RedundancyRule[] = [
  {
    id: 'redundant-chatgpt-plus-claude-pro-coding',
    applies: (input) =>
      input.useCase === 'coding' &&
      hasTool(input, 'chatgpt', 'plus') &&
      hasTool(input, 'claude', 'pro'),
    generate: (_input) => ({
      toolIds: ['chatgpt', 'claude'],
      recommendedAction: 'consolidate',
      projectedMonthlySavings: 20,
      reason:
        'Paying for both ChatGPT Plus and Claude Pro for coding gives you two separate interfaces for the same underlying models. Cursor Pro ($20/seat) includes both Claude and GPT-4 access within a single coding environment.',
    }),
  },
  {
    id: 'redundant-chatgpt-plus-claude-pro-writing',
    applies: (input) =>
      input.useCase === 'writing' &&
      hasTool(input, 'chatgpt', 'plus') &&
      hasTool(input, 'claude', 'pro'),
    generate: (_input) => ({
      toolIds: ['chatgpt', 'claude'],
      recommendedAction: 'drop-one',
      projectedMonthlySavings: 20,
      reason:
        'Most writing workflows don\'t require two frontier model subscriptions. Claude is generally preferred for long-form writing and editing; dropping ChatGPT Plus saves $20/month with no meaningful capability loss for writing tasks.',
    }),
  },
  {
    id: 'redundant-cursor-windsurf-coding',
    applies: (input) =>
      input.useCase === 'coding' &&
      hasTool(input, 'cursor') &&
      hasTool(input, 'windsurf'),
    generate: (input) => {
      const windsurfSpend = getToolSpend(input, 'windsurf');
      return {
        toolIds: ['cursor', 'windsurf'],
        recommendedAction: 'drop-one',
        projectedMonthlySavings: windsurfSpend,
        reason:
          'Cursor and Windsurf are competing AI-native IDEs with substantially overlapping capabilities. Consolidating to one saves the full cost of the second subscription.',
      };
    },
  },
];

export function applyCrossToolRules(input: AuditInput): CrossToolFinding[] {
  return redundancyRules
    .filter((r) => r.applies(input))
    .map((r) => ({
      ruleId: r.id,
      ...r.generate(input),
    }));
}
