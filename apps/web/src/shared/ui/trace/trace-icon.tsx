import * as React from 'react';
import { cn } from '@/lib/cn';

export function TraceIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('trace-icon', className)} {...props} />;
}
