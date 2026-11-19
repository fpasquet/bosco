import * as React from 'react';
import { cn } from '@/lib/cn';

export function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <div className={cn('popover-title', className)} {...props} />;
}
