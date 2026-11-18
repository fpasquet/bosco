import { Radio } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@bosco/domain';

export interface LiveTrackingOfferProps {
  /** Nom court du profil de la session (« perso ») */
  profile: string;
  sourceId: string;
}

/**
 * Session d'un profil sans suivi en direct : rien ne signale qu'elle t'attend, et aucune autorisation ne se donne
 * d'ici. Bosco propose seulement d'installer le suivi, depuis le poste.
 */
export function LiveTrackingOffer({ profile, sourceId }: LiveTrackingOfferProps) {
  return (
    <aside
      aria-label="Suivi en direct"
      className="flex items-start gap-3 rounded-card border border-line bg-surface-alt px-4 py-3 text-sm"
    >
      <Radio aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Suivi en direct non installé dans le profil {profile}</p>
        <p className="text-xs text-muted">
          Sans lui, {APP_NAME} ne sait pas quand cette session t’attend, et ses autorisations se donnent dans le
          terminal.
        </p>
        <Link
          href={`/settings/sources?suivi=${encodeURIComponent(sourceId)}`}
          className="mt-1 hidden link text-xs font-medium link-primary md:inline-block"
        >
          Installer le suivi en direct
        </Link>
        <p className="mt-1 text-xs text-muted md:hidden">Il s’installe depuis le poste.</p>
      </div>
    </aside>
  );
}
