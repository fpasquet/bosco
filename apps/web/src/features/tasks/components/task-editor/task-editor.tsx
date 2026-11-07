'use client';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TaskDraftDto, TaskIssueDto } from '@bosco/domain';
import { createTask, editTask, repositoriesQuery, rightsQuery, TaskIssues } from '../../api/tasks';
import { useLiveTasks } from '../../hooks/use-live-tasks';
import { TaskForm } from '../task-form';

/** Création ou modification d'une tâche (E6a, E6b) ; une fois enregistrée, retour à la file. */
export function TaskEditor({ id, title }: { id?: number; title: string }) {
  const router = useRouter();
  const tasks = useLiveTasks();
  const { data: repositories } = useQuery(repositoriesQuery);
  const rights = useQueries({ queries: (repositories ?? []).map(({ name }) => rightsQuery(name)) });
  const [issues, setIssues] = useState<TaskIssueDto[]>([]);
  const save = useMutation({
    mutationFn: (draft: TaskDraftDto) => (id ? editTask(id, draft) : createTask(draft)),
    onSuccess: (task) => router.push(id ? `/tasks/${task.id}` : '/tasks'),
    onError: (error) => setIssues(error instanceof TaskIssues ? error.issues : []),
  });
  if (!tasks || !repositories) return null;
  const editing = id ? tasks.find((task) => task.id === id) : undefined;
  if (id && !editing) return null;
  const limits = Object.fromEntries(
    repositories.flatMap(({ name }, index) => {
      const effective = rights[index]?.data?.effective;
      return effective
        ? [[name, { budgetUsd: effective.maxBudgetUsd, maxTurns: effective.maxTurns, tools: effective.tools }]]
        : [];
    }),
  );
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <TaskForm
        busy={save.isPending}
        editing={editing}
        issues={issues}
        limits={limits}
        repositories={repositories}
        tasks={tasks.filter((task) => task.state !== 'cancelled')}
        onCancel={() => router.back()}
        onSubmit={(draft) => save.mutate(draft)}
      />
    </div>
  );
}
