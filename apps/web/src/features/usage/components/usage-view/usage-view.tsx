'use client';
import { useState } from 'react';
import type { QuotaDto, UsageReportDto } from '@bosco/domain';
import { HistorySwitch } from '@/shared/components/history-switch';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { Segmented } from '@/shared/ui/segmented';
import type { UsageMeasure } from '../../lib/chart';
import type { UsageFilters as Filters } from '../../lib/filters';
import { sinceLabel } from '../../lib/format';
import { ActivityTiles } from '../activity-tiles';
import { QuotaCard } from '../quota-card';
import { TokenTiles } from '../token-tiles';
import { UsageBreakdown } from '../usage-breakdown';
import { UsageChart, UsageLegend, UsageTable } from '../usage-chart';
import { UsageFilters } from '../usage-filters';

export interface UsageViewProps {
  filters: Filters;
  groups: { id: number; name: string }[];
  /** Dossier personnel, pour écrire les profils comme dans le terminal */
  home: string;
  onChange: (filters: Filters) => void;
  profiles: { id: string; label: string }[];
  projects: { id: number; name: string }[];
  quota: QuotaDto | undefined;
  /** undefined : en chargement */
  report: undefined | UsageReportDto;
  /** Aujourd'hui (AAAA-MM-JJ) : sa barre est « en cours » */
  today: string;
}

const MEASURES = [
  { value: 'tokens', label: 'Tokens' },
  { value: 'cost', label: 'Coût estimé' },
] as const;

/** Jours montrés sur le téléphone : une barre lisible par jour. */
const PHONE_DAYS = 7;

/**
 * Page Usage (E23a, E23b) : une ligne de filtres pour toute la page, sauf le quota ; l'activité de Bosco, les tokens et
 * le coût estimé, le graphique quotidien, le quota des abonnements et la répartition par projet, modèle et profil.
 */
export function UsageView({
  filters,
  groups,
  home,
  onChange,
  profiles,
  projects,
  quota,
  report,
  today,
}: UsageViewProps) {
  const [measure, setMeasure] = useState<UsageMeasure>('tokens');
  const [table, setTable] = useState(false);
  const subtitle = report?.since
    ? `Ce que consomment tes sessions Claude Code, d’après leurs transcripts. Données depuis le ${sinceLabel(report.since)}.`
    : 'Ce que consomment tes sessions Claude Code, d’après leurs transcripts.';
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <HistorySwitch current="usage" />
      <div className="hidden md:block">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <UsageFilters
        filters={filters}
        groups={groups}
        models={report?.models ?? []}
        profiles={profiles}
        projects={projects}
        table={table}
        onChange={onChange}
        onTable={() => setTable(!table)}
      />
      {report ? (
        <>
          <ActivityTiles activity={report.activity} />
          <TokenTiles tokens={report.tokens} />
          <section
            aria-labelledby="usage-daily"
            className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0">
                <h2 id="usage-daily" className="text-sm font-semibold">
                  Utilisation quotidienne
                </h2>
                <p className="text-xs text-muted">
                  Entrée, sortie, lecture et écriture du cache, par jour
                  {filters.period === '7' && ' · 7 derniers jours'}
                </p>
              </div>
              <Segmented
                className="ml-auto"
                label="Mesure du graphique"
                options={MEASURES}
                value={measure}
                onChange={setMeasure}
              />
            </div>
            <UsageLegend />
            <div className="hidden md:block">
              <UsageChart days={report.days} measure={measure} today={today} />
            </div>
            <div className="md:hidden">
              <UsageChart days={report.days.slice(-PHONE_DAYS)} measure={measure} today={today} compact />
            </div>
            {table && <UsageTable days={report.days} today={today} />}
          </section>
          {quota && <QuotaCard quota={quota} home={home} />}
          <UsageBreakdown
            byProject={report.byProject}
            byModel={report.byModel}
            byProfile={report.byProfile}
            onProject={(id) => onChange({ ...filters, scope: { kind: 'project', id } })}
          />
        </>
      ) : (
        <SectionSkeleton rows={6} />
      )}
    </div>
  );
}
