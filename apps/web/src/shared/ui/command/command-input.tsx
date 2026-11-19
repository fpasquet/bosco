'use client';
import type { ComponentProps } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Champ de recherche en tête de la liste, avec sa loupe. */
export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="command-search">
      <Search aria-hidden className="command-search-icon" />
      <CommandPrimitive.Input className={cn('command-input', className)} {...props} />
    </div>
  );
}
