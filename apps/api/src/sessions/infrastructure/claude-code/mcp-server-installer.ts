// Serveur MCP de Bosco dans un profil Claude Code : le contexte des projets et les décisions proposées, en HTTP sur le
// port du service, avec le secret de l'installation. Ajouté avec le suivi en direct, ou par `bosco mcp install`.
import { APP_NAME } from '@bosco/domain';
import type { McpServerInstaller } from '../../application/ports.ts';
import { ClaudeMcpConfig } from './claude-mcp-config.ts';

/** Nom du serveur dans la configuration du profil, celui que donne aussi `bosco mcp install` */
export const MCP_SERVER = APP_NAME.toLowerCase();

export class ClaudeMcpServerInstaller implements McpServerInstaller {
  private readonly config: ClaudeMcpConfig;

  constructor(
    claudeBinary: string,
    home: string,
    /** Nom du serveur dans le profil (« bosco ») */
    private readonly name: string,
    /** Adresse du serveur MCP du service et secret de l'installation */
    private readonly endpoint: { secret: string; url: string },
  ) {
    this.config = new ClaudeMcpConfig(claudeBinary, home);
  }

  install(profilePath: string): Promise<void> {
    const { secret, url } = this.endpoint;
    return this.config.add(profilePath, this.name, {
      type: 'http',
      url,
      headers: { Authorization: `Bearer ${secret}` },
    });
  }

  isInstalled(profilePath: string): Promise<boolean> {
    return this.config.has(profilePath, this.name);
  }

  uninstall(profilePath: string): Promise<void> {
    return this.config.remove(profilePath, this.name);
  }
}
