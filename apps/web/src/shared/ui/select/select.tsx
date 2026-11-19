'use client';
import type { ComponentProps } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Liste déroulante (Radix Select) quand une option porte plus qu'un texte (un badge, un chemin) : le bouton prend la
 * classe `select` de daisyUI, la liste celle du projet `listbox`, rangée par groupes avec leur titre.
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps extends ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: 'md' | 'sm';
}

export function SelectTrigger({ children, className, size = 'md', ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn('select w-full gap-2 text-left', size === 'sm' && 'select-sm', className)}
      {...props}
    >
      {/* La flèche est celle de la classe select de daisyUI */}
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ children, className, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          'popup listbox z-50 overflow-hidden rounded-card border border-line bg-surface text-sm text-ink shadow-overlay',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex justify-center py-1 text-muted">
          <ChevronUp aria-hidden className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="py-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex justify-center py-1 text-muted">
          <ChevronDown aria-hidden className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label className={cn('px-3 pt-2 pb-1 text-xs font-semibold text-muted', className)} {...props} />
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn('my-1 h-px bg-line', className)} {...props} />;
}

/**
 * Une option : coche si choisie, puis son contenu (texte, badge, chemin), qui fait aussi son nom accessible. Le bouton
 * le reprend tel quel, sauf si `SelectValue` reçoit le sien.
 */
export function SelectItem({ children, className, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 py-2 pr-3 pl-2 outline-none select-none focus:bg-surface-alt aria-disabled:cursor-not-allowed aria-disabled:text-muted aria-selected:bg-primary-soft',
        className,
      )}
      {...props}
    >
      <span className="size-4 shrink-0">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {/* ItemText ne transmet pas sa classe : la mise en page passe par un élément à l'intérieur */}
      <SelectPrimitive.ItemText>
        <span className="flex min-w-0 items-center gap-2">{children}</span>
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
