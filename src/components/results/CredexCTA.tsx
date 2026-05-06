import { ArrowRight, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CredexCTAProps {
  totalMonthlySavings: number;
}

export function CredexCTA({ totalMonthlySavings }: CredexCTAProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-full bg-white/20 p-3">
          <Zap className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">
            Capture your savings today
          </p>
          <h2 className="text-2xl font-bold mb-3">
            You could save {formatCurrency(totalMonthlySavings)}/month with Credex
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Credex resells discounted AI credits directly from vendors, letting startups access
            the same models at 20–40% below retail. A Credex advisor can walk you through
            capturing the savings identified in this audit — no long-term contract required.
          </p>

          <a
            href="https://credex.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-blue-700 font-semibold px-6 py-3 text-sm hover:bg-blue-50 transition-colors"
          >
            Book a free Credex consultation
            <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-3 text-xs text-blue-200">
            Free consultation · No commitment · Typical response within 1 business day
          </p>
        </div>
      </div>
    </div>
  );
}
