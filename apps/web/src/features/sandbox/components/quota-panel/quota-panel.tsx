'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { QuotaDto, QuotaScopeDto, QuotaThresholdsDto, QuotaWindowDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const percent = z.number({ error: 'Un pourcentage.' }).int('Un pourcentage entier.').min(1).max(100);
const schema = z.object({
  fiveHour: z.object({ stop: percent, wait: percent }),
  sevenDay: z.object({ stop: percent, wait: percent }),
});

export interface QuotaPanelProps {
  busy: boolean;
  /** Seuils refusés par l'API (attente au-dessus de l'arrêt) */
  error: null | string;
  onScope: (scope: QuotaScopeDto) => void;
  onThresholds: (thresholds: QuotaThresholdsDto) => void;
  quota: QuotaDto;
}

const SCOPES: { label: string; value: QuotaScopeDto }[] = [
  { value: 'sandbox', label: 'Sessions en bac à sable' },
  { value: 'all', label: 'Sessions en bac à sable et pilotées sur le poste' },
];

const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

function Gauge({ label, week, window }: { label: string; week: boolean; window: null | QuotaWindowDto }) {
  const resets = window && (week ? DAY : CLOCK).format(new Date(window.resetsAt));
  const value = window ? `${window.usage} %` : 'pas encore lu';
  const reset = week ? `remise à zéro ${resets ?? ''}` : `remise à zéro à ${resets ?? ''}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs tabular-nums">{window ? `${window.usage} %` : '—'}</span>
      </div>
      <progress
        className="progress w-full progress-primary"
        value={window?.usage ?? 0}
        max={100}
        aria-label={`${label} : ${value}`}
      />
      <span className="text-xs text-muted">{window ? reset : 'lu au premier tour d’une session'}</span>
    </div>
  );
}

function Threshold({ label, name, register }: { label: string; name: string; register: () => object }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-20 text-muted">{label}</span>
      <input type="number" min={1} max={100} className="input w-20 input-sm" aria-label={name} {...register()} />
      <span className="text-muted">%</span>
    </label>
  );
}

/**
 * Quota de l'abonnement (E11, DT-39) : l'usage de la fenêtre de 5 h et de la semaine de chaque abonnement, lu à
 * chaque tour, et les seuils : au-delà de l'attente, aucun tour ne part ; au-delà de l'arrêt, le tour en cours
 * s'arrête. Ils retiennent les sessions en bac à sable, et aussi, au choix, celles pilotées sur le poste.
 */
export function QuotaPanel({ busy, error, onScope, onThresholds, quota }: QuotaPanelProps) {
  const { formState, handleSubmit, register } = useForm<QuotaThresholdsDto>({
    resolver: zodResolver(schema),
    values: quota.thresholds,
  });
  const invalid = Object.keys(formState.errors).length > 0;
  return (
    <section aria-labelledby="quota-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="quota-title" className="font-semibold">
        Quota de l’abonnement
      </h2>
      <div className="mt-3 grid gap-6 md:grid-cols-3">
        {quota.subscriptions.map((subscription) => (
          <div key={subscription.path} className="flex min-w-0 flex-col gap-3">
            <p className="font-medium">Abonnement {subscription.label}</p>
            <Gauge label="Fenêtre de 5 h" week={false} window={subscription.fiveHour} />
            <Gauge label="Semaine" week window={subscription.sevenDay} />
          </div>
        ))}
        <form noValidate className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(onThresholds)(event)}>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Ne plus lancer de tour au-delà de</legend>
            <Threshold
              label="5 h"
              name="Attente, fenêtre de 5 h"
              register={() => register('fiveHour.wait', { valueAsNumber: true })}
            />
            <Threshold
              label="semaine"
              name="Attente, semaine"
              register={() => register('sevenDay.wait', { valueAsNumber: true })}
            />
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Arrêter le tour au-delà de</legend>
            <Threshold
              label="5 h"
              name="Arrêt, fenêtre de 5 h"
              register={() => register('fiveHour.stop', { valueAsNumber: true })}
            />
            <Threshold
              label="semaine"
              name="Arrêt, semaine"
              register={() => register('sevenDay.stop', { valueAsNumber: true })}
            />
          </fieldset>
          {(error || invalid) && (
            <p role="alert" className="text-xs text-danger">
              {error ?? 'Des pourcentages entiers, de 1 à 100.'}
            </p>
          )}
          <Button type="submit" size="sm" variant="outline" className="self-start" disabled={busy}>
            Enregistrer les seuils
          </Button>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Les seuils retiennent</legend>
            {SCOPES.map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="quota-scope"
                  className="radio radio-sm"
                  checked={quota.scope === value}
                  disabled={busy}
                  onChange={() => onScope(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </form>
      </div>
      <p className="mt-3 text-xs text-muted">
        Lu à chaque tour d’une session pilotée de l’abonnement. Les sessions lancées dans un terminal ne sont jamais
        arrêtées par Bosco.
      </p>
    </section>
  );
}
