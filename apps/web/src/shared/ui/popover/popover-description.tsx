import * as React from 'react';
import { cn } from '@/lib/cn';

export function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('popover-description', className)} {...props} />;
}
