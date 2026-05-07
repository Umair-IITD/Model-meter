import { NextRequest, NextResponse } from 'next/server';
import { LeadApiRequest } from '@/lib/schemas';
import { getFirestoreAdmin } from '@/lib/firebase-admin';
import { sendAuditEmail } from '@/lib/resend';

// In-memory rate limiter for lead submissions
const leadRateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_LEADS_PER_IP_PER_HOUR = 3;

function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = leadRateLimits.get(ip);

  if (!entry || entry.resetAt < now) {
    leadRateLimits.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }

  if (entry.count >= MAX_LEADS_PER_IP_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  const parsed = LeadApiRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot check — silently succeed if bot filled the hidden field
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ success: true });
  }

  // Rate limit AFTER honeypot (don't waste rate limit slots on bots)
  if (!checkLeadRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in an hour.' },
      { status: 429 }
    );
  }

  // Fetch audit once — used for savings denormalization + email recommendations
  const db = getFirestoreAdmin();
  let totalMonthlySavings = 0;
  let topRecommendations: string[] = [];

  try {
    const auditDoc = await db.collection('audits').doc(data.auditId).get();
    if (auditDoc.exists) {
      const auditData = auditDoc.data()!;
      totalMonthlySavings = (auditData.totalMonthlySavings as number) ?? 0;

      if (auditData.findings) {
        const findings = auditData.findings as Array<{
          toolName: string;
          reason: string;
          projectedMonthlySavings: number;
        }>;
        topRecommendations = findings
          .filter((f) => f.projectedMonthlySavings > 0)
          .sort((a, b) => b.projectedMonthlySavings - a.projectedMonthlySavings)
          .slice(0, 2)
          .map((f) => `${f.toolName}: ${f.reason}`);
      }
    }
  } catch (error) {
    console.error('[api/leads] Could not fetch audit:', error);
    // Non-fatal — continue with zero savings
  }

  const highSavings = totalMonthlySavings > 500;

  // Persist lead to Firestore (private collection — no public access)
  try {
    await db.collection('leads').add({
      auditId: data.auditId,
      email: data.email,
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.role && { role: data.role }),
      ...(data.teamSize && { teamSize: data.teamSize }),
      createdAt: new Date(),
      totalMonthlySavings,
      highSavings,
    });
  } catch (error) {
    console.error('[api/leads] Firestore write failed:', error);
    return NextResponse.json(
      { error: "Couldn't save your email. Please try again." },
      { status: 500 }
    );
  }

  // Send transactional email — failure is non-fatal (lead is already stored)
  try {
    await sendAuditEmail({
      to: data.email,
      auditId: data.auditId,
      totalMonthlySavings,
      topRecommendations,
      highSavings,
    });
  } catch (error) {
    console.error('[api/leads] Resend email failed (non-fatal):', error);
    // Don't return error to client — lead is stored, email is best-effort
  }

  return NextResponse.json({ success: true });
}
