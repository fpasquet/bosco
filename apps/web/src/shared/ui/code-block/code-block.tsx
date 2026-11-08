'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/cn';

const codeBlockVariants = cva('code-block', {
  variants: {
    variant: {
      default: 'code-block-default',
      destructive: 'code-block-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function CodeBlock({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof codeBlockVariants> & { size?: 'default' | 'sm' }) {
  return <div className={cn(codeBlockVariants({ variant }), size === 'sm' && 'code-block-sm', className)} {...props} />;
}
