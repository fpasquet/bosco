'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import type { SessionDto } from '@bosco/domain';
import { HistorySwitch } from '@/shared/components/history-switch';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useNow } from '@/shared/hooks/use-now';
import { groupsQuery } from '../../api/groups';
import { type HistoryFilters as Filters, historyQuery } from '../../api/history';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useLiveEvents } from '../../hooks/use-live-events';
import { HistoryFilters } from '../history-filters';
import { HistoryList } from '../history-list';

/** Historique : la recherche des sessions, jour par jour ; l'usage a sa page. */
export function HistoryScreen({
  group,
  project,
  title,
}: {
  group: null | number;
  project: null | string;
  title: string;
}) {
  const now = useNow(60_000);
  useLiveEvents(true);
  const [filters, setFilters] = useState<Filters>({ days: 7, group, profile: null, query: '', project, state: null });
  // La recherche part pendant la frappe, sans attendre la fin de chaque requête
  const deferred = useDeferredValue(filters);
  const { data: sources } = useQuery(sourcesQuery);
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: groups } = useQuery(groupsQuery);
  const days = useQuery({ ...historyQuery(deferred), placeholderData: keepPreviousData });
  const projects = [
    ...new Set((sessions ?? []).flatMap((session) => (session.project ? [session.project.name] : []))),
  ].toSorted((a, b) => a.localeCompare(b, 'fr'));
  const profiles = (sources?.sources ?? []).map(({ id, label }) => ({ id, label }));
  const profileOf = (session: SessionDto) => profiles.find((profile) => profile.id === session.sourceId)?.label ?? null;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <HistorySwitch current="sessions" />
      <div className="hidden md:block">
        <p className="text-xs text-muted">Poste local · tous les profils surveillés</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <HistoryFilters
        filters={filters}
        onChange={setFilters}
        profiles={profiles}
        projects={projects}
        groups={(groups ?? []).filter((candidate) => !candidate.system)}
      />
      {days.data ? <HistoryList days={days.data} now={now} profileOf={profileOf} /> : <SectionSkeleton rows={6} />}
    </div>
  );
}
