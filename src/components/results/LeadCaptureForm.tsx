'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LeadCaptureFormProps {
  auditId: string;
  totalMonthlySavings: number;
}

function getCopyForSavings(savings: number): { heading: string; cta: string } {
  if (savings > 500) {
    return {
      heading: 'Save this report + unlock your Credex consultation',
      cta: 'Send my report',
    };
  }
  if (savings >= 100) {
    return {
      heading: 'Get this report emailed to you',
      cta: 'Email me the report',
    };
  }
  return {
    heading: 'Get notified when new optimizations apply to your stack',
    cta: 'Notify me',
  };
}

export function LeadCaptureForm({ auditId, totalMonthlySavings }: LeadCaptureFormProps) {
  const { heading, cta } = getCopyForSavings(totalMonthlySavings);

  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          email,
          companyName: companyName || undefined,
          role: role || undefined,
          honeypot: '', // honeypot field value — always empty
        }),
      });

      if (!res.ok && res.status !== 429) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Submission failed.');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save your email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
        <h3 className="font-semibold text-green-900 text-lg">Report sent!</h3>
        <p className="text-green-700 text-sm mt-1">Check your inbox for your audit results.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <Mail className="h-5 w-5 text-blue-500 shrink-0" />
        <h3 className="font-semibold text-slate-900">{heading}</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lead-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-company">Company (optional)</Label>
            <Input
              id="lead-company"
              type="text"
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-role">Role (optional)</Label>
            <Input
              id="lead-role"
              type="text"
              placeholder="CTO, Eng Manager…"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoComplete="organization-title"
            />
          </div>
        </div>

        {/* Honeypot — hidden from humans, filled by bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            cta
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          No spam. Credex may reach out for high-savings cases only. Unsubscribe any time.
        </p>
      </div>
    </div>
  );
}
