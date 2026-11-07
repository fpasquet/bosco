'use client';
import { Zap } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import { useSourcesPreferences } from '../../lib/preferences';

/** Encart du suivi en direct, facultatif : « Plus tard » le masque (CA-SESS-04). */
export function LiveTrackingHint() {
  const dismissed = useSourcesPreferences((state) => state.liveTrackingHintDismissed);
  const dismiss = useSourcesPreferences((state) => state.dismissLiveTrackingHint);
  if (dismissed) return null;
  return (
    <aside
      aria-label="Suivi en direct"
      className="flex w-full items-center gap-4 rounded-card border border-line bg-surface-alt px-5 py-4"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-surface text-muted">
        <Zap aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Ensuite : suivi en direct</p>
        <p className="text-xs text-muted">
          Indispensable pour savoir qu’une session t’attend et répondre depuis {APP_NAME}.
        </p>
      </div>
      <Button variant="ghost" size="sm" className="text-muted" onClick={dismiss}>
        Plus tard
      </Button>
    </aside>
  );
}
