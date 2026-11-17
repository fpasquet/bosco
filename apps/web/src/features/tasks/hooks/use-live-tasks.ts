'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { TaskDto } from '@bosco/domain';
import { tasksQuery } from '../api/tasks';

/** Tâches tenues à jour par le flux en direct des tâches : toutes, puis chaque changement (DT-06). */
export function useLiveTasks(): TaskDto[] | undefined {
  const client = useQueryClient();
  useEffect(() => {
    const source = new EventSource('/api/tasks/events');
    source.addEventListener('tasks.snapshot', (event) => {
      const { tasks } = JSON.parse((event as MessageEvent<string>).data) as { tasks: TaskDto[] };
      client.setQueryData(tasksQuery.queryKey, tasks);
    });
    source.addEventListener('task.updated', (event) => {
      const { task } = JSON.parse((event as MessageEvent<string>).data) as { task: TaskDto };
      client.setQueryData<TaskDto[]>(tasksQuery.queryKey, (tasks) => [
        ...(tasks ?? []).filter((known) => known.id !== task.id),
        task,
      ]);
    });
    return () => source.close();
  }, [client]);
  return useQuery(tasksQuery).data;
}
