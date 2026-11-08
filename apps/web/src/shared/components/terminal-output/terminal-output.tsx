'use client';
import { useHighlightedCode } from '@/shared/hooks/use-highlighted-code';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine,
} from '@/shared/ui/code-block';

export interface TerminalOutputProps {
  className?: string;
  command: string;
  output: string;
}

/**
 * Terminal : la commande colorée comme du shell, puis sa sortie, dont les couleurs ANSI sont rendues, dans un même
 * bloc, comme dans le terminal. « Copier » copie la commande et sa sortie.
 */
export function TerminalOutput({ className, command, output }: TerminalOutputProps) {
  const commandLines = useHighlightedCode(`$ ${command}`, 'bash');
  const outputLines = useHighlightedCode(output || '(aucune sortie)', 'ansi');
  const lines = [...commandLines, ...outputLines];
  return (
    <CodeBlock size="sm">
      <CodeBlockActions>
        <CodeBlockCopyButton value={`$ ${command}\n${output}`} className="bg-surface" />
      </CodeBlockActions>
      <CodeBlockContent wrap className={className}>
        {lines.map((line, index) => (
          // Les lignes ne changent pas d'ordre : leur position est leur identité
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}
