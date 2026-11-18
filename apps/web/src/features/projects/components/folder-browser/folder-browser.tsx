'use client';
import { ArrowUp, ChevronRight, Folder, FolderGit2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FolderListingDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { addLabel, checkedLabel, checkGitLabel, type ChosenFolder, gitToCheck } from '../../lib/selection';

export interface FolderBrowserProps {
  busy: boolean;
  chosen: readonly ChosenFolder[];
  error: null | string;
  /** Groupe où ranger les nouveaux projets ; null : « Aucun groupe » */
  group: null | number;
  groups: readonly { id: number; name: string }[];
  /** Dossier ouvert ; null pendant sa lecture */
  listing: FolderListingDto | null;
  onCancel: () => void;
  onCheck: (folders: ChosenFolder[]) => void;
  onGroupChange: (group: null | number) => void;
  onOpen: (path: string) => void;
  onSubmit: () => void;
  onToggle: (folder: ChosenFolder) => void;
  open: boolean;
}

/**
 * Ajouter des projets : le navigateur parcourt les dossiers du poste depuis le dossier personnel, sans saisir de
 * chemin. Seuls des noms de dossiers se voient ; la sélection est gardée d'un dossier à l'autre.
 */
export function FolderBrowser({
  busy,
  chosen,
  error,
  group,
  groups,
  listing,
  onCancel,
  onCheck,
  onGroupChange,
  onOpen,
  onSubmit,
  onToggle,
  open,
}: FolderBrowserProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const checked = new Set(chosen.map(({ path }) => path));
  const toCheck = listing ? gitToCheck(listing, chosen) : [];
  const withoutGit = chosen.filter(({ git }) => !git);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="folder-browser-title" onClose={onCancel}>
      <div className="modal-box flex max-w-2xl flex-col gap-3 p-0">
        <div className="flex items-center px-5 pt-4">
          <h2 id="folder-browser-title" className="font-display text-lg font-semibold">
            Ajouter des projets
          </h2>
          <Button variant="ghost" size="icon-sm" className="ml-auto text-muted" aria-label="Fermer" onClick={onCancel}>
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 px-5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted"
            aria-label="Dossier parent"
            disabled={!listing?.parent}
            onClick={() => listing?.parent && onOpen(listing.parent)}
          >
            <ArrowUp aria-hidden className="size-4" />
          </Button>
          <nav aria-label="Dossier ouvert" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-1 font-mono text-sm">
              {listing?.crumbs.map((crumb, index) => {
                const last = index === listing.crumbs.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight aria-hidden className="size-3.5 text-muted" />}
                    {last ? (
                      <span aria-current="location" className="font-medium">
                        {crumb.name}
                      </span>
                    ) : (
                      <button type="button" className="link text-muted link-hover" onClick={() => onOpen(crumb.path)}>
                        {crumb.name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
        {toCheck.length > 0 && (
          <p className="px-5 text-sm">
            <button type="button" className="link font-medium link-primary link-hover" onClick={() => onCheck(toCheck)}>
              {checkGitLabel(toCheck.length)}
            </button>
          </p>
        )}
        <div className="mx-5 max-h-96 overflow-y-auto rounded-card border border-line">
          {listing ? (
            <ul aria-label="Dossiers" className="divide-y divide-line">
              {listing.folders.map((folder) => {
                const Icon = folder.git ? FolderGit2 : Folder;
                return (
                  <li
                    key={folder.path}
                    className={cn('flex items-center gap-3 px-4 py-2', folder.added && 'bg-surface-alt')}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      aria-label={folder.name}
                      checked={folder.added || checked.has(folder.path)}
                      disabled={folder.added || busy}
                      onChange={() => onToggle({ git: folder.git, name: folder.name, path: folder.path })}
                    />
                    <Icon aria-hidden className="size-4 shrink-0 text-muted" />
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate font-mono text-sm',
                        folder.added ? 'text-muted' : 'font-medium',
                      )}
                    >
                      {folder.name}
                    </span>
                    {folder.git ? (
                      <span className="badge badge-ghost badge-sm">git</span>
                    ) : (
                      <span className="badge badge-outline badge-sm whitespace-nowrap">sans git</span>
                    )}
                    {folder.added && <span className="badge badge-ghost badge-sm whitespace-nowrap">déjà ajouté</span>}
                    {folder.suggestion && !folder.added && (
                      <span className="badge badge-soft badge-sm whitespace-nowrap badge-info">suggestion</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted"
                      aria-label={`Ouvrir ${folder.name}`}
                      onClick={() => onOpen(folder.path)}
                    >
                      <ChevronRight aria-hidden className="size-4" />
                    </Button>
                  </li>
                );
              })}
              {listing.folders.length === 0 && <li className="px-4 py-3 text-muted">Aucun dossier ici.</li>}
            </ul>
          ) : (
            <p role="status" className="px-4 py-3 text-muted">
              Lecture du dossier…
            </p>
          )}
        </div>
        {withoutGit.length > 0 && (
          <p className="px-5 text-xs text-muted">
            Sans git, pas de bac à sable : {withoutGit.map(({ name }) => name).join(', ')} tournera seulement sur le
            poste.
          </p>
        )}
        {error && (
          <p role="alert" className="mx-5 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
          <label className="flex items-center gap-2">
            <span className="text-muted">Dans le groupe :</span>
            <select
              className="select w-56"
              value={group ?? ''}
              onChange={(event) => onGroupChange(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Aucun groupe</option>
              {groups.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-muted">{checkedLabel(chosen.length)}</span>
          <Button variant="ghost" className="text-muted" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" disabled={chosen.length === 0 || busy} onClick={onSubmit}>
            {addLabel(chosen.length)}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
