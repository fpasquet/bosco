import { Skeleton } from '@/shared/ui/skeleton';

export interface PageSkeletonProps {
  /** Indicateurs en bandeau sous le titre (vue d'ensemble, E1e) */
  indicators?: boolean;
  /** Lignes d'une liste, ou champs d'un formulaire */
  rows?: number;
  /**
   * Forme de l'écran en chargement : une liste (sessions, tâches, socles), un détail avec sa colonne (session, tâche,
   * décision), des cartes de réglages (sources, réglages, intégrations), ou un formulaire.
   */
  variant: 'cards' | 'detail' | 'form' | 'list';
}

const CARD = 'flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card';

function Rows({ count }: { count: number }) {
  const rows = Array.from({ length: count }, (_, index) => (
    <div key={index} className="flex items-center gap-3">
      <Skeleton className="h-6 w-20 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="hidden h-4 w-12 shrink-0 md:block" />
    </div>
  ));
  return <>{rows}</>;
}

function Body({ indicators, rows, variant }: Required<PageSkeletonProps>) {
  switch (variant) {
    case 'list':
      return (
        <>
          {indicators && (
            <div className="hidden grid-cols-5 gap-4 rounded-card border border-line bg-surface px-4 py-3 shadow-card md:grid">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          )}
          <Skeleton className="h-4 w-40" />
          <div className={CARD}>
            <Rows count={rows} />
          </div>
        </>
      );
    case 'detail':
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`${CARD} md:col-span-2`}>
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: rows }, (_, index) => (
              <Skeleton key={index} className={index % 3 === 2 ? 'h-16 w-full' : 'h-4 w-5/6'} />
            ))}
          </div>
          <div className="hidden flex-col gap-4 md:flex">
            {[4, 3].map((lines, index) => (
              <div key={index} className={CARD}>
                <Skeleton className="h-3 w-16" />
                {Array.from({ length: lines }, (_, line) => (
                  <Skeleton key={line} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    case 'cards':
      return (
        <>
          {[rows, 3].map((lines, index) => (
            <div key={index} className={CARD}>
              <Skeleton className="h-4 w-48" />
              <Rows count={lines} />
            </div>
          ))}
        </>
      );
    case 'form':
      return (
        <div className={`${CARD} max-w-2xl`}>
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-control w-full" />
            </div>
          ))}
          <Skeleton className="h-control w-32 self-end" />
        </div>
      );
  }
}

/**
 * Écran en chargement : des blocs animés à la place du contenu, dans la forme de l'écran, plutôt qu'une page vide
 * (E1e : le chargement ordinaire n'affiche que ces blocs). Les lecteurs d'écran entendent « Chargement ».
 */
export function PageSkeleton({ indicators = false, rows = 4, variant }: PageSkeletonProps) {
  return (
    <div role="status" aria-busy className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <span className="sr-only">Chargement…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-64 max-w-full" />
      </div>
      <Body indicators={indicators} rows={rows} variant={variant} />
    </div>
  );
}
