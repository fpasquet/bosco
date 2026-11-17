import { RefreshCw, ServerCrash } from 'lucide-react';
import { Button } from '@/shared/ui/button';

/**
 * Worker indisponible (E5c) : Docker ou l'abonnement Claude manque. Aucune tâche n'est perdue : celles du worker
 * attendent, les tâches « Ma session », la relecture et la validation restent possibles (CA-TACH-14, CA-TACH-17).
 */
export function WorkerBanner({ busy, onRetry, reason }: { busy: boolean; onRetry: () => void; reason: string }) {
  return (
    <section
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger"
    >
      <ServerCrash aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        <b className="font-semibold">Le worker ne peut pas lancer d’agent : {reason}.</b> Les tâches du worker restent
        en file, rien n’est perdu ; les tâches « Ma session » et la relecture restent possibles.
      </p>
      <Button variant="outline" size="sm" disabled={busy} onClick={onRetry}>
        <RefreshCw aria-hidden className="size-3.5" />
        Réessayer
      </Button>
    </section>
  );
}
