import { ClipboardCheck, OctagonAlert, Workflow } from 'lucide-react';
import Link from 'next/link';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

/**
 * Session lancée par le worker pour une tâche (E2c, E2d) : sa relecture ou sa relance se font depuis la tâche. En
 * échec, le bandeau dit pourquoi, et le travail déjà fait reste sur la branche.
 */
export function WorkerTaskNotice({ session }: { session: SessionDto }) {
  const { task } = session;
  if (!task) return null;
  if (task.state === 'to_review')
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-card border border-primary bg-primary-soft px-4 py-3">
        <ClipboardCheck aria-hidden className="size-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1">
          <b className="font-semibold">Session du worker pour T-{task.id}, à relire.</b> La relecture se fait dans la
          revue de la tâche.
        </p>
        <Button asChild size="sm">
          <Link href={`/tasks/${task.id}`}>Ouvrir la revue</Link>
        </Button>
      </section>
    );
  if (task.state === 'failed')
    return (
      <section
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger"
      >
        <OctagonAlert aria-hidden className="size-4 shrink-0" />
        <p className="min-w-0 flex-1">
          <b className="font-semibold">{task.failure ?? 'La session s’est arrêtée avant la fin.'}</b>
          {session.branch && ` Le travail déjà fait reste sur la branche ${session.branch}.`}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/tasks/${task.id}`}>Voir la tâche</Link>
        </Button>
      </section>
    );
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
      <Workflow aria-hidden className="size-4 shrink-0 text-muted" />
      <p className="min-w-0 flex-1">Session lancée par le worker pour la tâche T-{task.id}.</p>
      <Button asChild size="sm" variant="outline">
        <Link href={`/tasks/${task.id}`}>Voir la tâche</Link>
      </Button>
    </section>
  );
}
