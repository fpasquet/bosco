'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/cn';

const codeBlockLineVariants = cva('code-block-line', {
  variants: {
    variant: {
      default: '',
      added: 'code-block-line-added',
      removed: 'code-block-line-removed',
      highlighted: 'code-block-line-highlighted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function CodeBlockLine({
  className,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof codeBlockLineVariants>) {
  // An empty line holds a newline so copying a selection keeps blank lines.
  const empty =
    children === undefined ||
    children === null ||
    children === '' ||
    (Array.isArray(children) && children.length === 0);

  return (
    <span className={cn(codeBlockLineVariants({ variant }), className)} {...props}>
      <span className="min-w-0">{empty ? '\n' : children}</span>
    </span>
  );
}
