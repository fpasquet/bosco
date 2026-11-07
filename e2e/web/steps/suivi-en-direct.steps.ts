// Phrases du suivi en direct dans le web : installation dans un profil, et Claude Code qui attend une réponse.
import { expect } from '@playwright/test';
import { join } from 'node:path';
import { type HookResponse, sendHook, sourceIdOf } from '../../shared/hooks.ts';
import { Given, Then, When } from './fixtures.ts';

/** Demande d'autorisation encore ouverte, que Claude Code abandonne si le terminal répond le premier. */
let pendingRequest: AbortController | null = null;

function base(bosco: { profilesRoot: string }, sessionId: string, event: string) {
  return {
    session_id: sessionId,
    transcript_path: join(bosco.profilesRoot, 'transcript.jsonl'),
    cwd: join(bosco.profilesRoot, 'labo-ia', 'packages', 'bosco'),
    permission_mode: 'default',
    hook_event_name: event,
  };
}

Given('le suivi en direct est installé dans le profil {texte}', async ({ bosco }, profile: string) => {
  const id = await sourceIdOf(bosco.url, profile);
  const response = await fetch(`${bosco.url}/api/sources/${id}/live-tracking`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ backup: true }),
  });
  expect(response.ok).toBe(true);
});

Given(
  'la session {texte} du profil {texte} termine son tour en disant {texte}',
  async ({ bosco }, sessionId: string, profile: string, message: string) => {
    const response = await sendHook(bosco.profilesRoot, profile, {
      ...base(bosco, sessionId, 'Stop'),
      stop_hook_active: false,
      last_assistant_message: message,
    });
    expect(response.status).toBe(200);
  },
);

Given('la session {texte} du profil {texte} donne un signal', async ({ bosco }, sessionId: string, profile: string) => {
  const response = await sendHook(bosco.profilesRoot, profile, {
    ...base(bosco, sessionId, 'SessionStart'),
    source: 'startup',
  });
  expect(response.status).toBe(200);
});

Given(
  'la session {texte} du profil {texte} demande l’autorisation de lancer {texte}',
  async ({ bosco, pending }, sessionId: string, profile: string, command: string) => {
    pendingRequest = new AbortController();
    pending.hook = sendHook(
      bosco.profilesRoot,
      profile,
      { ...base(bosco, sessionId, 'PermissionRequest'), tool_name: 'Bash', tool_input: { command } },
      { signal: pendingRequest.signal },
    );
    pending.hook.catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 200));
  },
);

When('la personne répond dans le terminal', async () => {
  pendingRequest?.abort();
  pendingRequest = null;
  await new Promise((resolve) => setTimeout(resolve, 200));
});

Then('Claude Code reçoit la décision {texte}', async ({ pending }, behavior: string) => {
  const response = (await pending.hook) as HookResponse;
  expect(
    (response.body as { hookSpecificOutput: { decision: { behavior: string } } }).hookSpecificOutput.decision,
  ).toMatchObject({
    behavior,
  });
});

Then('Claude Code reçoit le refus avec le motif {texte}', async ({ pending }, message: string) => {
  const response = (await pending.hook) as HookResponse;
  expect((response.body as { hookSpecificOutput: { decision: unknown } }).hookSpecificOutput.decision).toEqual({
    behavior: 'deny',
    message,
  });
});

When('je clique sur le bouton {texte} de la source {texte}', async ({ page }, name: string, source: string) => {
  await page.getByRole('listitem').filter({ hasText: source }).getByRole('button', { name }).click();
});

When('je clique sur le bouton {texte} de la fenêtre', async ({ page }, name: string) => {
  await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
});

When('je clique sur le lien {texte} de la fenêtre', async ({ page }, name: string) => {
  await page.getByRole('dialog').getByRole('link', { name }).click();
});

When('je saisis {texte} dans le champ {texte}', async ({ page }, text: string, label: string) => {
  await page.getByLabel(label).fill(text);
});

Then('le bandeau des sessions qui t’attendent montre {texte}', async ({ page }, text: string) => {
  await expect(page.getByRole('region', { name: 'Sessions qui t’attendent' })).toContainText(text);
});

Then('je ne vois plus le bandeau des sessions qui t’attendent', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Sessions qui t’attendent' })).toHaveCount(0);
});
