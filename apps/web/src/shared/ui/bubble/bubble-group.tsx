import * as React from 'react';
import { cn } from '@/lib/cn';

export function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('bubble-group', className)} {...props} />;
}
