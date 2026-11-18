'use client';
import { Box, ShieldAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';

export interface FullAccessDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
  /** « Utiliser un bac à sable » : le formulaire passe en bac à sable, en gardant l'accès complet ; absent : rien */
  onSandbox?: () => void;
  open: boolean;
  /** Projet principal de la session, où l'agent travaillera */
  project: string;
}

/**
 * Confirmation de l'accès complet sur le poste (E16e) : à chaque session, jamais une fois pour toutes, même quand le
 * mode vient d'un réglage par défaut. Sur le téléphone, une feuille du bas, « Donner l'accès complet » en tête.
 */
export function FullAccessDialog({ onCancel, onConfirm, onSandbox, open, project }: FullAccessDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      className="modal modal-bottom md:modal-middle"
      aria-labelledby="full-access-title"
      aria-describedby="full-access-text"
      onClose={onCancel}
    >
      <div className="modal-box flex flex-col gap-4">
        <h2 id="full-access-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldAlert aria-hidden className="size-5 shrink-0 text-warning" />
          Donner l’accès complet sur le poste ?
        </h2>
        <p id="full-access-text">
          L’agent modifiera les fichiers et lancera des commandes sur ce poste sans rien te demander, dans {project} et
          partout où ses outils peuvent aller. Pour un travail sans demande, un bac à sable l’isole du poste.
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {onSandbox && (
            <Button type="button" variant="outline" className="max-md:order-2" onClick={onSandbox}>
              <Box aria-hidden className="size-4" />
              Utiliser un bac à sable
            </Button>
          )}
          <Button type="button" variant="ghost" className="max-md:order-3 md:ml-auto" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant="warning" className="max-md:order-1 max-md:w-full" onClick={onConfirm}>
            Donner l’accès complet
          </Button>
        </div>
      </div>
    </dialog>
  );
}
