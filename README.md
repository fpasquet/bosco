# Bosco

Poste de pilotage local des sessions Claude Code : Bosco découvre les sessions du poste, dit laquelle attend une réponse, permet d'autoriser une commande sans changer de fenêtre, puis de confier du travail à Claude Code et de le relire avant toute fusion. Le bosco est le maître d'équipage d'un navire : ici, l'équipage, ce sont les sessions et le worker.

- Specs UI et cahier des charges : dépôt de specs `fpasquet/specs`, dossier `bosco/` (artifacts : [specs UI](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1), [cahier des charges](https://claude.ai/artifact/8ze73zWxiHUVDx99xfQqC4)).
- Exigences de développement exportées : [`docs/requirements/`](docs/requirements/README.md).
- Instructions des agents : [`AGENTS.md`](AGENTS.md).

## Démarrer

Prérequis : Node 26 (`.nvmrc`), pnpm 12 (`corepack enable`).

```bash
pnpm install
pnpm build
node apps/cli/dist/main.js start      # service sur http://127.0.0.1:4870, ouvre la vue d'ensemble
node apps/cli/dist/main.js service install   # service systemd de l'utilisateur
```

Données : `~/.local/share/bosco` (`BOSCO_DATA_DIR`). Port : `BOSCO_PORT` (4870 par défaut), toujours sur la boucle locale.

## Dépôt

| Dossier            | Contenu                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `apps/api`         | Service NestJS sur Fastify : API, flux en direct, hooks ; sert l'interface sur le même port            |
| `apps/web`         | Interface Next.js, design system (tokens des specs, daisyUI, shadcn/ui sur Radix, Storybook)           |
| `apps/cli`         | Commande `bosco`                                                                                       |
| `packages/core`    | Domaine et cas d'usage, sans framework, un dossier par contexte                                        |
| `packages/configs` | Configurations partagées : TypeScript, ESLint, Vitest, Prettier                                        |
| `e2e`              | Scénarios Gherkin de l'API (anglais) et du web (français), module d'enregistrement des appels sortants |

## Commandes

```bash
pnpm check            # lint, types, tests et build de chaque paquet (Turborepo)
pnpm e2e:api          # scénarios de l'API
pnpm e2e:web          # parcours du web, ordinateur et téléphone
pnpm --filter @bosco/web storybook
pnpm format
pnpm skills:install   # skills design-system et requirements-doc, épinglés par skills-lock.json
```

Les specs se clonent à côté (`~/www/specs` et `~/www/bosco`) : la copie des tokens (`tokens.mjs` du skill `design-system`) et l'export du cahier des charges (`export.mjs` du skill `requirements-doc`) se régénèrent depuis ce clone.
