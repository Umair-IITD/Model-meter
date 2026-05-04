import { describe, it, expect } from 'vitest';
import { runAudit } from '../index';

describe('optimal: user already on correct plan', () => {
  it('returns optimal with zero savings for large cursor business team', () => {
    const result = runAudit({
      teamSize: 10,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'business', monthlySpend: 400, seats: 10 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
    expect(result.findings[0].projectedMonthlySavings).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });

  it('returns optimal for cursor pro on individual plan', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'pro', monthlySpend: 20, seats: 1 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });

  it('returns optimal for github copilot pro (individual)', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'github-copilot', planId: 'pro', monthlySpend: 10, seats: 1 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
    expect(result.isOptimal).toBe(true);
  });
});

describe('edge case: zero spend on paid plan', () => {
  it('flags inconsistency and does not claim savings', () => {
    const result = runAudit({
      teamSize: 5,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'pro', monthlySpend: 0, seats: 1 }],
    });

    expect(result.findings[0].projectedMonthlySavings).toBe(0);
    expect(result.findings[0].ruleId).toBe('data-inconsistency');
  });
});

describe('edge case: free plans are always optimal', () => {
  it('returns optimal for cursor hobby (free)', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'hobby', monthlySpend: 0, seats: 1 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
    expect(result.isOptimal).toBe(true);
  });
});

describe('edge case: API direct tools', () => {
  it('handles anthropic API with coding use case — no seat rules apply', () => {
    const result = runAudit({
      teamSize: 2,
      useCase: 'coding',
      tools: [{ toolId: 'anthropic-api', planId: 'sonnet', monthlySpend: 100, seats: 1 }],
    });

    expect(result.findings[0].toolId).toBe('anthropic-api');
    // No plan-fit rules should fire for API tools
    expect(result.findings[0].ruleId).not.toBe('plan-fit-sub5-cursor-business');
  });

  it('handles openai API as optimal when use case does not trigger rules', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'openai-api', planId: 'nano', monthlySpend: 20, seats: 1 }],
    });

    expect(result.findings[0].recommendedAction).toBe('optimal');
  });
});

describe('edge case: savings threshold (isOptimal)', () => {
  it('isOptimal === true when total savings < $5', () => {
    // Claude team with 1 seat: saves $(25-20)×1 = $5 — boundary at exactly $5
    // We need savings < 5 for isOptimal
    const result = runAudit({
      teamSize: 3,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'pro', monthlySpend: 22, seats: 1 }],
      // Cursor pro at $22 — no rules fire, $0 savings
    });

    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });
});

describe('upgrade: cursor pro overspend', () => {
  it('recommends pro+ upgrade when cursor pro spend exceeds $60', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'pro', monthlySpend: 90, seats: 1 }],
    });

    expect(result.findings[0].ruleId).toBe('upgrade-cursor-pro-over-spend');
    expect(result.findings[0].recommendedAction).toBe('upgrade');
    expect(result.findings[0].projectedMonthlySavings).toBe(30); // 90 - 60
  });

  it('does NOT recommend upgrade when spend is between $40-$60 (breakeven zone)', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', planId: 'pro', monthlySpend: 50, seats: 1 }],
    });

    expect(result.findings[0].ruleId).not.toBe('upgrade-cursor-pro-over-spend');
  });
});
