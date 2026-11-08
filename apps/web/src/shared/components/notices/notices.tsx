'use client';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNotices } from '@/shared/hooks/use-notices';
import { Button } from '@/shared/ui/button';

const TONES = {
  info: { icon: Info, className: 'text-info' },
  success: { icon: CircleCheck, className: 'text-success' },
  warning: { icon: CircleAlert, className: 'text-warning' },
} as const;

/**
 * Messages brefs en bas de l'écran (« Autorisé · Specs du tableau de bord »), annoncés aux lecteurs d'écran ; certains
 * proposent une action le temps qu'ils restent affichés (« Annuler l'annulation »).
 */
export function Notices() {
  const notices = useNotices((state) => state.notices);
  const dismiss = useNotices((state) => state.dismiss);
  return (
    <div role="status" aria-live="polite" className="toast toast-end toast-bottom z-10 max-md:bottom-16">
      {notices.map((notice) => {
        const { className, icon: Icon } = TONES[notice.tone];
        return (
          <p
            key={notice.id}
            className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-sm shadow-overlay"
          >
            <Icon aria-hidden className={cn('size-4 shrink-0', className)} />
            {notice.text}
            {notice.action && (
              <Button
                variant="ghost"
                size="sm"
                className="-my-1 ml-2"
                onClick={() => {
                  dismiss(notice.id);
                  notice.action?.run();
                }}
              >
                {notice.action.label}
              </Button>
            )}
          </p>
        );
      })}
    </div>
  );
}
