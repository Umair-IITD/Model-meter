import Anthropic from '@anthropic-ai/sdk';
import type { AuditResult } from '@/lib/schemas';

// Uses claude-haiku-4-5-20251001 — sufficient for 100-word summaries, 5x cheaper than Sonnet
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001';
const SUMMARY_MAX_TOKENS = 200;
const SUMMARY_TIMEOUT_MS = 8000;

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function buildPrompt(result: AuditResult, teamSize: number, useCase: string): string {
  const topFindings = result.findings
    .filter((f) => f.projectedMonthlySavings > 0)
    .sort((a, b) => b.projectedMonthlySavings - a.projectedMonthlySavings)
    .slice(0, 3)
    .map((f) => `- ${f.toolName} (${f.currentPlan}): ${f.reason} Saves $${f.projectedMonthlySavings}/month.`)
    .join('\n');

  const crossFindings = result.crossToolFindings
    .slice(0, 2)
    .map((f) => `- ${f.toolIds.join(' + ')}: ${f.reason} Saves $${f.projectedMonthlySavings}/month.`)
    .join('\n');

  const allFindings = [topFindings, crossFindings].filter(Boolean).join('\n');

  return `You are a financial advisor writing an executive summary for an AI tooling cost audit.

Team: ${teamSize} people, primary use case: ${useCase}
Total potential savings: $${result.totalMonthlySavings}/month ($${result.totalAnnualSavings}/year)
${result.isOptimal ? 'Status: Already well-optimized' : ''}

Key findings:
${allFindings || 'No specific optimizations found — stack appears well-configured.'}

Write a 100-word plain-English executive summary. Be direct, specific about dollar amounts, and actionable. No jargon. Second person ("your team"). Do not mention specific vendor discounts or third parties. End with one clear recommended first step.`;
}

function generateTemplateSummary(result: AuditResult): string {
  if (result.isOptimal) {
    return `Your current AI tooling stack appears well-optimized for your team's size and use case. The tools and plans you've selected align with best-practice configurations. No immediate changes are recommended. Continue reviewing your stack quarterly as vendor pricing and feature sets evolve — the landscape changes quickly and a plan that's optimal today may not be in six months.`;
  }

  const topFinding = result.findings
    .filter((f) => f.projectedMonthlySavings > 0)
    .sort((a, b) => b.projectedMonthlySavings - a.projectedMonthlySavings)[0];

  const monthly = result.totalMonthlySavings;
  const annual = result.totalAnnualSavings;
  const highSavings = monthly > 500;

  return (
    `Your current AI configuration has an estimated saving of $${monthly}/month ($${annual}/year). ` +
    (topFinding
      ? `The biggest opportunity is ${topFinding.toolName}: ${topFinding.reason} Optimizing this subscription alone could save your team $${topFinding.projectedMonthlySavings}/month. `
      : '') +
    (highSavings
      ? 'These savings are significant enough to warrant immediate action — review the recommendations below and prioritize the highest-savings changes first.'
      : 'Start with the highest-savings item below and work your way down the list.')
  );
}

export async function generateAuditSummary(
  result: AuditResult,
  teamSize: number,
  useCase: string
): Promise<{ summary: string; summaryIsAI: boolean }> {
  try {
    const client = getAnthropicClient();
    const prompt = buildPrompt(result, teamSize, useCase);

    const apiPromise = client.messages.create({
      model: SUMMARY_MODEL,
      max_tokens: SUMMARY_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Anthropic API timeout')), SUMMARY_TIMEOUT_MS)
    );

    const message = await Promise.race([apiPromise, timeoutPromise]);
    const firstBlock = message.content[0];
    const text = firstBlock.type === 'text' ? firstBlock.text.trim() : '';

    if (!text) {
      return { summary: generateTemplateSummary(result), summaryIsAI: false };
    }

    return { summary: text, summaryIsAI: true };
  } catch (error) {
    console.error('[ai-summary] Anthropic API error — using template fallback:', error);
    return { summary: generateTemplateSummary(result), summaryIsAI: false };
  }
}
