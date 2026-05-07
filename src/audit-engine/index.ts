import type { AuditInput, AuditResult, ToolFinding, ToolInput } from '@/lib/schemas';
import { TOOL_NAMES, getPlanName } from '@/lib/tool-plans';
import { applyPlanFitRules } from './rules/plan-fit';
import { applyCrossToolRules } from './rules/redundancy';
import { applyUseCaseRules } from './rules/use-case';
import { applyUpgradeRules } from './rules/upgrade';

// Main audit entry point — deterministic, no external calls.
// Same input always produces same output.
export function runAudit(input: AuditInput): AuditResult {
  // Evaluate each tool independently
  const toolFindings: ToolFinding[] = input.tools.map((tool) =>
    evaluateTool(tool, input)
  );

  // Evaluate cross-tool redundancy rules
  const crossToolFindings = applyCrossToolRules(input);

  // Compute totals — include both per-tool and cross-tool savings
  const perToolSavings = toolFindings.reduce(
    (sum, f) => sum + f.projectedMonthlySavings,
    0
  );
  const crossToolSavings = crossToolFindings.reduce(
    (sum, f) => sum + f.projectedMonthlySavings,
    0
  );
  const totalMonthlySavings = Math.round(perToolSavings + crossToolSavings);
  const totalAnnualSavings = totalMonthlySavings * 12;

  // Optimal if total savings < $5 (noise threshold)
  const isOptimal = totalMonthlySavings < 5;

  return {
    totalMonthlySavings,
    totalAnnualSavings,
    isOptimal,
    findings: toolFindings,
    crossToolFindings,
  };
}

function evaluateTool(tool: ToolInput, input: AuditInput): ToolFinding {
  const toolName = TOOL_NAMES[tool.toolId] ?? tool.toolId;
  const currentPlan = getPlanName(tool.toolId, tool.planId);

  const base = {
    toolId: tool.toolId,
    toolName,
    currentPlan,
    currentMonthlySpend: tool.monthlySpend,
  };

  // Special case: $0 spend — API tools need manual spend entry; other paid plans signal data issue
  const API_TOOL_IDS = ['anthropic-api', 'openai-api', 'gemini-api'];
  if (tool.monthlySpend === 0 && !['free', 'hobby'].includes(tool.planId)) {
    const reason = API_TOOL_IDS.includes(tool.toolId)
      ? 'Enter your actual monthly API spend to receive tailored recommendations for this tool.'
      : 'Spend is $0 for a paid plan — please verify the amount to get accurate recommendations.';
    return {
      ...base,
      recommendedAction: 'optimal',
      projectedMonthlySavings: 0,
      ruleId: 'data-inconsistency',
      reason,
      estimatedSavings: false,
    };
  }

  // Collect all candidate findings from each rule category
  const candidates: Array<{
    savings: number;
    finding: Omit<ToolFinding, 'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'>;
  }> = [];

  const planFit = applyPlanFitRules(tool, input);
  if (planFit) candidates.push({ savings: planFit.projectedMonthlySavings, finding: planFit });

  const useCase = applyUseCaseRules(tool, input);
  if (useCase) candidates.push({ savings: useCase.projectedMonthlySavings, finding: useCase });

  const upgrade = applyUpgradeRules(tool, input);
  if (upgrade) candidates.push({ savings: upgrade.projectedMonthlySavings, finding: upgrade });

  if (candidates.length === 0) {
    return {
      ...base,
      ...optimalFinding(),
    };
  }

  // Select the rule producing the highest savings
  const best = candidates.sort((a, b) => b.savings - a.savings)[0];
  return { ...base, ...best.finding };
}

function optimalFinding(): Omit<
  ToolFinding,
  'toolId' | 'toolName' | 'currentPlan' | 'currentMonthlySpend'
> {
  return {
    recommendedAction: 'optimal',
    projectedMonthlySavings: 0,
    ruleId: 'already-optimal',
    reason:
      'This tool is on the right plan for your team size and use case. No changes recommended.',
    estimatedSavings: false,
  };
}
