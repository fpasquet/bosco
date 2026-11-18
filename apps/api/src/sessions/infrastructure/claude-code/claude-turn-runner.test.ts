// Ce que les scénarios ne voient pas : la ligne de commande d'un tour piloté, le message reçu par l'agent (DT-31) et la
// raison exacte que Claude Code donne quand il suspend « Approuver pour moi ».
import { describe, expect, it } from 'vitest';
import type { TurnRequest } from '../../application/pilot.service.ts';
import { suspensionOf, turnArguments, userMessage } from './claude-turn-runner.ts';

const request: TurnRequest = {
  addDirs: [],
  launch: null,
  configDir: '/home/dev/.claude-perso',
  cwd: '/home/dev/api-voix',
  message: { images: [{ data: 'AAAA', mediaType: 'image/png', name: 'capture.png' }], text: 'Regarde @src/lexique.ts' },
  resume: true,
  sessionId: 'c7e04a19',
  settings: { effort: 'high', model: 'claude-opus-5-5', permissionMode: 'plan' },
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
});

describe('userMessage', () => {
  it('sends the text, then the images in base64', () => {
    expect(userMessage(request)).toEqual({
      type: 'user',
      message: {
        role: 'user',
        content: [
          { type: 'text', text: 'Regarde @src/lexique.ts' },
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
