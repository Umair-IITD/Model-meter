import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';
import { getFirestoreAdmin } from '@/lib/firebase-admin';
import type { AuditDocument } from '@/lib/schemas';
import { SavingsHero } from '@/components/results/SavingsHero';
import { AISummary } from '@/components/results/AISummary';
import { FindingsTable } from '@/components/results/FindingsTable';
import { CredexCTA } from '@/components/results/CredexCTA';
import { OptimalBlock } from '@/components/results/OptimalBlock';
import { LeadCaptureForm } from '@/components/results/LeadCaptureForm';
import { ShareButton } from '@/components/results/ShareButton';

async function getAudit(uuid: string): Promise<(AuditDocument & { id: string }) | null> {
  try {
    const db = getFirestoreAdmin();
    const doc = await db.collection('audits').doc(uuid).get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as AuditDocument & { id: string };
  } catch (error) {
    console.error('[audit/[uuid]] Firestore read failed:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const audit = await getAudit(uuid);

  if (!audit) {
    return { title: 'Audit Not Found' };
  }

  const monthly = Math.round(audit.totalMonthlySavings);
  const title = audit.isOptimal
    ? 'AI Spend Audit — Already Optimized'
    : `AI Spend Audit — $${monthly.toLocaleString()}/mo potential savings`;
  const description = audit.summary.slice(0, 160);
  const ogUrl = `/api/og/${uuid}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function AuditResultPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const audit = await getAudit(uuid);

  if (!audit) {
    notFound();
  }

  const showCredexCTA = audit.totalMonthlySavings > 500;
  const showOptimalBlock = audit.isOptimal || audit.totalMonthlySavings < 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-slate-900 hidden sm:inline">Model-meter</span>
            </div>
          </div>
          <ShareButton auditId={uuid} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* 1. Hero — savings numbers above the fold */}
        <SavingsHero
          totalMonthlySavings={audit.totalMonthlySavings}
          totalAnnualSavings={audit.totalAnnualSavings}
          isOptimal={audit.isOptimal}
        />

        {/* 2. AI-generated (or template) summary */}
        <AISummary summary={audit.summary} />

        {/* 3. Per-tool breakdown */}
        <FindingsTable
          findings={audit.findings}
          crossToolFindings={audit.crossToolFindings}
        />

        {/* 4. Conditional Credex CTA */}
        {showCredexCTA && (
          <CredexCTA totalMonthlySavings={audit.totalMonthlySavings} />
        )}

        {/* 5. Optimal / low-savings message */}
        {showOptimalBlock && !showCredexCTA && <OptimalBlock />}

        {/* 6. Lead capture (always shown, below value) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Get This Report by Email</h2>
          <LeadCaptureForm
            auditId={uuid}
            totalMonthlySavings={audit.totalMonthlySavings}
          />
        </div>

        {/* Metadata footer */}
        <div className="text-xs text-center text-slate-400 pb-8 space-y-1">
          <p>
            Audit ID: <code className="font-mono">{uuid}</code> ·{' '}
            {audit.tools.length} tool{audit.tools.length !== 1 ? 's' : ''} analyzed
          </p>
          <p>
            Pricing sourced from official vendor pages · Updated 2026-05-08 ·{' '}
            <Link href="/audit/new" className="text-blue-500 hover:underline">
              Run a new audit
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
