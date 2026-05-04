import { describe, it, expect } from 'vitest';
import { runAudit } from '../index';

describe('integration: full audit with 3 tools', () => {
  it('returns correct total monthly and annual savings', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 },       // saves $60
        { toolId: 'github-copilot', planId: 'enterprise', monthlySpend: 117, seats: 3 }, // saves $60
        { toolId: 'claude', planId: 'team', monthlySpend: 75, seats: 3 },             // saves $15
      ],
    });

    expect(result.findings.length).toBe(3);
    expect(result.totalMonthlySavings).toBe(135);
    expect(result.totalAnnualSavings).toBe(1620);
    expect(result.isOptimal).toBe(false);

    // Each finding must have required fields
    result.findings.forEach((f) => {
      expect(f.ruleId).toBeTruthy();
      expect(f.reason).toBeTruthy();
      expect(f.recommendedAction).toBeTruthy();
      expect(typeof f.projectedMonthlySavings).toBe('number');
    });
  });

  it('cursor finding has correct rule and savings', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 }],
    });

    const cursorFinding = result.findings.find((f) => f.toolId === 'cursor');
    expect(cursorFinding?.ruleId).toBe('plan-fit-sub5-cursor-business');
    expect(cursorFinding?.projectedMonthlySavings).toBe(60);
  });

  it('github-copilot finding has correct rule and savings', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'github-copilot', planId: 'enterprise', monthlySpend: 117, seats: 3 }],
    });

    const ghFinding = result.findings.find((f) => f.toolId === 'github-copilot');
    expect(ghFinding?.ruleId).toBe('plan-fit-gh-copilot-enterprise-small');
    expect(ghFinding?.projectedMonthlySavings).toBe(60);
  });

  it('claude finding has correct rule and savings', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'claude', planId: 'team', monthlySpend: 75, seats: 3 }],
    });

    const claudeFinding = result.findings.find((f) => f.toolId === 'claude');
    expect(claudeFinding?.ruleId).toBe('plan-fit-sub5-claude-team');
    expect(claudeFinding?.projectedMonthlySavings).toBe(15);
  });

  it('single-tool audit still produces a valid result', () => {
    const result = runAudit({
      teamSize: 5,
      useCase: 'mixed',
      tools: [{ toolId: 'chatgpt', planId: 'plus', monthlySpend: 20, seats: 1 }],
    });

    expect(result.findings.length).toBe(1);
    expect(result.findings[0].toolId).toBe('chatgpt');
    expect(typeof result.totalMonthlySavings).toBe('number');
  });
});
