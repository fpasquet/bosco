'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { SessionDto, SourcesDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNow } from '@/shared/hooks/use-now';
import { importProgressQuery, sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useLiveEvents } from '../../hooks/use-live-events';
import { usePermissionAnswers } from '../../hooks/use-permission-answers';
import { useOffline } from '../../lib/connection';
import { formatCost } from '../../lib/format';
import {
  endedToday,
  filterSessions,
  groupByProject,
  groupByState,
  indicatorsOf,
  openSessions,
  profileMark,
  waitingSessions,
} from '../../lib/overview';
import { useOverviewPreferences } from '../../lib/preferences';
import { AllowDialog } from '../allow-dialog';
import { ConnectionStatus } from '../connection-status';
import { EndedToday } from '../ended-today';
import { ImportProgressBanner } from '../import-progress-banner';
import { LiveTrackingHint } from '../live-tracking-hint';
import { LiveTrackingLine } from '../live-tracking-line';
import { OverviewHeader } from '../overview-header';
import { OverviewIndicators } from '../overview-indicators';
import { ProfileChoice } from '../profile-choice';
import { SessionsTable } from '../sessions-table';
import { StateBoard } from '../state-board';
import { WaitingActions, WaitingBanner } from '../waiting-banner';
import { Welcome } from '../welcome';

interface OverviewProps {
  project: null | string;
  title: string;
}

/** Lignes animées pendant un chargement : le premier affichage garde la forme de l'écran (CA-SESS-20, CA-SESS-22). */
const PENDING_ROWS = 4;

function LiveOverview({ project, sources, title }: OverviewProps & { sources: SourcesDto }) {
  const now = useNow();
  const [query, setQuery] = useState('');
  const { grouping, hideInactive, setGrouping, toggleHideInactive } = useOverviewPreferences();
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: progress } = useQuery(importProgressQuery);
  const inProject = (list: readonly SessionDto[]) =>
    project === null ? list : list.filter((session) => session.project?.name === project);
  const all = inProject(sessions ?? []);
  const open = openSessions(all, now);
  const visible = filterSessions(open, { hideInactive: grouping === 'project' && hideInactive, query, project });
  const indicators = indicatorsOf(open, all, now);
  const loading = sessions === undefined || progress !== null;
  const liveTracking = sources.sources.some((source) => source.liveTracking);
  const answers = usePermissionAnswers();
  const offline = useOffline();
  const actions = { busyId: answers.busyId, offline, onAllow: answers.onAllow };
  const opened = `${open.length} ${open.length > 1 ? 'sessions ouvertes' : 'session ouverte'}`;
  const summary = `${opened} · ${indicators.sessionsToday} aujourd’hui · ${formatCost(indicators.costToday)} estimés`;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <OverviewHeader
        title={title}
        now={now}
        grouping={grouping}
        onGroupingChange={setGrouping}
        hideInactive={hideInactive}
        onHideInactiveChange={toggleHideInactive}
        query={query}
        onQueryChange={setQuery}
        project={project}
        costToday={formatCost(indicators.costToday)}
        summary={grouping === 'state' ? summary : undefined}
      />
      <ConnectionStatus />
      {progress && <ImportProgressBanner progress={progress} />}
      {!liveTracking && <LiveTrackingLine />}
      {grouping === 'project' ? (
        <>
          {liveTracking && <WaitingBanner now={now} sessions={waitingSessions(open)} {...actions} />}
          {progress === null && sessions !== undefined && (
            <div className="hidden md:block">
              <OverviewIndicators indicators={indicators} now={now} />
            </div>
          )}
          <SessionsTable
            groups={groupByProject(visible)}
            markOf={(session) => profileMark(session, sources.sources)}
            now={now}
            pendingRows={loading ? PENDING_ROWS : 0}
            showFolder={project !== null}
            frozen={offline}
          />
        </>
      ) : (
        <StateBoard
          columns={groupByState(visible, liveTracking)}
          now={now}
          actionsOf={(session) => <WaitingActions session={session} {...actions} />}
        />
      )}
      {!loading && open.length === 0 && <p className="text-center text-muted">Aucune session ouverte aujourd’hui.</p>}
      {(project !== null || grouping === 'state') && <EndedToday project={project} sessions={endedToday(all, now)} />}
      <AllowDialog session={answers.confirming} onCancel={answers.cancel} onConfirm={answers.confirm} />
    </div>
  );
}

/** Vue d'ensemble : premier lancement tant qu'aucun profil n'est choisi (E1a), puis les sessions en direct (E1b à E1e). */
export function OverviewScreen({ project, title }: OverviewProps) {
  const { data } = useQuery(sourcesQuery);
  const watching = (data?.sources.length ?? 0) > 0;
  useLiveEvents(watching);
  if (!data) return <PageSkeleton variant="list" indicators />;
  if (!watching) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-6 md:px-8">
        <Welcome />
        <ProfileChoice candidates={data.candidates} home={data.home} />
        <LiveTrackingHint />
      </div>
    );
  }
  return <LiveOverview project={project} sources={data} title={title} />;
}
