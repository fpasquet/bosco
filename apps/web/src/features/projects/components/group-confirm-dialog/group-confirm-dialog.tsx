'use client';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Button } from '@/shared/ui/button';

export interface GroupConfirmDialogProps {
  busy: boolean;
  children: ReactNode;
  confirmLabel: string;
  /** Action qui supprime : bouton rouge */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

/**
 * Confirmation d'un changement d'un groupe : ses instructions ou ses projets, qui touchent les prochains agents des
 * projets comptés, ou sa suppression, qui ne retire aucun projet.
 */
export function GroupConfirmDialog({
  busy,
  children,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
  open,
  title,
}: GroupConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { text: useId(), title: useId() };
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      role="alertdialog"
      aria-labelledby={ids.title}
      aria-describedby={ids.text}
      onClose={onCancel}
    >
      <div className="modal-box flex flex-col gap-4">
        <h2 id={ids.title} className="font-display text-lg font-semibold">
          {title}
        </h2>
        <div id={ids.text} className="flex flex-col gap-2">
          {children}
        </div>
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant={destructive ? 'destructive' : 'primary'} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** Texte de la confirmation qui compte les projets touchés ; les agents déjà lancés gardent leur contexte. */
export function TouchedProjects({ intro, projects }: { intro: string; projects: readonly string[] }) {
  const count = projects.length > 1 ? `${projects.length} projets` : `${projects.length} projet`;
  return (
    <>
      <p>
        {intro} <b className="font-semibold">{count}</b>
        {projects.length > 0 && ` : ${projects.join(', ')}`}.
      </p>
      <p className="text-sm text-muted">Les agents déjà lancés ne sont pas touchés.</p>
    </>
  );
}
