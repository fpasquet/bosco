// Phrases Claude Code : des profils et des transcripts écrits comme le fait Claude Code, dans le dossier du scénario.
import { utimesSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSCRIPTS } from '../../shared/transcripts.ts';
import { Given } from './fixtures.ts';

const written = new Map<string, string>();

Given(
  'the Claude Code profile {string} has the transcript {string} for the session {string}',
  ({ bosco }, profile: string, fixture: string, sessionId: string) => {
    written.set(sessionId, bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, fixture), sessionId));
  },
);

Given(
  'the transcript of the session {string} was last modified {int} days ago',
  ({}, sessionId: string, days: number) => {
    const file = written.get(sessionId);
    if (!file) throw new Error(`No transcript written for the session ${sessionId}`);
    const at = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    utimesSync(file, at, at);
  },
);
