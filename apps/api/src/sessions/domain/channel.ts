/**
 * Canal de Bosco (E2i, E4f, règle 9) : un serveur de canal de Claude Code (« channels », aperçu de recherche) que
 * Bosco installe dans un profil. Une session du terminal lancée avec lui reçoit les messages écrits dans Bosco ;
 * Claude Code les écrit dans le transcript comme une demande, marquée comme venue du canal. Vérifié sur 2.1.319.
 */

/** Nom du serveur dans la configuration du profil : « bosco » est déjà celui du serveur MCP de Ma session */
export const CHANNEL_SERVER = 'bosco-channel';

/** Commande qui lance une session avec le canal ; le dossier de configuration en tête pour un autre profil que ~/.claude */
export function channelLaunchCommand(profilePath: string, home: string): string {
  const launch = `claude --dangerously-load-development-channels server:${CHANNEL_SERVER}`;
  if (profilePath === `${home}/.claude`) return launch;
  const shown = profilePath.startsWith(`${home}/`) ? `~${profilePath.slice(home.length)}` : profilePath;
  return `CLAUDE_CONFIG_DIR=${shown} ${launch}`;
}

/**
 * Texte d'un message arrivé par le canal de Bosco, lu dans une ligne de transcript ; null pour toute autre ligne.
 * Claude Code l'écrit en demande « méta », venue du canal, entourée d'une balise <channel source="bosco-channel" …>.
 */
export function channelMessageOf(record: Record<string, unknown>): null | string {
  const origin = record.origin as null | undefined | { kind?: unknown; server?: unknown };
  if (record.type !== 'user' || origin?.kind !== 'channel' || origin.server !== CHANNEL_SERVER) return null;
  const message = record.message as null | undefined | { content?: unknown };
  const content = typeof message?.content === 'string' ? message.content : null;
  if (!content) return null;
  const start = content.indexOf('>');
  const end = content.lastIndexOf('</channel>');
  if (!content.startsWith('<channel') || start < 0 || end < start) return content.trim() || null;
  return content.slice(start + 1, end).trim() || null;
}
