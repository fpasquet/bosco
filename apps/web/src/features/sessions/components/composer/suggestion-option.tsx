import type { ReactNode } from 'react';
import { File as FileIcon } from 'lucide-react';
import type { SuggestionDto } from '@bosco/domain';
import { mentionText, type SuggestionKind, TRIGGER } from './mentions';

export interface SuggestionOptionProps {
  active: boolean;
  id: string;
  item: SuggestionDto;
  kind: SuggestionKind;
  onChoose: () => void;
  query: string;
}

/** Chemin d'un fichier, la partie tapée en gras. */
function highlighted(value: string, query: string): ReactNode {
  const start = query ? value.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (start < 0) return <>{value}</>;
  return (
    <>
      {value.slice(0, start)}
      <b className="font-semibold text-ink">{value.slice(start, start + query.length)}</b>
      {value.slice(start + query.length)}
    </>
  );
}

/** Une option du menu : un fichier (chemin en mono), ou une commande avec son origine et sa description. */
export function SuggestionOption({ active, id, item, kind, onChoose, query }: SuggestionOptionProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      className="flex cursor-pointer items-center gap-2 px-3 py-2 aria-selected:bg-primary-soft can-hover:hover:bg-surface-alt"
      // Le focus reste dans l'éditeur : le choix se fait au clavier comme à la souris
      onMouseDown={(event) => {
        event.preventDefault();
        onChoose();
      }}
    >
      {kind === 'file' ? (
        <>
          <FileIcon aria-hidden className="size-3.5 shrink-0 text-muted" />
          <span className="truncate font-mono text-xs text-muted">{highlighted(item.value, query)}</span>
        </>
      ) : (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-medium">{mentionText(TRIGGER.command, item.value)}</span>
            {item.origin && <span className="truncate text-xs text-muted">{item.origin}</span>}
          </span>
          {item.description && <span className="text-xs text-muted">{item.description}</span>}
        </span>
      )}
    </div>
  );
}
