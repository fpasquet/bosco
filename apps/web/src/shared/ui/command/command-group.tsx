'use client';

import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group className={cn('command-group', className)} {...props} />;
}
