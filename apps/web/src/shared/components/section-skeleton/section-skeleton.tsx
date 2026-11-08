import { Skeleton } from '@/shared/ui/skeleton';

/** Partie d'écran en chargement (réglages d'un dépôt, contexte, droits) : une carte de lignes animées. */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <span className="sr-only">Chargement…</span>
      <Skeleton className="h-4 w-48" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  );
}
