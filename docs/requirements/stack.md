<!-- Généré par export.mjs (skill requirements-doc) depuis sources/70-stack.md : ne pas modifier ici. -->

# <a id="7-stack-technique"></a>7. Stack technique

## <a id="71-choix"></a>7.1 Choix

| Couche | Choix | Justification | Alternatives écartées |
|---|---|---|---|
| Langage | TypeScript 6.0 (dernière version de la branche 6), Node 26 LTS (fixé par `engines` et `.nvmrc`), tout en ESM | Choix du porteur du projet ; un seul langage, SDK Claude disponible ; passage à TypeScript 7 prévu (DT-20) | Python, CommonJS |
| Back | NestJS, adaptateur Fastify | Framework déjà maîtrisé, modules, injection, DT-12 | Fastify seul, Express |
| API | REST + SSE | DT-06 | GraphQL, WebSocket |
| Base | SQLite (WAL, FTS5) via `better-sqlite3` | DT-04 | PostgreSQL |
| Accès données | MikroORM, pilote SQLite | Choix du porteur du projet ; unité de travail, migrations, entités séparées du domaine (DT-14) | Drizzle, Prisma, TypeORM |
| Front | Next.js (App Router), React | Framework déjà maîtrisé, DT-13 | React + Vite |
| Styles | Tailwind CSS 4, tokens des specs, classes de daisyUI 5.7 avec un thème pointé sur les tokens (DT-25) | Parité avec les maquettes, qui emploient les mêmes classes (imposé) | CSS modules, classes maison |
| Composants | shadcn/ui sur Radix, dont les variantes (CVA) posent les classes de daisyUI ; Storybook (pages Tokens et Classes, accessibilité bloquante) ; conventions du skill `design-system` (DT-25) | Comportements accessibles de Radix, rendu des classes de daisyUI, un seul catalogue | Composants de daisyUI seuls (sans comportements clavier), bibliothèque de composants complète |
| Données serveur | TanStack Query, dernière version | Choix du porteur du projet ; cache, invalidation et synchronisation avec les flux SSE | SWR, Redux |
| État client | Zustand, dernière version | Choix du porteur du projet ; état propre à l'interface : regroupement, filtres, panneaux ouverts, sélection (DT-17) | Redux, Context React |
| Formulaires | React Hook Form, dernière version, avec son résolveur zod | Choix du porteur du projet ; valeurs, erreurs par champ et soumission gérées par la bibliothèque, schémas zod partagés avec l'API ; les erreurs renvoyées par l'API se posent sur leur champ | État local à la main, Formik |
| Icônes | `lucide-react` | Mêmes icônes que les maquettes | Autres jeux |
| MCP | SDK MCP officiel | Serveur HTTP | Implémentation maison |
| Agents | Claude Agent SDK | DT-09 | Lancer la CLI |
| Conteneurs | Docker via `dockerode` | DT-08 | CLI docker |
| Surveillance de fichiers | `chokidar` | Fiable sous Linux | `fs.watch` |
| Compilation | TypeScript 6 (`tsc -b`) pour l'application serveur (service, worker, commande `bosco`) et les paquets ; Next.js pour le web | Choix du porteur du projet ; un seul compilateur, décorateurs et métadonnées vérifiés (DT-18) | Compilateur tiers en plus de `tsc` |
| Tests | Vitest pour le domaine, les cas d'usage et les adaptateurs ; playwright-bdd sur Playwright pour les scénarios Gherkin de l'API (anglais) et du web (français), avec axe ; enregistrements rejoués par un module du dépôt sur undici (DT-21) | Choix du porteur du projet ; un seul exécuteur Gherkin, tests rapides et sans réseau, navigateur déjà installé | Jest, Cypress, Cucumber seul |
| Qualité | Configurations partagées dans `packages/configs` (§7.3, DT-23) ; ESLint 10 (configuration plate) avec typescript-eslint en règles typées, sonarjs, perfectionist, check-file, `eslint-plugin-boundaries` pour les frontières et `@next/eslint-plugin-next` ; Prettier 3 avec `eslint-config-prettier` et `prettier-plugin-gherkin` ; contrôle des `.feature` (DT-21) ; TypeScript strict ; husky, lint-staged et commitlint | Choix du porteur du projet, dernières versions (DT-19) | oxlint, Biome |
| Architecture du back | Hexagonale (ports et adaptateurs) | Choix du porteur du projet ; domaine testable sans NestJS ni base (DT-15) | Couches NestJS classiques |
| Organisation | Monorepo pnpm 12 et Turborepo 2.11 (DT-22) | `apps/api` (service, worker et commande `bosco`, DT-15), `apps/web`, `packages/domain` (contrats partagés avec le web), `packages/configs` ; Turborepo ordonne les tâches et les met en cache | Multi-dépôts, Nx, scripts pnpm seuls |

Versions : les versions stables de NestJS, Next.js, TanStack Query, Zustand, React Hook Form, ESLint et Prettier au démarrage du lot 0, figées dans le fichier de verrouillage. Le worker est un second point d'entrée de l'application serveur, sans serveur HTTP, lancé dans son propre processus (DT-02). L'application web reste presque entièrement côté client : elle reçoit ses données par l'API et les flux SSE.

## <a id="72-structure-du-code"></a>7.2 Structure du code

**Structure hexagonale** (DT-15, conception en §6.7) :

| Couche | Contenu | Dépend de |
|---|---|---|
| `apps/api/src/<contexte>/domain` | Agrégats, objets valeur, événements et erreurs d'un contexte (`sessions`, `devices`, `tasks`, `policies`, `knowledge`), sans décorateur | son domaine, `src/shared/domain` |
| `apps/api/src/<contexte>/application` | Un service par agrégat (découvrir une session, autoriser, lancer une tâche, valider, accepter une décision) et `ports.ts` | son domaine, `src/shared` |
| `apps/api/src/<contexte>/infrastructure` | Adaptateurs des ports : dépôts MikroORM, lecture des transcripts, Docker, GitHub, Jira, Confluence, `git` et `gh`, notifications | ports |
| `apps/api/src/<contexte>/interface/http` | Contrôleurs REST, flux SSE, entrée des hooks, serveur MCP, schémas zod | application |
| `apps/api/src/<contexte>/<contexte>.module.ts` | Module NestJS du contexte : chaque port relié à son adaptateur (jetons de `tokens.ts`) | tout le contexte |
| `apps/api/src/shared` | Noyau partagé : erreur de base, horloge, persistance commune (MikroORM, migrations), hébergement de Next.js | rien |
| `apps/api/src/app.module.ts`, `main.ts`, `main-worker.ts`, `cli/main.ts` | Point de composition et points d'entrée : service, worker, commande `bosco` (démarrer, installer le service systemd, reprendre une session) | tout |
| `packages/domain` | Contrats partagés avec le web : types des vues, `APP_NAME` | rien |

Le domaine et l'application ne connaissent ni NestJS, ni MikroORM, ni Docker : ils se testent avec des adaptateurs en mémoire. Le mapping MikroORM vit dans les adaptateurs (schémas d'entités), pas sur les classes du domaine. Le worker réutilise les mêmes cas d'usage que l'API.

**ESM partout** : `"type": "module"` dans chaque paquet, imports avec extension, pas de `require`. NestJS, MikroORM, Next.js et Vitest tournent en ESM ; l'ensemble a été vérifié avec TypeScript 6 le 07/11/2026 (DT-18).

## <a id="73-qualite-du-code"></a>7.3 Qualité du code

Toutes les configurations vivent dans `packages/configs` (DT-23) ; chaque paquet les étend en une ou deux lignes. Versions exactes dans les `package.json` (pas de `^`), dernières versions stables au lot 0.

| Export | Contenu |
|---|---|
| `tsconfig/base.json` | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `isolatedModules`, `forceConsistentCasingInFileNames`, ES2024 |
| `tsconfig/node.json` | base + `NodeNext` (imports avec extension), types Node : `packages/*`, CLI, scénarios |
| `tsconfig/nest.json` | node + `experimentalDecorators` et `emitDecoratorMetadata` : API et worker (DT-18) |
| `tsconfig/next.json` | base + DOM, `Bundler`, JSX, greffon Next.js : web |
| `eslint/base` | `@eslint/js`, typescript-eslint `recommendedTypeChecked` (`projectService`), sonarjs (qualité et sécurité), perfectionist (tri des imports et des membres), check-file (fichiers et dossiers en kebab-case), imports et exports de types explicites, `eslint-config-prettier` en dernier |
| `eslint/nest` | base + frontières de l'architecture (`eslint-plugin-boundaries` : couches d'un contexte, contextes entre eux) et frameworks interdits au domaine et à l'application (`no-restricted-imports`) + résultat d'un `await` nommé avant usage : application serveur |
| `eslint/next` | base + `@next/eslint-plugin-next` (Core Web Vitals), `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` strict, lint des classes (ni valeur arbitraire, ni couleur de la palette Tailwind, seulement les tokens et les classes de daisyUI) : web |
| `vitest` | `base` (fichiers `*.test.ts`, `restoreMocks`, pas de suite vide) et `nest` (base + décorateurs `oxc.decorator`, DT-18), étendus par `mergeConfig` |
| `prettier` | Largeur 120, guillemets simples, virgules finales, greffon Gherkin ; référencé par `"prettier"` dans le `package.json` racine, avec un `.prettierignore` pour les fichiers générés et les enregistrements |

Règles d'usage :

- une erreur de lint se corrige ; une règle ne se désactive que dans `packages/configs`, avec un commentaire qui dit pourquoi ; pas de `eslint-disable` dans le code ;
- chaque paquet expose `lint`, `typecheck` (`tsc --noEmit`), `test` et, s'il y a lieu, `build`, lancés par Turborepo (DT-22) ;
- un hook `pre-commit` (husky et lint-staged) formate les fichiers indexés avec Prettier, et un hook `commit-msg` vérifie les Conventional Commits avec commitlint ; la CI refait les deux contrôles ;
- un test Vitest cite le critère qu'il vérifie dans son nom (« CA-SESS-04 · … »), un scénario Gherkin par un tag (`@CA-SESS-04`) (NF-19) ; aucune autre référence aux specs dans le code (ni écran, ni règle, ni décision) ;
- le nom de l'application ne s'écrit jamais en dur : une constante `APP_NAME` côté serveur, une variable dans les textes de l'interface ;
- commits au format Conventional Commits, en anglais, atomiques : un changement cohérent qui compile et passe ses tests.

## <a id="74-regles-pour-les-agents"></a>7.4 Règles pour les agents

Claude Code écrit le code (DT-24) : les conventions sont des fichiers du dépôt, livrés au lot 0 et tenus à jour avec le code.

| Fichier | Contenu attendu |
|---|---|
| `AGENTS.md` (et le lien `CLAUDE.md`) | Langue des échanges et du code ; specs comme référence, avec la mémoire à lire en premier (`specs/ui/CONTEXTE.md`, `specs/requirements/REQUIREMENTS.md`) et ce qu'il ne faut jamais lire en entier ; écart entre le code et les specs tranché avec le développeur, puis reporté dans les specs dans le même changement ; identifiants stables ; git (branches, commits atomiques, aucune écriture distante sans confirmation) ; table des règles ci-dessous |
| `.claude/rules/general.md` | Tout le dépôt : nommage, TypeScript, dépendances et versions exactes, variables d'environnement validées au démarrage, secrets jamais journalisés, lint sans désactivation, contrôles avant de rendre la main |
| `.claude/rules/nestjs.md` (`paths: apps/api/**`) | Modules par contexte et leurs quatre couches, agrégats, objets valeur, événements, ports, nommage des cas d'usage, erreurs du domaine (§6.7), anti-patterns (§6.8), adaptateurs, assemblage, traduction des erreurs, validation des entrées, MikroORM (schémas d'entités, migrations relues, jamais modifiées une fois commitées), flux SSE, hooks |
| `.claude/rules/nextjs.md` (`paths: apps/web/**`) | Organisation par fonctionnalité, TanStack Query, Zustand et React Hook Form (DT-17), accessibilité, textes |
| `.claude/rules/design-system.md` (`paths: apps/web/**`) | Posé par le skill `design-system` (`scaffold.mjs --specs`) : tokens en source unique, classes de daisyUI posées par les variantes des composants, un dossier par composant, Storybook, lint des classes |
| `.claude/rules/tests.md` (`paths:` tests, `e2e/**`, `**/*.feature`) | Ce que teste chaque niveau, les deux suites et leurs langues, phrases génériques, enregistrements et leurs modes, tags permis (DT-21) |
| `.claude/agents/specs-gap-reviewer.md` | Sous-agent en lecture seule, lancé en fin de lot : confronte le code aux règles RF et critères CA du lot, propose le statut de chaque écran et les écarts à trancher |

**Avant de rendre la main** (repris dans `general.md`) : `pnpm format:check`, puis `turbo run lint typecheck test build`, puis `turbo run e2e:api` ou `e2e:web` dès qu'une route ou un écran change ; `trace.mjs` pour les critères couverts en fin de lot.
