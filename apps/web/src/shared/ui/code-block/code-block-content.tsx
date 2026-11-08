'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { CodeBlockLine } from './code-block-line';

export function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  ...props
}: React.ComponentProps<'pre'> & {
  wrap?: boolean;
  lineNumbers?: boolean;
  startLine?: number;
}) {
  return (
    <pre
      dir="ltr"
      // Un bloc qui défile doit se parcourir au clavier (règle scrollable-region-focusable d'axe)
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      style={{ counterReset: `line ${startLine - 1}`, ...style }}
      className={cn(
        'code-block-content',
        wrap && 'code-block-content-wrap',
        lineNumbers && 'code-block-content-numbered',
        className,
      )}
      {...props}
    >
      <code className="code-block-content-code">
        {lineNumbers && typeof children === 'string'
          ? children
              .replace(/\n$/, '')
              .split('\n')
              .map((line, index) => <CodeBlockLine key={index}>{line}</CodeBlockLine>)
          : children}
      </code>
    </pre>
  );
}
