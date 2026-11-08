import { expect } from '@playwright/test';
// Phrases des profils de Claude Code, écrits dans le dossier du scénario comme le fait Claude Code.
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSCRIPTS } from '../../shared/transcripts.ts';
import { Given } from './fixtures.ts';

Given(
  'le profil Claude Code {texte} contient le transcript {texte} de la session {texte}',
  ({ bosco, transcripts }, profile: string, transcript: string, sessionId: string) => {
    transcripts.set(sessionId, bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, transcript), sessionId));
  },
);

Given('Bosco surveille les profils {texte} et {texte}', async ({ bosco }, first: string, second: string) => {
  const response = await fetch(`${bosco.url}/api/sources`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths: [join(bosco.profilesRoot, first), join(bosco.profilesRoot, second)] }),
  });
  expect(response.ok).toBe(true);
});

Given(
  'le dépôt {texte} a le fichier des services de test {texte}',
  ({ bosco }, repository: string, fixture: string) => {
    copyFileSync(
      join(import.meta.dirname, '../../shared/compose', fixture),
      join(bosco.profilesRoot, repository, 'compose.yaml'),
    );
  },
);
