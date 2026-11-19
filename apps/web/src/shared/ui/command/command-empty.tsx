'use client';

import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={cn('command-empty', className)} {...props} />;
}
