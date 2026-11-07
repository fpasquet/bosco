'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Lien de navigation : la page courante porte aria-current, que les classes `current:` mettent en avant. */
export function NavLink({ children, className, href }: { children: ReactNode; className: string; href: string }) {
  const pathname = usePathname();
  const current = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  );
}
