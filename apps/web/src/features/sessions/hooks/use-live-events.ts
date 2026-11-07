'use client';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { LiveEventDto, SessionDto } from '@bosco/domain';
import { importProgressQuery, sessionsQuery } from '../api/sessions';
import { settledNotice, useNotices } from '../lib/notices';
import { useSettlements } from '../lib/settlements';

type EventOf<T extends LiveEventDto['type']> = Extract<LiveEventDto, { type: T }>['data'];

function upsert(sessions: SessionDto[] | undefined, session: SessionDto): SessionDto[] {
  const others = (sessions ?? []).filter((known) => known.id !== session.id);
  return [...others, session];
}

function listen(source: EventSource, client: QueryClient): void {
  const on = <T extends LiveEventDto['type']>(type: T, apply: (data: EventOf<T>) => void) =>
    source.addEventListener(type, (event) => apply(JSON.parse((event as MessageEvent<string>).data) as EventOf<T>));
  on('sessions.snapshot', ({ sessions }) => client.setQueryData(sessionsQuery.queryKey, sessions));
  on('session.updated', ({ session }) => {
    client.setQueryData<SessionDto[]>(sessionsQuery.queryKey, (sessions) => upsert(sessions, session));
    // Le détail ouvert de cette session relit son fil (E2a, CA-SESS-27)
    void client.invalidateQueries({ queryKey: ['session', session.id] });
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
 * (CA-SESS-16). EventSource se reconnecte seul et reçoit un nouvel instantané.
 */
export function useLiveEvents(enabled: boolean): void {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource('/api/events');
    listen(source, client);
    return () => source.close();
  }, [client, enabled]);
}
