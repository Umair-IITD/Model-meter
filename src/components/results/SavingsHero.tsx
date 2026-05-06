import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SavingsHeroProps {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isOptimal: boolean;
}

export function SavingsHero({ totalMonthlySavings, totalAnnualSavings, isOptimal }: SavingsHeroProps) {
  if (isOptimal) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <TrendingUp className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-green-800">You&apos;re spending well</h1>
        </div>
        <p className="text-green-700 text-lg">
          Your AI stack is already well-optimized. No significant savings identified.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-950 to-slate-900 p-8 text-center text-white shadow-xl">
      <div className="flex items-center justify-center gap-2 mb-2">
        <TrendingDown className="h-6 w-6 text-blue-300" />
        <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest">
          Potential savings identified
        </p>
      </div>

      <div className="my-4">
        <span className="text-6xl font-extrabold text-green-400 tracking-tight">
          {formatCurrency(totalMonthlySavings)}
        </span>
        <span className="text-2xl font-medium text-white/70 ml-2">/month</span>
      </div>

      <div className="text-white/60 text-lg">
        {formatCurrency(totalAnnualSavings)}{' '}
        <span className="font-semibold text-white/80">per year</span>
      </div>

      <p className="mt-4 text-sm text-white/50">
        Based on official vendor pricing · Conservative estimates
      </p>
    </div>
  );
}
