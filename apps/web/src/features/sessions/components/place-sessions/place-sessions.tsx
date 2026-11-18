'use client';
import { useQuery } from '@tanstack/react-query';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useNow } from '@/shared/hooks/use-now';
import { groupQuery } from '../../api/groups';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useLiveEvents } from '../../hooks/use-live-events';
import { usePermissionAnswers } from '../../hooks/use-permission-answers';
import { useOffline } from '../../lib/connection';
import {
  endedToday,
  indicatorsOf,
  openSessions,
  profileMark,
  sessionsIn,
  sortSessions,
  waitingSessions,
} from '../../lib/overview';
import { AllowDialog } from '../allow-dialog';
import { ConnectionStatus } from '../connection-status';
import { EndedToday } from '../ended-today';
import { OverviewIndicators } from '../overview-indicators';
import { SessionsTable } from '../sessions-table';
import { WaitingBanner } from '../waiting-banner';

/** Page d'un projet ou d'un groupe, dont l'onglet Sessions réunit les sessions. */
export type SessionsPlace = { id: number; kind: 'group' } | { id: number; kind: 'project' };

/**
 * Onglet Sessions de la page d'un projet ou d'un groupe : le bandeau T'attend, les indicateurs et le tableau ne
 * comptent que les sessions de ses projets, avec les mêmes boutons et règles que la vue d'ensemble ; les terminées
 * du jour mènent à l'historique.
 */
export function PlaceSessions({ place }: { place: SessionsPlace }) {
  const now = useNow();
  const { data: sources } = useQuery(sourcesQuery);
  useLiveEvents((sources?.sources.length ?? 0) > 0);
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: group } = useQuery({ ...groupQuery(place.id), enabled: place.kind === 'group' });
  const answers = usePermissionAnswers();
  const offline = useOffline();
  const projects = place.kind === 'project' ? [place.id] : group?.projects.map(({ id }) => id);
  if (!sessions || !sources || !projects) return <SectionSkeleton rows={4} />;
  const all = sessionsIn(sessions, projects);
  const open = openSessions(all, now);
  const indicators = indicatorsOf(open, all, now);
  const liveTracking = sources.sources.some((source) => source.liveTracking);
  const ended = endedToday(all, now);
  const projectName = all[0]?.project?.name;
  const inProject = place.kind === 'project';
  return (
    <div className="flex flex-col gap-4">
      <ConnectionStatus />
      {liveTracking && (
        <WaitingBanner
          now={now}
          sessions={waitingSessions(open)}
          busyId={answers.busyId}
          offline={offline}
          onAllow={answers.onAllow}
        />
      )}
      <div className="hidden md:block">
        <OverviewIndicators indicators={indicators} now={now} />
      </div>
      {open.length > 0 && (
        <SessionsTable
          groups={[{ name: null, sessions: sortSessions(open) }]}
          column={inProject ? 'folder' : 'project'}
          markOf={(session) => profileMark(session, sources.sources)}
          now={now}
          frozen={offline}
        />
      )}
      {open.length === 0 && (
        <p className="rounded-card border border-line bg-surface px-4 py-3 text-muted">
          {inProject ? 'Aucune session ouverte dans ce projet.' : 'Aucune session ouverte dans ce groupe.'}
        </p>
      )}
      <EndedToday
        sessions={ended}
        scope={
          inProject && projectName
            ? { history: `/history?project=${encodeURIComponent(projectName)}`, label: 'dans ce projet' }
            : { history: '/history', label: 'dans ce groupe' }
        }
      />
      <AllowDialog session={answers.confirming} onCancel={answers.cancel} onConfirm={answers.confirm} />
    </div>
  );
}
