import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import type { SandboxRefusalsDto } from '@bosco/domain';
import { clockOf } from '../../lib/detail';

/**
 * Sorties réseau refusées d'un bac à sable (E2j, CA-SESS-108) : le domaine et l'heure, à la fin du fil ; le domaine
 * s'ajoute aux domaines autorisés de l'isolation du bac à sable, sur le poste.
 */
export function SandboxRefusals({ refusals }: SandboxRefusalsDto) {
  if (refusals.length === 0) return null;
  // Plusieurs refus d'un même domaine ne font qu'une ligne : la plus récente
  const byHost = new Map(refusals.map((refusal) => [refusal.host, refusal]));
  return (
    <ul aria-label="Sorties réseau refusées" className="mt-3 flex flex-col gap-2">
      {[...byHost.values()].map(({ at, host }) => (
        <li
          key={host}
          className="flex flex-wrap items-center gap-2 rounded-card border border-warning bg-warning-soft px-3 py-2 text-sm"
        >
          <ShieldX aria-hidden className="size-4 shrink-0 text-warning" />
          <span className="min-w-0 flex-1">
            <b className="font-semibold">Sortie réseau refusée</b> · <span className="font-mono">{host}</span> ·{' '}
            <time dateTime={at} className="font-mono tabular-nums">
              {clockOf(at)}
            </time>
          </span>
          <Link href="/settings/sandbox" className="link text-xs font-medium link-primary max-md:hidden">
            Ajouter à la liste
          </Link>
        </li>
      ))}
    </ul>
  );
}
