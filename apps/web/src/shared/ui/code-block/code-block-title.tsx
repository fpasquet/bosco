'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export function CodeBlockTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('code-block-title', className)} {...props} />;
}
