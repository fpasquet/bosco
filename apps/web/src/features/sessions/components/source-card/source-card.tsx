import { Box, Radio, RadioTower, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import { sinceNow } from '../../lib/format';

export interface SourceCardProps {
  /** Canal de Bosco du profil (E4f) : installé ou non ; absent tant qu'il n'est pas connu */
  channel?: { installed: boolean; onOpen: () => void };
  label: string;
  /** Dernier signal reçu d'une session du profil ; null tant qu'aucune n'a parlé depuis le démarrage de Bosco */
  lastSignalAt: Date | null;
  liveTracking: boolean;
  /** Suivi installé par une autre version de Bosco : la source passe « À mettre à jour » */
  liveTrackingOutdated?: boolean;
  /** Réglages du profil (E4g) : ses valeurs par défaut des sessions ; absent : pas de lien */
  manageHref?: string;
  now: Date;
  onOpenLiveTracking: () => void;
  onWatchedChange: (watched: boolean) => void;
  /** Chemin écrit comme dans le terminal (~/.claude-perso) */
  path: string;
  /** Sur le téléphone, les réglages se lisent seulement : l'interrupteur montre l'état sans le changer */
  readOnly?: boolean;
  /** Interrupteur de la source : sa lecture s'arrête, rien n'est effacé (CA-SESS-56) */
  watched: boolean;
}

export interface ManagedSourceCardProps {
  /** « 1 bac à sable · dernier tour à 15:12 » ; null avant le premier tour */
  activity: null | string;
  /** Chemin écrit comme dans le terminal */
  path: string;
}

/**
 * La source « Bacs à sable », tenue par Bosco : il lance lui-même ses sessions. La couper ferait disparaître les
 * sessions en bac à sable : ni interrupteur, ni « Gérer », ni suivi en direct ou canal à installer.
 */
export function ManagedSourceCard({ activity, path }: ManagedSourceCardProps) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 md:items-center md:gap-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-surface-alt text-muted">
        <Box aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 md:flex-1">
          <p className="flex min-w-0 items-center gap-2 font-medium">
            <span className="truncate">Bacs à sable</span>
            <span className="badge shrink-0 badge-ghost badge-sm">Tenue par {APP_NAME}</span>
          </p>
          <p className="truncate font-mono text-xs text-muted">{path}</p>
        </div>
        <div className="min-w-0 text-xs md:w-56">
          <p className="flex items-center gap-1.5 font-medium text-muted">
            <Radio aria-hidden className="size-3.5 shrink-0" />
            Piloté par {APP_NAME}
          </p>
          {activity && <p className="text-muted">{activity}</p>}
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ outdated, watched }: { outdated: boolean; watched: boolean }) {
  if (outdated) return <span className="badge shrink-0 badge-soft badge-sm badge-warning">À mettre à jour</span>;
  if (watched) return <span className="badge shrink-0 badge-soft badge-sm badge-success">Actif</span>;
  return <span className="badge shrink-0 badge-ghost badge-sm">En pause</span>;
}

function LiveTrackingState({ liveTracking, outdated }: { liveTracking: boolean; outdated: boolean }) {
  if (outdated)
    return (
      <p className="flex items-center gap-1.5 font-medium">
        <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
        Suivi en direct à mettre à jour
      </p>
    );
  return (
    <p className="flex items-center gap-1.5 font-medium">
      <Radio aria-hidden className={liveTracking ? 'size-3.5 shrink-0 text-success' : 'size-3.5 shrink-0 text-muted'} />
      {liveTracking ? 'Suivi en direct installé' : 'Suivi en direct non installé'}
    </p>
  );
}

function liveTrackingAction(liveTracking: boolean, outdated: boolean): string {
  if (outdated) return 'Mettre à jour';
  return liveTracking ? 'Vérifier le suivi en direct' : 'Installer';
}

/** Une source surveillée (E4a) : son suivi en direct et son dernier signal, pour voir d'un coup d'œil que tout est branché. */
export function SourceCard(props: SourceCardProps) {
  const { label, lastSignalAt, liveTracking, now, onOpenLiveTracking, onWatchedChange, path, watched } = props;
  const outdated = props.liveTrackingOutdated ?? false;
  return (
    <li className="flex items-start gap-3 px-4 py-3 md:items-center md:gap-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-surface-alt text-muted">
        <SquareTerminal aria-hidden className="size-4" />
      </span>
      {/* Sur le téléphone, l'état du suivi passe sous le nom : l'interrupteur reste sur la première ligne */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 md:flex-1">
          <p className="flex min-w-0 items-center gap-2 font-medium">
            <span className="truncate">{label}</span>
            <StatusBadge outdated={outdated} watched={watched} />
          </p>
          <p className="truncate font-mono text-xs text-muted">{path}</p>
          {props.manageHref && (
            <Link href={props.manageHref} className="link text-xs font-medium link-primary">
              Gérer<span className="sr-only"> le profil {label}</span>
            </Link>
          )}
        </div>
        <div className="min-w-0 text-xs md:w-56">
          <LiveTrackingState liveTracking={liveTracking} outdated={outdated} />
          <p className="text-muted">
            {lastSignalAt ? `dernier signal ${sinceNow(lastSignalAt, now)}` : 'aucun signal depuis le démarrage'}
          </p>
          {props.channel && (
            <p className="mt-1 flex items-center gap-1.5 text-muted">
              <RadioTower aria-hidden className="size-3.5 shrink-0" />
              Canal de Bosco · {props.channel.installed ? 'installé' : 'non installé'}
              <button type="button" className="link font-medium link-primary" onClick={props.channel.onOpen}>
                {props.channel.installed ? 'Gérer' : 'Installer'}
                <span className="sr-only"> le canal de Bosco du profil {label}</span>
              </button>
            </p>
          )}
        </div>
      </div>
      <input
        type="checkbox"
        role="switch"
        aria-label={`Lire le profil ${label}`}
        className="toggle shrink-0 toggle-primary"
        checked={watched}
        disabled={props.readOnly}
        onChange={(event) => onWatchedChange(event.target.checked)}
      />
      <Button
        variant={liveTracking && !outdated ? 'outline' : 'primary'}
        size="sm"
        className="hidden md:inline-flex"
        onClick={onOpenLiveTracking}
      >
        {liveTrackingAction(liveTracking, outdated)}
        {outdated && <span className="sr-only"> le suivi en direct du profil {label}</span>}
      </Button>
    </li>
  );
}
