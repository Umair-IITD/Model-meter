'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GlobalInputs } from './GlobalInputs';
import { ToolCard } from './ToolCard';
import { useAuditForm } from '@/hooks/useAuditForm';
import { toast } from '@/components/ui/use-toast';
import type { AuditApiResponse } from '@/lib/schemas';

export function AuditForm() {
  const router = useRouter();
  const { formState, setTeamSize, setUseCase, addTool, updateTool, removeTool, isValid } =
    useAuditForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isValid) {
      toast({
        title: 'Add at least one tool',
        description: 'Select a tool and enter your spend to run the audit.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        teamSize: formState.teamSize,
        useCase: formState.useCase,
        tools: formState.tools.map(({ toolId, planId, monthlySpend, seats }) => ({
          toolId,
          planId,
          monthlySpend,
          seats,
        })),
      };

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Audit failed. Please try again.');
      }

      const data = (await res.json()) as AuditApiResponse;
      router.push(`/audit/${data.auditId}`);
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Global inputs */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">About Your Team</h2>
          <GlobalInputs
            teamSize={formState.teamSize}
            useCase={formState.useCase}
            onTeamSizeChange={setTeamSize}
            onUseCaseChange={setUseCase}
          />
        </CardContent>
      </Card>

      {/* Tool cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your AI Tools</h2>
          <span className="text-sm text-muted-foreground">
            {formState.tools.length} tool{formState.tools.length !== 1 ? 's' : ''} added
          </span>
        </div>

        {formState.tools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <p className="text-muted-foreground text-sm">
              Add the AI tools your team subscribes to.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Include all tools — even ones you suspect are redundant.
            </p>
          </div>
        ) : (
          formState.tools.map((tool, idx) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={idx}
              onUpdate={updateTool}
              onRemove={removeTool}
              canRemove={true}
            />
          ))
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addTool}
          disabled={formState.tools.length >= 20}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {formState.tools.length === 0 ? 'Your First' : 'Another'} Tool
        </Button>
      </div>

      {/* Submit */}
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isValid}
          size="lg"
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing your spend…
            </>
          ) : (
            'Run My Free Audit →'
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          No account needed · Takes about 5 seconds · 100% free
        </p>
      </div>
    </div>
  );
}
