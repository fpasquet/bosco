'use client';
import { Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ArchitectureDto, ContextDto, DecisionDto, GroupInstructionsDto } from '@bosco/domain';
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

function DecisionRow({ decision }: { decision: DecisionDto }) {
  const state = DECISION_STATES[decision.state];
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <Link href={`/context/decisions/${decision.id}`} className="min-w-0 flex-1 link-hover">
        <span className="font-mono text-xs text-muted">DEC-{decision.id}</span> {titleOf(decision)}
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

/** Une consigne par ligne non vide ; une consigne répétée garde une clé à elle. */
function linesOf(instructions: string): { key: string; line: string }[] {
  const seen = new Map<string, number>();
  return instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const count = (seen.get(line) ?? 0) + 1;
      seen.set(line, count);
      return { key: `${line}#${count}`, line };
    });
}

const groupsLabel = (count: number) => (count > 1 ? `${count} groupes` : `${count} groupe`);

/** Instructions d'un groupe du projet : elles se lisent ici et s'écrivent dans le groupe. */
function GroupInstructions({ group }: { group: GroupInstructionsDto }) {
  const lines = linesOf(group.instructions);
  return (
    <div className="px-4 py-2.5">
      <p className="flex items-center gap-2 font-medium">
        {group.name}
        <span className="text-xs font-normal text-muted">
          {lines.length > 1 ? `${lines.length} lignes` : `${lines.length} ligne`}
        </span>
        <Link
          href={`/groups/${group.id}/instructions`}
          className="ml-auto hidden link text-xs font-normal md:inline"
          aria-label={`Modifier les instructions de ${group.name}`}
        >
          Modifier
        </Link>
      </p>
      {lines.length === 0 ? (
        <p className="mt-1 text-sm text-muted">Aucune instruction.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1 text-sm">
          {lines.map(({ key, line }) => (
            <li key={key}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Contexte d'un projet : tout ce que reçoit un agent au lancement, instructions de « Tous les projets » et de ses
 * groupes, décisions acceptées du projet, qui l'emportent, et place dans l'architecture. Les décisions proposées par un
 * agent attendent ta validation.
 */
export function ContextOverview({ busy, context, onPreview, onSaveArchitecture }: ContextOverviewProps) {
  const [editing, setEditing] = useState(false);
  const { architecture, project } = context;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link href={`/context/decisions/new?project=${encodeURIComponent(project)}`}>
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
        <Card id="context-decisions" title={`Décisions de ${project} · ${context.decisions.length} acceptées`}>
          {context.decisions.length === 0 ? (
            <p className="px-4 py-3 text-muted">Aucune décision acceptée pour ce projet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {context.decisions.map((decision) => (
                <DecisionRow key={decision.id} decision={decision} />
              ))}
            </ul>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card id="context-groups" title={`Instructions des groupes · ${groupsLabel(context.groups.length)}`}>
            <div className="flex flex-col divide-y divide-line">
              {context.groups.map((group) => (
                <GroupInstructions key={group.id} group={group} />
              ))}
            </div>
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
        {context.decisions.length} acceptées · {context.proposed.length} proposées · elles l’emportent sur les
        instructions des groupes
      </p>
      <p className="text-xs text-muted md:hidden">Une nouvelle décision se crée depuis le poste.</p>
    </div>
  );
}
