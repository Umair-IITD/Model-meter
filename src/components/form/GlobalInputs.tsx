'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GlobalInputsProps {
  teamSize: number;
  useCase: string;
  onTeamSizeChange: (size: number) => void;
  onUseCaseChange: (useCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed') => void;
}

const USE_CASES = [
  { value: 'coding', label: 'Software Development' },
  { value: 'writing', label: 'Writing & Content' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'research', label: 'Research & Analysis' },
  { value: 'mixed', label: 'Mixed / General' },
] as const;

export function GlobalInputs({
  teamSize,
  useCase,
  onTeamSizeChange,
  onUseCaseChange,
}: GlobalInputsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="team-size">Team size</Label>
        <Input
          id="team-size"
          type="number"
          min={1}
          max={10000}
          value={teamSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) onTeamSizeChange(val);
          }}
          placeholder="e.g. 10"
        />
        <p className="text-xs text-muted-foreground">
          Number of people using AI tools on your team
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="use-case">Primary use case</Label>
        <Select
          value={useCase}
          onValueChange={(v) => onUseCaseChange(v as 'coding' | 'writing' | 'data' | 'research' | 'mixed')}
        >
          <SelectTrigger id="use-case">
            <SelectValue placeholder="Select use case" />
          </SelectTrigger>
          <SelectContent>
            {USE_CASES.map((uc) => (
              <SelectItem key={uc.value} value={uc.value}>
                {uc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How your team primarily uses AI tools
        </p>
      </div>
    </div>
  );
}
