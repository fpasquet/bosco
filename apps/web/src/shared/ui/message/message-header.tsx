import * as React from 'react';
import { cn } from '@/lib/cn';

export function MessageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('message-header', className)} {...props} />;
}
