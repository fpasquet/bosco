import type { ComponentProps } from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Calque du popover, apparu comme les autres calques flottants (`popup`). Radix en fait une fenêtre (role dialog) :
 * elle se nomme par `aria-label`, ou `aria-labelledby` vers son titre.
 */
export function PopoverContent({
  align = 'center',
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn('popup popover-content', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
