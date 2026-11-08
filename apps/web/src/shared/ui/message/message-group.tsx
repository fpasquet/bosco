import * as React from 'react';
import { cn } from '@/lib/cn';

export function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('message-group', className)} {...props} />;
}
