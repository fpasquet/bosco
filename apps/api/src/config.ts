// Configuration du service, validée au démarrage : une valeur invalide arrête Bosco avec un message clair.
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const schema = z.object({
  BOSCO_PORT: z.coerce.number().int().min(1024).max(65535).default(4870),
  BOSCO_DATA_DIR: z
    .string()
    .min(1)
    .default(join(homedir(), '.local', 'share', 'bosco')),
  // Dossier de l'interface Next.js construite ; vide pour un service sans interface (tests de l'API)
  BOSCO_WEB_DIR: z.string().default(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web')),
  // Dossier où chercher les profils de Claude Code (~/.claude, ~/.claude-perso…)
  BOSCO_PROFILES_ROOT: z.string().min(1).default(homedir()),
  BOSCO_TEST: z.enum(['0', '1']).default('0'),
  // Mode développement (pnpm dev) : Next.js compile l'interface à la demande et la recharge à chaud
  BOSCO_DEV: z.enum(['0', '1']).default('0'),
});

export type Config = Readonly<{
  port: number;
  host: '127.0.0.1';
  dataDir: string;
  profilesRoot: string;
  webDir: null | string;
  testing: boolean;
  dev: boolean;
}>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid configuration: ${issues}`);
  }
  const values = parsed.data;
  // Boucle locale seulement : l'accès du téléphone ouvrira sa propre écoute, après appairage (NF-13)
  return {
    port: values.BOSCO_PORT,
    host: '127.0.0.1',
    dataDir: values.BOSCO_DATA_DIR,
    profilesRoot: values.BOSCO_PROFILES_ROOT,
    webDir: values.BOSCO_WEB_DIR || null,
    testing: values.BOSCO_TEST === '1',
    dev: values.BOSCO_DEV === '1',
  };
}
