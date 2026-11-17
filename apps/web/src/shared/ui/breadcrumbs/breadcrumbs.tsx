import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface BreadcrumbsProps {
  className?: string;
  /** De la place la plus large à la page ouverte ; le dernier élément, sans lien, est la page elle-même */
  items: { href?: string; label: string }[];
  /** Sur le téléphone, l'écran est poussé : le fil devient le retour à sa dernière étape (false : racine, sans retour) */
  phoneBack?: boolean;
}

/**
 * Fil d'Ariane au-dessus du titre : la place fixe de la page dans la navigation, quel que soit le chemin pris. Sur le
 * téléphone, il devient le retour de l'écran poussé.
 */
export function Breadcrumbs({ className, items, phoneBack = true }: BreadcrumbsProps) {
  const back = items.findLast((item) => item.href);
  return (
    <>
      <nav aria-label="Fil d’Ariane" className={cn('breadcrumbs hidden py-0 text-xs text-muted md:block', className)}>
        <ul>
          {items.map(({ href, label }, index) => (
            <li key={`${index}-${label}`}>
              {href ? (
                <Link href={href} className="link link-hover">
                  {label}
                </Link>
              ) : (
                <span aria-current={index === items.length - 1 ? 'page' : undefined}>{label}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {phoneBack && back?.href && (
        <Link
          href={back.href}
          className={cn('inline-flex h-control items-center gap-1 self-start text-sm text-muted md:hidden', className)}
        >
          <ChevronLeft aria-hidden className="size-4" />
          {back.label}
        </Link>
      )}
    </>
  );
}
