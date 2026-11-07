import { Zap } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@bosco/domain';

/** Sans suivi en direct, pas de bandeau T'attend : une ligne discrète propose de l'installer (CA-SESS-08). */
export function LiveTrackingLine() {
  return (
    <p className="flex items-start gap-2 text-xs text-muted">
      <Zap aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Sans suivi en direct, {APP_NAME} ne sait pas quand une session t’attend.{' '}
        <Link href="/sources" className="link font-medium link-primary">
          Installer le suivi en direct
        </Link>
      </span>
    </p>
  );
}
