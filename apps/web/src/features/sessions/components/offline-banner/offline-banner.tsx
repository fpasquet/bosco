import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import { clockOf } from '../../lib/detail';
import { elapsed } from '../../lib/format';

export interface OfflineBannerProps {
  lastDataAt: null | string;
  nextRetryAt: null | string;
  now: Date;
  offlineSince: string;
  onRetry: () => void;
}

/** Bosco ne répond plus (E1f) : l'écran garde ses informations, datées, et se reconnecte seul (CA-SESS-23, 25). */
export function OfflineBanner({ lastDataAt, nextRetryAt, now, offlineSince, onRetry }: OfflineBannerProps) {
  const retryIn = nextRetryAt ? Math.max(0, Math.ceil((new Date(nextRetryAt).getTime() - now.getTime()) / 1000)) : 0;
  return (
    <section
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger"
    >
      <WifiOff aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        <b className="font-semibold">
          {APP_NAME} ne répond plus depuis {elapsed(new Date(offlineSince), now)}.
        </b>{' '}
        {lastDataAt && <span>Les informations ci-dessous datent de {clockOf(lastDataAt)}.</span>}
      </p>
      <span className="text-xs tabular-nums">Nouvelle tentative dans {retryIn} s</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw aria-hidden className="size-3.5" />
        Réessayer
      </Button>
    </section>
  );
}
