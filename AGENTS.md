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

| Règle                                                | Couvre                                                                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`general.md`](.claude/rules/general.md)             | Tout le dépôt : nommage, TypeScript, dépendances, configuration, secrets, lint, contrôles avant de rendre la main                                               |
| [`nestjs.md`](.claude/rules/nestjs.md)               | `apps/api` : modules par contexte et leurs quatre couches, domaine, cas d'usage, adaptateurs, erreurs HTTP, validation, MikroORM, flux en direct, anti-patterns |
| [`nextjs.md`](.claude/rules/nextjs.md)               | `apps/web` : organisation, données (TanStack Query, Zustand), textes, accessibilité                                                                             |
| [`design-system.md`](.claude/rules/design-system.md) | `apps/web` : tokens, classes de daisyUI, composants, Storybook, lint des classes                                                                                |
| [`tests.md`](.claude/rules/tests.md)                 | Tests Vitest, scénarios Gherkin de l'API et du web, enregistrements                                                                                             |

## Commandes

Les commandes passent par le Makefile (`make help`) : Node 26 (`.nvmrc`), pnpm 12.

```bash
make install          # dépendances et skills épinglés
make dev              # service en développement sur 4880, interface rechargée à chaud, données dans .data/
make storybook        # http://localhost:6006
make check            # lint, types, tests et build (Turborepo)
make e2e              # e2e-api (anglais, en rejeu) puis e2e-web (français, ordinateur et téléphone)
make format-check
make tokens           # après une évolution des tokens dans les specs
make requirements     # après une évolution du cahier des charges
```

## Git

- [Conventional Commits](https://www.conventionalcommits.org/) en anglais (`feat(sessions): …`, `fix(api): …`), vérifiés par commitlint (hook `commit-msg`) ; le hook `pre-commit` formate les fichiers indexés avec Prettier.
- **Commits atomiques** : un changement cohérent par commit, qui compile et passe ses tests.
- Branches en anglais, `<type>/<sujet-en-kebab-case>` (`feat/session-overview`), sans numéro de lot ni identifiant des specs.
- `git push` et toute écriture distante demandent une confirmation explicite.
