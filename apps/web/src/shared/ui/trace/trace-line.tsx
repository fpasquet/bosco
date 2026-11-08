import type * as React from 'react';
import { cn } from '@/lib/cn';

const STATUS_CLASS = { error: 'trace-line-error', pending: 'trace-line-pending', running: 'trace-line-running' };

/** Ligne d'une étape : son icône, son titre et sa description ; status en cours, en échec ou à venir. */
export function TraceLine({
  className,
  status,
  ...props
}: React.ComponentProps<'span'> & {
  status?: 'error' | 'pending' | 'running';
}) {
  return <span className={cn('trace-line', status && STATUS_CLASS[status], className)} {...props} />;
}
