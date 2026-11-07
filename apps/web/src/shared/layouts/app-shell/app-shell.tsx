import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/logo';
import { APP_NAME } from '@bosco/core/shared';
import { NAV_ITEMS } from './nav-items';
import { NavLink } from './nav-link';

/**
 * Coquille de l'application (disposition « Tour de contrôle ») : barre latérale sur ordinateur ; en-tête et onglets
 * en bas sur téléphone, sous 768 px. Les dépôts, profils et l'état des sources s'y ajoutent avec le lot 1.
 */
export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-nav px-3 py-4 text-nav-muted md:flex">
        <div className="flex items-center gap-2 px-2 pb-5">
          <Logo />
          <span className="font-display text-sm font-semibold text-nav-ink">{APP_NAME}</span>
          <span className="ml-auto badge badge-ghost font-mono badge-xs">local</span>
        </div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <NavLink
              key={href}
              href={href}
              className="flex h-9 items-center gap-3 rounded-control px-2.5 aria-current:bg-nav-active aria-current:font-medium aria-current:text-nav-ink"
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-nav px-4 text-nav-ink md:hidden">
          <Logo labelled />
          <h1 className="truncate font-display text-base font-semibold">{title}</h1>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <nav
          aria-label="Navigation principale"
          className="grid h-16 shrink-0 grid-cols-4 border-t border-line bg-nav text-xs text-nav-muted md:hidden"
        >
          {NAV_ITEMS.filter((item) => item.mobileLabel).map(({ href, icon: Icon, mobileLabel }) => (
            <NavLink
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 aria-current:font-medium aria-current:text-primary"
            >
              <Icon aria-hidden className="size-5" />
              {mobileLabel}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
