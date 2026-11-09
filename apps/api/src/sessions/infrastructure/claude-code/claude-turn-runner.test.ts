// Ce que les scénarios ne voient pas : la ligne de commande d'un tour piloté et le message reçu par l'agent (DT-31).
import { describe, expect, it } from 'vitest';
import type { TurnRequest } from '../../application/pilot.service.ts';
import { turnArguments, userMessage } from './claude-turn-runner.ts';

const request: TurnRequest = {
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
