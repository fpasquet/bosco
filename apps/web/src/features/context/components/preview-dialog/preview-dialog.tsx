'use client';
import { Copy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ContextPreviewDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

export interface PreviewDialogProps {
  onClose: () => void;
  onCopy: (text: string) => void;
  open: boolean;
  preview: ContextPreviewDto | undefined;
  project: string;
}

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Aperçu du texte transmis (E9f) : exactement ce que lira un agent au prochain lancement, calculé à l'ouverture, avec ce
 * qui n'y figure pas et une estimation des tokens.
 */
export function PreviewDialog({ onClose, onCopy, open, preview, project }: PreviewDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const absent = preview?.absent.proposed.map((decision) => `DEC-${decision.id} (proposée, pas encore acceptée)`) ?? [];
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby="preview-title"
      onClose={onClose}
    >
      <div className="modal-box flex max-w-3xl flex-col gap-3">
        <h2 id="preview-title" className="font-display text-lg font-semibold">
          Texte transmis à un agent de {project}
        </h2>
        {preview ? (
          <>
            <pre className="max-h-96 overflow-auto rounded-control bg-surface-alt p-3 font-mono text-xs whitespace-pre-wrap">
              {preview.text}
            </pre>
            {absent.length > 0 && (
              <p className="text-xs text-muted">
                {absent.length > 1 ? 'Absentes' : 'Absente'} : {absent.join(', ')}.
              </p>
            )}
            <p className="text-xs text-muted">
              {preview.tokens.toLocaleString('fr-FR')} tokens environ · calculé à {TIME.format(new Date(preview.at))}
            </p>
          </>
        ) : (
          <p className="text-muted">Calcul du texte…</p>
        )}
        <div className="modal-action mt-0">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button disabled={!preview} onClick={() => preview && onCopy(preview.text)}>
            <Copy aria-hidden className="size-4" />
            Copier
          </Button>
        </div>
      </div>
    </dialog>
  );
}
