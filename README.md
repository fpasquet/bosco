# Bosco

Poste de pilotage local des sessions Claude Code : Bosco découvre les sessions du poste, dit laquelle attend une réponse, permet d'autoriser une commande sans changer de fenêtre, puis de confier du travail à Claude Code et de le relire avant toute fusion. Le bosco est le maître d'équipage d'un navire : ici, l'équipage, ce sont les sessions et le worker.

- Specs UI et cahier des charges : dépôt de specs `fpasquet/specs`, dossier `bosco/` (artifacts : [specs UI](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1), [cahier des charges](https://claude.ai/artifact/8ze73zWxiHUVDx99xfQqC4)).
- Exigences de développement exportées : [`docs/requirements/`](docs/requirements/README.md).
- Instructions des agents : [`AGENTS.md`](AGENTS.md).

## Démarrer

Prérequis : Node 26 (`.nvmrc`), pnpm 12 (`corepack enable`).

```bash
make install          # dépendances et skills épinglés
make dev              # développement : http://127.0.0.1:4880, rechargement de l'interface, données dans .data/
make start            # le service sur http://127.0.0.1:4870, ouvre la vue d'ensemble
make service-install  # service systemd de l'utilisateur
make mcp-install      # « Ma session » : ajoute le serveur MCP de Bosco à ~/.claude (mcp-install-dev pour make dev, PROFILE=… pour un autre profil)
```

Données : `~/.local/share/bosco` (`BOSCO_DATA_DIR`). Port : `BOSCO_PORT` (4870 par défaut), toujours sur la boucle locale.

## Applications

Facultatives : Bosco se lance toujours dans le navigateur, macOS compris.

```bash
make desktop                  # application du poste (Linux) depuis le dépôt, avec le Node du poste
make desktop-install          # ajoute cette application du dépôt au menu des applications
make desktop-package          # paquet .deb qui embarque le service, l'interface et Node 26 (apps/desktop/out)
make desktop-package-install  # installe ce paquet (sudo)
make desktop-update           # récupère le dépôt, reconstruit le paquet et l'installe (sudo)
make android                  # APK de l'application Android (JDK 17 et SDK Android dans le dossier personnel)
```

Le paquet s'installe avec `make desktop-package-install` : l'application va dans `/opt/Bosco`, son entrée dans le menu des applications, et son bac à sable est configuré à l'installation. Elle garde les données de `~/.local/share/bosco`, comme le service lancé depuis le dépôt. Chaque paquet porte la version de l'application suivie de la date et du commit, toujours plus récente pour apt. Installé pendant que Bosco tourne, il se signale dans la barre système : « Relancer Bosco » passe à la nouvelle version. Une version plus ancienne refuse de démarrer sur des données qu'une plus récente a mises à jour.

## Dépôt

| Dossier            | Contenu                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`         | Application serveur NestJS sur Fastify : un module par contexte (domain, application, infrastructure, interface/http), sert l'interface sur le même port ; commande `bosco` (`src/cli`) |
| `apps/web`         | Interface Next.js, design system (tokens des specs, daisyUI, shadcn/ui sur Radix, Storybook)                                                                                            |
| `apps/desktop`     | Application du poste (Electron, Linux) : fenêtre de l'interface, barre système, notifications natives ; paquet .deb                                                                     |
| `apps/mobile`      | Application Android (Expo) : interface téléphone dans une vue web, appairage par QR code, notifications locales                                                                         |
| `packages/domain`  | Contrats partagés avec le web : nom de l'application, types des vues                                                                                                                    |
| `packages/configs` | Configurations partagées : TypeScript, ESLint, Vitest, Prettier                                                                                                                         |
| `e2e`              | Scénarios Gherkin de l'API (anglais) et du web (français), module d'enregistrement des appels sortants                                                                                  |

## Commandes

`make help` liste toutes les commandes. Les plus courantes :

```bash
make check            # lint, types, tests et build de chaque paquet (Turborepo)
make e2e              # scénarios de l'API, puis parcours du web (ordinateur et téléphone)
make storybook        # http://localhost:6006
make format
make tokens           # recopie les tokens des specs (../specs/bosco/ui)
make requirements     # régénère docs/requirements depuis le cahier des charges
make claude-compat    # vérifie le hook d'autorisation sur le Claude Code installé (NF-09)
```

À chaque nouvelle version de Claude Code, `make claude-compat` lance deux sessions courtes sur Haiku, sur l'abonnement : « Autoriser » doit laisser la commande s'exécuter, « Refuser » doit transmettre son motif à l'agent, et la fin de session doit arriver. Le comportement du hook n'est pas documenté par Claude Code (RQ-01).

Les specs se clonent à côté (`~/www/specs` et `~/www/bosco`) : la copie des tokens (`tokens.mjs` du skill `design-system`) et l'export du cahier des charges (`export.mjs` du skill `requirements-doc`) se régénèrent depuis ce clone.
