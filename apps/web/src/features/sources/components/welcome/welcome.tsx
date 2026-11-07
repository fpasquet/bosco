import { BellRing, ListChecks, ShieldCheck } from 'lucide-react';
import { Logo } from '@/shared/ui/logo';
import { APP_NAME } from '@bosco/domain';

const USES = [
  { icon: BellRing, strong: 't’attendent', before: 'Repère les sessions qui ', after: '' },
  { icon: ShieldCheck, strong: 'Autorise', before: '', after: ' depuis Bosco ou ton téléphone' },
  { icon: ListChecks, strong: 'Confie des tâches', before: '', after: ' au worker, relis avant toute fusion' },
];

/** Bienvenue du premier lancement : dans la page, sans fenêtre à fermer (RF-SESS-11). */
export function Welcome() {
  return (
    <section aria-labelledby="welcome-title" className="w-full">
      <div className="hidden md:block">
        <div className="flex items-center gap-4">
          <Logo size="lg" />
          <div className="min-w-0">
            <h1 id="welcome-title" className="font-display text-2xl font-semibold tracking-tight">
              Bienvenue dans {APP_NAME}
            </h1>
            <p className="mt-0.5 text-muted">
              Le maître d’équipage de tes sessions Claude Code : il les surveille pendant qu’elles travaillent et
              t’appelle quand l’une a besoin de toi.
            </p>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-3 text-xs">
          {USES.map(({ after, before, icon: Icon, strong }) => (
            <li key={strong} className="flex items-start gap-2 rounded-control bg-surface-alt px-3 py-2.5">
              <Icon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
              <span>
                {before}
                <b className="font-semibold text-ink">{strong}</b>
                {after}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-card bg-surface-alt p-3 md:hidden">
        <div className="flex items-center gap-3">
          <Logo />
          <p className="font-display text-base font-semibold">Bienvenue dans {APP_NAME}</p>
        </div>
        <p className="mt-2 text-xs text-muted">
          Il surveille tes sessions Claude Code et t’appelle quand l’une a besoin de toi : autorise une commande d’ici,
          confie des tâches au worker et relis-les.
        </p>
      </div>
    </section>
  );
}
