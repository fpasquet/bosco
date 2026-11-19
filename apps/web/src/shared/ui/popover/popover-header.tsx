import * as React from 'react';
import { cn } from '@/lib/cn';

export function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('popover-header', className)} {...props} />;
}
