import { APP_NAME } from '@bosco/domain';

export { BASE_PATH, DOCS_BASE_PATH } from './paths';

export const SITE_NAME = APP_NAME;
export const SITE_TAGLINE = 'Poste de pilotage local des sessions Claude Code';
export const SITE_DESCRIPTION = `${APP_NAME} découvre les sessions Claude Code du poste, dit laquelle t'attend, permet d'autoriser une commande sans changer de fenêtre, pilote une session et la fait tourner dans un bac à sable isolé du poste.`;
export const GITHUB_URL = 'https://github.com/fpasquet/bosco';
// Adresse publique du site : celle du projet Cloudflare Pages, ou d'un domaine rattaché plus tard (variable du workflow)
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bosco.pages.dev';
