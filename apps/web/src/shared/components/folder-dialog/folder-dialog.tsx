'use client';
import type { ReactNode } from 'react';
import { ArrowUp, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FolderListingDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';

export type ListedFolder = FolderListingDto['folders'][number];

export interface FolderDialogProps {
  /** Sous la barre du dossier ouvert, au-dessus de la liste */
  above?: ReactNode;
  /** Entre la liste et le pied : notes et refus */
  below?: ReactNode;
  /** Pied de la fenêtre : le choix et ses boutons */
  footer: ReactNode;
  /** Dossier ouvert ; null pendant sa lecture */
  listing: FolderListingDto | null;
  onCancel: () => void;
  onOpen: (path: string) => void;
  open: boolean;
  /** Ce qu'une ligne montre avant son bouton « Ouvrir » : sa case ou son bouton radio, son nom, ses marques */
  renderFolder: (folder: ListedFolder) => ReactNode;
  /** Ligne grisée (dossier déjà choisi ailleurs) */
  dimmed?: (folder: ListedFolder) => boolean;
  title: string;
}

/**
 * Navigateur de dossiers du poste, depuis le dossier personnel, sans saisir de chemin : le dossier ouvert en fil
 * d'Ariane, le dossier parent, et ses sous-dossiers, dont chacun s'ouvre. Ce qu'on choisit dans la liste et le pied
 * de la fenêtre viennent de qui l'ouvre (projets, dossier de configuration de Claude Code).
 */
export function FolderDialog({
  above,
  below,
  dimmed,
  footer,
  listing,
  onCancel,
  onOpen,
  open,
  renderFolder,
  title,
}: FolderDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="folder-dialog-title" onClose={onCancel}>
      <div className="modal-box flex max-w-2xl flex-col gap-3 p-0">
        <div className="flex items-center px-5 pt-4">
          <h2 id="folder-dialog-title" className="font-display text-lg font-semibold">
            {title}
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
        {above}
        <div className="mx-5 max-h-96 overflow-y-auto rounded-card border border-line">
          {listing ? (
            <ul aria-label="Dossiers" className="divide-y divide-line">
              {listing.folders.map((folder) => (
                <li
                  key={folder.path}
                  className={cn('flex items-center gap-3 px-4 py-2', dimmed?.(folder) && 'bg-surface-alt')}
                >
                  {renderFolder(folder)}
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
              ))}
              {listing.folders.length === 0 && <li className="px-4 py-3 text-muted">Aucun dossier ici.</li>}
            </ul>
          ) : (
            <p role="status" className="px-4 py-3 text-muted">
              Lecture du dossier…
            </p>
          )}
        </div>
        {below}
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">{footer}</div>
      </div>
    </dialog>
  );
}
