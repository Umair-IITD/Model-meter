'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  auditId: string;
}

export function ShareButton({ auditId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/audit/${auditId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={handleShare}
        className="gap-2"
        aria-label="Copy share link"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share this audit
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground hidden sm:block">
        <Copy className="h-3 w-3 inline mr-1" />
        Public link — no login required to view
      </p>
    </div>
  );
}
