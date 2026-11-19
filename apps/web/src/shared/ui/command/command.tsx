'use client';

import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive className={cn('command', className)} {...props} />;
}
