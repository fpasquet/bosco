'use client';
import { ChevronDown, Globe, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu } from 'radix-ui';
import type { SandboxRefusalsDto } from '@bosco/domain';
import { clockOf } from '../../lib/detail';

export interface SandboxRefusalsProps extends SandboxRefusalsDto {
  /** Projet de la session, dont les domaines propres peuvent recevoir le domaine refusé ; null hors projet */
  project: null | { id: number; name: string };
}

const ITEM = 'flex cursor-pointer items-center gap-2 px-3 py-2 outline-none focus:bg-surface-alt';

/** Réglages qui ouvrent le champ d'ajout d'un domaine, déjà rempli. */
function withDomain(path: string, host: string): string {
  return `${path}?domain=${encodeURIComponent(host)}`;
}

/** « Ajouter à la liste » : aux domaines du projet de la session, ou à la liste générale du bac à sable. */
function AddToList({ host, project }: { host: string; project: SandboxRefusalsProps['project'] }) {
  if (!project) {
    return (
      <Link
        href={withDomain('/settings/sandbox', host)}
        className="link text-xs font-medium link-primary max-md:hidden"
      >
        Ajouter à la liste
      </Link>
    );
  }
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Ajouter à la liste : ${host}`}
          className="btn gap-1 btn-ghost text-xs btn-xs max-md:hidden"
        >
          Ajouter à la liste
          <ChevronDown aria-hidden className="size-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 max-w-xs min-w-56 overflow-hidden rounded-card border border-line bg-surface text-sm text-ink shadow-overlay"
        >
          <DropdownMenu.Label className="border-b border-line px-3 py-2 font-mono text-xs text-muted">
            {host}
          </DropdownMenu.Label>
          <DropdownMenu.Item asChild className={ITEM}>
            <Link href={withDomain(`/projects/${project.id}/settings`, host)}>
              <Globe aria-hidden className="size-4 text-muted" />
              Aux domaines de {project.name}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={ITEM}>
            <Link href={withDomain('/settings/sandbox', host)}>
              <ShieldX aria-hidden className="size-4 text-muted" />À la liste générale
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * Sorties réseau refusées d'un bac à sable (E2j, CA-SESS-108) : le domaine et l'heure, à la fin du fil. « Ajouter à
 * la liste » ouvre, sur le poste, les domaines du projet de la session ou la liste générale, le domaine déjà rempli.
 */
export function SandboxRefusals({ project, refusals }: SandboxRefusalsProps) {
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
          <AddToList host={host} project={project} />
        </li>
      ))}
    </ul>
  );
}
