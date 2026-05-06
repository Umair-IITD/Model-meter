'use client';

import { useCallback } from 'react';
import { usePersistedForm } from './usePersistedForm';
import type { ToolId } from '@/lib/schemas';

const STORAGE_KEY = 'model-meter-form-v1';

export interface FormTool {
  id: string;
  toolId: ToolId;
  planId: string;
  monthlySpend: number;
  seats: number;
}

export interface FormState {
  teamSize: number;
  useCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
  tools: FormTool[];
  lastUpdated: string;
}

const DEFAULT_STATE: FormState = {
  teamSize: 1,
  useCase: 'coding',
  tools: [],
  lastUpdated: new Date().toISOString(),
};

function makeToolId(): string {
  return `tool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useAuditForm() {
  const [state, setState, clearStorage] = usePersistedForm<FormState>(
    STORAGE_KEY,
    DEFAULT_STATE
  );

  function touch(updater: (prev: FormState) => FormState) {
    setState((prev) => ({
      ...updater(prev),
      lastUpdated: new Date().toISOString(),
    }));
  }

  const setTeamSize = useCallback(
    (teamSize: number) => touch((prev) => ({ ...prev, teamSize })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setUseCase = useCallback(
    (useCase: FormState['useCase']) => touch((prev) => ({ ...prev, useCase })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const addTool = useCallback(
    () =>
      touch((prev) => ({
        ...prev,
        tools: [
          ...prev.tools,
          {
            id: makeToolId(),
            toolId: 'cursor' as ToolId,
            planId: 'pro',
            monthlySpend: 20,
            seats: 1,
          },
        ],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateTool = useCallback(
    (id: string, changes: Partial<Omit<FormTool, 'id'>>) =>
      touch((prev) => ({
        ...prev,
        tools: prev.tools.map((t) => (t.id === id ? { ...t, ...changes } : t)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeTool = useCallback(
    (id: string) =>
      touch((prev) => ({ ...prev, tools: prev.tools.filter((t) => t.id !== id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    clearStorage();
    setState({ ...DEFAULT_STATE, lastUpdated: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    formState: state,
    setTeamSize,
    setUseCase,
    addTool,
    updateTool,
    removeTool,
    reset,
    isValid: state.tools.length > 0,
  };
}
