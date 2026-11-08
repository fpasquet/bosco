'use client';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'streamdown';
import { HighlightedCode } from '@/shared/components/highlighted-code';

/** Code d'une réponse : un bloc coloré pour un bloc de code, du code en ligne sinon. */
export function MarkdownCode({ children, className, node: _node, ...props }: ComponentProps<'code'> & ExtraProps) {
  // Streamdown marque les seuls blocs de code par data-block : le reste est du code en ligne
  if (!('data-block' in props)) return <code className="markdown-code">{children}</code>;
  const language = /language-(\S+)/.exec(className ?? '')?.[1] ?? '';
  return <HighlightedCode code={typeof children === 'string' ? children : ''} language={language} />;
}
