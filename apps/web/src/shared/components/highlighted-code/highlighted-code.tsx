'use client';
import type { ReactNode } from 'react';
import { useHighlightedCode } from '@/shared/hooks/use-highlighted-code';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '@/shared/ui/code-block';

export interface HighlightedCodeProps {
  className?: string;
  code: string;
  /** Langage de coloration (« typescript », « bash ») ; vide ou inconnu : texte brut */
  language?: string;
  size?: 'default' | 'sm';
  /** En-tête du bloc (nom du fichier) ; sans titre, le bouton Copier flotte dans le coin */
  title?: ReactNode;
  /** Lignes ajoutées ou retirées d'un diff, dans l'ordre des lignes du code */
  variants?: ('added' | 'default' | 'removed')[];
  wrap?: boolean;
}

/** Bloc de code coloré par Shiki (CodeBlock de shadcn), avec son bouton Copier ; les lignes d'un diff sont marquées. */
export function HighlightedCode({
  className,
  code,
  language = '',
  size = 'default',
  title,
  variants,
  wrap = false,
}: HighlightedCodeProps) {
  const lines = useHighlightedCode(code, language);
  const copy = <CodeBlockCopyButton value={code} className="bg-surface" />;
  return (
    <CodeBlock size={size}>
      {title ? (
        <CodeBlockHeader>
          <CodeBlockTitle>{title}</CodeBlockTitle>
          <CodeBlockActions>{copy}</CodeBlockActions>
        </CodeBlockHeader>
      ) : (
        <CodeBlockActions>{copy}</CodeBlockActions>
      )}
      <CodeBlockContent wrap={wrap} className={className}>
        {lines.map((line, index) => (
          // Les lignes ne changent pas d'ordre : leur position est leur identité
          <CodeBlockLine key={index} variant={variants?.[index] ?? 'default'}>
            {line}
          </CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}
