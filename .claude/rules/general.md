# Règles générales du code

Valables pour tout le dépôt. `AGENTS.md` donne le cadre : langue, specs, git.

## Langue et nommage

- Code, identifiants et noms de fichiers en anglais ; commentaires en français, qui disent pourquoi en une ou deux lignes.
- Messages d'erreur, journaux, sorties de la commande `bosco` et titres des tests en anglais. Seuls les textes lus dans l'interface sont en français.
- URL et chemins en anglais : routes de l'API (`/api/sessions`), pages de l'interface (`/history`, `/tasks`).
- Fichiers et dossiers en kebab-case (`session.service.ts`) ; vérifié par le lint.
- Aucune référence aux specs dans le code (ni écran, ni règle, ni décision). Seule exception : le nom d'un test ou le tag d'un scénario cite le critère qu'il vérifie (`tests.md`).
- Le nom de l'application ne s'écrit jamais en dur : `APP_NAME` de `@bosco/domain`.

## TypeScript et modules

- TypeScript 6 strict, ESM partout ; imports relatifs avec l'extension `.ts`, réécrite en `.js` à la compilation (`rewriteRelativeImportExtensions`).
- Imports et exports de types explicites (`import type { Foo }`, `import { type Foo }`) ; le lint les corrige.
- Pas de `any` ; `unknown` puis un contrôle (zod, garde de type) pour toute donnée qui entre (requête, hook, transcript, fichier).

## Dépendances et monorepo

- pnpm 12 et Turborepo ; versions **exactes** dans les `package.json` (pas de `^`). Prendre la dernière version stable, vérifier ses dépendances pairs et noter un écart dans le compte rendu.
- Pas de paquet sans second consommateur : le code d'une seule application reste dans cette application.
- Un paquet dont le script d'installation doit tourner s'ajoute à `allowBuilds` de `pnpm-workspace.yaml`.
- Les commandes passent par le Makefile (`make dev`, `make check`, `make e2e`, `make storybook`…) : une nouvelle commande courante y gagne une cible décrite en anglais, que liste `make help`.

## Configuration et secrets

- Toute variable d'environnement est validée au démarrage par zod (`apps/api/src/config.ts`), préfixée `BOSCO_`, avec une valeur par défaut adaptée au poste.
- Un secret (jeton, clé, transcript copié) n'est jamais renvoyé, journalisé ni capturé : au plus ses 4 derniers caractères.
- Le service n'écoute que sur `127.0.0.1` ; toute autre écoute passe par l'accès du téléphone, après appairage (NF-13).
- Aucune action destructrice sur la base du poste (`~/.local/share/bosco`) sans accord explicite.

## Lint et qualité

- Configurations partagées dans `packages/configs` : chaque paquet les étend en une ligne.
- Une erreur de lint se corrige ; une règle ne se désactive que dans `packages/configs`, avec un commentaire qui dit pourquoi. Jamais de `eslint-disable` dans le code.
- `npx eslint . --fix` dans un paquet corrige le tri des imports et les imports de types.

## Avant de rendre la main

1. `make format-check`
2. `make check` (lint, types, tests, build de chaque paquet)
3. `make e2e-api` ou `make e2e-web` dès qu'une route, un écran ou un scénario change
4. Commits atomiques ; compte rendu de ce qui a été vérifié, et de ce qui ne l'a pas été
