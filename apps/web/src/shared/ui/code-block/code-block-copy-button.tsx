'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';

export function CodeBlockCopyButton({
  value,
  variant = 'ghost',
  size = 'icon-xs',
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { value: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        aria-label={copied ? 'Copié' : 'Copier'}
        className={cn(className)}
        onClick={(event) => {
          onClick?.(event);
          navigator.clipboard
            .writeText(value)
            .then(() => setCopied(true))
            .catch(() => {});
        }}
        {...props}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copié' : ''}
      </span>
    </>
  );
}
