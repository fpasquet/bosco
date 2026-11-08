'use client';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/cn';
import { MarkdownCode } from './markdown-code';
import { MarkdownLink } from './markdown-link';

export interface MarkdownProps {
  children: string;
  className?: string;
}

const COMPONENTS = { a: MarkdownLink, code: MarkdownCode };
const NO_LINK_CHECK = { enabled: false };

/**
 * Texte en Markdown d'un agent (réponses, réflexions), rendu par Streamdown : titres, listes, tableaux, citations, et
 * blocs de code colorés (CodeBlock). La mise en forme vient de la classe markdown, pas des classes de Streamdown.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <Streamdown
      mode="static"
      controls={false}
      linkSafety={NO_LINK_CHECK}
      components={COMPONENTS}
      className={cn('markdown', className)}
    >
      {children}
    </Streamdown>
  );
}
