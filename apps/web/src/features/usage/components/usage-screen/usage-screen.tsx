'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNow } from '@/shared/hooks/use-now';
import { groupsQuery, profilesQuery, projectsQuery, quotaQuery, usageQuery } from '../../api/usage';
import { useUsageFilters } from '../../hooks/use-usage-filters';
import { UsageView } from '../usage-view';

/** Page Usage reliée à Bosco : les filtres viennent de l'adresse, les chiffres de l'API. */
export function UsageScreen() {
  const now = useNow(60_000);
  const [filters, setFilters] = useUsageFilters();
  const { data: report } = useQuery({ ...usageQuery(filters), placeholderData: keepPreviousData });
  const { data: quota } = useQuery(quotaQuery);
  const { data: sources } = useQuery(profilesQuery);
  const { data: projects } = useQuery(projectsQuery);
  const { data: groups } = useQuery(groupsQuery);
  return (
    <UsageView
      filters={filters}
      report={report}
      quota={quota}
      home={sources?.home ?? ''}
      today={now.toLocaleDateString('sv')}
      profiles={(sources?.sources ?? []).filter(({ watched }) => watched).map(({ id, label }) => ({ id, label }))}
      projects={(projects?.projects ?? []).map(({ id, name }) => ({ id, name }))}
      groups={(groups ?? []).filter(({ system }) => !system).map(({ id, name }) => ({ id, name }))}
      onChange={setFilters}
    />
  );
}
