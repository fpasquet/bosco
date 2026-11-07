'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cancellationQuery, cancelTask, relaunchTask } from '../../api/tasks';
import { useLiveTasks } from '../../hooks/use-live-tasks';
import { TaskDetail } from '../task-detail';

/** Détail d'une tâche, tenu à jour par le flux des tâches (E13). */
export function TaskDetailScreen({ id }: { id: number }) {
  const tasks = useLiveTasks();
  const task = tasks?.find((candidate) => candidate.id === id);
  const { data: failing } = useQuery({ ...cancellationQuery(id), enabled: Boolean(task) });
  const cancel = useMutation({ mutationFn: () => cancelTask(id) });
  const relaunch = useMutation({
    mutationFn: (changes: Parameters<typeof relaunchTask>[1]) => relaunchTask(id, changes),
  });
  if (!tasks) return null;
  if (!task) return <p className="p-4 md:px-8 md:pt-6">Tâche introuvable.</p>;
  return (
    <div className="p-4 md:px-8 md:pt-6">
      <TaskDetail
        task={task}
        failing={failing ?? []}
        busy={cancel.isPending || relaunch.isPending}
        onCancel={() => cancel.mutate()}
        onRelaunch={(changes) => relaunch.mutate(changes)}
      />
    </div>
  );
}
