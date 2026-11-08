import type * as React from 'react';
import { cn } from '@/lib/cn';

/** Bloc animé qui tient la place d'un contenu en chargement (classe skeleton de daisyUI) ; muet pour l'accessibilité. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden className={cn('skeleton', className)} {...props} />;
}
