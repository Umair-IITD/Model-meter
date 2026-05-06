'use client';

import { useState, useEffect, useRef } from 'react';

const STALENESS_DAYS = 30;

export function usePersistedForm<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored) as T & { lastUpdated?: string };

      // Discard state older than 30 days
      if ('lastUpdated' in parsed && parsed.lastUpdated) {
        const age = Date.now() - new Date(parsed.lastUpdated as string).getTime();
        if (age > STALENESS_DAYS * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
          return defaultValue;
        }
      }

      return parsed;
    } catch {
      return defaultValue;
    }
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Ignore storage errors (private browsing quota, etc.)
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [key, state]);

  function clearStorage() {
    localStorage.removeItem(key);
  }

  return [state, setState, clearStorage] as const;
}
