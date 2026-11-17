import { type ReactNode, useId } from 'react';

export interface SectionCardProps {
  /** Ce qui suit le titre, à droite : un compteur, une action */
  aside?: ReactNode;
  children: ReactNode;
  title: string;
}

/** Carte titrée d'une page de réglages (un projet, un groupe) : un intitulé, puis son contenu. */
export function SectionCard({ aside, children, title }: SectionCardProps) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <h2 id={id} className="text-xs font-semibold text-muted">
          {title}
        </h2>
        {aside}
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">{children}</div>
    </section>
  );
}
