'use client';
import { CircleCheck, CircleX, Network } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import type { TestEnvironmentDto, TestServicesModeDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import type { EnvironmentChanges } from '../../api/test-environment';
import { gigabytes, refusalTime } from '../../lib/isolation';

export interface TestEnvironmentProps {
  busy: boolean;
  environment: TestEnvironmentDto;
  /** Refus de l'API pour l'image saisie, affiché sous le champ */
  error: null | string;
  now: Date;
  onChange: (changes: EnvironmentChanges) => void;
}

const MODES: { label: string; value: TestServicesModeDto }[] = [
  { value: 'auto', label: 'Automatique' },
  { value: 'choose', label: 'Choisir' },
  { value: 'none', label: 'Aucun' },
];

function Card({ children, id, title }: { children: React.ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <h2 id={id} className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Environnement de test d'un dépôt (E12a) : les services lancés autour de l'agent, lus dans le fichier des services
 * de test à la branche de départ, ce qui est écarté et pourquoi, l'image de l'agent et le dernier lancement.
 */
export function TestEnvironment({ busy, environment, error, now, onChange }: TestEnvironmentProps) {
  const { handleSubmit, register } = useForm({ defaultValues: { image: environment.image ?? '' } });
  const { limits } = environment;
  const perService = `${gigabytes(limits.memory)} · ${limits.cpus} processeur${limits.cpus > 1 ? 's' : ''}`;
  // En « Choisir », les services non cochés se cochent ; les autres écartés restent écartés
  const choosable = environment.services.filter(
    (service) =>
      !environment.excluded.some((excluded) => excluded.name === service.name && excluded.reason !== 'non coché'),
  );
  const excluded = environment.excluded.filter(
    (entry) => environment.mode !== 'choose' || entry.reason !== 'non coché',
  );
  const toggle = (name: string, checked: boolean) =>
    onChange({
      mode: 'choose',
      selected: checked
        ? [...environment.selected, name]
        : environment.selected.filter((selected) => selected !== name),
    });
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-4 md:col-span-2">
        <Card id="environment-services" title="Services de test">
          <div className="flex flex-col gap-4 px-4 py-3">
            <p className="text-muted">
              {environment.file ? (
                <>
                  Source : <span className="font-mono text-ink">{environment.file}</span> du dépôt, lu sur{' '}
                  <span className="font-mono text-ink">{environment.branch}</span>
                </>
              ) : (
                <>Aucun fichier des services de test{environment.branch ? ` sur ${environment.branch}` : ''}.</>
              )}
            </p>
            <fieldset className="hidden md:block">
              <legend className="sr-only">Services lancés</legend>
              <div className="join">
                {MODES.map(({ label, value }) => (
                  <input
                    key={value}
                    type="radio"
                    name="environment-mode"
                    className="btn join-item btn-sm"
                    aria-label={label}
                    checked={environment.mode === value}
                    disabled={busy}
                    onChange={() => onChange({ mode: value })}
                  />
                ))}
              </div>
            </fieldset>
            <p className="text-xs text-muted md:hidden">
              Sélection : {MODES.find(({ value }) => value === environment.mode)?.label}
            </p>
            {environment.mode === 'none' && (
              <p className="text-muted">Aucun service de test n’est lancé pour ce dépôt.</p>
            )}
            {environment.mode === 'choose' && (
              <ul aria-label="Services à lancer" className="flex flex-col gap-2">
                {choosable.map((service) => (
                  <li key={service.name}>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={environment.selected.includes(service.name)}
                        disabled={busy}
                        onChange={(event) => toggle(service.name, event.target.checked)}
                      />
                      <span className="font-medium">{service.name}</span>
                      <span className="font-mono text-xs text-muted">{service.image}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {environment.mode === 'auto' && (
              <div>
                <h3 className="text-xs font-semibold">Lancés</h3>
                {environment.launched.length === 0 ? (
                  <p className="mt-1 text-muted">Aucun service avec une image dans le fichier.</p>
                ) : (
                  <ul aria-label="Services lancés" className="mt-1 divide-y divide-line">
                    {environment.launched.map((service) => (
                      <li key={service.name} className="flex flex-wrap items-center gap-3 py-2">
                        <span className="font-medium">{service.name}</span>
                        <span className="font-mono text-xs text-muted">{service.image}</span>
                        <span className="ml-auto text-xs text-muted">{perService}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {environment.mode !== 'none' && excluded.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold">Écartés</h3>
                <ul aria-label="Services écartés" className="mt-1 flex flex-col gap-1">
                  {excluded.map((entry) => (
                    <li key={entry.name}>
                      <span className="font-medium">{entry.name}</span>{' '}
                      <span className="text-muted">· {entry.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {environment.mode !== 'none' && environment.removed.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold">Options retirées</h3>
                <ul aria-label="Options retirées" className="mt-1 flex flex-wrap gap-1.5">
                  {environment.removed.map((option) => (
                    <li key={option} className="badge badge-ghost">
                      {option}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-muted">Rien n’est publié sur le poste, les données sont jetables.</p>
              </div>
            )}
            <p className="flex items-start gap-2 text-xs text-muted">
              <Network aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Les services tournent sur un réseau privé sans Internet ; l’agent les joint par leur nom.
            </p>
          </div>
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <Card id="environment-image" title="Image de l’agent">
          <div className="flex flex-col gap-1 px-4 py-3">
            <p className="md:hidden">
              <span className="font-mono">{environment.image ?? environment.defaultImage}</span>
              {!environment.image && ' (par défaut)'}
            </p>
            <form
              className="hidden flex-col gap-1 md:flex"
              onSubmit={(event) => void handleSubmit(({ image }) => onChange({ image: image.trim() || null }))(event)}
            >
              <label htmlFor="environment-image-name" className="text-xs font-medium">
                Image
              </label>
              <div className="flex gap-2">
                <input
                  id="environment-image-name"
                  className="input flex-1 font-mono input-sm"
                  placeholder={`${environment.defaultImage} (par défaut)`}
                  aria-describedby="environment-image-hint"
                  aria-invalid={error ? true : undefined}
                  {...register('image')}
                />
                <Button type="submit" size="sm" variant="outline" disabled={busy}>
                  Enregistrer
                </Button>
              </div>
            </form>
            <p id="environment-image-hint" className={error ? 'text-xs text-danger' : 'text-xs text-muted'}>
              {error ?? 'Pour un dépôt PHP, une image avec PHP et Composer.'}
            </p>
          </div>
        </Card>
        <Card id="environment-limits" title="Limites">
          <dl className="divide-y divide-line">
            <div className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted">Par service</dt>
              <dd className="font-medium">{perService}</dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted">Attente au plus</dt>
              <dd className="font-medium">{limits.waitSeconds} s</dd>
            </div>
          </dl>
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            En cas d’échec, la tâche continue sans services et l’agent est prévenu.
          </p>
        </Card>
        <Card id="environment-last-run" title="Dernier lancement">
          {environment.lastRun ? (
            <div className="flex flex-col gap-2 px-4 py-3">
              <p className="text-xs text-muted">
                <Link href={`/tasks/${environment.lastRun.taskId}`} className="link font-mono">
                  T-{environment.lastRun.taskId}
                </Link>{' '}
                · {refusalTime(environment.lastRun.at, now)}
              </p>
              <ul className="flex flex-col gap-1">
                {environment.lastRun.launches.map((launch) => (
                  <li key={launch.name} className="flex items-center gap-2">
                    {launch.error ? (
                      <CircleX aria-hidden className="size-3.5 text-danger" />
                    ) : (
                      <CircleCheck aria-hidden className="size-3.5 text-success" />
                    )}
                    <span className="font-medium">{launch.name}</span>
                    <span className="text-muted">{launch.error ?? `prêt en ${launch.readySeconds ?? 0} s`}</span>
                  </li>
                ))}
              </ul>
              {environment.lastRun.removedAt && (
                <p className="text-xs text-muted">Supprimés {refusalTime(environment.lastRun.removedAt, now)}</p>
              )}
            </div>
          ) : (
            <p className="px-4 py-3 text-muted">Aucune tâche n’a encore lancé de services pour ce dépôt.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
