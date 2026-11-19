'use client';

import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('command-list', className)} {...props} />;
}
