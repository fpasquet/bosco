import * as React from 'react';
import { cn } from '@/lib/cn';

export function TraceDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('trace-description', className)} {...props} />;
}
