// Serveurs MCP d'un profil Claude Code : Claude Code écrit lui-même sa configuration (`claude mcp add-json --scope user`),
// dans <profil>/.claude.json, ou ~/.claude.json pour ~/.claude. Bosco ne fait que la lire.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export class ClaudeMcpConfig {
  constructor(
    private readonly claudeBinary: string,
    /** Dossier personnel : le profil ~/.claude garde sa configuration dans ~/.claude.json */
    private readonly home: string,
  ) {}

  add(profilePath: string, name: string, server: Record<string, unknown>): Promise<void> {
    return this.claude(profilePath, ['mcp', 'add-json', '--scope', 'user', name, JSON.stringify(server)]);
  }

  remove(profilePath: string, name: string): Promise<void> {
    return this.claude(profilePath, ['mcp', 'remove', '--scope', 'user', name]);
  }

  async has(profilePath: string, name: string): Promise<boolean> {
    const file = this.isDefault(profilePath) ? join(this.home, '.claude.json') : join(profilePath, '.claude.json');
    try {
      const content = await readFile(file, 'utf8');
      const config = JSON.parse(content) as { mcpServers?: Record<string, unknown> };
      return Boolean(config.mcpServers?.[name]);
    } catch {
      return false;
    }
  }

  private isDefault(profilePath: string): boolean {
    return profilePath === join(this.home, '.claude');
  }

  private claude(profilePath: string, args: string[]): Promise<void> {
    const env = { ...process.env };
    // ~/.claude se lit sans dossier de configuration, depuis le dossier personnel que Bosco connaît
    if (this.isDefault(profilePath)) {
      delete env.CLAUDE_CONFIG_DIR;
      env.HOME = this.home;
    } else env.CLAUDE_CONFIG_DIR = profilePath;
    return new Promise((resolve, reject) => {
      const child = spawn(this.claudeBinary, args, { env, stdio: ['ignore', 'ignore', 'pipe'] });
      let error = '';
      child.stderr?.on('data', (chunk: Buffer) => {
        error += chunk.toString();
      });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(error.trim() || `claude ${args.join(' ')} answered ${code}`)),
      );
    });
  }
}
