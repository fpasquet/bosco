import * as React from 'react';
import { cn } from '@/lib/cn';

export function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('message-content', className)} {...props} />;
}
