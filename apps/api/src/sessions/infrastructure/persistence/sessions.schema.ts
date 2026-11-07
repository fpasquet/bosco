import { EntitySchema } from '@mikro-orm/core';

export interface SourceRow {
  id: string;
  label: string;
  liveTracking: boolean;
  path: string;
  watched: boolean;
}

export interface SessionRow {
  branch: null | string;
  costMicros: number;
  lastAction: null | string;
  recentActions: string[];
  repoRoot: null | string;
  unpricedTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  id: string;
  inputTokens: number;
  lastEventAt: Date;
  lastMessage: null | string;
  model: null | string;
  nextSeq: number;
  outputTokens: number;
  repoPath: null | string;
  sourceId: string;
  startedAt: Date;
  title: null | string;
}

/** Journal d'une session : une ligne par événement, numérotée, jamais modifiée. */
export interface SessionEventRow {
  at: Date;
  kind: string;
  seq: number;
  sessionId: string;
  text: string;
}

/** Position de lecture d'un transcript : la lecture reprend là où elle s'était arrêtée. */
export interface TranscriptCursorRow {
  offset: number;
  path: string;
}

export const SourceSchema = new EntitySchema<SourceRow>({
  name: 'Source',
  tableName: 'source',
  properties: {
    id: { type: 'string', primary: true },
    path: { type: 'string', unique: true },
    label: { type: 'string' },
    watched: { type: 'boolean' },
    liveTracking: { type: 'boolean', fieldName: 'live_tracking' },
  },
});

export const SessionSchema = new EntitySchema<SessionRow>({
  name: 'Session',
  tableName: 'session',
  properties: {
    id: { type: 'string', primary: true },
    sourceId: { type: 'string', fieldName: 'source_id', index: true },
    repoPath: { type: 'string', fieldName: 'repo_path', nullable: true },
    repoRoot: { type: 'string', fieldName: 'repo_root', nullable: true },
    branch: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    model: { type: 'string', nullable: true },
    startedAt: { type: 'datetime', fieldName: 'started_at' },
    lastEventAt: { type: 'datetime', fieldName: 'last_event_at', index: true },
    lastMessage: { type: 'text', fieldName: 'last_message', nullable: true },
    lastAction: { type: 'text', fieldName: 'last_action', nullable: true },
    recentActions: { type: 'json', fieldName: 'recent_actions', default: '[]' },
    inputTokens: { type: 'integer', fieldName: 'input_tokens' },
    outputTokens: { type: 'integer', fieldName: 'output_tokens' },
    cacheCreationTokens: { type: 'integer', fieldName: 'cache_creation_tokens' },
    cacheReadTokens: { type: 'integer', fieldName: 'cache_read_tokens' },
    nextSeq: { type: 'integer', fieldName: 'next_seq' },
    costMicros: { type: 'integer', fieldName: 'cost_micros', default: 0 },
    unpricedTokens: { type: 'integer', fieldName: 'unpriced_tokens', default: 0 },
  },
});

export const SessionEventSchema = new EntitySchema<SessionEventRow>({
  name: 'SessionEvent',
  tableName: 'session_event',
  properties: {
    sessionId: { type: 'string', fieldName: 'session_id', primary: true },
    seq: { type: 'integer', primary: true },
    at: { type: 'datetime' },
    kind: { type: 'string' },
    text: { type: 'text' },
  },
});

export const TranscriptCursorSchema = new EntitySchema<TranscriptCursorRow>({
  name: 'TranscriptCursor',
  tableName: 'transcript_cursor',
  properties: {
    path: { type: 'string', primary: true },
    offset: { type: 'integer' },
  },
});
