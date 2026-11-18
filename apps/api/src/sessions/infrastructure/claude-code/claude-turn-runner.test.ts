// Ce que les scénarios ne voient pas : la ligne de commande d'un tour piloté, son contexte, le message reçu par l'agent
// (DT-31), la raison exacte que Claude Code donne quand il suspend « Approuver pour moi », et le jeton longue durée
// passé par l'environnement du tour.
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { TurnListener, TurnRequest } from '../../application/pilot.service.ts';
import { ClaudeTurnRunner, suspensionOf, turnArguments, UNREADABLE_TOKEN, userMessage } from './claude-turn-runner.ts';

const request: TurnRequest = {
  addDirs: [],
  appendSystemPrompt: null,
  launch: null,
  configDir: '/home/dev/.claude-perso',
  cwd: '/home/dev/site-perso',
  message: {
    images: [{ data: 'AAAA', mediaType: 'image/png', name: 'capture.png' }],
    text: 'Regarde @src/categories.ts',
  },
  resume: true,
  sessionId: 'c7e04a19',
  settings: { effort: 'high', model: 'claude-opus-5-5', permissionMode: 'plan' },
  tokenFile: null,
};

describe('turnArguments', () => {
  it('resumes the session with the settings of the message, permissions through the control protocol', () => {
    expect(turnArguments(request).join(' ')).toBe(
      '-p --input-format stream-json --output-format stream-json --verbose --permission-prompt-tool stdio --permission-mode plan --model claude-opus-5-5 --effort high --resume c7e04a19',
    );
  });

  it('creates a new session with its id, and leaves the model and the effort to the profile', () => {
    const args = turnArguments({
      ...request,
      resume: false,
      settings: { effort: null, model: null, permissionMode: 'ask' },
    });
    expect(args.slice(-4)).toEqual(['--permission-mode', 'default', '--session-id', 'c7e04a19']);
  });

  it('CA-CONT-07 · adds the context of the projects to the system prompt, the same at each turn', () => {
    const context = '# Contexte du projet site-perso\n\n## Décisions du projet\n\nDEC-1 Garder Jest pour les tests';
    const args = turnArguments({ ...request, appendSystemPrompt: context });
    expect(args.slice(args.indexOf('--append-system-prompt'), -2)).toEqual(['--append-system-prompt', context]);
  });
});

describe('userMessage', () => {
  it('sends the text, then the images in base64', () => {
    expect(userMessage(request)).toEqual({
      type: 'user',
      message: {
        role: 'user',
        content: [
          { type: 'text', text: 'Regarde @src/categories.ts' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
        ],
      },
    });
  });
});

describe('turnArguments with the five modes', () => {
  it('names the modes as Claude Code does', () => {
    const modes = (['ask', 'acceptEdits', 'plan', 'auto', 'bypassPermissions'] as const).map((permissionMode) => {
      const args = turnArguments({ ...request, settings: { ...request.settings, permissionMode } });
      return args[args.indexOf('--permission-mode') + 1];
    });
    expect(modes).toEqual(['default', 'acceptEdits', 'plan', 'auto', 'bypassPermissions']);
  });
});

describe('suspensionOf', () => {
  const ask = (reason: string) => ({
    subtype: 'can_use_tool',
    decision_reason: reason,
    decision_reason_type: 'classifier',
  });

  it('CA-SESS-168 · reads the refusals in a row or in total after which Claude Code suspends auto mode', () => {
    expect(
      suspensionOf(
        ask(
          '3 consecutive actions were blocked. Please review the transcript before continuing. Latest blocked action: rm',
        ),
      ),
    ).toEqual({ count: 3, total: false });
    expect(suspensionOf(ask('20 actions were blocked this session. Please review the transcript.'))).toEqual({
      count: 20,
      total: true,
    });
  });

  it('ignores any other permission request', () => {
    expect(suspensionOf({ subtype: 'can_use_tool', tool_name: 'Bash' })).toBeNull();
    expect(suspensionOf({ ...ask('3 consecutive actions were blocked'), decision_reason_type: 'rule' })).toBeNull();
  });
});

describe('the long-lived token of a turn', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bosco-token-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  // Faux Claude Code : il écrit sur sa sortie d'erreur le jeton qu'il a reçu, puis échoue
  const binary = join(dir, 'claude');
  writeFileSync(binary, '#!/bin/sh\necho "received ${CLAUDE_CODE_OAUTH_TOKEN:-none}" >&2\nexit 1\n');
  chmodSync(binary, 0o755);

  function run(tokenFile: null | string, env: Record<string, string> = {}): Promise<null | string> {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    try {
      return new Promise((resolve) => {
        const listener = { exited: resolve } as unknown as TurnListener;
        new ClaudeTurnRunner(binary).start({ ...request, cwd: dir, configDir: dir, tokenFile }, listener);
      });
    } finally {
      process.env = saved;
    }
  }

  it('CA-REGL-33 · passes the token read from its file at launch, and never shows it in an error', async () => {
    const file = join(dir, 'token');
    writeFileSync(file, 'sk-ant-oat01-fake-token-1234\n');
    const error = await run(file);
    expect(error).toBe('received …1234');
  });

  it('CA-REGL-33 · never passes the token of the environment of Bosco to a profile without one', async () => {
    const inherited = await run(null, { CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-from-bosco-9999' });
    expect(inherited).toBe('received none');
  });

  it('CA-REGL-33 · does not start a turn whose token no longer reads, and says why', async () => {
    const unreadable = await run(join(dir, 'missing'));
    expect(unreadable).toBe(UNREADABLE_TOKEN);
  });
});
