import * as React from 'react';
import { cn } from '@/lib/cn';

export function TraceTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('trace-title', className)} {...props} />;
}
