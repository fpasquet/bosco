// Ce que les scénarios ne voient pas : le serveur du canal se déclare canal auprès de Claude Code (DT-32).
import { describe, expect, it } from 'vitest';
import { answer } from './channel.ts';

describe('answer', () => {
  it('declares the claude/channel capability with instructions, and nothing else', () => {
    const init = answer({ id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
    expect(init).toMatchObject({
      id: 1,
      result: {
        protocolVersion: '2025-11-25',
        capabilities: { experimental: { 'claude/channel': {} } },
        serverInfo: { name: 'bosco-channel' },
      },
    });
    expect(answer({ id: 2, method: 'tools/list' })).toEqual({ jsonrpc: '2.0', id: 2, result: { tools: [] } });
    expect(answer({ method: 'notifications/initialized' })).toBeNull();
  });
});
