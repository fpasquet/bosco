'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { CostReportDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { formatCost, modelName } from '../../lib/format';
import { axisMax, chartSeries, seriesCost } from '../../lib/history';

export interface CostReportProps {
  now: Date;
  report: CostReportDto;
}

/** Les dépôts n'ont pas de couleur propre : les séries prennent les couleurs du thème (E3b, annotation 2). */
const FILLS = ['fill-primary', 'fill-info', 'fill-warning', 'fill-muted'];
const SWATCHES = ['bg-primary', 'bg-info', 'bg-warning', 'bg-muted'];

const CHART = { height: 180, gap: 4, left: 36 };

function usd(value: number): string {
  return formatCost({ unpriced: false, usd: value });
}

function Kpi({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        <span className="font-display text-xl font-semibold tabular-nums">{value}</span>
        {detail && <span className="text-xs text-muted">{detail}</span>}
      </dd>
    </div>
  );
}

/** Graphique du coût par jour ouvré, empilé par dépôt ; aujourd'hui surligné avec son total (CA-SESS-53, 54). */
function Chart({ now, report }: CostReportProps) {
  const series = chartSeries(report);
  const top = series.filter((entry) => entry.name !== '*').map((entry) => entry.name);
  const totals = report.days.map((day) => day.repositories.reduce((total, entry) => total + entry.usd, 0));
  const max = axisMax(totals);
  const width = Math.max(report.days.length * 24, 240);
  const bar = (width - CHART.left) / Math.max(report.days.length, 1) - CHART.gap;
  const today = now.toLocaleDateString('sv');
  const y = (value: number) => CHART.height - (value / max) * CHART.height;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <b className="font-semibold text-ink">Coût par jour</b>
        {report.workingDays} jours ouvrés
        {series.map((entry, index) => (
          <span key={entry.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2.5 rounded-sm', SWATCHES[index])} />
            {entry.label}
          </span>
        ))}
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Coût estimé par jour ouvré, par dépôt"
          width={width}
          height={CHART.height + 24}
          className="text-muted"
        >
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line x1={CHART.left} x2={width} y1={y(max * ratio)} y2={y(max * ratio)} className="stroke-line" />
              <text x={0} y={y(max * ratio) + 4} className="fill-muted text-xs">
                {usd(max * ratio).replace(',00', '')}
              </text>
            </g>
          ))}
          {report.days.map((day, index) => {
            const x = CHART.left + index * (bar + CHART.gap);
            let base = 0;
            const total = totals[index] ?? 0;
            const isToday = day.date === today;
            return (
              <g key={day.date}>
                <title>{dayDetail(day, total)}</title>
                {series.map((entry, position) => {
                  const value = seriesCost(day, entry, top);
                  const rect = (
                    <rect
                      key={entry.label}
                      x={x}
                      width={bar}
                      y={y(base + value)}
                      height={(value / max) * CHART.height}
                      className={FILLS[position]}
                    />
                  );
                  base += value;
                  return rect;
                })}
                {isToday && (
                  <text
                    x={x + bar / 2}
                    y={Math.max(12, y(total) - 4)}
                    textAnchor="middle"
                    className="fill-ink text-xs font-semibold"
                  >
                    {usd(total)}
                  </text>
                )}
                <text
                  x={x + bar / 2}
                  y={CHART.height + 16}
                  textAnchor="middle"
                  className={cn('text-xs', isToday ? 'fill-ink' : 'fill-muted')}
                >
                  {Number(day.date.slice(8))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

/** Détail d'un jour au survol : coût et sessions par dépôt (CA-SESS-54). */
function dayDetail(day: CostReportDto['days'][number], total: number): string {
  const parts = day.repositories.map(
    (entry) => (entry.name ?? 'hors dépôt') + ' ' + usd(entry.usd) + ' (' + entry.sessions + ')',
  );
  return [day.date, usd(total), parts.join(', ')].join(' · ');
}

type Sort = 'name' | 'sessions' | 'usd';

/** Coûts de la période (E3b) : total, moyenne par jour ouvré, graphique, répartition par dépôt et par modèle. */
export function CostReport({ now, report }: CostReportProps) {
  const [sort, setSort] = useState<Sort>('usd');
  const repositories = report.byRepository.toSorted((a, b) =>
    sort === 'name' ? (a.name ?? '').localeCompare(b.name ?? '') : b[sort] - a[sort],
  );
  const header = (label: string, key: Sort) => (
    <th aria-sort={sort === key ? 'descending' : 'none'} className="font-medium">
      <button type="button" className="link link-hover" onClick={() => setSort(key)}>
        {label}
      </button>
    </th>
  );
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 rounded-card border border-line bg-surface shadow-card md:grid-cols-4">
        <Kpi label="Total de la période" value={usd(report.totalUsd)} detail="estimé" />
        <Kpi
          label="Moyenne par jour ouvré"
          value={usd(report.averagePerWorkingDayUsd)}
          detail={`${report.workingDays} jours`}
        />
        <Kpi label="Sessions" value={String(report.sessions)} />
        <Kpi label="Part du cache" value={`${report.cacheShare} %`} detail="des tokens lus" />
      </dl>
      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <Chart now={now} report={report} />
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <section
          aria-labelledby="by-repository"
          className="overflow-x-auto rounded-card border border-line bg-surface shadow-card md:col-span-2"
        >
          <h2 id="by-repository" className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
            Par dépôt
          </h2>
          <table className="table w-full text-left">
            <thead className="text-xs text-muted">
              <tr>
                {header('Dépôt', 'name')}
                {header('Sessions', 'sessions')}
                {header('Coût', 'usd')}
                <th className="font-medium">Part</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((entry) => (
                <tr key={entry.name ?? ''} className="border-t border-line">
                  <td>
                    {entry.name ? (
                      <Link
                        href={`/history?repo=${encodeURIComponent(entry.name)}`}
                        className="link font-medium link-hover"
                      >
                        {entry.name}
                      </Link>
                    ) : (
                      'Hors dépôt git'
                    )}
                  </td>
                  <td className="tabular-nums">{entry.sessions}</td>
                  <td className="font-mono text-xs tabular-nums">{usd(entry.usd)}</td>
                  <td className="text-muted tabular-nums">{entry.share} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-labelledby="by-model" className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h2 id="by-model" className="mb-3 text-xs font-semibold text-muted">
            Par modèle
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {report.byModel.map((entry) => (
              <li key={entry.model ?? ''} className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate">{modelName(entry.model)}</span>
                <span className="text-xs text-muted tabular-nums">{entry.share} %</span>
                <span className="font-mono text-xs tabular-nums">{usd(entry.usd)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
