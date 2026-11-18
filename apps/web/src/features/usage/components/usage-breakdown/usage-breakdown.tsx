'use client';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { UsageShareDto } from '@bosco/domain';
import { displayPath } from '@/lib/format';
import { modelName } from '@/shared/lib/session-settings';
import { formatPercent, formatUsd } from '../../lib/format';

export interface UsageBreakdownProps {
  byModel: UsageShareDto[];
  /** Les sessions elles-mêmes et leurs sous-agents */
  byOrigin: UsageShareDto[];
  byProfile: UsageShareDto[];
  byProject: UsageShareDto[];
  /** Dossier personnel, pour écrire les dossiers hors projet comme dans le terminal */
  home: string;
  /** Un clic sur un projet filtre toute la page sur lui */
  onProject: (id: number) => void;
}

/** Projets montrés d'emblée : les suivants se déplient, pour que la colonne reste lisible avec beaucoup de projets. */
const SHOWN_PROJECTS = 10;

interface ShareProps {
  label: string;
  /** Mention en retrait après le nom (« hors projet ») */
  note?: string;
  onClick?: () => void;
  share: UsageShareDto;
}

function ShareName({ label, note, onClick }: Omit<ShareProps, 'share'>) {
  if (note)
    return (
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate font-mono text-xs">{label}</span>
        <span className="text-xs whitespace-nowrap text-muted">{note}</span>
      </span>
    );
  if (onClick)
    return (
      <button type="button" className="link truncate text-left link-hover" onClick={onClick}>
        {label}
        <span className="sr-only"> : filtrer la page sur ce projet</span>
      </button>
    );
  return <span className="truncate">{label}</span>;
}

function Share({ label, note, onClick, share }: ShareProps) {
  const amount = share.usd === null ? 'non chiffré' : formatUsd(share.usd);
  return (
    <li className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2 text-sm">
        <ShareName label={label} note={note} onClick={onClick} />
        <span className="ml-auto font-mono text-xs text-muted tabular-nums">{formatPercent(share.share)}</span>
        <span className="w-20 text-right font-mono text-xs tabular-nums">{amount}</span>
      </p>
      {/* Une grandeur, pas une identité : une seule couleur pour toutes les barres */}
      <span aria-hidden className="h-1.5 rounded-full bg-surface-alt">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, share.share)}%` }} />
      </span>
    </li>
  );
}

function Column({ children, footer, title }: { children: React.ReactNode; footer?: React.ReactNode; title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ul className="flex flex-col gap-3">{children}</ul>
      {footer}
    </div>
  );
}

/**
 * Chaque projet et chaque dossier hors projet, les plus gros d'abord : les dix premiers d'emblée, les autres sous
 * « Afficher les N autres ». Un projet filtre la page au clic ; un dossier hors projet se lit seulement.
 */
function ProjectShares({
  home,
  onProject,
  shares,
}: {
  home: string;
  onProject: (id: number) => void;
  shares: UsageShareDto[];
}) {
  const [expanded, setExpanded] = useState(false);
  const moreId = useId();
  // Un seul projet de plus ne vaut pas un bouton
  const folded = shares.length > SHOWN_PROJECTS + 1 ? shares.length - SHOWN_PROJECTS : 0;
  const row = (share: UsageShareDto) =>
    share.folder ? (
      <Share key={share.key} share={share} label={displayPath(share.folder, home)} note="hors projet" />
    ) : (
      <Share
        key={share.key}
        share={share}
        label={share.label}
        onClick={typeof share.projectId === 'number' ? () => onProject(share.projectId as number) : undefined}
      />
    );
  return (
    <Column
      title="Par projet"
      footer={
        folded > 0 && (
          <button
            type="button"
            className="flex items-center gap-1 self-start text-xs text-muted link-hover"
            aria-expanded={expanded}
            aria-controls={moreId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Afficher moins' : `Afficher les ${folded} autres`}
            <ChevronDown aria-hidden className="size-3.5 transition-transform aria-expanded:rotate-180" />
          </button>
        )
      }
    >
      {(folded > 0 ? shares.slice(0, SHOWN_PROJECTS) : shares).map(row)}
      {folded > 0 && (
        <li id={moreId} hidden={!expanded}>
          <ul aria-label="Autres projets" className="flex flex-col gap-3">
            {shares.slice(SHOWN_PROJECTS).map(row)}
          </ul>
        </li>
      )}
    </Column>
  );
}

/**
 * Répartition du coût estimé : par projet, par modèle, par profil, et entre les sessions et leurs sous-agents, les
 * plus gros d'abord. Tous les projets sont listés, avec chaque dossier hors projet ; ailleurs, les petits sont
 * regroupés en « autres ». Une session à plusieurs projets compte pour chacun : la somme des projets peut dépasser le
 * total. Un modèle sans tarif connu s'affiche « non chiffré ».
 */
export function UsageBreakdown({ byModel, byOrigin, byProfile, byProject, home, onProject }: UsageBreakdownProps) {
  return (
    <section aria-labelledby="usage-breakdown" className="flex flex-col gap-2">
      <h2 id="usage-breakdown" className="text-sm font-semibold">
        Répartition
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProjectShares home={home} shares={byProject} onProject={onProject} />
        <Column title="Par modèle">
          {byModel.map((share) => (
            <Share
              key={share.key}
              share={share}
              label={share.key === 'others' ? share.label : modelName(share.label)}
            />
          ))}
        </Column>
        <Column title="Par profil">
          {byProfile.map((share) => (
            <Share key={share.key} share={share} label={share.label} />
          ))}
        </Column>
        <Column title="Sessions et sous-agents">
          {byOrigin.map((share) => (
            <Share key={share.key} share={share} label={share.label} />
          ))}
        </Column>
      </div>
    </section>
  );
}
