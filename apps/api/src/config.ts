// Configuration du service, validée au démarrage : une valeur invalide arrête Bosco avec un message clair.
import { realpathSync } from 'node:fs';
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
  // Accès du téléphone (E4c) : port HTTPS sur le réseau local (par défaut, celui du service + 1) et adresse imposée
  BOSCO_PHONE_PORT: z.coerce.number().int().min(1024).max(65535).optional(),
  BOSCO_PHONE_HOST: z.string().min(1).optional(),
  // Worker (DT-09) : identifiants de l'abonnement Claude du poste et exécutable de Claude Code monté dans l'agent
  BOSCO_WORKER_CREDENTIALS: z.string().min(1).optional(),
  BOSCO_CLAUDE_BIN: z.string().min(1).optional(),
  BOSCO_GH_BIN: z.string().min(1).optional(),
});

export type Config = Readonly<{
  port: number;
  host: '127.0.0.1';
  dataDir: string;
  profilesRoot: string;
  webDir: null | string;
  testing: boolean;
  dev: boolean;
  /** Écoute HTTPS du téléphone, ouverte seulement quand l'accès est activé (NF-13) */
  phone: { host: null | string; port: number };
  worker: { claudeBinary: string; credentials: string; gh: string };
}>;

/** Claude Code installé sur le poste : le lien de ~/.local/bin/claude mène à l'exécutable de la version courante. */
function installedClaude(): string {
  const link = join(homedir(), '.local', 'bin', 'claude');
  try {
    return realpathSync(link);
  } catch {
    return link;
  }
}

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
    phone: { host: values.BOSCO_PHONE_HOST ?? null, port: values.BOSCO_PHONE_PORT ?? values.BOSCO_PORT + 1 },
    worker: {
      credentials: values.BOSCO_WORKER_CREDENTIALS ?? join(values.BOSCO_PROFILES_ROOT, '.claude', '.credentials.json'),
      claudeBinary: values.BOSCO_CLAUDE_BIN ?? installedClaude(),
      gh: values.BOSCO_GH_BIN ?? '/usr/bin/gh',
    },
  };
}
