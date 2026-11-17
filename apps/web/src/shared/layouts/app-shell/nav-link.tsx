import type { ReactNode } from 'react';
import Link from 'next/link';

/** Lien de navigation : l'entrée de la place ouverte porte aria-current, que les classes `aria-current:` mettent en avant. */
export function NavLink({
  children,
  className,
  current,
  href,
}: {
  children: ReactNode;
  className: string;
  current: boolean;
  href: string;
}) {
  return (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  );
}
