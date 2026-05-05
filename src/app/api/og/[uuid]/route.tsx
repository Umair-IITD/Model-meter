import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  let totalMonthlySavings = 0;
  let totalAnnualSavings = 0;
  let toolCount = 0;
  let isOptimal = false;

  try {
    const db = getFirestoreAdmin();
    const doc = await db.collection('audits').doc(uuid).get();

    if (doc.exists) {
      const data = doc.data()!;
      totalMonthlySavings = data.totalMonthlySavings as number;
      totalAnnualSavings = data.totalAnnualSavings as number;
      toolCount = (data.tools as unknown[])?.length ?? 0;
      isOptimal = data.isOptimal as boolean;
    }
  } catch {
    // Render a generic OG image even if Firestore is unavailable
  }

  const savingsText = isOptimal
    ? 'Already Optimized'
    : `$${Math.round(totalAnnualSavings).toLocaleString()}/year in savings`;

  const subText = isOptimal
    ? 'Your AI stack is spending well'
    : `$${Math.round(totalMonthlySavings).toLocaleString()}/month across ${toolCount} tool${toolCount !== 1 ? 's' : ''}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          padding: '60px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              background: '#3b82f6',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Model-meter
          </div>
          <div style={{ color: '#94a3b8', fontSize: '16px', marginLeft: '16px' }}>
            AI Spend Audit by Credex
          </div>
        </div>

        {/* Main savings number */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              color: isOptimal ? '#86efac' : '#4ade80',
              fontSize: isOptimal ? '56px' : '72px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              marginBottom: '16px',
            }}
          >
            {savingsText}
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: '28px',
              fontWeight: 500,
            }}
          >
            {subText}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: '#475569',
            fontSize: '16px',
          }}
        >
          <div>Free AI spend audit — no login required</div>
          <div>model-meter.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    }
  );
}
