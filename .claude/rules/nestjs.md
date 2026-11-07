---
paths:
  - 'apps/api/**'
---

# Application serveur NestJS (apps/api)

Conception complète : cahier des charges, §6.7 et §6.8 (`docs/requirements/architecture.md`).

## Architecture hexagonale par modules

- Un dossier par contexte métier (`sessions`, puis `devices`, `tasks`, `policies`, `knowledge`), chacun en quatre couches :
  - `domain/` : agrégats, objets valeur, événements, erreurs du domaine ; **aucun** import de NestJS, MikroORM, rxjs, zod, chokidar, ni de `node:fs`, `node:child_process`, `node:http(s)`, `node:net` ;
  - `application/` : un service par agrégat (`session.service.ts`) et `ports.ts` (dépôts, passerelles, horloge) ; mêmes interdits ;
  - `infrastructure/` : adaptateurs des ports (`persistence/` MikroORM, `claude-code/` lecture des transcripts, puis Docker, git, intégrations) ;
  - `interface/http/` : contrôleurs, flux en direct, entrée des hooks, schémas zod.
- `<contexte>.module.ts` relie chaque port à son adaptateur par des fabriques (`useFactory`) et les jetons `Symbol` de `<contexte>/tokens.ts`.
- `src/shared/` est le noyau partagé : erreur de base (`DomainError`), jetons communs (`CONFIG`, `ORM`), schéma des réglages, hébergement de Next.js, route de santé.
- `src/` est le point de composition : `app.module.ts` assemble les contextes et câble ce qui les croise, `persistence.module.ts` ouvre la base (global, jeton `ORM`), `mikro-orm.config.ts` liste les schémas de chaque contexte et les migrations (`src/migrations/`), `main.ts` démarre le service. `cli/main.ts` est la commande `bosco` (démarrer, installer le service systemd, puis reprendre une session). Le worker (lot 2) sera un autre point d'entrée, `main-worker.ts`, dans son propre processus.
- Un contexte n'importe jamais les classes d'un autre : il déclare un port, que le point de composition branche. Les adaptateurs ne dépendent pas du point de composition : ils reçoivent la configuration par injection (`CONFIG`).
- Ces frontières sont vérifiées par le lint (`@bosco/configs/eslint/nest`, eslint-plugin-boundaries) : une violation se corrige, jamais ne se désactive.
- Les contrats partagés avec le web (types des vues, `APP_NAME`) vivent dans `packages/domain`.
- Un adaptateur traduit et délègue : aucune règle métier dans un contrôleur. Une méthode de contrôleur porte le nom de la méthode du service qu'elle appelle.

## Écrire le domaine

- **Agrégats** : on charge, on appelle une méthode métier, on enregistre. L'agrégat protège seul ses invariants (une session a un seul état ; une tâche ne change que par ses transitions nommées ; une décision acceptée ne change que par une nouvelle version).
- **Objets valeur** pour les identifiants, montants, durées, budgets, noms de branche (`bosco/t-<n>-<sujet>`), règles d'outil : immuables, valides dès leur création. Aucun identifiant ni montant en `string` ou `number` nu entre les couches.
- **Événements du domaine** (`PermissionRequested`, `TaskReadyForReview`…) : notés par l'agrégat, publiés par le service après l'enregistrement par le port `EventPublisher`. Le flux en direct et les notifications s'y abonnent dans les adaptateurs.
- **Temps et identifiants** par les ports `Clock` et `IdGenerator` : jamais `new Date()`, `Date.now()` ni `randomUUID()` dans le domaine.

## Cas d'usage, nommage, erreurs

- Une méthode par intention (`askPermission`, `answerPermission`, `queueTask`, `validateTask`, `acceptDecision`), jamais `execute`, `handle` ni `run`.
- `get…` lève une erreur si l'objet manque, `find…` renvoie `null` ; `list…`, `count…`, `has…`.
- Une erreur du domaine hérite de `DomainError` (ou de l'erreur de base de son contexte) et porte un **code stable** en camelCase (`permissionAlreadyPending`) et un message en anglais.

## Anti-patterns

| À ne pas faire                                                      | À faire                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Domaine anémique : propriétés publiques modifiées par les services  | Méthodes métier sur l'agrégat                                       |
| Décorateurs ou entités MikroORM dans le domaine                     | Schémas d'entités dans les adaptateurs (`EntitySchema`)             |
| Règle métier dans un contrôleur, le flux en direct ou un hook       | L'adaptateur traduit et délègue au cas d'usage                      |
| Dépôt qui renvoie une entité de l'ORM ou un `QueryBuilder`          | Le dépôt renvoie des objets du domaine                              |
| Couplage entre contextes                                            | Un port déclaré par le contexte qui en a besoin                     |
| Cérémonie : event sourcing, CQRS, bus de commandes, dépôt générique | Agrégats simples, SQLite, événements publiés après l'enregistrement |

## Tests du domaine

Vitest, sans base ni réseau, horloge fixe : les invariants, le temps, les cas rares. Un parcours déjà couvert par un scénario Gherkin ne se rejoue pas en test unitaire (`tests.md`).

## Entrées et erreurs

- Corps de requête et charge des hooks validés par un schéma zod à l'entrée ; une entrée refusée répond 400 avec `code: 'invalidRequest'`.
- Une erreur du domaine se traduit en statut HTTP et en corps `{ statusCode, code, message }` ; l'interface traduit le `code`. Un 5xx ne renvoie jamais de détail interne.
- Un hook de Claude Code ne bloque jamais une session : en cas d'erreur ou d'arrêt de Bosco, Claude Code continue avec son propre fonctionnement (NF-05).

## Persistance (MikroORM sur SQLite)

- Schémas d'entités (`EntitySchema`) dans `<contexte>/infrastructure/persistence/` ; colonnes en snake_case ; les classes du domaine restent sans décorateur.
- Une modification de schéma : `pnpm --filter @bosco/api db:migration`, ajout de la migration à `MIGRATIONS` (`src/mikro-orm.config.ts`), relecture. Une migration commitée n'est jamais modifiée ; les migrations sont additives.
- Le test `migrations.test.ts` vérifie que les migrations décrivent exactement le schéma des entités.
- `allowGlobalContext` est désactivé : chaque requête a son contexte.

## Flux en direct

Chaque flux commence par un instantané de l'état, puis envoie les changements, sur le même canal ; une reconnexion reçoit un nouvel instantané (DT-06).

## Écriture

Le résultat d'un `await` est nommé dans une constante avant d'être utilisé : pas de `(await x).y` ni de `f(await x)` (vérifié par le lint).
