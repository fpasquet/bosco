'use client';
import { useEffect, useRef } from 'react';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { titleOf } from '../sessions-table';
import { WaitingSummary } from '../waiting-summary';

export interface AllowDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
  /** Session dont on confirme l'autorisation ; null : fenêtre fermée */
  session: null | SessionDto;
}

/** Sur téléphone, « Autoriser » demande une confirmation rappelant la commande (RF-SESS-07, CA-SESS-37). */
export function AllowDialog({ onCancel, onConfirm, session }: AllowDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (session && element && !element.open) element.showModal();
    if (!session && element?.open) element.close();
  }, [session]);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="allow-dialog-title" onClose={onCancel}>
      <form
        method="dialog"
        className="modal-box flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 id="allow-dialog-title" className="font-display text-lg font-semibold">
          Autoriser la commande
        </h2>
        {session && (
          <div className="flex flex-col gap-1 rounded-control bg-surface-alt px-3 py-2">
            <p className="font-medium">{titleOf(session)}</p>
            <WaitingSummary session={session} />
          </div>
        )}
        <p className="text-muted">L’autorisation ne vaut que pour cette commande.</p>
        <div className="modal-action mt-0">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">Autoriser</Button>
        </div>
      </form>
    </dialog>
  );
}
