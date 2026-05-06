'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TOOL_PLANS } from '@/lib/tool-plans';
import type { ToolId } from '@/lib/schemas';

interface PlanSelectorProps {
  toolId: ToolId;
  value: string;
  onChange: (planId: string) => void;
}

export function PlanSelector({ toolId, value, onChange }: PlanSelectorProps) {
  const plans = TOOL_PLANS[toolId] ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Select plan">
        <SelectValue placeholder="Select plan" />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.planId} value={plan.planId}>
            {plan.planName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
