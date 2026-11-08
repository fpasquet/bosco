'use client';
import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';

export interface SocleImpactDialogProps {
  busy: boolean;
  /** Dépôts dont les prochains agents recevront le changement */
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  socle: string;
}

/**
 * Confirmation d'un changement de socle (E14a, CA-CONT-58) : il touche les prochains agents de tous ses dépôts, les
 * agents déjà lancés gardent le contexte reçu au départ.
 */
export function SocleImpactDialog({ busy, count, onCancel, onConfirm, open, socle }: SocleImpactDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const repositories = count > 1 ? `${count} dépôts` : `${count} dépôt`;
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      role="alertdialog"
      aria-labelledby="socle-impact-title"
      aria-describedby="socle-impact-text"
      onClose={onCancel}
    >
      <div className="modal-box flex flex-col gap-4">
        <h2 id="socle-impact-title" className="font-display text-lg font-semibold">
          Changer « {socle} » ?
        </h2>
        <p id="socle-impact-text">
          Ce changement touche les prochains agents de <b className="font-semibold">{repositories}</b>.
        </p>
        <p className="text-sm text-muted">
          Les agents déjà lancés ne sont pas touchés : ils gardent le contexte reçu au départ.
        </p>
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirm}>
            Enregistrer
          </Button>
        </div>
      </div>
    </dialog>
  );
}
