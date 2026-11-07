'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { IsolationDto } from '@bosco/domain';
import { addDomain, isolationQuery, IsolationRefused, removeDomain, setMaxAgents } from '../../api/isolation';
import { IsolationEgress } from '../isolation-egress';
import { IsolationResources } from '../isolation-resources';

export type IsolationView = 'egress' | 'resources';

const VIEWS: { href: string; label: string; value: IsolationView }[] = [
  { value: 'resources', label: 'Mode et ressources', href: '/settings/isolation' },
  { value: 'egress', label: 'Sortie réseau et secrets', href: '/settings/isolation/egress' },
];

/**
 * Réglages › Isolation du worker (E11a, E11b), en deux sous-onglets. Les changements valent tout de suite, même
 * pour les tâches en cours ; sur le téléphone, tout est en lecture seule.
 */
export function IsolationScreen({ title, view }: { title: string; view: IsolationView }) {
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
  const capacity = useMutation({ mutationFn: setMaxAgents, onSuccess: saved, onError: refused });
  const busy = add.isPending || remove.isPending || capacity.isPending;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div>
        <p className="text-xs text-muted">{title}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Isolation du worker</h1>
      </div>
      <nav aria-label="Isolation du worker" className="tabs tabs-border tabs-sm">
        {VIEWS.map(({ href, label, value }) => (
          <Link
            key={value}
            href={href}
            className={value === view ? 'tab tab-active' : 'tab text-muted opacity-100'}
            aria-current={value === view ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {data &&
        (view === 'resources' ? (
          <IsolationResources isolation={data} busy={busy} onMaxAgents={(agents) => capacity.mutate(agents)} />
        ) : (
          <IsolationEgress
            isolation={data}
            busy={busy}
            error={error}
            now={new Date()}
            onAdd={(domain) => add.mutate(domain)}
            onRemove={(domain) => remove.mutate(domain)}
          />
        ))}
      {view === 'resources' && error && <p className="text-danger">{error}</p>}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
