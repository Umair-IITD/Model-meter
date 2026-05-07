import Link from 'next/link';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <span className="font-bold text-2xl text-slate-900">Model-meter</span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          This audit doesn&apos;t exist
        </h2>
        <p className="text-slate-500 mb-8">
          The audit link you followed may have expired or be incorrect.
          Start a new audit — it only takes a minute.
        </p>

        <Link href="/audit/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            Start a New Audit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
