'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export function CodeBlockFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('code-block-footer', className)} {...props} />;
}
