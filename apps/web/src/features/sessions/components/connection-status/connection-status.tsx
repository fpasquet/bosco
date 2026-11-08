'use client';
import { useNow } from '@/shared/hooks/use-now';
import { useConnection } from '../../lib/connection';
import { OfflineBanner } from '../offline-banner';

/** Bandeau de coupure, branché sur l'état du lien avec Bosco ; rien tant qu'il répond. */
export function ConnectionStatus() {
  const now = useNow();
  const { lastDataAt, nextRetryAt, offlineSince, retry } = useConnection();
  if (!offlineSince) return null;
  return (
    <OfflineBanner
      now={now}
      offlineSince={offlineSince}
      lastDataAt={lastDataAt}
      nextRetryAt={nextRetryAt}
      onRetry={retry}
    />
  );
}
