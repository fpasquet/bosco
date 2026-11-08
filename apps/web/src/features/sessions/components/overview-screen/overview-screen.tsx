'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { SessionDto, SourcesDto } from '@bosco/domain';
import { importProgressQuery, sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useLiveEvents } from '../../hooks/use-live-events';
import { useNow } from '../../hooks/use-now';
import { usePermissionAnswers } from '../../hooks/use-permission-answers';
import { formatCost } from '../../lib/format';
import {
  filterSessions,
  groupByRepository,
  groupByState,
  indicatorsOf,
  openSessions,
  profileMark,
  waitingSessions,
} from '../../lib/overview';
import { useOverviewPreferences } from '../../lib/preferences';
import { AllowDialog } from '../allow-dialog';
import { ImportProgressBanner } from '../import-progress-banner';
import { LiveTrackingHint } from '../live-tracking-hint';
import { LiveTrackingLine } from '../live-tracking-line';
import { Notices } from '../notices';
import { OverviewHeader } from '../overview-header';
import { OverviewIndicators } from '../overview-indicators';
import { ProfileChoice } from '../profile-choice';
import { SessionsTable } from '../sessions-table';
import { StateBoard } from '../state-board';
import { WaitingActions, WaitingBanner } from '../waiting-banner';
import { Welcome } from '../welcome';

interface OverviewProps {
  repository: null | string;
  title: string;
}

/** Lignes animées pendant un chargement : le premier affichage garde la forme de l'écran (CA-SESS-20, CA-SESS-22). */
const PENDING_ROWS = 4;

function LiveOverview({ repository, sources, title }: OverviewProps & { sources: SourcesDto }) {
  const now = useNow();
  const [query, setQuery] = useState('');
  const { grouping, hideInactive, setGrouping, toggleHideInactive } = useOverviewPreferences();
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: progress } = useQuery(importProgressQuery);
  const inRepository = (list: readonly SessionDto[]) =>
    repository === null ? list : list.filter((session) => session.repository?.name === repository);
  const all = inRepository(sessions ?? []);
  const open = openSessions(all, now);
  const visible = filterSessions(open, { hideInactive: grouping === 'repository' && hideInactive, query, repository });
  const indicators = indicatorsOf(open, all, now);
  const loading = sessions === undefined || progress !== null;
  const liveTracking = sources.sources.some((source) => source.liveTracking);
  const answers = usePermissionAnswers();
  const actions = { busyId: answers.busyId, onAllow: answers.onAllow };
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
        repository={repository}
        costToday={formatCost(indicators.costToday)}
        summary={grouping === 'state' ? summary : undefined}
      />
      {progress && <ImportProgressBanner progress={progress} />}
      {!liveTracking && <LiveTrackingLine />}
      {grouping === 'repository' ? (
        <>
          {liveTracking && <WaitingBanner now={now} sessions={waitingSessions(open)} {...actions} />}
          {progress === null && sessions !== undefined && (
            <div className="hidden md:block">
              <OverviewIndicators indicators={indicators} now={now} />
            </div>
          )}
          <SessionsTable
            groups={groupByRepository(visible)}
            markOf={(session) => profileMark(session, sources.sources)}
            now={now}
            pendingRows={loading ? PENDING_ROWS : 0}
            showFolder={repository !== null}
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
      <AllowDialog session={answers.confirming} onCancel={answers.cancel} onConfirm={answers.confirm} />
      <Notices />
    </div>
  );
}

/** Vue d'ensemble : premier lancement tant qu'aucun profil n'est choisi (E1a), puis les sessions en direct (E1b à E1e). */
export function OverviewScreen({ repository, title }: OverviewProps) {
  const { data } = useQuery(sourcesQuery);
  const watching = (data?.sources.length ?? 0) > 0;
  useLiveEvents(watching);
  if (!data) return null;
  if (!watching) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-6 md:px-8">
        <Welcome />
        <ProfileChoice candidates={data.candidates} home={data.home} />
        <LiveTrackingHint />
      </div>
    );
  }
  return <LiveOverview repository={repository} sources={data} title={title} />;
}
