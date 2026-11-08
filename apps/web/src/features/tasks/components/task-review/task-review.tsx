'use client';
import { ChevronRight, Copy } from 'lucide-react';
import Link from 'next/link';
import type { TaskChangesDto, TaskDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { usd } from '../../lib/tasks';
import { DiffView } from '../diff-view';
import { TaskStateBadge } from '../task-state-badge';

export interface TaskReviewProps {
  busy: boolean;
  changes: TaskChangesDto | undefined;
  /** Tâches qui attendent celle-ci : la validation les débloque (règle 3) */
  followers: TaskDto[];
  onCopy: (text: string) => void;
  onReject: () => void;
  onValidate: () => void;
  task: TaskDto;
}

function Card({ children, id, title }: { children: React.ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id={id} className="mb-2 text-xs font-semibold text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Revue d'une tâche à relire (E7a) : la consigne et le compte rendu de l'agent côte à côte, les fichiers modifiés et
 * le diff, puis ce que la tâche a consommé et ce que la validation débloque. Bosco ne fusionne jamais.
 */
export function TaskReview({ busy, changes, followers, onCopy, onReject, onValidate, task }: TaskReviewProps) {
  const merge =
    task.outcome.branch && task.outcome.from
      ? `git switch ${task.outcome.from} && git merge ${task.outcome.branch}`
      : null;
  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <nav aria-label="Fil d’Ariane" className="flex items-center gap-1 text-xs text-muted">
            <Link href="/tasks" className="link link-hover">
              Tâches
            </Link>
            <ChevronRight aria-hidden className="size-3" />
            T-{task.id}
          </nav>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold md:text-2xl">
            <TaskStateBadge state={task.state} />
            {task.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs text-muted">
            <span>
              {task.repository.name}
              {task.folder ? ` · ${task.folder}` : ''} · {task.mode === 'worker' ? 'Worker' : 'Ma session'}
            </span>
            {task.outcome.sessionId && (
              <Link href={`/sessions/${task.outcome.sessionId}`} className="link font-sans">
                Voir la session
              </Link>
            )}
          </p>
        </div>
        <div className="fixed inset-x-0 bottom-16 z-10 flex gap-2 border-t border-line bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
          <Button variant="outline" className="flex-1 md:flex-none" disabled={busy} onClick={onReject}>
            Rejeter
          </Button>
          <Button className="flex-1 md:flex-none" disabled={busy} onClick={onValidate}>
            Valider
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card id="review-instruction" title="Consigne">
              <p className="line-clamp-6 whitespace-pre-line">{task.instruction}</p>
            </Card>
            <Card id="review-report" title="Compte rendu de l’agent">
              <p className="whitespace-pre-line">{task.outcome.report ?? 'L’agent n’a pas laissé de compte rendu.'}</p>
            </Card>
          </div>
          <Card id="review-changes" title="Modifications">
            {task.mode === 'session' && (
              <p className="text-muted">
                Travail fait par ta session, directement dans le dépôt : relis-le avec git ou ton éditeur.
              </p>
            )}
            {task.mode === 'worker' &&
              (changes ? <DiffView changes={changes} /> : <p className="text-muted">Lecture du diff…</p>)}
          </Card>
        </div>
        <aside className="flex flex-col gap-4">
          {task.mode === 'worker' && (
            <Card id="review-usage" title="Consommation">
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Budget</dt>
                  <dd>
                    {usd(task.spentUsd)} / {usd(task.guardrails.budgetUsd)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tours</dt>
                  <dd>
                    {task.outcome.turns} / {task.guardrails.maxTurns}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted">Coût estimé au tarif public.</p>
            </Card>
          )}
          <Card id="review-after" title="Après">
            {followers.length === 0 ? (
              <p className="text-sm text-muted">Aucune tâche n’attend celle-ci.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {followers.map((follower) => (
                  <li key={follower.id}>
                    <Link href={`/tasks/${follower.id}`} className="link font-mono">
                      T-{follower.id}
                    </Link>{' '}
                    {follower.waitingFor.every((prerequisite) => prerequisite.id === task.id)
                      ? 'partira à la validation'
                      : 'attend encore d’autres tâches'}
                  </li>
                ))}
              </ul>
            )}
            {merge && (
              <div className="mt-3 flex flex-col gap-1">
                <p className="text-xs text-muted">Bosco ne fusionne jamais. Pour fusionner toi-même :</p>
                <div className="flex items-center gap-2">
                  <code
                    title={merge}
                    className="min-w-0 flex-1 truncate rounded-control bg-surface-alt px-2 py-1 font-mono text-xs"
                  >
                    {merge}
                  </code>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Copier la commande de fusion"
                    onClick={() => onCopy(merge)}
                  >
                    <Copy aria-hidden className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
