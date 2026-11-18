import type { UsageReportDto } from '@bosco/domain';
import { modelName } from '@/shared/lib/session-settings';
import { formatPercent, formatTokens, formatUsd } from '../../lib/format';

/**
 * Tokens de la période : les quatre sortes, la réutilisation du cache (lecture du cache / (entrée + lecture du
 * cache)), les tours sans lecture du cache, sessions et tours, et le coût estimé au tarif public de l'API. Les
 * sous-agents des sessions comptent dans les tokens et le coût, leur part est dite sous le coût. Un modèle sans tarif
 * connu est exclu du coût et signalé sous le chiffre.
 */
export function TokenTiles({ tokens }: { tokens: UsageReportDto['tokens'] }) {
  const subagents = tokens.subagents.costUsd > 0 ? `dont ${formatUsd(tokens.subagents.costUsd)} de sous-agents` : null;
  const tiles: { label: string; notes?: string[]; value: string }[] = [
    { label: 'Entrée', value: formatTokens(tokens.input) },
    { label: 'Sortie', value: formatTokens(tokens.output) },
    { label: 'Lecture du cache', value: formatTokens(tokens.cacheRead) },
    { label: 'Écriture en cache', value: formatTokens(tokens.cacheCreation) },
    { label: 'Réutilisation du cache', value: formatPercent(tokens.cacheReuse) },
    { label: 'Tours sans lecture du cache', value: formatPercent(tokens.turnsWithoutCacheRead) },
    {
      label: 'Sessions / tours',
      value: `${tokens.sessions} / ${new Intl.NumberFormat('fr').format(tokens.turns)}`,
    },
    {
      label: 'Coût estimé',
      value: formatUsd(tokens.costUsd),
      notes: [
        ...(subagents ? [subagents] : []),
        tokens.unpricedModels.length > 0
          ? `hors ${tokens.unpricedModels.map(modelName).join(', ')}, non chiffré`
          : 'au tarif public de l’API, estimé',
      ],
    },
  ];
  return (
    <section aria-labelledby="usage-tokens" className="flex flex-col gap-2">
      <h2 id="usage-tokens" className="text-sm font-semibold">
        Tokens
      </h2>
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {tiles.map(({ label, notes = [], value }) => (
          <div key={label} className="flex flex-col rounded-card border border-line bg-surface p-3 shadow-card">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="flex flex-col">
              <span className="font-display text-xl font-semibold tabular-nums">{value}</span>
              {notes.map((note) => (
                <span key={note} className="text-xs text-muted">
                  {note}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">Réutilisation du cache = lecture du cache / (entrée + lecture du cache).</p>
    </section>
  );
}
