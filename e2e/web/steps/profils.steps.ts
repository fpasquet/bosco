// Phrases des profils de Claude Code, écrits dans le dossier du scénario comme le fait Claude Code.
import { join } from 'node:path';
import { TRANSCRIPTS } from '../../shared/transcripts.ts';
import { Given } from './fixtures.ts';

Given(
  'le profil Claude Code {texte} contient le transcript {texte} de la session {texte}',
  ({ bosco }, profile: string, transcript: string, sessionId: string) => {
    bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, transcript), sessionId);
  },
);
