import { ArrowDown, ArrowUp, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { CrossToolFinding, ToolFinding } from '@/lib/schemas';

interface FindingsTableProps {
  findings: ToolFinding[];
  crossToolFindings: CrossToolFinding[];
}

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case 'downgrade':
      return (
        <Badge variant="warning" className="gap-1">
          <ArrowDown className="h-3 w-3" /> Downgrade
        </Badge>
      );
    case 'upgrade':
      return (
        <Badge variant="info" className="gap-1">
          <ArrowUp className="h-3 w-3" /> Upgrade to save
        </Badge>
      );
    case 'switch':
      return (
        <Badge variant="warning" className="gap-1">
          <ArrowRight className="h-3 w-3" /> Switch tool
        </Badge>
      );
    default:
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Optimal
        </Badge>
      );
  }
}

export function FindingsTable({ findings, crossToolFindings }: FindingsTableProps) {
  const hasFindings = findings.length > 0 || crossToolFindings.length > 0;

  if (!hasFindings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tool data to display.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Per-Tool Breakdown</h2>

      {/* Per-tool findings */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Tool & Plan</span>
          <span className="text-right">Current</span>
          <span>Recommendation</span>
          <span className="text-right">Savings/mo</span>
        </div>

        <div className="divide-y divide-slate-100">
          {findings.map((finding) => (
            <div key={finding.toolId} className="px-5 py-4">
              {/* Mobile layout */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{finding.toolName}</p>
                    <p className="text-sm text-slate-500">{finding.currentPlan}</p>
                  </div>
                  <ActionBadge action={finding.recommendedAction} />
                </div>
                <p className="text-sm text-slate-600">{finding.reason}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Current: {formatCurrency(finding.currentMonthlySpend)}/mo
                  </span>
                  {finding.projectedMonthlySavings > 0 && (
                    <span className="font-bold text-green-700">
                      {finding.estimatedSavings ? '~' : ''}
                      {formatCurrency(finding.projectedMonthlySavings)} saved
                    </span>
                  )}
                </div>
                {finding.recommendedPlan && (
                  <p className="text-xs text-blue-600">→ {finding.recommendedPlan}</p>
                )}
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-start">
                <div>
                  <p className="font-semibold text-slate-900">{finding.toolName}</p>
                  <p className="text-sm text-slate-500">{finding.currentPlan}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{finding.reason}</p>
                  {finding.recommendedPlan && (
                    <p className="text-xs text-blue-600 mt-1">→ {finding.recommendedPlan}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {formatCurrency(finding.currentMonthlySpend)}/mo
                  </p>
                </div>

                <div>
                  <ActionBadge action={finding.recommendedAction} />
                </div>

                <div className="text-right min-w-[80px]">
                  {finding.projectedMonthlySavings > 0 ? (
                    <p className="font-bold text-green-700">
                      {finding.estimatedSavings ? '~' : ''}
                      {formatCurrency(finding.projectedMonthlySavings)}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-sm">—</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-tool findings */}
      {crossToolFindings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Redundancy Detected
          </h3>
          <div className="space-y-3">
            {crossToolFindings.map((finding) => (
              <div
                key={finding.ruleId}
                className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      {finding.toolIds.join(' + ')}
                    </p>
                    <p className="text-sm text-amber-800 mt-1">{finding.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-green-700">
                      {formatCurrency(finding.projectedMonthlySavings)}/mo
                    </p>
                    <p className="text-xs text-amber-600 capitalize">
                      {finding.recommendedAction.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
