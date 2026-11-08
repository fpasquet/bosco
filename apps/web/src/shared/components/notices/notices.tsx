'use client';
import { CircleCheck, Info, MessageCircleQuestion, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type Notice, useNotices } from '@/shared/hooks/use-notices';
import { Button } from '@/shared/ui/button';

const TONES = {
  info: { icon: Info, bar: 'bg-info', className: 'text-info' },
  success: { icon: CircleCheck, bar: 'bg-success', className: 'text-success' },
  warning: { icon: MessageCircleQuestion, bar: 'bg-warning', className: 'text-warning' },
} as const;

/** Un message : il se ferme seul à la fin de sa barre de temps, arrêtée tant que la souris ou le focus est dessus. */
function NoticeItem({ notice }: { notice: Notice }) {
  const dismiss = useNotices((state) => state.dismiss);
  const { bar, className, icon: Icon } = TONES[notice.tone];
  return (
    <li className="notice relative flex w-full items-start gap-3 overflow-hidden rounded-card border border-line bg-surface py-2.5 pr-2 pl-4 text-sm shadow-overlay md:w-96">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', bar)} />
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', className)} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{notice.text}</p>
        {notice.line && <p className="truncate text-xs text-muted">{notice.line}</p>}
      </div>
      {notice.action && (
        <Button
          variant="ghost"
          size="xs"
          className="text-primary"
          onClick={() => {
            dismiss(notice.id);
            notice.action?.run();
          }}
        >
          {notice.action.label}
        </Button>
      )}
      <button
        type="button"
        className="grid size-6 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-alt"
        aria-label="Fermer le message"
        onClick={() => dismiss(notice.id)}
      >
        <X aria-hidden className="size-4" />
      </button>
      {notice.duration !== null && (
        <span
          aria-hidden
          className="notice-timer"
          style={{ animationDuration: `${notice.duration}ms` }}
          onAnimationEnd={() => dismiss(notice.id)}
        />
      )}
    </li>
  );
}

/**
 * Messages brefs en bas de l'écran (E15c), montés une fois dans la coquille : une confirmation (« Autorisé · … »), ou
 * la notification qui remplace celle du bureau quand Bosco est devant toi. Trois au plus, annoncés aux lecteurs
 * d'écran ; au-dessus de la barre d'onglets sur le téléphone.
 */
export function Notices() {
  const notices = useNotices((state) => state.notices);
  return (
    <div
      role="status"
      aria-live="polite"
      className="toast toast-end toast-bottom z-30 max-md:inset-x-0 max-md:bottom-16"
    >
      <ul className="flex flex-col items-end gap-2">
        {notices.map((notice) => (
          <NoticeItem key={notice.id} notice={notice} />
        ))}
      </ul>
    </div>
  );
}
