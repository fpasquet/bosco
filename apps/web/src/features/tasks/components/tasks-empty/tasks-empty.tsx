import { Bot, Plus, SquareTerminal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';

/** File vide (E5a) : à quoi servent les tâches, et les deux façons de les confier à Claude Code (CA-TACH-01). */
export function TasksEmpty() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-6 text-center">
      <div>
        <h2 className="font-display text-xl font-semibold">Prépare du travail pour Claude Code</h2>
        <p className="mt-1 text-muted">
          Une tâche dit où travailler, quoi faire, après quoi et dans quelles limites ; elle part dès que tout est prêt.
        </p>
      </div>
      <div className="grid w-full gap-4 text-left md:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bot aria-hidden className="size-4" /> Worker
          </h3>
          <p className="mt-1 text-muted">
            Un agent sans terminal travaille dans une copie jetable du dépôt, puis tu relis sa branche.
          </p>
        </section>
        <section className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold">
            <SquareTerminal aria-hidden className="size-4" /> Ma session
          </h3>
          <p className="mt-1 text-muted">
            La tâche attend qu’une session Claude Code interactive la prenne, sous tes yeux.
          </p>
        </section>
      </div>
      <Button asChild>
        <Link href="/tasks/new">
          <Plus aria-hidden className="size-4" />
          Nouvelle tâche
        </Link>
      </Button>
      <p className="text-xs text-muted">
        Tant qu’un dépôt n’a pas ses propres droits, les réglages généraux s’appliquent à ses tâches.
      </p>
    </div>
  );
}
