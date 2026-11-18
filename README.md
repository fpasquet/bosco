# Bosco

Poste de pilotage local des sessions Claude Code : Bosco découvre les sessions du poste, dit laquelle attend une réponse, permet d'autoriser une commande sans changer de fenêtre, et fait tourner une session dans un bac à sable, isolée du poste, sur sa propre branche. Le bosco est le maître d'équipage d'un navire : ici, l'équipage, ce sont les sessions.

- Documentation et téléchargement des applications : [bosco-c5q.pages.dev](https://bosco-c5q.pages.dev) ([Télécharger](https://bosco-c5q.pages.dev/docs/download)).
- Specs UI et cahier des charges : dépôt de specs `fpasquet/specs`, dossier `bosco/` (artifacts : [specs UI](https://claude.ai/artifact/Uxbwu4Wk8Qs3SVn4RjZFz1), [cahier des charges](https://claude.ai/artifact/8ze73zWxiHUVDx99xfQqC4)).
- Exigences de développement exportées : [`docs/requirements/`](docs/requirements/README.md).
- Instructions des agents : [`AGENTS.md`](AGENTS.md).

## Démarrer

Prérequis : Node 26 (`.nvmrc`, `nvm use` ; pnpm refuse d’installer avec une autre version), pnpm 12 (`corepack enable`).

```bash
make install          # dépendances et skills épinglés
make dev              # développement : http://127.0.0.1:4880, rechargement de l'interface, données dans .data/
make start            # le service sur http://127.0.0.1:4870, ouvre la vue d'ensemble
make service-install  # service systemd de l'utilisateur
make mcp-install      # serveur MCP de Bosco (contexte du projet, décisions proposées) ajouté à ~/.claude (mcp-install-dev pour make dev, PROFILE=… pour un autre profil)
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
make beta BRANCH=feat/…       # installe la version d'une branche d'origin à la place de l'application (sudo)
make android                  # APK de l'application Android (JDK 17 et SDK Android dans le dossier personnel)
```

Le paquet s'installe avec `make desktop-package-install` : l'application va dans `/opt/Bosco`, son entrée dans le menu des applications, et son bac à sable est configuré à l'installation. Elle garde les données de `~/.local/share/bosco`, comme le service lancé depuis le dépôt. Chaque paquet porte la version de l'application suivie de la date et du commit, toujours plus récente pour apt. Installé pendant que Bosco tourne, il se signale dans la barre système : « Relancer Bosco » passe à la nouvelle version. Une version plus ancienne refuse de démarrer sur des données qu'une plus récente a mises à jour.

Sans rien construire sur le poste, les applications se téléchargent depuis la page [Télécharger](https://bosco-c5q.pages.dev/docs/download) du site, qui donne les fichiers de la dernière version stable et de la dernière bêta, ou depuis les [releases GitHub](https://github.com/fpasquet/bosco/releases) : le paquet `.deb`, l'AppImage (qui se met à jour seule, depuis les mêmes releases) et l'APK Android, signé avec la clé de release. Une beta paraît en pre-release. Réglages › À propos dit la version qui tourne, cherche une fois par jour au plus une version plus récente (sur le canal stable ou bêta, sans identifiant, désactivable) et affiche le journal des versions.

L'AppImage se lance sans le bac à sable de Chromium (`--no-sandbox`, ajouté par son lanceur) : une AppImage ne peut pas installer le `chrome-sandbox` privilégié ni le profil AppArmor qu'Ubuntu exige depuis la 23.10. Le paquet `.deb` les configure à l'installation : préfère-le si tu veux ce bac à sable.

Pour essayer une branche avant sa fusion, `make beta BRANCH=<branche>` la construit dans un worktree à part (`~/.cache/bosco/beta`, gardé d'un essai à l'autre) sans toucher au dépôt courant, puis installe son paquet à la place de l'application, sur les vraies données. Sans `BRANCH`, c'est la copie de travail courante qui est installée. `make beta BRANCH=main` revient à la version stable, à condition que la branche essayée n'ait pas migré la base.

## Versions

Chaque version suit les [Conventional Commits](https://www.conventionalcommits.org/) de `main` : une nouveauté (`feat`) monte la version mineure, une correction (`fix`) le correctif, avant la 1.0. La version du dépôt est celle de `package.json` ; le service, l'application du poste et l'application Android la lisent.

Une release se lance à la main, depuis l'onglet Actions, workflow « Release » :

1. **Essai à blanc** (`dry_run`, coché par défaut) : la version et les notes s'affichent dans le résumé de l'exécution, les fichiers restent dans ses artefacts. Rien ne part sur le dépôt.
2. **Beta** (`channel: beta`) : la beta suivante (`0.3.0-beta.1`, puis `-beta.2`…), publiée en pre-release.
3. **Stable** (`channel: stable`) : la version des commits, ou celle donnée dans `version`.

Le workflow écrit la version dans les applications, régénère `CHANGELOG.md` (git-cliff, `cliff.toml`) et construit le `.deb`, l'AppImage, leurs fichiers de mise à jour (`latest-linux.yml`, `beta-linux.yml`) et l'APK sur ce commit. Une fois tout construit, il pousse le commit `chore(release): vX.Y.Z` et l'étiquette `vX.Y.Z` sur `main`, puis crée la release avec les notes de la version, les fichiers et `SHA256SUMS`.

L'APK ne contient que le code natif arm64 (`buildArchs` de `apps/mobile/app.json`), celui de tous les téléphones récents : il est plus léger et se construit plus vite ; un émulateur x86_64 demande d'y ajouter `x86_64`. L'APK se signe avec la clé de release, rangée dans les secrets du dépôt : `ANDROID_KEYSTORE_BASE64` (le keystore en base64), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`. Sans eux, une release s'arrête ; un essai à blanc signe avec la clé de debug.

```bash
make changelog        # régénère CHANGELOG.md
make desktop-release  # .deb, AppImage et fichiers de mise à jour, à la version exacte du dépôt (copie propre)
```

## Dépôt

| Dossier            | Contenu                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`         | Application serveur NestJS sur Fastify : un module par contexte (domain, application, infrastructure, interface/http), sert l'interface sur le même port ; commande `bosco` (`src/cli`) |
| `apps/web`         | Interface Next.js, design system (tokens des specs, daisyUI, shadcn/ui sur Radix, Storybook)                                                                                            |
| `apps/desktop`     | Application du poste (Electron, Linux) : fenêtre de l'interface, barre système, notifications natives ; paquet .deb                                                                     |
| `apps/mobile`      | Application Android (Expo) : interface téléphone dans une vue web, appairage par QR code, notifications locales                                                                         |
| `apps/docs`        | Site de documentation (Fumadocs), en français : installation, applications, guides, développement ; export statique dans `out/`                                                         |
| `packages/domain`  | Contrats partagés avec le web : nom de l'application, types des vues                                                                                                                    |
| `packages/configs` | Configurations partagées : TypeScript, ESLint, Vitest, Prettier                                                                                                                         |
| `tools/release`    | Outils du workflow Release : version calculée depuis les commits, écrite dans les applications, CHANGELOG.md et notes                                                                   |
| `e2e`              | Scénarios Gherkin de l'API (anglais) et du web (français), module d'enregistrement des appels sortants                                                                                  |

## Documentation

Le site de documentation (`apps/docs`, Fumadocs) est un export statique publié sur Cloudflare Pages par le workflow « Docs » (`.github/workflows/docs.yml`) : à chaque push sur `main` qui touche le site, après chaque exécution réussie du workflow « Release » (la page Télécharger lit les releases GitHub au build et donne ainsi la nouvelle version), et à la main depuis l'onglet Actions. Sans domaine, il est servi sur [bosco-c5q.pages.dev](https://bosco-c5q.pages.dev) : le nom `bosco` étant déjà pris, Cloudflare a suffixé l'adresse du projet.

Mise en place, une seule fois :

1. Sur Cloudflare, **My Profile › API Tokens › Create Token** › « Create Custom Token », avec la permission **Account › Cloudflare Pages › Edit**, limitée à ton compte.
2. L'Account ID est dans le tableau de bord (**Workers & Pages**, colonne de droite), ou dans `pnpm --filter @bosco/docs exec wrangler whoami` après `wrangler login`.
3. Les deux secrets du dépôt :

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --repo fpasquet/bosco
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo fpasquet/bosco
   ```

4. Lance **Actions › Docs › Run workflow**. Le premier passage crée le projet Pages `bosco` (branche de production `main`), les suivants le réutilisent. Sans les secrets, le workflow s'arrête sur un avertissement, sans échec.

L'adresse du site est la valeur par défaut de `SITE_URL` (`apps/docs/src/lib/constants.ts`). Pour un domaine plus tard : **Workers & Pages › bosco › Custom domains**, puis la variable du dépôt `NEXT_PUBLIC_SITE_URL` sur cette adresse (`gh variable set NEXT_PUBLIC_SITE_URL --repo fpasquet/bosco --body https://…`). Le nom du projet est `CLOUDFLARE_PAGES_PROJECT` dans `docs.yml` (et `DOCS_PROJECT` du Makefile). `make docs-deploy` publie depuis le poste, après `wrangler login`.

## Commandes

`make help` liste toutes les commandes. Les plus courantes :

```bash
make check            # lint, types, tests et build de chaque paquet (Turborepo)
make e2e              # scénarios de l'API, puis parcours du web (ordinateur et téléphone)
make storybook        # http://localhost:6006
make docs-dev         # site de documentation sur http://127.0.0.1:4890
make docs-build       # export statique du site dans apps/docs/out
make docs-preview     # l'export servi comme sur Cloudflare Pages, http://127.0.0.1:4891
make docs-screenshots # captures du site, prises sur Bosco avec les données du fil rouge
make format
make tokens           # recopie les tokens des specs (../specs/bosco/ui)
make requirements     # régénère docs/requirements depuis le cahier des charges
make claude-compat    # vérifie le hook d'autorisation sur le Claude Code installé (NF-09)
```

À chaque nouvelle version de Claude Code, `make claude-compat` lance deux sessions courtes sur Haiku, sur l'abonnement : « Autoriser » doit laisser la commande s'exécuter, « Refuser » doit transmettre son motif à l'agent, et la fin de session doit arriver. Le comportement du hook n'est pas documenté par Claude Code (RQ-01).

Les specs se clonent à côté (`~/www/specs` et `~/www/bosco`) : la copie des tokens (`tokens.mjs` du skill `design-system`) et l'export du cahier des charges (`export.mjs` du skill `requirements-doc`) se régénèrent depuis ce clone.
