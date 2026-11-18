'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';
import { APP_NAME } from '@bosco/domain';
import { INTRO, USES } from './intro';

export interface AboutDialogProps {
  onClose: () => void;
  open: boolean;
}

/** « À propos » : le texte de bienvenue, puis l'origine du nom ; se ferme sans rien changer. */
export function AboutDialog({ onClose, open }: AboutDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="about-title" onClose={onClose}>
      {/* La coquille a deux logos (poste, téléphone) : seule la fenêtre ouverte rend son texte */}
      {open && (
        <div className="modal-box flex max-w-lg flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <h2 id="about-title" className="font-display text-xl font-semibold">
              À propos de {APP_NAME}
            </h2>
            <Button variant="ghost" size="icon-sm" className="ml-auto text-muted" aria-label="Fermer" onClick={onClose}>
              <X aria-hidden className="size-4" />
            </Button>
          </div>
          <p className="text-muted">{INTRO}</p>
          <ul className="flex flex-col gap-2 text-sm">
            {USES.map(({ after, before, icon: Icon, strong }) => (
              <li key={strong} className="flex items-start gap-2 rounded-control bg-surface-alt px-3 py-2.5">
                <Icon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
                <span>
                  {before}
                  <b className="font-semibold text-ink">{strong}</b>
                  {after}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            <b className="font-semibold">D’où vient le nom ?</b> Le bosco est le maître d’équipage d’un navire : il
            veille sur l’équipage et l’appelle au sifflet quand il faut. {APP_NAME} en fait autant avec tes sessions.
          </p>
        </div>
      )}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

/** Le logo de la coquille, qui ouvre « À propos » : à côté du nom sur le poste, seul dans l'en-tête du téléphone. */
export function AboutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`À propos de ${APP_NAME}`}
        className="shrink-0 rounded-control focus-ring"
        onClick={() => setOpen(true)}
      >
        <Logo />
      </button>
      <AboutDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
