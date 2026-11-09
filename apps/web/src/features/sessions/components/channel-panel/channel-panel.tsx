'use client';
import { Check, Copy, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ChannelProfileDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

export interface ChannelPanelProps {
  busy: boolean;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
  onInstall: () => void;
  onUninstall: () => void;
  /** Profil ouvert ; null : panneau fermé */
  profile: ChannelProfileDto | null;
  /** Chemin du profil écrit comme dans le terminal (~/.claude-perso) */
  shownPath: string;
}

/** Une commande à copier : sur le téléphone, affichée sans bouton (la copie se fait sur le poste). */
function CommandLine({ label, onCopy, text }: { label: string; onCopy: ChannelPanelProps['onCopy']; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-control bg-surface-alt py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 py-1.5 font-mono text-xs break-all">{text}</code>
      <button
        type="button"
        aria-label={`Copier ${label}`}
        className="btn btn-square btn-ghost btn-sm max-md:hidden"
        onClick={() => onCopy(text, `${label} copiée`)}
      >
        <Copy aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Installation du canal de Bosco dans un profil (E4f, CA-SESS-102) : ce que cela permet, l'installation, puis la
 * commande qui lance une session avec le canal et son alias. Rien ne change pour une session lancée sans lui.
 */
export function ChannelPanel({ busy, onClose, onCopy, onInstall, onUninstall, profile, shownPath }: ChannelPanelProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (profile && element && !element.open) element.showModal();
    if (!profile && element?.open) element.close();
  }, [profile]);
  const alias = profile ? `alias claude-bosco='${profile.command}'` : '';
  return (
    <dialog ref={dialog} className="modal modal-end" aria-labelledby="channel-title" onClose={onClose}>
      <div className="modal-box flex size-full max-h-none max-w-md flex-col gap-5 rounded-none">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="channel-title" className="font-display text-lg font-semibold">
              Canal de Bosco · profil {profile?.label}
            </h2>
            <p className="font-mono text-xs text-muted">{shownPath}</p>
          </div>
          <button type="button" aria-label="Fermer" className="btn btn-square btn-ghost btn-sm" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto text-sm">
          <section className="flex flex-col gap-1">
            <h3 className="flex items-center gap-2 font-medium">
              <Check aria-hidden className="size-4 text-success" />
              Ce que cela permet
            </h3>
            <p className="text-muted">
              Écrire depuis Bosco, sur le poste ou le téléphone, à une session ouverte dans un terminal. Texte seulement
              : ni images, ni réglages.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 font-medium">
              {profile?.installed && <Check aria-hidden className="size-4 text-success" />}
              Installer
            </h3>
            <p className="text-muted">Bosco ajoute son canal aux serveurs du profil, sans rien remplacer.</p>
            {profile?.installed ? (
              <span className="badge gap-1 self-start badge-soft badge-success">
                <Check aria-hidden className="size-3" />
                Installé
              </span>
            ) : (
              <Button variant="primary" size="sm" className="self-start" disabled={busy} onClick={onInstall}>
                Installer
              </Button>
            )}
          </section>
          {profile?.installed && (
            <section className="flex flex-col gap-2">
              <h3 className="font-medium">Lancer tes sessions avec le canal</h3>
              <p className="text-muted">Lance Claude Code avec cette commande :</p>
              <CommandLine label="la commande" text={profile.command} onCopy={onCopy} />
              <p className="text-muted">Un alias évite de la retaper :</p>
              <CommandLine label="l’alias" text={alias} onCopy={onCopy} />
            </section>
          )}
          <div role="note" className="alert items-start alert-soft text-xs alert-warning">
            <TriangleAlert aria-hidden className="size-4" />
            <span>
              Aperçu de recherche de Claude Code : à chaque lancement, Claude Code demande de confirmer un canal en
              développement local. Une organisation Team ou Enterprise peut désactiver les canaux.
            </span>
          </div>
          <p className="flex items-start gap-2 text-xs text-muted">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Une session lancée sans le canal ne change pas : on y répond dans le terminal.
          </p>
        </div>
        {profile?.installed && (
          <footer className="flex items-center border-t border-line pt-4">
            <Button variant="ghost" size="sm" disabled={busy} onClick={onUninstall}>
              Retirer
            </Button>
            <Button variant="primary" size="sm" className="ml-auto" onClick={onClose}>
              Terminer
            </Button>
          </footer>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Fermer le panneau">
          Fermer
        </button>
      </form>
    </dialog>
  );
}
