import { EntitySchema } from '@mikro-orm/core';

export interface SourceRow {
  id: string;
  label: string;
  liveTracking: boolean;
  managed: boolean;
  path: string;
  watched: boolean;
}

export interface SessionRow {
  branch: null | string;
  changedFiles: { added: number; path: string; removed: number }[];
  turns: number;
  costMicros: number;
  endedAt: Date | null;
  lastAction: null | string;
  recentActions: string[];
  projectRoot: null | string;
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
  projectPath: null | string;
  sourceId: string;
  startedAt: Date;
  subagentCacheCreationTokens: number;
  subagentCacheReadTokens: number;
  subagentCostMicros: number;
  subagentInputTokens: number;
  subagentOutputTokens: number;
  title: null | string;
  usageComplete: boolean;
  /** Attente de la session, en JSON (dates en ISO 8601) */
  waiting: null | Record<string, unknown>;
}

/** Usage d'un tour d'une session (une réponse de l'agent) : la page Usage le compte par jour, projet et modèle. */
export interface SessionTurnRow {
  at: Date;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  id?: number;
  inputTokens: number;
  model: null | string;
  outputTokens: number;
  sessionId: string;
  /** Réponse d'un sous-agent de la session */
  subagent: boolean;
}

/** PR créée par l'agent d'une session, repérée dans son fil ; une adresse ne compte qu'une fois. */
export interface SessionPullRequestRow {
  at: Date;
  sessionId: string;
  url: string;
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
    managed: { type: 'boolean', default: false },
  },
});

export const SessionSchema = new EntitySchema<SessionRow>({
  name: 'Session',
  tableName: 'session',
  properties: {
    id: { type: 'string', primary: true },
    sourceId: { type: 'string', fieldName: 'source_id', index: true },
    projectPath: { type: 'string', fieldName: 'repo_path', nullable: true },
    projectRoot: { type: 'string', fieldName: 'repo_root', nullable: true },
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
    waiting: { type: 'json', nullable: true },
    endedAt: { type: 'datetime', fieldName: 'ended_at', nullable: true },
    turns: { type: 'integer', default: 0 },
    changedFiles: { type: 'json', fieldName: 'changed_files', default: '[]' },
    usageComplete: { type: 'boolean', fieldName: 'usage_complete', default: false },
    subagentInputTokens: { type: 'integer', fieldName: 'subagent_input_tokens', default: 0 },
    subagentOutputTokens: { type: 'integer', fieldName: 'subagent_output_tokens', default: 0 },
    subagentCacheCreationTokens: { type: 'integer', fieldName: 'subagent_cache_creation_tokens', default: 0 },
    subagentCacheReadTokens: { type: 'integer', fieldName: 'subagent_cache_read_tokens', default: 0 },
    subagentCostMicros: { type: 'integer', fieldName: 'subagent_cost_micros', default: 0 },
  },
});

export const SessionTurnSchema = new EntitySchema<SessionTurnRow>({
  name: 'SessionTurn',
  tableName: 'session_turn',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: true },
    sessionId: { type: 'string', fieldName: 'session_id', index: true },
    at: { type: 'datetime', index: true },
    model: { type: 'string', nullable: true },
    inputTokens: { type: 'integer', fieldName: 'input_tokens' },
    outputTokens: { type: 'integer', fieldName: 'output_tokens' },
    cacheCreationTokens: { type: 'integer', fieldName: 'cache_creation_tokens' },
    cacheReadTokens: { type: 'integer', fieldName: 'cache_read_tokens' },
    subagent: { type: 'boolean', default: false },
  },
});

export const SessionPullRequestSchema = new EntitySchema<SessionPullRequestRow>({
  name: 'SessionPullRequest',
  tableName: 'session_pull_request',
  properties: {
    url: { type: 'string', primary: true },
    sessionId: { type: 'string', fieldName: 'session_id', index: true },
    at: { type: 'datetime', index: true },
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
