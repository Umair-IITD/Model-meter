import { Sparkles } from 'lucide-react';

interface AISummaryProps {
  summary: string;
}

export function AISummary({ summary }: AISummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          AI Analysis
        </span>
      </div>
      <p className="text-slate-700 leading-relaxed">{summary}</p>
    </div>
  );
}
