'use client';
import type { ComponentProps } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CommandItemProps extends ComponentProps<typeof CommandPrimitive.Item> {
  /** Choix courant d'une liste de choix : coché ; absent, la colonne de la coche reste vide */
  checked?: boolean;
}

/** Une ligne de la liste : coche du choix courant, puis son contenu. Survolée ou atteinte au clavier, elle s'éclaire. */
export function CommandItem({ checked, children, className, ...props }: CommandItemProps) {
  return (
    <CommandPrimitive.Item className={cn('command-item', className)} {...props}>
      {checked !== undefined && <Check aria-hidden className={cn('command-item-check', !checked && 'invisible')} />}
      {children}
    </CommandPrimitive.Item>
  );
}
