'use client';
import { FolderOpen, HardDrive, Layers, Radio, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { SourceRemovalDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';

export interface RemoveSourceDialogProps {
  busy: boolean;
  /** Chemin du profil écrit comme dans le terminal (~/.claude-perso) */
  displayPath: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  /** Ce que le retrait changerait ; null tant qu'il se charge */
  removal: null | SourceRemovalDto;
}

function sessionsLine(count: number): string {
  if (count > 1) return `${APP_NAME} arrête de lire ce dossier et oublie ses ${count} sessions`;
  return count === 1
    ? `${APP_NAME} arrête de lire ce dossier et oublie sa session`
    : `${APP_NAME} arrête de lire ce dossier ; aucune session à oublier`;
}

/** Ce qui sera retiré du profil, nommé : suivi en direct (avec le serveur de Bosco) et canal. */
function installedLine({ channel, liveTracking }: SourceRemovalDto): null | string {
  if (liveTracking && channel)
    return `Le suivi en direct, le canal et le serveur de ${APP_NAME} sont retirés du profil`;
  if (liveTracking) return `Le suivi en direct et le serveur de ${APP_NAME} sont retirés du profil`;
  return channel ? `Le canal de ${APP_NAME} est retiré du profil` : null;
}

/** Les groupes (et projets) qui le prenaient par défaut, et l'abonnement par défaut qu'ils reprennent. */
function DefaultsLine({ removal }: { removal: SourceRemovalDto }) {
  const users = removal.groups;
  if (users.length === 0 && removal.projects.length === 0 && !removal.defaultSubscription) return null;
  const subscription = removal.subscription ?? 'celui de Claude Code';
  return (
    <li className="flex gap-2">
      <Layers aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
      <span>
        {users.length > 0 && (
          <b className="block font-medium">
            {users.length > 1 ? `${users.length} groupes reprendront` : '1 groupe reprendra'} l’abonnement par défaut :{' '}
            {users.join(', ')}
          </b>
        )}
        {removal.projects.length > 0 && (
          <span className="block font-medium">
            {removal.projects.length > 1 ? 'Les projets' : 'Le projet'} {removal.projects.join(', ')}{' '}
            {removal.projects.length > 1 ? 'reprendront' : 'reprendra'} l’abonnement par défaut
          </span>
        )}
        {removal.defaultSubscription ? (
          <span
            className={users.length + removal.projects.length > 0 ? 'block text-xs text-muted' : 'block font-medium'}
          >
            C’était l’abonnement par défaut de {APP_NAME} : {subscription} le devient.
          </span>
        ) : (
          <span className="block text-xs text-muted">
            Ses prochaines sessions partiront avec {subscription}, l’abonnement par défaut de {APP_NAME}.
          </span>
        )}
      </span>
    </li>
  );
}

/**
 * Confirmation avant de retirer un profil des sources : Bosco oublie le dossier et ses sessions, et retire du profil ce
 * qu'il y avait installé ; rien n'est supprimé dans le dossier de Claude Code. Un tour en cours d'une session du
 * profil empêche le retrait.
 */
export function RemoveSourceDialog({ busy, displayPath, onCancel, onConfirm, open, removal }: RemoveSourceDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { text: useId(), title: useId() };
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const installed = removal ? installedLine(removal) : null;
  const running = removal?.running ?? 0;
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
        <div>
          <h2 id={ids.title} className="font-display text-lg font-semibold">
            Retirer la source {removal?.label ?? ''} ?
          </h2>
          <p className="font-mono text-xs text-muted">{displayPath}</p>
        </div>
        <ul id={ids.text} className="flex flex-col gap-2.5">
          {removal && (
            <>
              <li className="flex gap-2">
                <FolderOpen aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>
                  <b className="block font-medium">{sessionsLine(removal.sessions)}</b>
                  <span className="block text-xs text-muted">
                    Leur historique, leur usage et leurs notifications disparaissent de {APP_NAME}.
                  </span>
                </span>
              </li>
              {installed && (
                <li className="flex gap-2">
                  <Radio aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                  <span>
                    <b className="block font-medium">{installed}</b>
                    <span className="block text-xs text-muted">
                      Les réglages du profil d’avant leur installation sont remis.
                    </span>
                  </span>
                </li>
              )}
              <DefaultsLine removal={removal} />
            </>
          )}
          <li className="flex gap-2">
            <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>
              <b className="block font-medium">
                Rien n’est supprimé sur le poste : ni le dossier, ni les sessions de Claude Code
              </b>
              <span className="block text-xs text-muted">
                « Ajouter un dossier » le rajoute, et son historique est relu.
              </span>
            </span>
          </li>
        </ul>
        {running > 0 && (
          <p role="alert" className="alert alert-soft text-sm alert-warning">
            <TriangleAlert aria-hidden className="size-4" />
            {running > 1
              ? `${running} sessions de ce profil tournent : arrête-les d’abord.`
              : 'Une session de ce profil tourne : arrête-la d’abord.'}
          </p>
        )}
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" disabled={busy || !removal || running > 0} onClick={onConfirm}>
            Retirer la source
          </Button>
        </div>
      </div>
    </dialog>
  );
}
