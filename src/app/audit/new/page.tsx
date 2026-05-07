import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';
import { AuditForm } from '@/components/form/AuditForm';

export const metadata: Metadata = {
  title: 'Run Your AI Spend Audit',
  description:
    'Enter your AI tools, plans, and monthly spend. Get an instant per-tool breakdown with savings recommendations.',
};

export default function NewAuditPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">Model-meter</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Audit Your AI Spend
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Add the AI tools your team subscribes to, enter what you currently pay,
            and get an instant savings breakdown.
          </p>
        </div>

        <AuditForm />

        <p className="mt-8 text-xs text-center text-slate-400">
          Model-meter uses official vendor pricing only. No data is shared with vendors.
          Results are for informational purposes only.
        </p>
      </main>
    </div>
  );
}
