# AGENTS.md

Instructions pour les agents qui travaillent dans ce dépôt. La documentation destinée aux humains est dans [`README.md`](README.md).

## Langue

- **Toujours répondre en français** à la personne : messages, questions, comptes rendus, résumés de fin de tâche. Le code, les identifiants et les messages de commit restent en anglais.

## Specs : la référence

Les specs UI et le cahier des charges de Bosco vivent dans le dépôt de specs (`fpasquet/specs`, dossier `bosco/`), cloné à côté : `../specs/bosco/ui` et `../specs/bosco/requirements`. Ce dépôt n'en reçoit que l'export du cahier des charges (`docs/requirements/`) et la copie des tokens (`apps/web/src/styles/tokens.css`), qu'on ne modifie jamais ici.

- **Pour une question fonctionnelle**, lire d'abord `docs/requirements/README.md`, puis `docs/requirements/lots/<lot>.md` (règles RF, écrans, critères CA). Les maquettes sont dans l'artifact des specs, dont le lien est dans ce README.
- **Écart entre le code et les specs** : ne jamais le laisser silencieux. Le trancher avec la personne (le code a raison, les specs ont raison, question ouverte), puis le reporter dans le dépôt de specs (skills `specs-ui` et `requirements-doc`, section « Maintenir pendant les développements »), dans un commit qui cite la PR de code. Mettre à jour le statut de l'écran (`todo`, `doing`, `done`, `gap`) dans `../specs/bosco/ui/sources/<lot>/lot.json`, puis régénérer l'export (`export.mjs`).
- **Fin d'un lot** : le sous-agent `specs-gap-reviewer` confronte le code aux règles et critères du lot.
- **Identifiants stables** : écrans (E2), états (E2b), règles (RF-SESS-03), critères (CA-SESS-12) et exigences (NF-13) ne sont jamais renumérotés ni réutilisés.

## Code

Les conventions sont dans `.claude/rules/`, que Claude Code charge selon les fichiers ouverts. **Avant de modifier du code, lire la règle qui le couvre.**

| Règle                                                | Couvre                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`general.md`](.claude/rules/general.md)             | Tout le dépôt : nommage, TypeScript, dépendances, configuration, secrets, lint, contrôles avant de rendre la main |
| [`core.md`](.claude/rules/core.md)                   | `packages/core` : contextes, agrégats, objets valeur, événements, ports, cas d'usage, erreurs, anti-patterns      |
| [`nestjs.md`](.claude/rules/nestjs.md)               | `apps/api` (et le worker) : adaptateurs, assemblage, erreurs HTTP, validation, MikroORM, flux en direct           |
| [`nextjs.md`](.claude/rules/nextjs.md)               | `apps/web` : organisation, données (TanStack Query, Zustand), textes, accessibilité                               |
| [`design-system.md`](.claude/rules/design-system.md) | `apps/web` : tokens, classes de daisyUI, composants, Storybook, lint des classes                                  |
| [`tests.md`](.claude/rules/tests.md)                 | Tests Vitest, scénarios Gherkin de l'API et du web, enregistrements                                               |

## Commandes

```bash
pnpm install          # Node 26 (.nvmrc), pnpm 12
pnpm check            # turbo run lint typecheck test build
pnpm e2e:api          # scénarios de l'API (anglais), en rejeu
pnpm e2e:web          # parcours du web (français), ordinateur et téléphone
pnpm format:check
node apps/cli/dist/main.js start   # bosco start : le service et la coquille
```

## Git

- [Conventional Commits](https://www.conventionalcommits.org/) en anglais (`feat(sessions): …`, `fix(api): …`), vérifiés par commitlint (hook `commit-msg`) ; le hook `pre-commit` formate les fichiers indexés avec Prettier.
- **Commits atomiques** : un changement cohérent par commit, qui compile et passe ses tests.
- Branches en anglais, `<type>/<sujet-en-kebab-case>` (`feat/session-overview`), sans numéro de lot ni identifiant des specs.
- `git push` et toute écriture distante demandent une confirmation explicite.
