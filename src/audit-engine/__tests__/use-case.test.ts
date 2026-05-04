import { describe, it, expect } from 'vitest';
import { runAudit } from '../index';

describe('use-case-api-data-extraction', () => {
  it('fires for anthropic opus with data use case', () => {
    const result = runAudit({
      teamSize: 2,
      useCase: 'data',
      tools: [{ toolId: 'anthropic-api', planId: 'opus', monthlySpend: 500, seats: 1 }],
    });

    expect(result.findings[0].ruleId).toBe('use-case-api-data-extraction');
    expect(result.findings[0].recommendedAction).toBe('switch');
    expect(result.findings[0].projectedMonthlySavings).toBeGreaterThan(0);
    expect(result.findings[0].estimatedSavings).toBe(true);
    // Must mention the cheapest alternative
    expect(
      result.findings[0].reason.toLowerCase().includes('flash') ||
      result.findings[0].reason.includes('50x')
    ).toBe(true);
  });

  it('fires for openai flagship model with data use case', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'data',
      tools: [{ toolId: 'openai-api', planId: 'flagship', monthlySpend: 300, seats: 1 }],
    });

    expect(result.findings[0].ruleId).toBe('use-case-api-data-extraction');
    expect(result.findings[0].estimatedSavings).toBe(true);
  });

  it('does NOT fire for anthropic haiku (already cheapest)', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'data',
      tools: [{ toolId: 'anthropic-api', planId: 'haiku', monthlySpend: 50, seats: 1 }],
    });

    expect(result.findings[0].ruleId).not.toBe('use-case-api-data-extraction');
    expect(result.findings[0].recommendedAction).toBe('optimal');
  });

  it('does NOT fire when use case is not data', () => {
    const result = runAudit({
      teamSize: 2,
      useCase: 'coding',
      tools: [{ toolId: 'anthropic-api', planId: 'opus', monthlySpend: 200, seats: 1 }],
    });

    expect(result.findings[0].ruleId).not.toBe('use-case-api-data-extraction');
  });
});

describe('use-case-chatgpt-pro200-coding', () => {
  it('recommends cursor business for chatgpt pro-200 coding user', () => {
    const result = runAudit({
      teamSize: 1,
      useCase: 'coding',
      tools: [{ toolId: 'chatgpt', planId: 'pro-200', monthlySpend: 200, seats: 1 }],
    });

    expect(result.findings[0].ruleId).toBe('use-case-chatgpt-pro200-coding');
    expect(result.findings[0].recommendedAction).toBe('switch');
    expect(result.findings[0].projectedMonthlySavings).toBe(160); // 200 - 40
  });
});
