'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { checkWorker, workerQuery } from '../../api/tasks';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { useLiveTasks } from '../../hooks/use-live-tasks';
import { chainOf, sortTasks, tabOf, type TaskTab } from '../../lib/tasks';
import { TaskChain } from '../task-chain';
import { TaskList } from '../task-list';
import { TasksEmpty } from '../tasks-empty';
import { WorkerBanner } from '../worker-banner';

const TABS: { label: string; value: TaskTab }[] = [
  { label: 'Actives', value: 'active' },
  { label: 'Terminées', value: 'finished' },
  { label: 'Échecs', value: 'failed' },
];

/**
 * Indicateur du worker (E5b) : quand un agent travaille, il ouvre le panneau des conteneurs sur le poste, et leur écran
 * sur le téléphone (CA-TACH-76).
 */
function WorkerIndicator({ running, text, unavailable }: { running: number; text: string; unavailable: boolean }) {
  const openPanel = useContainersPanel((state) => state.setOpen);
  const content = (
    <>
      <span aria-hidden className={cn('size-2 rounded-full', unavailable ? 'bg-danger' : 'bg-success')} />
      Worker : {text}
    </>
  );
  if (running === 0 && !unavailable) return <p className="flex items-center gap-1.5 text-xs text-muted">{content}</p>;
  return (
    <>
      <button
        type="button"
        className="hidden items-center gap-1.5 text-xs text-muted hover:text-ink md:flex"
        onClick={() => openPanel(true)}
      >
        {content}
      </button>
      <Link href="/tasks/containers" className="flex items-center gap-1.5 text-xs text-muted md:hidden">
        {content}
      </Link>
    </>
  );
}

/** File de tâches (E5a, E5b) : tout le travail préparé pour Claude Code, du plus urgent au plus lointain. */
export function TasksScreen({ title }: { title: string }) {
  const tasks = useLiveTasks();
  const client = useQueryClient();
  const { data: worker } = useQuery(workerQuery);
  const retry = useMutation({
    mutationFn: checkWorker,
    onSuccess: (status) => client.setQueryData(workerQuery.queryKey, status),
  });
  const [tab, setTab] = useState<TaskTab>('active');
  const [repository, setRepository] = useState('');
  const [mode, setMode] = useState('');
  const [hovered, setHovered] = useState<null | number>(null);
  const filtered = useMemo(
    () =>
      (tasks ?? []).filter(
        (task) => (!repository || task.repository.name === repository) && (!mode || task.mode === mode),
      ),
    [mode, repository, tasks],
  );
  const chain = useMemo(() => chainOf(filtered), [filtered]);
  if (!tasks) return <PageSkeleton variant="list" rows={5} />;
  const running = worker?.running ?? tasks.filter((task) => task.state === 'running' && task.mode === 'worker').length;
  const shown = sortTasks(filtered.filter((task) => tabOf(task) === tab));
  const repositories = [...new Set(tasks.map((task) => task.repository.name))].toSorted((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <WorkerIndicator
            running={running}
            text={worker?.unavailable ? 'indisponible' : `${running} / ${worker?.capacity ?? 4} agents au travail`}
            unavailable={Boolean(worker?.unavailable)}
          />
          <h1 className="mt-1 hidden font-display text-2xl font-semibold tracking-tight md:block">{title}</h1>
        </div>
        <Link href="/tasks/rights" className="link text-xs text-muted md:ml-auto">
          Droits des agents
        </Link>
        {tasks.length > 0 && (
          <Button asChild>
            <Link href="/tasks/new">
              <Plus aria-hidden className="size-4" />
              Nouvelle tâche
            </Link>
          </Button>
        )}
      </div>
      {worker?.unavailable && (
        <WorkerBanner reason={worker.unavailable} busy={retry.isPending} onRetry={() => retry.mutate()} />
      )}
      {tasks.length === 0 ? (
        <TasksEmpty />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Tâches" className="tabs tabs-box tabs-sm">
              {TABS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={cn('tab', tab === value ? 'tab-active' : 'text-muted opacity-100')}
                  onClick={() => setTab(value)}
                >
                  {label} {filtered.filter((task) => tabOf(task) === value).length}
                </button>
              ))}
            </div>
            <select
              aria-label="Dépôt"
              className="select w-auto select-sm"
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
            >
              <option value="">Dépôt : tous</option>
              {repositories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="Mode"
              className="select w-auto select-sm"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value="">Mode : tous</option>
              <option value="worker">Worker</option>
              <option value="session">Ma session</option>
            </select>
          </div>
          {/* L'enchaînement prend deux cinquièmes : assez pour lire ses tâches sans zoomer */}
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <TaskList tasks={shown} waiting={worker?.waiting ?? {}} onHover={setHovered} />
            </div>
            <TaskChain tasks={chain} highlighted={hovered} />
          </div>
        </>
      )}
    </div>
  );
}
