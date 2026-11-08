import * as React from 'react';
import { cn } from '@/lib/cn';

export function Trace({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('trace', className)} {...props} />;
}
