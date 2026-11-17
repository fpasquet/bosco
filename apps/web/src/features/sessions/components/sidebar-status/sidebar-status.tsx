import Link from 'next/link';

export interface SidebarStatusProps {
  liveTracking: boolean;
  /** Sources surveillées */
  watched: number;
}

/** État des sources, en pied de la barre latérale : il mène à Réglages › Sources. */
export function SidebarStatus({ liveTracking, watched }: SidebarStatusProps) {
  return (
    <Link href="/sources" className="block rounded-control px-2 py-0.5 text-xs/relaxed focus-ring hover:bg-nav-active">
      <span className="flex items-center gap-2 font-medium text-nav-ink">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        {watched > 1 ? `${watched} sources surveillées` : '1 source surveillée'}
      </span>
      <span className="block">{liveTracking ? 'Suivi en direct actif' : 'Suivi en direct non installé'}</span>
    </Link>
  );
}
