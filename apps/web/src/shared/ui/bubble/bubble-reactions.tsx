import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/cn';

const bubbleReactionsVariants = cva('bubble-reactions', {
  variants: {
    side: {
      top: 'bubble-reactions-top',
      bottom: 'bubble-reactions-bottom',
    },
    align: {
      start: 'bubble-reactions-start',
      end: 'bubble-reactions-end',
    },
  },
  defaultVariants: {
    side: 'bottom',
    align: 'end',
  },
});

export function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
}) {
  return <div className={cn(bubbleReactionsVariants({ side, align }), className)} {...props} />;
}
