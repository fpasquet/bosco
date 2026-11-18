import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { LinkTabs } from '@/shared/ui/link-tabs';

export type SettingsTab = 'notifications' | 'phone' | 'sandbox' | 'sources' | 'subscription';

/** Les cinq onglets des Réglages, dans l'ordre ; ce qui ne vaut que pour un projet ou un groupe se règle dans sa page. */
export const SETTINGS_TABS: readonly { href: string; key: SettingsTab; label: string }[] = [
  { key: 'sources', href: '/settings/sources', label: 'Sources' },
  { key: 'phone', href: '/settings/phone', label: 'Téléphone' },
  { key: 'notifications', href: '/settings/notifications', label: 'Notifications' },
  { key: 'subscription', href: '/settings/subscription', label: 'Abonnement Claude' },
  { key: 'sandbox', href: '/settings/sandbox', label: 'Bac à sable' },
];

/** Racine des Réglages sur le téléphone : l'onglet Sources, dont le contenu suit la liste des onglets. */
const ROOT = '/settings/sources';

export interface SettingsHeaderProps {
  /** À droite du titre : « Réservé à toi » */
  aside?: ReactNode;
  current: SettingsTab;
}

/**
 * En-tête des Réglages : « Réglages › Sources » et les cinq onglets. Sur le téléphone, l'onglet Sources est la
 * racine de l'onglet « Réglages » du bas : la liste des onglets, puis « Conteneurs en cours » ; les autres onglets sont
 * des écrans poussés, dont le fil devient le retour.
 */
export function SettingsHeader({ aside, current }: SettingsHeaderProps) {
  const tab = SETTINGS_TABS.find(({ key }) => key === current) ?? SETTINGS_TABS[0];
  return (
    <div className="flex flex-col gap-3">
      <Breadcrumbs
        phoneBack={current !== 'sources'}
        items={[{ href: ROOT, label: 'Réglages' }, { label: tab?.label ?? '' }]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{tab?.label}</h1>
        {aside}
      </div>
      <LinkTabs
        label="Onglets des réglages"
        current={tab?.href ?? ROOT}
        tabs={SETTINGS_TABS}
        className="max-md:hidden"
      />
      {current === 'sources' && (
        <nav
          aria-label="Réglages du poste"
          className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface shadow-card md:hidden"
        >
          {[...SETTINGS_TABS, { href: '/containers', label: 'Conteneurs en cours' }].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={href === ROOT ? 'page' : undefined}
              className="flex items-center justify-between px-4 py-3 aria-current:font-semibold"
            >
              <span className="font-medium">{label}</span>
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
