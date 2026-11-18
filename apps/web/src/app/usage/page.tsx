import { Suspense } from 'react';
import { UsageScreen } from '@/features/usage/components/usage-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Usage : `?period=7&group=2` ouvre la page déjà filtrée (« Usage » du menu ⋯ d'un projet ou d'un groupe). */
export default function UsagePage() {
  return (
    <AppShell title="Usage" place={{ kind: 'usage' }}>
      <Suspense>
        <UsageScreen />
      </Suspense>
    </AppShell>
  );
}
