---
paths:
  - 'apps/api/**'
  - 'apps/worker/**'
---

# Service NestJS (apps/api)

## Structure

- `src/main.ts` démarre le service (NestJS sur Fastify) et sert l'interface Next.js sur le même port (`adapters/in/web/next-host.ts`).
- `src/app.module.ts` est le point de composition : il relie chaque port de `@bosco/core` à son adaptateur, par des fabriques (`useFactory`) et des jetons `Symbol` (`src/tokens.ts`). Un module par contexte s'y ajoute avec son lot.
- `src/adapters/in/` : entrées (contrôleurs HTTP, flux en direct, hooks de Claude Code, serveur MCP) ; `src/adapters/out/` : sorties (persistance MikroORM, lecture des transcripts, Docker, git et GitHub CLI, intégrations, notifications).
- Un adaptateur traduit et délègue : aucune règle métier dans un contrôleur. Une méthode de contrôleur porte le nom de la méthode du service qu'elle appelle.

## Entrées et erreurs

- Corps de requête et charge des hooks validés par un schéma zod à l'entrée ; une entrée refusée répond 400 avec `code: 'invalidRequest'`.
- Une erreur du domaine se traduit en statut HTTP et en corps `{ statusCode, code, message }` ; l'interface traduit le `code`. Un 5xx ne renvoie jamais de détail interne.
- Un hook de Claude Code ne bloque jamais une session : en cas d'erreur ou d'arrêt de Bosco, Claude Code continue avec son propre fonctionnement (NF-05).

## Persistance (MikroORM sur SQLite)

- Schémas d'entités (`EntitySchema`) dans `adapters/out/persistence/` ; colonnes en snake_case ; les classes du domaine restent sans décorateur.
- Une modification de schéma : `pnpm --filter @bosco/api db:migration`, ajout de la migration à `MIGRATIONS` (`orm.config.ts`), relecture. Une migration commitée n'est jamais modifiée ; les migrations sont additives.
- Le test `migrations.test.ts` vérifie que les migrations décrivent exactement le schéma des entités.
- `allowGlobalContext` est désactivé : chaque requête a son contexte.

## Flux en direct

Chaque flux commence par un instantané de l'état, puis envoie les changements, sur le même canal ; une reconnexion reçoit un nouvel instantané (DT-06).

## Écriture

Le résultat d'un `await` est nommé dans une constante avant d'être utilisé : pas de `(await x).y` ni de `f(await x)` (vérifié par le lint).
