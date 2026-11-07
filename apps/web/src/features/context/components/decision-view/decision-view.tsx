'use client';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { DecisionDetailDto, DecisionDto, DecisionTextDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { dateOf, DECISION_STATES, titleOf } from '../../lib/decisions';
import { DecisionForm } from '../decision-form';

export interface DecisionViewProps {
  busy: boolean;
  detail: DecisionDetailDto;
  now: Date;
  onAbandon: (reason: null | string) => void;
  onAccept: (edited: DecisionTextDto | null) => void;
  onRefuse: (reason: null | string) => void;
  /** Retour au contexte : le dépôt, ou la liste des socles */
  parent: { href: string; label: string };
  targetLabel: string;
}

const SECTIONS: { key: keyof DecisionTextDto; label: string }[] = [
  { key: 'context', label: 'Contexte' },
  { key: 'decision', label: 'Décision' },
  { key: 'consequences', label: 'Conséquences' },
  { key: 'alternatives', label: 'Alternatives écartées' },
];

function ReasonForm({
  action,
  label,
  onCancel,
  onSubmit,
}: {
  action: string;
  label: string;
  onCancel: () => void;
  onSubmit: (reason: null | string) => void;
}) {
  const { handleSubmit, register } = useForm({ defaultValues: { reason: '' } });
  return (
    <form
      className="flex flex-col gap-2 rounded-card border border-line bg-surface-alt p-3"
      onSubmit={(event) => void handleSubmit(({ reason }) => onSubmit(reason.trim() || null))(event)}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">{label}</span>
        <textarea className="textarea w-full" rows={2} {...register('reason')} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive">
          {action}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function Relation({ decision, label }: { decision: DecisionDto; label: string }) {
  return (
    <li>
      <Link href={`/context/decisions/${decision.id}`} className="link font-mono text-xs">
        DEC-{decision.id}
      </Link>{' '}
      <span className="text-sm">{label}</span>
    </li>
  );
}

/**
 * Une décision (E9b, E9d) : proposée par un agent, elle attend que tu l'acceptes, la modifies ou la refuses ; acceptée,
 * elle se lit avec ses versions et ses liens, et se modifie, se remplace ou s'abandonne sans rien perdre.
 */
export function DecisionView({
  busy,
  detail,
  now,
  onAbandon,
  onAccept,
  onRefuse,
  parent,
  targetLabel,
}: DecisionViewProps) {
  const { decision, replacedBy, specifiedBy } = detail;
  const [shown, setShown] = useState(decision.versions.length - 1);
  const [panel, setPanel] = useState<'abandon' | 'edit' | 'refuse' | null>(null);
  const version = decision.versions[shown] ?? decision.versions.at(-1)!;
  const state = DECISION_STATES[decision.state];
  const proposed = decision.state === 'proposed';
  const target =
    decision.target.kind === 'repository'
      ? `repository=${encodeURIComponent(decision.target.name)}`
      : `socle=${decision.target.id}`;
  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0">
      <header>
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-1 text-xs text-muted">
          <Link href={parent.href} className="link link-hover">
            {parent.label}
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          DEC-{decision.id}
        </nav>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold md:text-2xl">
          <span className={cn('badge', state.badge)}>{state.label}</span>
          DEC-{decision.id} · {titleOf(decision)}
        </h1>
        <p className="mt-1 text-xs text-muted">
          {proposed
            ? `Proposée par ${version.author} · ${dateOf(version.at, now)} · ${targetLabel}`
            : `Version ${shown + 1} · ${dateOf(version.at, now)} · ${version.author} · ${targetLabel}`}
        </p>
      </header>
      {decision.reason && (
        <p role="status" className="rounded-card border border-line bg-surface-alt px-4 py-3">
          Motif : {decision.reason}
        </p>
      )}
      {replacedBy && (
        <p className="rounded-card border border-line bg-surface-alt px-4 py-3">
          Remplacée par{' '}
          <Link href={`/context/decisions/${replacedBy.id}`} className="link">
            DEC-{replacedBy.id} · {titleOf(replacedBy)}
          </Link>
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
          {panel === 'edit' ? (
            <section className="rounded-card border border-line bg-surface p-4 shadow-card">
              <DecisionForm
                mode="review"
                initial={decision.versions.at(-1)!}
                targetLabel={targetLabel}
                exceptionChoices={[]}
                busy={busy}
                serverError={null}
                onCancel={() => setPanel(null)}
                onSubmit={({ text }) => onAccept(text)}
              />
            </section>
          ) : (
            <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              {SECTIONS.map(({ key, label }) =>
                version[key] ? (
                  <section key={key}>
                    <h2 className="text-xs font-semibold text-muted">{label}</h2>
                    <p className="mt-1 whitespace-pre-line">{version[key]}</p>
                  </section>
                ) : null,
              )}
            </article>
          )}
          {panel === 'refuse' && (
            <ReasonForm
              label="Motif du refus (facultatif, noté dans l’historique)"
              action="Refuser"
              onCancel={() => setPanel(null)}
              onSubmit={onRefuse}
            />
          )}
          {panel === 'abandon' && (
            <ReasonForm
              label="Pourquoi l’abandonner ? (facultatif) La décision n’est plus transmise, elle reste lisible."
              action="Abandonner"
              onCancel={() => setPanel(null)}
              onSubmit={onAbandon}
            />
          )}
        </div>
        <aside className="flex flex-col gap-4">
          {decision.versions.length > 1 && (
            <section
              aria-labelledby="decision-history"
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <h2 id="decision-history" className="mb-2 text-xs font-semibold text-muted">
                Historique
              </h2>
              <ol className="flex flex-col gap-1.5">
                {decision.versions
                  .map((entry, index) => ({ entry, index }))
                  .toReversed()
                  .map(({ entry, index }) => (
                    <li key={index}>
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-control px-2 py-1 text-left text-sm',
                          index === shown && 'bg-primary-soft',
                        )}
                        aria-current={index === shown ? 'true' : undefined}
                        onClick={() => setShown(index)}
                      >
                        <span className="font-medium">Version {index + 1}</span>
                        {index === decision.versions.length - 1 && <span className="text-muted"> · actuelle</span>}
                        <span className="block text-xs text-muted">
                          {dateOf(entry.at, now)} · {entry.author} · « {entry.note} »
                        </span>
                      </button>
                    </li>
                  ))}
              </ol>
            </section>
          )}
          <section
            aria-labelledby="decision-links"
            className="rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <h2 id="decision-links" className="mb-2 text-xs font-semibold text-muted">
              Liée à
            </h2>
            <ul className="flex flex-col gap-1.5">
              {specifiedBy.map((other) => (
                <Relation key={other.id} decision={other} label="la précise" />
              ))}
              {decision.fromTask !== null && (
                <li className="text-sm">
                  <Link href={`/tasks/${decision.fromTask}`} className="link font-mono text-xs">
                    T-{decision.fromTask}
                  </Link>{' '}
                  tâche à l’origine de la proposition
                </li>
              )}
              {specifiedBy.length === 0 && decision.fromTask === null && (
                <li className="text-sm text-muted">Aucun lien.</li>
              )}
            </ul>
          </section>
          {proposed && (
            <p className="text-xs text-muted">
              Si tu l’acceptes, elle est transmise aux prochains agents de {targetLabel}, les tâches pas encore lancées
              comprises.
            </p>
          )}
        </aside>
      </div>
      {proposed && panel === null && (
        <div className="fixed inset-x-0 bottom-16 z-10 flex gap-2 border-t border-line bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
          <Button variant="outline" className="flex-1 md:flex-none" disabled={busy} onClick={() => setPanel('refuse')}>
            Refuser
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" disabled={busy} onClick={() => setPanel('edit')}>
            Modifier avant d’accepter
          </Button>
          <Button className="flex-1 md:flex-none" disabled={busy} onClick={() => onAccept(null)}>
            Accepter
          </Button>
        </div>
      )}
      {decision.state === 'accepted' && panel === null && (
        <div className="hidden flex-wrap gap-2 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href={`/context/decisions/${decision.id}/edit`}>Modifier</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/context/decisions/new?${target}&replaces=${decision.id}`}>Remplacer</Link>
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setPanel('abandon')}>
            Abandonner
          </Button>
        </div>
      )}
      {decision.state === 'accepted' && (
        <p className="text-xs text-muted md:hidden">
          Modifier, remplacer ou abandonner une décision se fait depuis le poste.
        </p>
      )}
    </div>
  );
}
