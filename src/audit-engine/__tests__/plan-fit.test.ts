import { describe, it, expect } from 'vitest';
import { runAudit } from '../index';

describe('plan-fit-sub5-cursor-business', () => {
  it('fires when seats < 5 and saves correctly', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 120, seats: 3 }],
    });

    expect(result.findings[0].ruleId).toBe('plan-fit-sub5-cursor-business');
    expect(result.findings[0].recommendedAction).toBe('downgrade');
    expect(result.findings[0].projectedMonthlySavings).toBe(60); // (40-20) × 3
    expect(result.totalMonthlySavings).toBe(60);
    expect(result.totalAnnualSavings).toBe(720);
    expect(result.isOptimal).toBe(false);
  });

  it('does NOT fire when seats === 5 (exact boundary)', () => {
    const result = runAudit({
      teamSize: 5,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 200, seats: 5 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
    expect(result.findings[0].projectedMonthlySavings).toBe(0);
  });

  it('fires when seats === 4', () => {
    const result = runAudit({
      teamSize: 4,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 160, seats: 4 }],
    });

    expect(result.findings[0].ruleId).toBe('plan-fit-sub5-cursor-business');
    expect(result.findings[0].projectedMonthlySavings).toBe(80); // (40-20) × 4
  });
});

describe('plan-fit-sub5-claude-team', () => {
  it('fires when claude team has fewer than 5 seats', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'writing',
      tools: [{ toolId: 'claude', planId: 'team', monthlySpend: 75, seats: 3 }],
    });

    expect(result.findings[0].ruleId).toBe('plan-fit-sub5-claude-team');
    expect(result.findings[0].projectedMonthlySavings).toBe(15); // (25-20) × 3
  });
});

describe('plan-fit-gh-copilot-enterprise-small', () => {
  it('fires for enterprise with 3 seats and recommends business', () => {
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'github-copilot', planId: 'enterprise', monthlySpend: 117, seats: 3 }],
    });

    expect(result.findings[0].ruleId).toBe('plan-fit-gh-copilot-enterprise-small');
    expect(result.findings[0].projectedMonthlySavings).toBe(60); // (39-19) × 3
  });

  it('does NOT fire when seats > 3', () => {
    const result = runAudit({
      teamSize: 5,
      useCase: 'coding',
      tools: [{ toolId: 'github-copilot', planId: 'enterprise', monthlySpend: 195, seats: 5 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
  });
});

describe('plan-fit-solo-team-plan', () => {
  it('fires for solo user on cursor business', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 40, seats: 1 }],
    });

    expect(result.findings[0].ruleId).toBe('plan-fit-sub5-cursor-business');
    expect(result.findings[0].projectedMonthlySavings).toBe(20);
  });
});
