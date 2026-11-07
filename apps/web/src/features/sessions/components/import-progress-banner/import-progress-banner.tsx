import type { ImportProgressDto } from '@bosco/domain';

const COUNT = new Intl.NumberFormat('fr');

/** Première lecture de l'historique (E1e) : la progression est réelle, le total est connu avant la lecture. */
export function ImportProgressBanner({ progress }: { progress: ImportProgressDto }) {
  const percent = progress.total > 0 ? Math.floor((progress.read / progress.total) * 100) : 0;
  const label = `${COUNT.format(progress.read)} sessions lues sur ${COUNT.format(progress.total)}`;
  return (
    <section
      aria-label="Lecture de tes sessions"
      className="rounded-card border border-line bg-surface px-4 py-3 shadow-card"
    >
      <p className="flex flex-wrap items-baseline gap-x-2">
        <b className="font-semibold">Lecture de tes sessions :</b>
        <span>{label}</span>
        <span className="ml-auto font-mono text-xs text-muted tabular-nums">{percent} %</span>
      </p>
      <progress
        className="progress mt-2 w-full progress-primary"
        value={progress.read}
        max={progress.total}
        aria-label={label}
      />
      <p className="mt-1.5 text-xs text-muted">
        Les sessions ouvertes s’affichent d’abord, l’historique se lit ensuite. Tu peux quitter cet écran : la lecture
        continue.
      </p>
    </section>
  );
}
