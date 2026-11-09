import { Radio, RadioTower, SquareTerminal } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { sinceNow } from '../../lib/format';

export interface SourceCardProps {
  /** Canal de Bosco du profil (E4f) : installé ou non ; absent tant qu'il n'est pas connu */
  channel?: { installed: boolean; onOpen: () => void };
  label: string;
  /** Dernier signal reçu d'une session du profil ; null tant qu'aucune n'a parlé depuis le démarrage de Bosco */
  lastSignalAt: Date | null;
  liveTracking: boolean;
  now: Date;
  onOpenLiveTracking: () => void;
  onWatchedChange: (watched: boolean) => void;
  /** Chemin écrit comme dans le terminal (~/.claude-perso) */
  path: string;
  /** Interrupteur de la source : sa lecture s'arrête, rien n'est effacé (CA-SESS-56) */
  watched: boolean;
}

/** Une source surveillée (E4a) : son suivi en direct et son dernier signal, pour voir d'un coup d'œil que tout est branché. */
export function SourceCard(props: SourceCardProps) {
  const { label, lastSignalAt, liveTracking, now, onOpenLiveTracking, onWatchedChange, path, watched } = props;
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
            {watched ? (
              <span className="badge shrink-0 badge-soft badge-sm badge-success">Actif</span>
            ) : (
              <span className="badge shrink-0 badge-ghost badge-sm">En pause</span>
            )}
          </p>
          <p className="truncate font-mono text-xs text-muted">{path}</p>
        </div>
        <div className="min-w-0 text-xs md:w-56">
          <p className="flex items-center gap-1.5 font-medium">
            <Radio
              aria-hidden
              className={liveTracking ? 'size-3.5 shrink-0 text-success' : 'size-3.5 shrink-0 text-muted'}
            />
            {liveTracking ? 'Suivi en direct installé' : 'Suivi en direct non installé'}
          </p>
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
        onChange={(event) => onWatchedChange(event.target.checked)}
      />
      <Button
        variant={liveTracking ? 'outline' : 'primary'}
        size="sm"
        className="hidden md:inline-flex"
        onClick={onOpenLiveTracking}
      >
        {liveTracking ? 'Vérifier le suivi en direct' : 'Installer'}
      </Button>
    </li>
  );
}
