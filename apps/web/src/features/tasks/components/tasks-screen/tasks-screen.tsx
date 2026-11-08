'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { checkWorker, workerQuery } from '../../api/tasks';
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
  if (!tasks) return <PageSkeleton variant="list" rows={5} />;
  const running = worker?.running ?? tasks.filter((task) => task.state === 'running' && task.mode === 'worker').length;
  const filtered = tasks.filter(
    (task) => (!repository || task.repository.name === repository) && (!mode || task.mode === mode),
  );
  const shown = sortTasks(filtered.filter((task) => tabOf(task) === tab));
  const repositories = [...new Set(tasks.map((task) => task.repository.name))].toSorted((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span aria-hidden className={cn('size-2 rounded-full', worker?.unavailable ? 'bg-danger' : 'bg-success')} />
            Worker : {worker?.unavailable ? 'indisponible' : `${running} / ${worker?.capacity ?? 4} agents au travail`}
          </p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <TaskList tasks={shown} waiting={worker?.waiting ?? {}} />
            </div>
            <TaskChain tasks={chainOf(filtered)} />
          </div>
        </>
      )}
    </div>
  );
}
