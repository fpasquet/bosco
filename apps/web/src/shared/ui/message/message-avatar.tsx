import * as React from 'react';
import { cn } from '@/lib/cn';

export function MessageAvatar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('message-avatar', className)} {...props} />;
}
