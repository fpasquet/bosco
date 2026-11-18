'use client';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { LiveEventDto, ProjectsDto, SessionDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import { importProgressQuery, sessionsQuery } from '../api/sessions';
import { RETRY_MS, useConnection } from '../lib/connection';
import { settledNotice } from '../lib/notices';
import { useSettlements } from '../lib/settlements';

type EventOf<T extends LiveEventDto['type']> = Extract<LiveEventDto, { type: T }>['data'];

function upsert(sessions: SessionDto[] | undefined, session: SessionDto): SessionDto[] {
  const others = (sessions ?? []).filter((known) => known.id !== session.id);
  return [...others, session];
}

/** Un dépôt adopté pendant qu'une session tourne : sa session arrive avec un projet que la liste ne connaît pas encore. */
function joinsUnknownProject(client: QueryClient, session: SessionDto): boolean {
  if (!session.project) return false;
  const known = client.getQueryData<ProjectsDto>(['projects', 'overview']);
  return known !== undefined && !known.projects.some((project) => project.id === session.project?.id);
}

function listen(source: EventSource, client: QueryClient): void {
  const on = <T extends LiveEventDto['type']>(type: T, apply: (data: EventOf<T>) => void) =>
    source.addEventListener(type, (event) => {
      useConnection.getState().markData();
      apply(JSON.parse((event as MessageEvent<string>).data) as EventOf<T>);
    });
  on('sessions.snapshot', ({ sessions }) => client.setQueryData(sessionsQuery.queryKey, sessions));
  on('session.updated', ({ session }) => {
    client.setQueryData<SessionDto[]>(sessionsQuery.queryKey, (sessions) => upsert(sessions, session));
    // Le détail ouvert de cette session relit son fil
    void client.invalidateQueries({ queryKey: ['session', session.id] });
    // Les projets, leurs listes de choix et les groupes relisent le nouveau projet
    if (joinsUnknownProject(client, session))
      for (const queryKey of [['projects'], ['pilot', 'options'], ['groups']])
        void client.invalidateQueries({ queryKey });
  });
  on('import.progress', ({ progress }) => client.setQueryData(importProgressQuery.queryKey, progress));
  on('permission.settled', ({ outcome, sessionId, title }) => {
    useSettlements.getState().record(sessionId, outcome);
    const notice = settledNotice(outcome, title ?? `Session ${sessionId.slice(0, 8)}`);
    useNotices.getState().push(notice.text, notice.tone);
  });
}

/**
 * Abonne le cache des sessions au flux en direct : l'instantané le remplace, chaque changement y entre aussitôt
 *. Une coupure est signalée aussitôt et une reconnexion tentée toutes les 5 s, ou tout de suite par
 * « Réessayer » ; la reconnexion reçoit un nouvel instantané.
 */
export function useLiveEvents(enabled: boolean): void {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const connection = useConnection.getState();
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      clearTimeout(timer);
      source?.close();
      source = new EventSource('/api/events');
      listen(source, client);
      source.addEventListener('open', () => useConnection.getState().markOnline());
      source.addEventListener('error', () => {
        source?.close();
        useConnection.getState().markOffline(new Date(Date.now() + RETRY_MS).toISOString());
        timer = setTimeout(connect, RETRY_MS);
      });
    };
    connection.setRetry(connect);
    connect();
    return () => {
      clearTimeout(timer);
      source?.close();
    };
  }, [client, enabled]);
}
