'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { IsolationDto } from '@bosco/domain';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { addDomain, isolationQuery, IsolationRefused, removeDomain } from '../../api/isolation';
import { IsolationEgress } from '../isolation-egress';
import { IsolationResources } from '../isolation-resources';

/**
 * Réglages › Bac à sable : ce que voit l'agent, ses limites et les domaines qu'il peut joindre.
 * Un domaine ajouté vaut tout de suite, même pour les bacs à sable démarrés ; sur le téléphone, tout se lit.
 */
export function IsolationScreen() {
  const client = useQueryClient();
  const { data } = useQuery(isolationQuery);
  const [error, setError] = useState<null | string>(null);
  const saved = (isolation: IsolationDto) => {
    setError(null);
    client.setQueryData(isolationQuery.queryKey, isolation);
  };
  const refused = (failure: Error) =>
    setError(failure instanceof IsolationRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.');
  const add = useMutation({ mutationFn: addDomain, onSuccess: saved, onError: refused });
  const remove = useMutation({ mutationFn: removeDomain, onSuccess: saved, onError: refused });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="sandbox" />
      {!data && <SectionSkeleton rows={4} />}
      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <IsolationResources isolation={data} />
          <IsolationEgress
            isolation={data}
            busy={add.isPending || remove.isPending}
            error={error}
            onAdd={(domain) => add.mutate(domain)}
            onRemove={(domain) => remove.mutate(domain)}
          />
        </div>
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
