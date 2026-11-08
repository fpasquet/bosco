'use client';
import { Folder, FolderX } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { repositories } from '../../lib/format';

export interface FolderListProps {
  /** Nombre de dépôts trouvés sous chaque dossier ; rien pour les dossiers exclus */
  counts?: Record<string, number>;
  /** Dossiers proposés par défaut (/tmp) */
  defaults?: readonly string[];
  disabled: boolean;
  excluded?: boolean;
  folders: string[];
  hint: string;
  onChange: (folders: string[]) => void;
  placeholder: string;
  title: string;
}

/** Dossiers écrits comme dans le terminal (« ~/www ») : retirés d'un clic, ajoutés depuis le champ ; lecture seule sur le téléphone. */
export function FolderList({
  counts,
  defaults = [],
  disabled,
  excluded = false,
  folders,
  hint,
  onChange,
  placeholder,
  title,
}: FolderListProps) {
  const [draft, setDraft] = useState('');
  const titleId = useId();
  const Icon = excluded ? FolderX : Folder;
  return (
    <section aria-labelledby={titleId} className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <h2 id={titleId} className="font-medium">
        {title}
      </h2>
      <p className="text-xs text-muted">{hint}</p>
      {folders.length > 0 && (
        <ul aria-labelledby={titleId} className="mt-2 divide-y divide-line rounded-control border border-line">
          {folders.map((folder) => (
            <li key={folder} className="flex items-center gap-3 px-3 py-2">
              <Icon aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{folder}</span>
              {counts && (
                <span className="text-xs whitespace-nowrap text-muted">{repositories(counts[folder] ?? 0)}</span>
              )}
              {defaults.includes(folder) && <span className="badge badge-ghost badge-sm">par défaut</span>}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                disabled={disabled}
                onClick={() => onChange(folders.filter((candidate) => candidate !== folder))}
              >
                Retirer
                <span className="sr-only"> {folder}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-2 hidden gap-2 md:flex"
        onSubmit={(event) => {
          event.preventDefault();
          const path = draft.trim();
          if (!path) return;
          onChange([...folders, path]);
          setDraft('');
        }}
      >
        <input
          aria-label={`Ajouter un dossier : ${title}`}
          className="input flex-1 font-mono input-sm"
          placeholder={placeholder}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="outline" size="sm" disabled={disabled || !draft.trim()}>
          Ajouter
          <span className="sr-only"> : {title}</span>
        </Button>
      </form>
    </section>
  );
}
