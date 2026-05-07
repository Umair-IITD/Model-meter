'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ToolSelector } from './ToolSelector';
import { PlanSelector } from './PlanSelector';
import { PRICING, getExpectedMonthlySpend, isApiTokenTool } from '@/audit-engine/pricing';
import type { FormTool } from '@/hooks/useAuditForm';
import type { ToolId } from '@/lib/schemas';

interface ToolCardProps {
  tool: FormTool;
  index: number;
  onUpdate: (id: string, changes: Partial<Omit<FormTool, 'id'>>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function ToolCard({ tool, index, onUpdate, onRemove, canRemove }: ToolCardProps) {
  const toolIsApi = isApiTokenTool(tool.toolId);

  // Local string state for seats avoids the number-input concatenation bug
  // (typing "2" into a field showing "1" would produce "12" with a pure number binding)
  const [seatsRaw, setSeatsRaw] = useState(String(tool.seats));

  // Sync external resets (e.g. when the user changes the tool type)
  useEffect(() => {
    setSeatsRaw(String(tool.seats));
  }, [tool.seats]);

  function handleToolChange(toolId: ToolId) {
    const firstPlanId = Object.keys(PRICING[toolId] ?? {})[0] ?? 'free';
    const calculatedSpend = getExpectedMonthlySpend(toolId, firstPlanId, 1);
    setSeatsRaw('1');
    onUpdate(tool.id, { toolId, planId: firstPlanId, monthlySpend: calculatedSpend, seats: 1 });
  }

  function handlePlanChange(planId: string) {
    const spend = toolIsApi
      ? tool.monthlySpend
      : getExpectedMonthlySpend(tool.toolId, planId, tool.seats);
    onUpdate(tool.id, { planId, monthlySpend: spend });
  }

  function handleSeatsChange(raw: string) {
    // Allow empty or in-progress input (e.g. user is clearing the field)
    setSeatsRaw(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const spend = getExpectedMonthlySpend(tool.toolId, tool.planId, parsed);
      onUpdate(tool.id, { seats: parsed, monthlySpend: spend });
    }
  }

  function handleSeatsBlur() {
    const parsed = parseInt(seatsRaw, 10);
    const safe = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setSeatsRaw(String(safe));
    if (safe !== tool.seats) {
      const spend = getExpectedMonthlySpend(tool.toolId, tool.planId, safe);
      onUpdate(tool.id, { seats: safe, monthlySpend: spend });
    }
  }

  const calculatedSpend = toolIsApi ? null : getExpectedMonthlySpend(tool.toolId, tool.planId, tool.seats);

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

        {/* Column order: Tool | Plan | Seats | Monthly Spend */}
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${toolIsApi ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>

          {/* 1. Tool selector */}
          <div className="space-y-1.5">
            <Label>Tool</Label>
            <ToolSelector value={tool.toolId} onChange={handleToolChange} />
          </div>

          {/* 2. Plan selector */}
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <PlanSelector
              toolId={tool.toolId}
              value={tool.planId}
              onChange={handlePlanChange}
            />
          </div>

          {/* 3. Seats — hidden for API tools (usage-based, no seat concept) */}
          {!toolIsApi && (
            <div className="space-y-1.5">
              <Label htmlFor={`seats-${tool.id}`}>Seats</Label>
              <Input
                id={`seats-${tool.id}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={seatsRaw}
                onChange={(e) => handleSeatsChange(e.target.value)}
                onBlur={handleSeatsBlur}
                onFocus={(e) => e.target.select()}
                placeholder="1"
                aria-label="Number of licensed users"
              />
              <p className="text-xs text-muted-foreground">Licensed users</p>
            </div>
          )}

          {/* 4. Monthly spend */}
          {toolIsApi ? (
            /* API tools: manual entry — usage varies each month */
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
                  step={1}
                  className="pl-7"
                  value={tool.monthlySpend === 0 ? '' : tool.monthlySpend}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdate(tool.id, { monthlySpend: isNaN(val) ? 0 : val });
                  }}
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-muted-foreground">Your last month&apos;s API bill</p>
            </div>
          ) : (
            /* Non-API tools: auto-calculated from plan × seats */
            <div className="space-y-1.5">
              <Label>Monthly spend</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-slate-50 px-3 text-sm">
                <span className="font-medium text-slate-800">
                  ${(calculatedSpend ?? 0).toLocaleString()}
                  <span className="text-slate-500">/mo</span>
                </span>
                <span className="ml-auto text-xs font-normal text-slate-400">auto</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {tool.seats > 1
                  ? `${tool.seats} × $${(calculatedSpend ?? 0) / tool.seats}/seat`
                  : 'From plan price'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
