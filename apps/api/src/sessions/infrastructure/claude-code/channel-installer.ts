// Installation du canal de Bosco dans un profil Claude Code (E4f) : `claude mcp add-json --scope user`, comme le serveur
// MCP de Ma session ; Claude Code écrit lui-même sa configuration (<profil>/.claude.json, ~/.claude.json pour ~/.claude).
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ChannelInstaller } from '../../application/channel.service.ts';
import { CHANNEL_SERVER, channelLaunchCommand } from '../../domain/channel.ts';

/** Ce que Claude Code lance pour le canal : la commande `channel` de Bosco, avec l'adresse de son service. */
export interface ChannelEntry {
  args: string[];
  command: string;
  env: Record<string, string>;
}

export class ClaudeChannelInstaller implements ChannelInstaller {
  constructor(
    private readonly claudeBinary: string,
    private readonly entry: ChannelEntry,
    /** Dossier personnel : le profil ~/.claude garde sa configuration dans ~/.claude.json */
    private readonly home: string,
  ) {}

  async install(profilePath: string): Promise<void> {
    const server = JSON.stringify({ type: 'stdio', ...this.entry });
    await this.claude(profilePath, ['mcp', 'add-json', '--scope', 'user', CHANNEL_SERVER, server]);
  }

  launchCommand(profilePath: string): string {
    return channelLaunchCommand(profilePath, this.home);
  }

  async uninstall(profilePath: string): Promise<void> {
    await this.claude(profilePath, ['mcp', 'remove', '--scope', 'user', CHANNEL_SERVER]);
  }

  async isInstalled(profilePath: string): Promise<boolean> {
    const file = this.isDefault(profilePath) ? join(this.home, '.claude.json') : join(profilePath, '.claude.json');
    try {
      const content = await readFile(file, 'utf8');
      const config = JSON.parse(content) as { mcpServers?: Record<string, unknown> };
      return Boolean(config.mcpServers?.[CHANNEL_SERVER]);
    } catch {
      return false;
    }
  }

  private isDefault(profilePath: string): boolean {
    return profilePath === join(this.home, '.claude');
  }

  private claude(profilePath: string, args: string[]): Promise<void> {
    const env = { ...process.env };
    if (this.isDefault(profilePath)) delete env.CLAUDE_CONFIG_DIR;
    else env.CLAUDE_CONFIG_DIR = profilePath;
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
