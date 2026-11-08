import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/cn';

const bubbleVariants = cva('bubble', {
  variants: {
    variant: {
      default: 'bubble-default',
      secondary: 'bubble-secondary',
      muted: 'bubble-muted',
      tinted: 'bubble-tinted',
      outline: 'bubble-outline',
      ghost: 'bubble-ghost',
      destructive: 'bubble-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
  }) {
  return <div className={cn(bubbleVariants({ variant }), align === 'end' && 'bubble-end', className)} {...props} />;
}
