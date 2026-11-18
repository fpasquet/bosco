import { expect } from '@playwright/test';
// Phrases des profils de Claude Code, écrits dans le dossier du scénario comme le fait Claude Code.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSCRIPTS } from '../../shared/transcripts.ts';
import { Given } from './fixtures.ts';

Given(
  'le profil Claude Code {texte} contient le transcript {texte} de la session {texte}',
  ({ bosco, transcripts }, profile: string, transcript: string, sessionId: string) => {
    transcripts.set(sessionId, bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, transcript), sessionId));
  },
);

Given(
  'une nouvelle version de Claude Code écrit les sessions du profil {texte} dans un format inconnu',
  async ({ bosco }, profile: string) => {
    // Trois nouveaux transcripts illisibles d'affilée : la source passe « À mettre à jour »
    for (const sessionId of ['0d1e2f30', '0d1e2f31', '0d1e2f32'])
      bosco.writeProfileTranscript(profile, join(TRANSCRIPTS, 'session-unknown-format.jsonl'), sessionId);
    const unreadable = async () => {
      const response = await fetch(`${bosco.url}/api/sources`);
      const body = (await response.json()) as { sources: { path: string; unreadable: boolean }[] };
      return body.sources.find(({ path }) => path.endsWith(`/${profile}`))?.unreadable;
    };
    await expect.poll(unreadable).toBe(true);
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

Given('le projet {texte} a le fichier des services de test {texte}', ({ bosco }, project: string, fixture: string) => {
  copyFileSync(
    join(import.meta.dirname, '../../shared/compose', fixture),
    join(bosco.profilesRoot, project, 'compose.yaml'),
  );
});

Given(
  'le profil Claude Code {texte} a accès à l’abonnement Claude de {texte}',
  ({ bosco }, profile: string, email: string) => {
    const dir = join(bosco.profilesRoot, profile);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '.credentials.json'), '{}');
    writeFileSync(join(dir, '.claude.json'), JSON.stringify({ oauthAccount: { emailAddress: email } }));
  },
);

Given('le poste a le fichier npm {texte}', ({ bosco }, fixture: string) => {
  copyFileSync(join(import.meta.dirname, '../../shared/npm', fixture), join(bosco.profilesRoot, '.npmrc'));
});
