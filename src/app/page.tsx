import Link from 'next/link';
import { ArrowRight, DollarSign, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SOCIAL_PROOF = [
  { company: 'Series A SaaS', result: 'Identified $2,400/month in redundant AI subscriptions' },
  { company: 'Pre-seed startup', result: 'Consolidated 3 AI tools to 1, saving $480/month' },
  { company: '15-person eng team', result: 'Switched from flaghship API to Flash-Lite, saving $1,200/month' },
] as const;

const FEATURES = [
  {
    icon: DollarSign,
    title: 'Source-cited pricing',
    description:
      'Every recommendation is backed by official vendor pricing — no guesswork, no outdated numbers.',
  },
  {
    icon: BarChart3,
    title: 'Per-tool breakdown',
    description:
      'See exactly which tools are over-provisioned, redundant, or on the wrong plan for your team size.',
  },
  {
    icon: Shield,
    title: 'No login, no tracking',
    description:
      'Run a full audit without creating an account. Your data is never sold or used for advertising.',
  },
  {
    icon: Zap,
    title: 'Results in 5 seconds',
    description:
      'Deterministic rule engine — no AI in the calculation path. Same input always gives same output.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Model-meter</span>
            <span className="text-xs text-slate-400 hidden sm:inline">by Credex</span>
          </div>
          <Link href="/audit/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Run free audit
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
          <Zap className="h-3.5 w-3.5" />
          Free for teams of any size
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Is your team{' '}
          <span className="text-blue-600">overpaying</span>
          {' '}for AI tools?
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Model-meter audits what your startup spends on Cursor, GitHub Copilot, Claude,
          ChatGPT, and more — then tells you exactly where the waste is. No login required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/audit/new">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-13 px-8 rounded-xl gap-2"
            >
              Audit My AI Spend
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-slate-500">
            Takes about 60 seconds · Results shown instantly
          </p>
        </div>
      </section>

      {/* Social proof — labelled as illustrative */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Illustrative savings from typical startup audits
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((proof) => (
              <div key={proof.company} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-2">{proof.company}</p>
                <p className="font-semibold text-slate-800 text-sm">{proof.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Built for finance-literate founders
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            See your savings in under a minute
          </h2>
          <p className="text-slate-400 mb-8">
            No account. No credit card. No sales call required to see results.
          </p>
          <Link href="/audit/new">
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold text-base h-12 px-8 rounded-xl gap-2"
            >
              Start Free Audit
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Model-meter</span>
            <span className="text-slate-400">by Credex</span>
          </div>
          <p>Pricing sourced from official vendor pages · Updated 2026-05-08</p>
        </div>
      </footer>
    </div>
  );
}
