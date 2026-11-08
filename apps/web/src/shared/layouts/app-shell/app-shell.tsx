import type { ReactNode } from 'react';
import { Notices } from '@/shared/components/notices';
import { Logo } from '@/shared/ui/logo';
import { APP_NAME } from '@bosco/domain';
import { NAV_ITEMS } from './nav-items';
import { NavLink } from './nav-link';
import { ShellBell } from './shell-slots';

interface AppShellProps {
  children: ReactNode;
  /** Suite de la barre latérale propre à l'écran : dépôts, profils et état des sources de la vue d'ensemble */
  sidebar?: ReactNode;
  title: string;
}

/**
 * Coquille de l'application (disposition « Tour de contrôle ») : barre latérale sur ordinateur ; en-tête et onglets
 * en bas sur téléphone, sous 768 px.
 */
export function AppShell({ children, sidebar, title }: AppShellProps) {
  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-nav px-3 py-4 text-nav-muted md:flex">
        <div className="flex items-center gap-2 px-2 pb-5">
          <Logo />
          <span className="font-display text-sm font-semibold text-nav-ink">{APP_NAME}</span>
          <span className="ml-auto badge badge-ghost font-mono badge-xs">local</span>
          <ShellBell />
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
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-nav px-4 text-nav-ink md:hidden">
          <Logo labelled />
          <h1 className="truncate font-display text-base font-semibold">{title}</h1>
          <span className="ml-auto">
            <ShellBell />
          </span>
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
      <Notices />
    </div>
  );
}
