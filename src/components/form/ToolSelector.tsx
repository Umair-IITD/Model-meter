'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TOOL_NAMES, TOOL_IDS } from '@/lib/tool-plans';
import type { ToolId } from '@/lib/schemas';

interface ToolSelectorProps {
  value: ToolId;
  onChange: (toolId: ToolId) => void;
  disabledToolIds?: ToolId[];
}

export function ToolSelector({ value, onChange, disabledToolIds = [] }: ToolSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ToolId)}>
      <SelectTrigger aria-label="Select AI tool">
        <SelectValue placeholder="Select tool" />
      </SelectTrigger>
      <SelectContent>
        {TOOL_IDS.map((toolId) => (
          <SelectItem
            key={toolId}
            value={toolId}
            disabled={disabledToolIds.includes(toolId) && toolId !== value}
          >
            {TOOL_NAMES[toolId]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
