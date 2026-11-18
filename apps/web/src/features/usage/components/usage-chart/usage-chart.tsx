'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { UsageDayDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { axisOf, labeledDays, segmentsOf, SERIES, totalOf, type UsageMeasure, valueOf } from '../../lib/chart';
import { dayLabel, formatAxisTokens, formatAxisUsd, formatTokens, formatUsd } from '../../lib/format';

export interface UsageChartProps {
  days: UsageDayDto[];
  measure: UsageMeasure;
  /** Aujourd'hui (AAAA-MM-JJ) : sa barre est « en cours » */
  today: string;
  /** Sur le téléphone : une barre lisible par jour, sans la ligne des mois */
  compact?: boolean;
}

/** Couleur de chaque série par son token, dans l'ordre fixe : jamais selon le rang. */
const FILL = { 1: 'fill-series-1', 2: 'fill-series-2', 3: 'fill-series-3', 4: 'fill-series-4' } as const;
const SWATCH = { 1: 'bg-series-1', 2: 'bg-series-2', 3: 'bg-series-3', 4: 'bg-series-4' } as const;

const MONTH = new Intl.DateTimeFormat('fr', { month: 'short' });

/** Légende, toujours affichée : la couleur de chaque série et son nom, en couleur de texte. */
export function UsageLegend() {
  return (
    <ul aria-label="Légende" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {SERIES.map(({ color, key, label }) => (
        <li key={key} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2.5 rounded-sm', SWATCH[color])} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function format(value: number, measure: UsageMeasure): string {
  return measure === 'tokens' ? formatTokens(value) : formatUsd(value);
}

/** Ce que dit une barre : le jour, ses quatre séries, le total et le coût estimé. */
function describe(day: UsageDayDto, measure: UsageMeasure, today: string): string {
  const series = SERIES.map(({ key, label }) => `${label} ${format(valueOf(day, key, measure), measure)}`).join(', ');
  const current = day.date === today ? ', en cours' : '';
  return `${dayLabel(day.date)}${current} : ${series}, total ${formatTokens(totalOf(day, 'tokens'))}, coût estimé ${formatUsd(totalOf(day, 'cost'))}`;
}

function Tooltip({ day, id, left, today }: { day: UsageDayDto; id: string; left: number; today: string }) {
  return (
    <div
      id={id}
      role="tooltip"
      className="pointer-events-none absolute top-1 z-10 w-56 -translate-x-1/2 rounded-card border border-line bg-surface p-3 text-xs shadow-card"
      style={{ left: `${Math.min(85, Math.max(15, left))}%` }}
    >
      <p className="mb-1.5 font-semibold text-ink">
        {dayLabel(day.date)}
        {day.date === today && <span className="font-normal text-muted"> · en cours</span>}
      </p>
      {SERIES.map(({ color, key, label }) => (
        <p key={key} className="flex items-center gap-2 text-muted">
          <span aria-hidden className={cn('size-2 rounded-sm', SWATCH[color])} />
          <span className="flex-1">{label}</span>
          <span className="font-mono text-ink tabular-nums">{formatTokens(day.tokens[key])}</span>
        </p>
      ))}
      <p className="mt-1.5 flex border-t border-line pt-1.5 text-muted">
        <span className="flex-1">Total</span>
        <span className="font-mono text-ink tabular-nums">{formatTokens(totalOf(day, 'tokens'))}</span>
      </p>
      <p className="flex text-muted">
        <span className="flex-1">Coût estimé</span>
        <span className="font-mono text-ink tabular-nums">{formatUsd(totalOf(day, 'cost'))}</span>
      </p>
    </div>
  );
}

/**
 * Utilisation quotidienne : une barre par jour, les quatre séries empilées dans un ordre fixe (lecture du cache
 * en bas, entrée en haut), 2 px entre deux segments, un seul axe, gradué en tokens ou en dollars. Le total ne s'inscrit
 * que sur le pic et sur le dernier jour. Au survol ou au focus d'un jour, les autres s'estompent et une info-bulle
 * détaille ses séries ; chaque jour est un bouton nommé pour le clavier et les lecteurs d'écran.
 */
export function UsageChart({ compact = false, days, measure, today }: UsageChartProps) {
  const [active, setActive] = useState<null | number>(null);
  const tooltip = useId();
  // Le dessin prend la largeur réelle du cadre : les textes gardent leur taille, quelle que soit la largeur
  const frame = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<null | number>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setMeasured(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const width = measured ?? (compact ? 360 : 720);
  const height = compact ? 150 : 250;
  const left = compact ? 40 : 52;
  const top = 34;
  const bottom = compact ? 20 : 34;
  const plot = height - top - bottom;
  const axis = axisOf(Math.max(0, ...days.map((day) => totalOf(day, measure))));
  const scale = plot / axis.max;
  const slot = (width - left - 4) / Math.max(1, days.length);
  const bar = Math.min(compact ? 28 : 18, slot * 0.62);
  const xOf = (index: number) => left + slot * index + slot / 2;
  const labeled = labeledDays(days, measure);
  const tickLabel = measure === 'tokens' ? formatAxisTokens : formatAxisUsd;
  const shownDay = (index: number) => compact || index % 5 === 0 || index === days.length - 1;
  const monthStarts = days.flatMap((day, index) => (index === 0 || day.date.endsWith('-01') ? [index] : []));
  const activeDay = active === null ? null : days[active];
  return (
    <div ref={frame} className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden>
        {axis.ticks.map((tick) => {
          const y = top + plot - tick * scale;
          return (
            <g key={tick}>
              <line x1={left} x2={width} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
              <text x={left - 6} y={y + 3} textAnchor="end" className="fill-muted font-mono text-xs">
                {tickLabel(tick)}
              </text>
            </g>
          );
        })}
        {days.map((day, index) => {
          const x = xOf(index);
          const segments = segmentsOf(day, measure, scale);
          const last = segments.at(-1);
          const stackTop = top + plot - (last ? last.offset + last.height : 0);
          return (
            <g key={day.date} opacity={active === null || active === index ? 1 : 0.35}>
              {segments.map(({ color, height: size, key, offset }) => (
                <rect
                  key={key}
                  x={x - bar / 2}
                  y={top + plot - offset - size}
                  width={bar}
                  height={size}
                  rx={Math.min(2, size / 2)}
                  className={FILL[color]}
                />
              ))}
              {labeled.has(index) && (
                <text
                  x={index === days.length - 1 ? x + bar / 2 : x}
                  y={stackTop - (day.date === today ? 18 : 5)}
                  textAnchor={index === days.length - 1 ? 'end' : 'middle'}
                  className="fill-ink font-mono text-xs"
                >
                  {format(totalOf(day, measure), measure)}
                  {day.date === today && (
                    <tspan x={index === days.length - 1 ? x + bar / 2 : x} dy={13} className="fill-muted font-sans">
                      en cours
                    </tspan>
                  )}
                </text>
              )}
              {shownDay(index) && (
                <text x={x} y={top + plot + 14} textAnchor="middle" className="fill-muted font-mono text-xs">
                  {Number(day.date.slice(8))}
                </text>
              )}
            </g>
          );
        })}
        {!compact &&
          monthStarts.map((index) => (
            <text key={index} x={xOf(index) - slot / 2} y={height - 4} className="fill-muted text-xs">
              {MONTH.format(new Date(`${days[index]?.date ?? ''}T12:00:00`))}
            </text>
          ))}
      </svg>
      <div className="absolute inset-0">
        {days.map((day, index) => (
          <button
            key={day.date}
            type="button"
            aria-label={describe(day, measure, today)}
            aria-describedby={active === index ? tooltip : undefined}
            className="absolute rounded-control focus-ring"
            style={{
              left: `${((xOf(index) - slot / 2) / width) * 100}%`,
              width: `${(slot / width) * 100}%`,
              top: `${(top / height) * 100}%`,
              height: `${(plot / height) * 100}%`,
            }}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(active === index ? null : index)}
          />
        ))}
      </div>
      {activeDay && active !== null && (
        <Tooltip day={activeDay} id={tooltip} left={(xOf(active) / width) * 100} today={today} />
      )}
    </div>
  );
}

/** Vue en tableau du graphique : les mêmes données, une ligne par jour, accessible sans la couleur. */
export function UsageTable({ days, today }: { days: UsageDayDto[]; today: string }) {
  return (
    <div className="max-h-96 overflow-auto rounded-card border border-line">
      <table className="table table-sm">
        <caption className="sr-only">Utilisation quotidienne, une ligne par jour</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col">Jour</th>
            {SERIES.map(({ key, label }) => (
              <th key={key} scope="col" className="text-right">
                {label}
              </th>
            ))}
            <th scope="col" className="text-right">
              Total
            </th>
            <th scope="col" className="text-right">
              Coût estimé
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {days.toReversed().map((day) => (
            <tr key={day.date}>
              <th scope="row" className="font-sans font-normal">
                {dayLabel(day.date)}
                {day.date === today && <span className="text-muted"> · en cours</span>}
              </th>
              {SERIES.map(({ key }) => (
                <td key={key} className="text-right">
                  {formatTokens(day.tokens[key])}
                </td>
              ))}
              <td className="text-right">{formatTokens(totalOf(day, 'tokens'))}</td>
              <td className="text-right">{formatUsd(totalOf(day, 'cost'))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
