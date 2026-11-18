'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { useNotices } from '@/shared/hooks/use-notices';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { chooseHistory, dataQuery, resetBosco } from '../../api/data';
import { DataSettings } from '../data-settings';
import { ResetDialog } from '../reset-dialog';

/** Pendant la lecture de tout l'historique, les chiffres se relisent à cet intervalle. */
const IMPORT_REFRESH_MS = 2000;

/** Réglages › Données : la période importée, la base de Bosco et sa réinitialisation, réservée au poste. */
export function DataScreen() {
  const phone = useIsPhone();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data } = useQuery({
    ...dataQuery,
    refetchInterval: (query) => (query.state.data?.history.importing ? IMPORT_REFRESH_MS : false),
  });
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const history = useMutation({
    mutationFn: chooseHistory,
    onSuccess: async (saved) => {
      client.setQueryData(dataQuery.queryKey, saved);
      // Les sessions plus anciennes rejoignent l'historique et l'usage au fil de la lecture
      await client.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => push('La période n’a pas pu être enregistrée.', 'warning'),
  });
  const reset = useMutation({
    mutationFn: resetBosco,
    // Tout ce que l'interface a gardé est périmé : Bosco s'ouvre sur le premier lancement
    onSuccess: async () => {
      setResetting(false);
      await client.resetQueries();
      router.push('/');
    },
    onError: () => push('La réinitialisation n’a pas abouti. Réessaie.', 'warning'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader
        current="data"
        aside={
          <span className="ml-auto hidden h-control items-center gap-2 rounded-control border border-line bg-surface px-3 text-muted md:inline-flex">
            <Lock aria-hidden className="size-4" />
            Réservé à toi
          </span>
        }
      />
      {data ? (
        <>
          <DataSettings
            data={data}
            busy={history.isPending}
            readOnly={phone}
            onChooseHistory={(period) => history.mutate(period)}
            onReset={() => setResetting(true)}
          />
          {!phone && (
            <ResetDialog
              open={resetting}
              reset={data.reset}
              busy={reset.isPending}
              onCancel={() => setResetting(false)}
              onConfirm={(word) => reset.mutate(word)}
            />
          )}
        </>
      ) : (
        <SectionSkeleton rows={4} />
      )}
    </div>
  );
}
