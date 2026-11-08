'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import type { SessionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { costsQuery, type HistoryFilters as Filters, historyQuery } from '../../api/history';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useLiveEvents } from '../../hooks/use-live-events';
import { useNow } from '../../hooks/use-now';
import { CostReport } from '../cost-report';
import { HistoryFilters } from '../history-filters';
import { HistoryList } from '../history-list';

export type HistoryTab = 'costs' | 'list';

/** Historique (E3a) et coûts (E3b) : les deux onglets partagent la recherche et les filtres. */
export function HistoryScreen({
  repository,
  tab,
  title,
}: {
  repository: null | string;
  tab: HistoryTab;
  title: string;
}) {
  const now = useNow(60_000);
  useLiveEvents(true);
  const [filters, setFilters] = useState<Filters>({
    days: tab === 'costs' ? 30 : 7,
    profile: null,
    query: '',
    repository,
    state: null,
  });
  // La recherche part pendant la frappe, sans attendre la fin de chaque requête (CA-SESS-47)
  const deferred = useDeferredValue(filters);
  const { data: sources } = useQuery(sourcesQuery);
  const { data: sessions } = useQuery(sessionsQuery);
  const days = useQuery({ ...historyQuery(deferred), enabled: tab === 'list', placeholderData: keepPreviousData });
  const costs = useQuery({ ...costsQuery(deferred), enabled: tab === 'costs', placeholderData: keepPreviousData });
  const repositories = [
    ...new Set((sessions ?? []).flatMap((session) => (session.repository ? [session.repository.name] : []))),
  ].toSorted((a, b) => a.localeCompare(b, 'fr'));
  const profiles = (sources?.sources ?? []).map(({ id, label }) => ({ id, label }));
  const profileOf = (session: SessionDto) => profiles.find((profile) => profile.id === session.sourceId)?.label ?? null;
  const tabLink = (value: HistoryTab, label: string) => (
    <Link
      role="tab"
      aria-selected={tab === value}
      href={value === 'costs' ? '/history?tab=costs' : '/history'}
      className={cn('tab', tab === value ? 'tab-active' : 'text-muted opacity-100')}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="hidden text-xs text-muted md:block">Poste local · tous les profils surveillés</p>
          <h1 className="mt-1 hidden font-display text-2xl font-semibold tracking-tight md:block">{title}</h1>
        </div>
        <div role="tablist" aria-label="Vue de l’historique" className="tabs tabs-box tabs-sm md:ml-auto">
          {tabLink('list', 'Liste')}
          {tabLink('costs', 'Coûts')}
        </div>
      </div>
      <HistoryFilters filters={filters} onChange={setFilters} profiles={profiles} repositories={repositories} />
      {tab === 'list' && days.data && <HistoryList days={days.data} now={now} profileOf={profileOf} />}
      {tab === 'costs' && costs.data && <CostReport report={costs.data} now={now} />}
      {((tab === 'list' && !days.data) || (tab === 'costs' && !costs.data)) && <SectionSkeleton rows={6} />}
    </div>
  );
}
