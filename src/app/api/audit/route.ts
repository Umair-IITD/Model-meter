import { NextRequest, NextResponse } from 'next/server';
import { AuditApiRequest } from '@/lib/schemas';
import { runAudit } from '@/audit-engine/index';
import { generateAuditSummary } from '@/lib/ai-summary';
import { getFirestoreAdmin } from '@/lib/firebase-admin';

// In-memory rate limiter — acceptable for MVP, doesn't persist across cold starts
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_AUDITS_PER_IP_PER_HOUR = 10;

function checkAuditRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }

  if (entry.count >= MAX_AUDITS_PER_IP_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  if (!checkAuditRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in an hour.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  const parsed = AuditApiRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const auditResult = runAudit(input);

  const auditId = crypto.randomUUID();

  // Generate AI summary (fails gracefully — template fallback in generateAuditSummary)
  const { summary, summaryIsAI } = await generateAuditSummary(
    auditResult,
    input.teamSize,
    input.useCase
  );

  // Persist to Firestore — public-safe, no PII
  try {
    const db = getFirestoreAdmin();
    await db.collection('audits').doc(auditId).set({
      createdAt: new Date(),
      useCase: input.useCase,
      teamSize: input.teamSize,
      tools: input.tools,
      findings: auditResult.findings,
      crossToolFindings: auditResult.crossToolFindings,
      totalMonthlySavings: auditResult.totalMonthlySavings,
      totalAnnualSavings: auditResult.totalAnnualSavings,
      isOptimal: auditResult.isOptimal,
      summary,
    });
  } catch (error) {
    console.error('[api/audit] Firestore write failed:', error);
    return NextResponse.json(
      { error: 'Could not save your audit. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    auditId,
    totalMonthlySavings: auditResult.totalMonthlySavings,
    totalAnnualSavings: auditResult.totalAnnualSavings,
    isOptimal: auditResult.isOptimal,
    findings: auditResult.findings,
    crossToolFindings: auditResult.crossToolFindings,
    summary,
    summaryIsAI,
  });
}
