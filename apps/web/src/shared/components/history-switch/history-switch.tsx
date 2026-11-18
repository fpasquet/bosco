import { LinkTabs } from '@/shared/ui/link-tabs';

const TABS = [
  { href: '/history', label: 'Sessions' },
  { href: '/usage', label: 'Usage' },
] as const;

/** Sur le téléphone, l'onglet Historique s'ouvre sur la bascule « Sessions | Usage » : la recherche ou l'usage. */
export function HistorySwitch({ current }: { current: 'sessions' | 'usage' }) {
  return (
    <LinkTabs
      className="md:hidden"
      label="Historique"
      current={current === 'usage' ? '/usage' : '/history'}
      tabs={TABS}
    />
  );
}
