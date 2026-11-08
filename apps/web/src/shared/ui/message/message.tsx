import * as React from 'react';
import { cn } from '@/lib/cn';

export function Message({
  className,
  align = 'start',
  ...props
}: React.ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return <div className={cn('message', align === 'end' && 'message-end', className)} {...props} />;
}
