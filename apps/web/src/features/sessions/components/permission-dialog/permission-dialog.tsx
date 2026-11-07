'use client';
import { useEffect, useRef, useState } from 'react';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { titleOf } from '../sessions-table';
import { WaitingSummary } from '../waiting-summary';

export interface PermissionDialogProps {
  /** deny : motif facultatif transmis à l'agent (CA-SESS-34) ; allow : confirmation sur téléphone (CA-SESS-37) */
  mode: 'allow' | 'deny';
  onCancel: () => void;
  onConfirm: (reason: null | string) => void;
  /** Session concernée ; null : fenêtre fermée */
  session: null | SessionDto;
}

/** Fenêtre de réponse à une autorisation, sur un <dialog> natif : focus piégé et Échap pour annuler. */
export function PermissionDialog({ mode, onCancel, onConfirm, session }: PermissionDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (session && !element.open) {
      setReason('');
      element.showModal();
    }
    if (!session && element.open) element.close();
  }, [session]);
  const title = mode === 'deny' ? 'Refuser la commande' : 'Autoriser la commande';
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="permission-dialog-title" onClose={onCancel}>
      <form
        method="dialog"
        className="modal-box flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(mode === 'deny' ? reason.trim() || null : null);
        }}
      >
        <h2 id="permission-dialog-title" className="font-display text-lg font-semibold">
          {title}
        </h2>
        {session && (
          <div className="flex flex-col gap-1 rounded-control bg-surface-alt px-3 py-2">
            <p className="font-medium">{titleOf(session)}</p>
            <WaitingSummary session={session} />
          </div>
        )}
        {mode === 'deny' ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Motif, facultatif : il est transmis à l’agent comme consigne</span>
            <textarea
              className="textarea w-full"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Pas de migration avant la revue du schéma."
            />
          </label>
        ) : (
          <p className="text-muted">L’autorisation ne vaut que pour cette commande.</p>
        )}
        <div className="modal-action mt-0">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant={mode === 'deny' ? 'outline' : 'primary'}>
            {mode === 'deny' ? 'Refuser' : 'Autoriser'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
