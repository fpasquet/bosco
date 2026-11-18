import { Box, Copy, FolderOpen, MessageSquare, RadioTower } from 'lucide-react';
import type { SessionDto } from '@bosco/domain';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Button } from '@/shared/ui/button';
import { elapsed } from '../../lib/format';
import { SessionStateBadge } from '../session-state-badge';
import { titleOf } from '../sessions-table';
import { placeOf } from '../waiting-banner';

export interface SessionHeaderProps {
  /** Marque du profil (« perso ») quand ce n'est pas le profil par défaut */
  mark: null | string;
  now: Date;
  onCopy: (text: string, label: string) => void;
  profile: null | string;
  /** Commande de reprise d'une session close (CA-SESS-42) ; null tant qu'elle est ouverte */
  resume: null | string;
  session: SessionDto;
}

function since(session: SessionDto, now: Date): string {
  const started = elapsed(new Date(session.startedAt), now);
  if (session.state === 'waiting' && session.waiting)
    return `${started} · attend depuis ${elapsed(new Date(session.waiting.since), now)}`;
  if (session.state === 'running') return `en cours depuis ${started}`;
  return `dernier événement il y a ${elapsed(new Date(session.lastEventAt), now)}`;
}

/** En-tête du détail d'une session (E2a) : état, titre, projet, profil, durée, et ce qu'on peut copier. */
export function SessionHeader({ mark, now, onCopy, profile, resume, session }: SessionHeaderProps) {
  const folder = session.project ? session.projectPath : null;
  return (
    <header className="flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1">
        {/* Place fixe, quelle que soit l'entrée : le projet principal de la session, sinon « Hors projet » */}
        <Breadcrumbs
          items={
            session.project
              ? [
                  { href: '/projects', label: 'Projets' },
                  { href: `/projects/${session.project.id}/sessions`, label: session.project.name },
                ]
              : [{ label: 'Hors projet' }]
          }
        />
        <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold tracking-tight md:text-2xl">
          <SessionStateBadge state={session.state} />
          <span className="line-clamp-2 min-w-0">{titleOf(session)}</span>
          {session.pilot?.sandbox ? (
            <span className="badge gap-1 badge-soft font-sans badge-sm font-medium badge-primary">
              <Box aria-hidden className="size-3" />
              Bac à sable
            </span>
          ) : (
            session.pilot && (
              <span className="badge gap-1 badge-outline font-sans badge-sm font-normal text-muted">
                <MessageSquare aria-hidden className="size-3" />
                Pilotée dans Bosco
              </span>
            )
          )}
          {session.channel && (
            <span className="badge gap-1 badge-outline font-sans badge-sm font-normal text-muted">
              <RadioTower aria-hidden className="size-3" />
              Canal de Bosco
            </span>
          )}
          {mark && (
            <span className="rounded-sm border border-line px-1 font-mono text-xs font-normal text-muted">{mark}</span>
          )}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {[placeOf(session), profile && `profil ${profile}`, since(session, now)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="hidden gap-2 md:flex">
        {resume && (
          <Button variant="outline" size="sm" onClick={() => onCopy(resume, 'Commande de reprise copiée')}>
            <Copy aria-hidden className="size-3.5" />
            Copier la reprise
          </Button>
        )}
        {folder && (
          <Button variant="outline" size="sm" onClick={() => onCopy(folder, 'Chemin du dossier copié')}>
            <FolderOpen aria-hidden className="size-3.5" />
            Copier le chemin du dossier
          </Button>
        )}
      </div>
    </header>
  );
}
