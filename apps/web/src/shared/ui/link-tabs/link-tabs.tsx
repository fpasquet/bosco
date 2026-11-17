import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface LinkTab {
  /** Compteur à côté du libellé (décisions à valider) ; absent ou nul, rien ne s'affiche */
  count?: number;
  href: string;
  label: string;
}

export interface LinkTabsProps {
  className?: string;
  /** Adresse de l'onglet ouvert */
  current: string;
  /** Nom de la barre d'onglets pour les lecteurs d'écran */
  label: string;
  tabs: readonly LinkTab[];
}

/** Onglets d'une page dont chacun a son adresse : un lien ou un retour arrière retombe sur le même onglet. */
export function LinkTabs({ className, current, label, tabs }: LinkTabsProps) {
  return (
    <nav aria-label={label} className={cn('tabs tabs-box w-fit tabs-sm', className)}>
      {tabs.map(({ count, href, label: name }) => (
        <Link
          key={href}
          href={href}
          className={cn('tab gap-1.5', href !== current && 'text-muted opacity-100')}
          aria-current={href === current ? 'page' : undefined}
        >
          {name}
          {count ? (
            <span className="badge badge-sm badge-primary">
              {count}
              <span className="sr-only"> à valider</span>
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
