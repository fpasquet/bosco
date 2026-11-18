import type { UsageShareDto } from '@bosco/domain';
import { modelName } from '@/shared/lib/session-settings';
import { formatPercent, formatUsd } from '../../lib/format';

export interface UsageBreakdownProps {
  byModel: UsageShareDto[];
  /** Les sessions elles-mêmes et leurs sous-agents */
  byOrigin: UsageShareDto[];
  byProfile: UsageShareDto[];
  byProject: UsageShareDto[];
  /** Un clic sur un projet filtre toute la page sur lui */
  onProject: (id: number) => void;
}

function Share({ label, onClick, share }: { label: string; onClick?: () => void; share: UsageShareDto }) {
  const amount = share.usd === null ? 'non chiffré' : formatUsd(share.usd);
  return (
    <li className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2 text-sm">
        {onClick ? (
          <button type="button" className="link truncate text-left link-hover" onClick={onClick}>
            {label}
            <span className="sr-only"> : filtrer la page sur ce projet</span>
          </button>
        ) : (
          <span className="truncate">{label}</span>
        )}
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

function Column({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

/**
 * Répartition du coût estimé : par projet, par modèle, par profil, et entre les sessions et leurs sous-agents, les
 * plus gros d'abord, les petits regroupés en « autres ». Une session à plusieurs projets compte pour chacun : la somme des projets peut dépasser le
 * total. Un modèle sans tarif connu s'affiche « non chiffré ».
 */
export function UsageBreakdown({ byModel, byOrigin, byProfile, byProject, onProject }: UsageBreakdownProps) {
  return (
    <section aria-labelledby="usage-breakdown" className="flex flex-col gap-2">
      <h2 id="usage-breakdown" className="text-sm font-semibold">
        Répartition
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Column title="Par projet">
          {byProject.map((share) => (
            <Share
              key={share.key}
              share={share}
              label={share.label}
              onClick={typeof share.projectId === 'number' ? () => onProject(share.projectId as number) : undefined}
            />
          ))}
        </Column>
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
