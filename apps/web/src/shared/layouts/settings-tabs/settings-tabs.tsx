import Link from 'next/link';

const TABS = [
  { href: '/settings/repositories', label: 'Dépôts' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/subscription', label: 'Abonnement Claude' },
  { href: '/settings/isolation', label: 'Isolation du bac à sable' },
] as const;

/** Onglets des Réglages, réservés à la personne (RF-CONT-09). */
export function SettingsTabs({ current }: { current: (typeof TABS)[number]['href'] }) {
  return (
    <nav aria-label="Réglages" className="tabs tabs-box w-fit tabs-sm">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={href === current ? 'tab tab-active' : 'tab text-muted opacity-100'}
          aria-current={href === current ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
