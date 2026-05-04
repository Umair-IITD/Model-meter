import { describe, it, expect } from 'vitest';
import { runAudit } from '../index';

describe('redundant-chatgpt-plus-claude-pro-coding', () => {
  it('fires when both present for coding use case', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [
        { toolId: 'chatgpt', planId: 'plus', monthlySpend: 20, seats: 1 },
        { toolId: 'claude', planId: 'pro', monthlySpend: 20, seats: 1 },
      ],
    });

    expect(result.crossToolFindings.length).toBeGreaterThanOrEqual(1);
    expect(result.crossToolFindings[0].ruleId).toBe(
      'redundant-chatgpt-plus-claude-pro-coding'
    );
    expect(result.crossToolFindings[0].projectedMonthlySavings).toBe(20);
    expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(20);
  });

  it('does NOT fire when use case is NOT coding', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'data',
      tools: [
        { toolId: 'chatgpt', planId: 'plus', monthlySpend: 20, seats: 1 },
        { toolId: 'claude', planId: 'pro', monthlySpend: 20, seats: 1 },
      ],
    });

    const codingRule = result.crossToolFindings.find(
      (f) => f.ruleId === 'redundant-chatgpt-plus-claude-pro-coding'
    );
    expect(codingRule).toBeUndefined();
  });
});

describe('redundant-chatgpt-plus-claude-pro-writing', () => {
  it('fires for writing use case and recommends dropping one', () => {
    const result = runAudit({
      teamSize: 2,
      useCase: 'writing',
      tools: [
        { toolId: 'chatgpt', planId: 'plus', monthlySpend: 20, seats: 1 },
        { toolId: 'claude', planId: 'pro', monthlySpend: 20, seats: 1 },
      ],
    });

    expect(result.crossToolFindings.length).toBeGreaterThanOrEqual(1);
    const rule = result.crossToolFindings.find(
      (f) => f.ruleId === 'redundant-chatgpt-plus-claude-pro-writing'
    );
    expect(rule).toBeDefined();
    expect(rule?.projectedMonthlySavings).toBe(20);
  });
});

describe('redundant-cursor-windsurf-coding', () => {
  it('fires when both cursor and windsurf present for coding', () => {
    const result = runAudit({
      teamSize: 2,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', planId: 'pro', monthlySpend: 20, seats: 1 },
        { toolId: 'windsurf', planId: 'pro', monthlySpend: 20, seats: 1 },
      ],
    });

    const rule = result.crossToolFindings.find(
      (f) => f.ruleId === 'redundant-cursor-windsurf-coding'
    );
    expect(rule).toBeDefined();
    expect(rule?.projectedMonthlySavings).toBe(20); // windsurf spend
  });
});
