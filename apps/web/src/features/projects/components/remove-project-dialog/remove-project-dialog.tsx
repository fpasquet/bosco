'use client';
import { EyeOff, FolderOpen, HardDrive, Layers, ScrollText, TriangleAlert } from 'lucide-react';
import { APP_NAME } from '@bosco/domain';
import { GroupConfirmDialog } from '../group-confirm-dialog';

export interface RemoveProjectDialogProps {
  busy: boolean;
  /** Décisions du projet, gardées pour son retour */
  decisions: number;
  /** Groupes qu'il quitte ; next : le projet qui en devient le principal quand c'était lui */
  groups: { name: string; next: null | string }[];
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  /** Sessions pilotées par Bosco qui tournent encore dans le projet : le retrait attend qu'elles s'arrêtent */
  running: number;
  sessions: number;
}

function sessionsLine(count: number): string {
  if (count > 1) return `Ses ${count} sessions passent sous « Hors projet »`;
  return count === 1 ? 'Sa session passe sous « Hors projet »' : 'Aucune session ne passe sous « Hors projet »';
}

function decisionsLine(count: number): string {
  if (count > 1) return `Ses ${count} décisions sont gardées, et reviennent si tu l’ajoutes de nouveau`;
  return count === 1
    ? 'Sa décision est gardée, et revient si tu l’ajoutes de nouveau'
    : 'Aucune décision à garder pour son retour';
}

/**
 * Confirmation avant de retirer un projet : ce qui change, que son dossier est ignoré pour ne pas revenir de lui-même,
 * et le rappel que rien n'est supprimé sur le poste.
 * Une session pilotée qui tourne encore dans le projet l'empêche, avec la raison.
 */
export function RemoveProjectDialog({
  busy,
  decisions,
  groups,
  name,
  onCancel,
  onConfirm,
  open,
  running,
  sessions,
}: RemoveProjectDialogProps) {
  const principals = groups.filter((group) => group.next);
  return (
    <GroupConfirmDialog
      open={open}
      busy={busy || running > 0}
      destructive
      title={`Retirer ${name} de ${APP_NAME} ?`}
      confirmLabel="Retirer le projet"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <ul className="flex flex-col gap-2.5">
        <li className="flex gap-2">
          <FolderOpen aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>{sessionsLine(sessions)}</span>
        </li>
        {groups.length > 0 && (
          <li className="flex gap-2">
            <Layers aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>
              Il sort de {groups.length > 1 ? `${groups.length} groupes` : '1 groupe'} :{' '}
              {groups.map((group) => group.name).join(', ')}
              {principals.map((group) => (
                <span key={group.name} className="block text-xs text-muted">
                  Dans {group.name}, {group.next} devient le projet principal.
                </span>
              ))}
            </span>
          </li>
        )}
        <li className="flex gap-2">
          <ScrollText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>{decisionsLine(decisions)}</span>
        </li>
        <li className="flex gap-2">
          <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>
            Son dossier est ignoré : une nouvelle session ne le fait pas revenir. « Ne plus ignorer », dans Projets, le
            rétablit
          </span>
        </li>
        <li className="flex gap-2">
          <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>Rien n’est supprimé sur le poste : ni le dossier, ni les sessions</span>
        </li>
      </ul>
      {running > 0 && (
        <p role="alert" className="alert alert-soft text-sm alert-warning">
          <TriangleAlert aria-hidden className="size-4" />
          {running > 1
            ? `${running} sessions pilotées par ${APP_NAME} tournent encore dans ce projet : arrête-les avant de le retirer.`
            : `Une session pilotée par ${APP_NAME} tourne encore dans ce projet : arrête-la avant de le retirer.`}
        </p>
      )}
    </GroupConfirmDialog>
  );
}
