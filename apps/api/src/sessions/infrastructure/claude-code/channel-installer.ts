// Installation du canal de Bosco dans un profil Claude Code (E4f) : un serveur MCP en stdio, ajouté comme celui du
// contexte, sans rien remplacer des serveurs existants.
import type { ChannelInstaller } from '../../application/channel.service.ts';
import { CHANNEL_SERVER, channelLaunchCommand } from '../../domain/channel.ts';
import { ClaudeMcpConfig } from './claude-mcp-config.ts';

/** Ce que Claude Code lance pour le canal : la commande `channel` de Bosco, avec l'adresse de son service. */
export interface ChannelEntry {
  args: string[];
  command: string;
  env: Record<string, string>;
}

export class ClaudeChannelInstaller implements ChannelInstaller {
  private readonly config: ClaudeMcpConfig;

  constructor(
    claudeBinary: string,
    private readonly entry: ChannelEntry,
    /** Dossier personnel : le profil ~/.claude garde sa configuration dans ~/.claude.json */
    private readonly home: string,
  ) {
    this.config = new ClaudeMcpConfig(claudeBinary, home);
  }

  install(profilePath: string): Promise<void> {
    return this.config.add(profilePath, CHANNEL_SERVER, { type: 'stdio', ...this.entry });
  }

  launchCommand(profilePath: string): string {
    return channelLaunchCommand(profilePath, this.home);
  }

  uninstall(profilePath: string): Promise<void> {
    return this.config.remove(profilePath, CHANNEL_SERVER);
  }

  isInstalled(profilePath: string): Promise<boolean> {
    return this.config.has(profilePath, CHANNEL_SERVER);
  }
}
