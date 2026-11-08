import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/cn';

export function BubbleContent({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'div';

  return <Comp className={cn('bubble-content', className)} {...props} />;
}
