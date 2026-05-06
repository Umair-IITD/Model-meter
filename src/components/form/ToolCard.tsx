'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ToolSelector } from './ToolSelector';
import { PlanSelector } from './PlanSelector';
import { PRICING } from '@/audit-engine/pricing';
import type { FormTool } from '@/hooks/useAuditForm';
import type { ToolId } from '@/lib/schemas';

interface ToolCardProps {
  tool: FormTool;
  index: number;
  onUpdate: (id: string, changes: Partial<Omit<FormTool, 'id'>>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function isApiTool(toolId: ToolId): boolean {
  return ['anthropic-api', 'openai-api', 'gemini-api'].includes(toolId);
}

export function ToolCard({ tool, index, onUpdate, onRemove, canRemove }: ToolCardProps) {
  const toolIsApi = isApiTool(tool.toolId);

  function handleToolChange(toolId: ToolId) {
    const firstPlanId = Object.keys(PRICING[toolId] ?? {})[0] ?? 'free';
    onUpdate(tool.id, { toolId, planId: firstPlanId, monthlySpend: 0, seats: 1 });
  }

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(tool.id)}
            aria-label={`Remove tool ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tool selector */}
          <div className="space-y-1.5">
            <Label>Tool</Label>
            <ToolSelector
              value={tool.toolId}
              onChange={handleToolChange}
            />
          </div>

          {/* Plan selector */}
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <PlanSelector
              toolId={tool.toolId}
              value={tool.planId}
              onChange={(planId) => onUpdate(tool.id, { planId })}
            />
          </div>

          {/* Monthly spend */}
          <div className="space-y-1.5">
            <Label htmlFor={`spend-${tool.id}`}>Monthly spend (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id={`spend-${tool.id}`}
                type="number"
                min={0}
                step="0.01"
                className="pl-7"
                value={tool.monthlySpend}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate(tool.id, { monthlySpend: isNaN(val) ? 0 : val });
                }}
                placeholder="0"
              />
            </div>
            {toolIsApi && (
              <p className="text-xs text-muted-foreground">Your last month&apos;s API bill</p>
            )}
          </div>

          {/* Seats — hidden for API tools */}
          {!toolIsApi && (
            <div className="space-y-1.5">
              <Label htmlFor={`seats-${tool.id}`}>Seats</Label>
              <Input
                id={`seats-${tool.id}`}
                type="number"
                min={1}
                value={tool.seats}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdate(tool.id, { seats: isNaN(val) || val < 1 ? 1 : val });
                }}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Number of licensed users</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
