import * as React from 'react';
import { cn } from '@/lib/cn';

export function MessageFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('message-footer', className)} {...props} />;
}
