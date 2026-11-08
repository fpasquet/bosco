'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Notices } from '@/shared/components/notices';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { Button } from '@/shared/ui/button';
import {
  addLink,
  cancellationQuery,
  cancelTask,
  changesQuery,
  LinkRefused,
  linksQuery,
  recognizeQuery,
  rejectTask,
  relaunchTask,
  removeLink,
  retryPullRequest,
  reviewQuery,
  undoCancelTask,
  validateTask,
} from '../../api/tasks';
import { useLiveTasks } from '../../hooks/use-live-tasks';
import { RejectDialog } from '../reject-dialog';
import { TaskDetail } from '../task-detail';
import { TaskLinks } from '../task-links';
import { TaskReview } from '../task-review';
import { ValidateDialog } from '../validate-dialog';

/** États d'une tâche qui n'a pas démarré : son annulation se défait encore quelques secondes (CA-TACH-71). */
const NOT_STARTED = new Set(['awaiting_session', 'blocked', 'queued']);

/** Détail d'une tâche, tenu à jour par le flux des tâches (E13) ; revue quand elle est à relire (E7a, E7b, E7c). */
export function TaskDetailScreen({ id }: { id: number }) {
  const client = useQueryClient();
  const tasks = useLiveTasks();
  const task = tasks?.find((candidate) => candidate.id === id);
  const toReview = task?.state === 'to_review';
  const { data: failing } = useQuery({ ...cancellationQuery(id), enabled: Boolean(task) });
  // Une tâche « Ma session » n'a pas de branche : son travail est déjà dans le dépôt
  const { data: changes } = useQuery({ ...changesQuery(id), enabled: toReview && Boolean(task?.outcome.base) });
  const { data: review } = useQuery({ ...reviewQuery(id), enabled: toReview || task?.state === 'validated' });
  const [dialog, setDialog] = useState<'reject' | 'validate' | null>(null);
  const { data: links } = useQuery({ ...linksQuery(id), enabled: Boolean(task) });
  const [typed, setTyped] = useState('');
  const { data: recognized } = useQuery({ ...recognizeQuery(typed.trim()), enabled: typed.trim().length > 8 });
  const [linkError, setLinkError] = useState<null | string>(null);
  const linked = () => client.invalidateQueries({ queryKey: ['task-links', id] });
  const add = useMutation({
    mutationFn: (url: string) => addLink(id, url),
    onSuccess: async () => {
      setLinkError(null);
      setTyped('');
      await linked();
    },
    onError: (failure) =>
      setLinkError(failure instanceof LinkRefused ? failure.message : 'Le lien n’a pas pu être ajouté.'),
  });
  const remove = useMutation({ mutationFn: (link: number) => removeLink(id, link), onSuccess: linked });
  const [pullRequestError, setPullRequestError] = useState<null | string>(null);
  const notify = useNotices((state) => state.push);
  const undo = useMutation({
    mutationFn: () => undoCancelTask(id),
    onSuccess: () => notify(`T-${id} remise en file`, 'success'),
    onError: () => notify('L’annulation ne peut plus être défaite.', 'warning'),
  });
  const cancel = useMutation({
    // undoable se juge au clic : le flux en direct a déjà changé l'état de la tâche quand la réponse arrive
    mutationFn: (_undoable: boolean) => cancelTask(id),
    // Annulation directe d'une tâche qui n'avait pas démarré : elle se défait encore quelques secondes (CA-TACH-67)
    onSuccess: (_task, undoable) => {
      notify(
        `T-${id} annulée`,
        'info',
        undoable ? { label: 'Annuler l’annulation', run: () => undo.mutate() } : undefined,
      );
    },
  });
  const relaunch = useMutation({
    mutationFn: (changes: Parameters<typeof relaunchTask>[1]) => relaunchTask(id, changes),
  });
  const settled = async (result: { pullRequestError: null | string }) => {
    setDialog(null);
    setPullRequestError(result.pullRequestError);
    await client.invalidateQueries({ queryKey: ['tasks'] });
  };
  const validate = useMutation({
    mutationFn: (pullRequest: null | { body: string; title: string }) => validateTask(id, pullRequest),
    onSuccess: settled,
  });
  const retry = useMutation({
    mutationFn: () => retryPullRequest(id, review?.proposal ?? { title: task?.title ?? '', body: '' }),
    onSuccess: settled,
  });
  const reject = useMutation({
    mutationFn: (values: { reason: string; relaunch: boolean }) => rejectTask(id, values),
    onSuccess: () => setDialog(null),
  });
  if (!tasks) return <PageSkeleton variant="detail" rows={6} />;
  if (!task) return <p className="p-4 md:px-8 md:pt-6">Tâche introuvable.</p>;
  const followers = tasks.filter((other) => other.waitingFor.some((prerequisite) => prerequisite.id === id));
  const busy =
    cancel.isPending ||
    undo.isPending ||
    relaunch.isPending ||
    validate.isPending ||
    reject.isPending ||
    retry.isPending;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      {pullRequestError && (
        <section
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger"
        >
          <p className="min-w-0 flex-1">
            <b className="font-semibold">Tâche validée, mais la PR n’est pas ouverte.</b> {pullRequestError}
          </p>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => retry.mutate()}>
            Réessayer
          </Button>
        </section>
      )}
      {toReview ? (
        <TaskReview
          task={task}
          changes={changes}
          followers={followers}
          busy={busy}
          onCopy={(text) => void navigator.clipboard?.writeText(text).catch(() => undefined)}
          onReject={() => setDialog('reject')}
          onValidate={() =>
            review?.pullRequest === 'ask' && !review.blocked ? setDialog('validate') : validate.mutate(null)
          }
        />
      ) : (
        <TaskDetail
          task={task}
          failing={failing ?? []}
          busy={busy}
          onCancel={() => cancel.mutate(NOT_STARTED.has(task.state) && (failing ?? []).length === 0)}
          onRelaunch={(changes) => relaunch.mutate(changes)}
        />
      )}
      <TaskLinks
        taskId={id}
        links={links ?? []}
        recognized={recognized ?? null}
        busy={add.isPending || remove.isPending}
        error={linkError}
        onUrlChange={setTyped}
        onAdd={(url) => add.mutate(url)}
        onRemove={(link) => remove.mutate(link.id)}
      />
      {toReview && (
        <RejectDialog
          open={dialog === 'reject'}
          task={task}
          followers={followers}
          busy={busy}
          onCancel={() => setDialog(null)}
          onReject={(values) => reject.mutate(values)}
        />
      )}
      {toReview && review && (
        <ValidateDialog
          open={dialog === 'validate'}
          task={task}
          review={review}
          followers={followers}
          busy={busy}
          onCancel={() => setDialog(null)}
          onValidate={(pullRequest) => validate.mutate(pullRequest)}
        />
      )}
      <Notices />
    </div>
  );
}
