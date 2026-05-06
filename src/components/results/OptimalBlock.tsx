import { Bell, CheckCircle } from 'lucide-react';

export function OptimalBlock() {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <div className="flex items-start gap-4">
        <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-green-900 text-lg">
            Your AI stack is well-optimized
          </h3>
          <p className="text-green-700 text-sm mt-1 leading-relaxed">
            Based on current vendor pricing, your team is on the right plans for your size
            and use case. No immediate changes are recommended.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">
              Enter your email below to be notified when new optimizations apply to your stack.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
