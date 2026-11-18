// Ce que les scénarios ne voient pas, faute de Docker : le lancement exact du conteneur de l'agent d'un bac à sable.
import { describe, expect, it } from 'vitest';
import { agentRunArgs } from './docker-sandbox-containers.ts';

const volumes = (args: readonly string[]) =>
  args.flatMap((arg, index) => (args[index - 1] === '--volume' ? [arg] : []));

describe('agent container of a sandbox', () => {
  const args = agentRunArgs(
    {
      key: 'c41e9a0712ab',
      mounts: [
        { from: '/data/sandboxes/c41e9a07/repo', to: '/home/camille/www/api-tarifs' },
        { from: '/data/sandboxes/c41e9a07/home', to: '/home/agent' },
      ],
      name: 'bosco-s-c41e9a0712ab-agent',
      network: 'bosco-s-c41e9a0712ab',
      workdir: '/home/camille/www/api-tarifs',
    },
    { claudeBinary: '/home/camille/.local/bin/claude', user: '1000:1000' },
  );

  it('CA-SESS-107 · mounts only the copies of the session and Claude Code, with the ceilings and no rights', () => {
    expect(volumes(args)).toEqual([
      '/home/camille/.local/bin/claude:/usr/local/bin/claude:ro',
      '/data/sandboxes/c41e9a07/repo:/home/camille/www/api-tarifs',
      '/data/sandboxes/c41e9a07/home:/home/agent',
    ]);
    expect(args.join(' ')).toContain('--memory 4294967296 --cpus 2 --pids-limit 512');
    expect(args.join(' ')).toContain('--user 1000:1000 --cap-drop ALL --security-opt no-new-privileges');
    expect(args).toContain('ENABLE_CLAUDEAI_MCP_SERVERS=false');
    expect(args.join(' ')).toContain('--network bosco-s-c41e9a0712ab');
  });
});
