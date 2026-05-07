import Groq from 'groq-sdk';
import type { AuditResult } from '@/lib/schemas';

// llama-3.1-8b-instant: fast, free-tier available, good for short summaries
const SUMMARY_MODEL = 'llama-3.1-8b-instant';
const SUMMARY_MAX_TOKENS = 200;
const SUMMARY_TIMEOUT_MS = 8000;

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
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
    const client = getGroqClient();
    const prompt = buildPrompt(result, teamSize, useCase);

    const apiPromise = client.chat.completions.create({
      model: SUMMARY_MODEL,
      max_tokens: SUMMARY_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Groq API timeout')), SUMMARY_TIMEOUT_MS)
    );

    const completion = await Promise.race([apiPromise, timeoutPromise]);
    const text = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!text) {
      return { summary: generateTemplateSummary(result), summaryIsAI: false };
    }

    return { summary: text, summaryIsAI: true };
  } catch (error) {
    console.error('[ai-summary] Groq API error — using template fallback:', error);
    return { summary: generateTemplateSummary(result), summaryIsAI: false };
  }
}
