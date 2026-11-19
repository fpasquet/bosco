import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AboutButton } from '@/shared/components/about-dialog';
import { Notices } from '@/shared/components/notices';
import { APP_NAME } from '@bosco/domain';
import { MOBILE_TABS, NAV_ITEMS, SETTINGS_ITEM, type ShellPlace } from './nav-items';
import { NavLink } from './nav-link';
import {
  ShellBanner,
  ShellBell,
  ShellContainers,
  ShellDock,
  ShellPlaceProvider,
  ShellSidebar,
  ShellStatus,
} from './shell-slots';

interface AppShellProps {
  children: ReactNode;
  /** Place de la page : l'entrée correspondante de la barre latérale et de l'onglet du bas est active */
  place: ShellPlace;
  title: string;
}

const ITEM =
  'flex h-9 items-center gap-3 rounded-control px-2.5 aria-current:bg-nav-active aria-current:font-medium aria-current:text-nav-ink';

/**
 * Coquille de l'application (disposition « Tour de contrôle ») : barre latérale sur ordinateur, avec les pages de
 * premier niveau, les groupes, les projets et les profils, puis l'état des sources, les conteneurs et « Réglages » en
 * pied ; en-tête et onglets en bas sur téléphone, sous 768 px.
 */
export function AppShell({ children, place, title }: AppShellProps) {
  return (
    <ShellPlaceProvider place={place}>
      <div className="flex h-dvh bg-canvas text-ink">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-nav px-3 py-4 text-nav-muted md:flex">
          <div className="flex items-center gap-2 px-2 pb-4">
            <AboutButton />
            <span className="font-display text-sm font-semibold text-nav-ink">{APP_NAME}</span>
            <span className="ml-auto badge badge-ghost font-mono badge-xs">local</span>
            <ShellBell />
          </div>
          <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ href, icon: Icon, label, places }) => (
              <NavLink key={href} href={href} current={places.includes(place.kind)} className={ITEM}>
                <Icon aria-hidden className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          {/* Positionnées, les zones qui défilent gardent leurs éléments absolus (textes réservés aux lecteurs d'écran) :
              sinon ils en sortent et la page entière défile sous la coquille */}
          <div className="relative -mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-2">
            <ShellSidebar />
          </div>
          <div className="border-t border-line pt-3">
            <ShellStatus />
            <div className="mt-2 empty:hidden">
              <ShellContainers />
            </div>
            <NavLink
              href={SETTINGS_ITEM.href}
              current={SETTINGS_ITEM.places.includes(place.kind)}
              className={cn('mt-2', ITEM)}
            >
              <SETTINGS_ITEM.icon aria-hidden className="size-4" />
              {SETTINGS_ITEM.label}
            </NavLink>
          </div>
        </aside>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-nav px-4 text-nav-ink md:hidden">
            <AboutButton />
            <h1 className="truncate font-display text-base font-semibold">{title}</h1>
            <span className="ml-auto">
              <ShellBell />
            </span>
          </header>
          <ShellBanner />
          <main className="relative min-h-0 flex-1 overflow-y-auto">{children}</main>
          <ShellDock />
          <nav
            aria-label="Navigation principale"
            className="grid h-16 shrink-0 grid-cols-4 border-t border-line bg-nav text-xs text-nav-muted md:hidden"
          >
            {MOBILE_TABS.map(({ href, icon: Icon, label, places }) => (
              <NavLink
                key={href}
                href={href}
                current={places.includes(place.kind)}
                className="flex flex-col items-center justify-center gap-1 aria-current:font-medium aria-current:text-primary"
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Notices />
      </div>
    </ShellPlaceProvider>
  );
}
