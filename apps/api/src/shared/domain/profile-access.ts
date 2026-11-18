/**
 * Accès d'un profil Claude Code à son abonnement : sa connexion (`/login`, qui écrit `.credentials.json` dans le profil)
 * ou un jeton longue durée (`claude setup-token`), que Claude Code reçoit par la variable CLAUDE_CODE_OAUTH_TOKEN et ne
 * range dans aucun fichier. Le jeton se déclare par le fichier où la personne l'a rangé : Bosco n'en garde que le chemin.
 */
export type ProfileAccess =
  | { credentials: string; kind: 'login' }
  /** Sans accès ; avec un jeton déclaré dont le fichier ne sert pas, sa raison */
  | { kind: 'none'; problem: null | string; tokenFile: null | string }
  | { kind: 'token'; tokenFile: string };

/** Accès transmis à un bac à sable : la copie de la connexion du profil, ou son jeton par l'environnement du tour. */
export type SandboxAccess = { credentials: string; kind: 'login' } | { kind: 'token'; tokenFile: string };

/** Variable par laquelle Claude Code reçoit un jeton longue durée. */
export const TOKEN_VARIABLE = 'CLAUDE_CODE_OAUTH_TOKEN';
