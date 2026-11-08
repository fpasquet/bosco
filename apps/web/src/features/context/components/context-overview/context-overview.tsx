'use client';
import { Eye, Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ArchitectureDto, ContextDto, DecisionDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { DECISION_STATES, titleOf } from '../../lib/decisions';

export interface ContextOverviewProps {
  busy: boolean;
  context: ContextDto;
  onPreview: () => void;
  onSaveArchitecture: (architecture: ArchitectureDto) => void;
}

function Card({
  action,
  children,
  id,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <h2 id={id} className="text-xs font-semibold text-muted">
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function DecisionRow({ decision, excepted }: { decision: DecisionDto; excepted?: DecisionDto }) {
  const state = DECISION_STATES[decision.state];
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <Link href={`/context/decisions/${decision.id}`} className="min-w-0 flex-1 link-hover">
        <span className="font-mono text-xs text-muted">DEC-{decision.id}</span> {titleOf(decision)}
        {excepted && <span className="block text-xs text-muted">fait exception à « {titleOf(excepted)} »</span>}
      </Link>
      <span className={cn('badge badge-sm', state.badge)}>{state.label}</span>
    </li>
  );
}

const split = (text: string) =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

function ArchitectureForm({
  architecture,
  busy,
  onCancel,
  onSave,
}: {
  architecture: ArchitectureDto;
  busy: boolean;
  onCancel: () => void;
  onSave: (architecture: ArchitectureDto) => void;
}) {
  const { handleSubmit, register } = useForm({
    defaultValues: { calls: architecture.calls.join(', '), calledBy: architecture.calledBy.join(', ') },
  });
  return (
    <form
      className="flex flex-col gap-3 px-4 py-3"
      onSubmit={(event) =>
        void handleSubmit(({ calledBy, calls }) => onSave({ calls: split(calls), calledBy: split(calledBy) }))(event)
      }
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium">Appelle</span>
        <input
          className="input w-full input-sm"
          placeholder="Service de synthèse, Stockage audio"
          {...register('calls')}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium">Appelée par</span>
        <input className="input w-full input-sm" placeholder="veille-presse, site-articles" {...register('calledBy')} />
      </label>
      <p className="text-xs text-muted">Des noms séparés par des virgules.</p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Enregistrer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/**
 * Contexte d'un dépôt (E9a) : tout ce que reçoit un agent au lancement, décisions acceptées du dépôt, socles qui s'y
 * appliquent et place dans l'architecture. Les décisions proposées par un agent attendent ta validation.
 */
export function ContextOverview({ busy, context, onPreview, onSaveArchitecture }: ContextOverviewProps) {
  const [editing, setEditing] = useState(false);
  const { architecture, repository } = context;
  const excludedIds = new Set(context.excluded.map(({ id }) => id));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link href={`/context/decisions/new?repository=${encodeURIComponent(repository)}`}>
            <Plus aria-hidden className="size-4" />
            Nouvelle décision
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye aria-hidden className="size-4" />
          Aperçu du texte transmis
        </Button>
      </div>
      {context.proposed.length > 0 && (
        <section
          aria-labelledby="context-proposed"
          className="flex flex-col gap-2 rounded-card border border-warning bg-warning-soft px-4 py-3"
        >
          <h2 id="context-proposed" className="font-semibold text-warning">
            {context.proposed.length > 1
              ? `${context.proposed.length} décisions proposées par un agent attendent ta validation`
              : '1 décision proposée par un agent attend ta validation'}
          </h2>
          <ul className="flex flex-col gap-1.5">
            {context.proposed.map((decision) => (
              <li key={decision.id} className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-xs">DEC-{decision.id}</span> · {titleOf(decision)}
                </span>
                <Button asChild size="xs" variant="outline">
                  <Link href={`/context/decisions/${decision.id}`} aria-label={`Examiner DEC-${decision.id}`}>
                    Examiner
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card id="context-decisions" title={`Décisions de ${repository} · ${context.decisions.length} acceptées`}>
          {context.decisions.length === 0 ? (
            <p className="px-4 py-3 text-muted">Aucune décision acceptée pour ce dépôt.</p>
          ) : (
            <ul className="divide-y divide-line">
              {context.decisions.map((decision) => (
                <DecisionRow
                  key={decision.id}
                  decision={decision}
                  excepted={context.excluded.find(({ id }) => id === decision.exceptionTo)}
                />
              ))}
            </ul>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card
            id="context-socles"
            title={`Socles appliqués · ${context.socles.length}`}
            action={
              <Link href="/context/socles" className="link text-xs">
                <Layers aria-hidden className="mr-1 inline size-3.5" />
                Gérer les socles
              </Link>
            }
          >
            {context.socles.length === 0 ? (
              <p className="px-4 py-3 text-muted">Aucun socle ne s’applique à ce dépôt.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {context.socles.map(({ decisions: all, socle }) => {
                  const excluded = context.excluded.filter(
                    (decision) => decision.target.kind === 'socle' && decision.target.id === socle.id,
                  );
                  return (
                    <div key={socle.id} className="px-4 py-2.5">
                      <p className="font-medium">
                        {socle.name}{' '}
                        <span className="text-xs font-normal text-muted">
                          {socle.scope === 'global' ? 'global' : 'hérité'} · {all.length + excluded.length}{' '}
                          {all.length + excluded.length > 1 ? 'décisions' : 'décision'}
                        </span>
                      </p>
                      <ul className="mt-1 flex flex-col gap-1 text-sm">
                        {all.map((decision) => (
                          <li key={decision.id}>
                            <Link href={`/context/decisions/${decision.id}`} className="link-hover">
                              {titleOf(decision)}
                            </Link>
                          </li>
                        ))}
                        {excluded.map((decision) => (
                          <li key={decision.id} className="text-muted">
                            <span className="line-through">{titleOf(decision)}</span>{' '}
                            <span className="badge badge-ghost badge-sm">Écartée</span>
                            <span className="block text-xs">
                              remplacée ici par DEC-
                              {context.decisions.find(({ exceptionTo }) => exceptionTo === decision.id)?.id} · non
                              transmise
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <Card
            id="context-architecture"
            title="Place dans l’architecture"
            action={
              !editing && (
                <Button size="xs" variant="ghost" className="hidden md:inline-flex" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              )
            }
          >
            {editing ? (
              <ArchitectureForm
                architecture={architecture}
                busy={busy}
                onCancel={() => setEditing(false)}
                onSave={(next) => {
                  onSaveArchitecture(next);
                  setEditing(false);
                }}
              />
            ) : (
              <dl className="flex flex-col gap-1.5 px-4 py-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Appelle</dt>
                  <dd>{architecture.calls.join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Appelée par</dt>
                  <dd>{architecture.calledBy.join(', ') || '—'}</dd>
                </div>
              </dl>
            )}
          </Card>
        </div>
      </div>
      <p className="text-xs text-muted">
        {context.decisions.length} acceptées · {context.proposed.length} proposées
        {excludedIds.size === 1 && ' · 1 écartée par une exception'}
        {excludedIds.size > 1 && ` · ${excludedIds.size} écartées par une exception`}
      </p>
      <p className="text-xs text-muted md:hidden">Une nouvelle décision se crée depuis le poste.</p>
    </div>
  );
}
