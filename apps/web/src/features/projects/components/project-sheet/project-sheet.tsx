'use client';
import { ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';
import { Button } from '@/shared/ui/button';

export interface ProjectSheetProps {
  onClose: () => void;
  /** null : feuille fermée */
  project: null | { id: number; name: string; path: string };
  /** Décisions proposées par un agent qui attendent la validation */
  proposals: number;
}

/**
 * Feuille du bas d'un projet sur le téléphone : une nouvelle session et les onglets de sa page, les
 * réglages en lecture seule. Ni retrait ni ajout à un groupe depuis le téléphone.
 */
export function ProjectSheet({ onClose, project, proposals }: ProjectSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (project && element && !element.open) element.showModal();
    if (!project && element?.open) element.close();
  }, [project]);
  const base = project ? `/projects/${project.id}` : '';
  const LINK = 'flex h-12 items-center gap-3 px-1';
  return (
    <dialog ref={dialog} className="modal modal-bottom" aria-labelledby={titleId} onClose={onClose}>
      {project && (
        <div className="modal-box flex flex-col gap-2 pb-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-lg font-semibold">
                {project.name}
              </h2>
              <p className="truncate font-mono text-xs text-muted">{project.path}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Fermer" onClick={onClose}>
              <X aria-hidden className="size-4" />
            </Button>
          </div>
          <Link href={`/sessions/new?project=${project.id}`} className="btn btn-primary">
            Nouvelle session
          </Link>
          <nav aria-label={`Pages de ${project.name}`} className="flex flex-col divide-y divide-line">
            <Link href={`${base}/sessions`} className={LINK}>
              <span className="flex-1">Sessions</span>
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </Link>
            <Link href={`${base}/context`} className={LINK}>
              <span className="flex-1">Contexte</span>
              {proposals > 0 && (
                <span className="badge badge-sm badge-primary">
                  {proposals}
                  <span className="sr-only"> à valider</span>
                </span>
              )}
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </Link>
            <Link href={`${base}/settings`} className={LINK}>
              <span className="flex-1">Réglages</span>
              <span className="text-xs text-muted">lecture seule</span>
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </Link>
          </nav>
        </div>
      )}
      <form method="dialog" className="modal-backdrop">
        <button type="submit" tabIndex={-1}>
          Fermer
        </button>
      </form>
    </dialog>
  );
}
