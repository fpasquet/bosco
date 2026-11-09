import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { File as FileIcon, Slash } from 'lucide-react';
import { mentionText, TRIGGER } from './mentions';

/** Puce non modifiable d'un fichier ou d'une commande dans l'éditeur. */
export function MentionChip({ node }: ReactNodeViewProps) {
  const attrs = node.attrs as { id: null | string; mentionSuggestionChar?: string };
  const char = attrs.mentionSuggestionChar ?? TRIGGER.file;
  const Icon = char === TRIGGER.command ? Slash : FileIcon;
  return (
    <NodeViewWrapper
      as="span"
      className="mx-0.5 inline-flex items-center gap-1 rounded-control border border-line bg-surface-alt px-1.5 py-0.5 align-baseline font-mono text-xs"
    >
      <Icon aria-hidden className="size-3 shrink-0 text-muted" />
      {mentionText(char, attrs.id ?? '')}
    </NodeViewWrapper>
  );
}
