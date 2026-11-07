---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.stories.tsx'
  - 'e2e/**'
  - '**/*.feature'
---

# Tests

## Ce que teste chaque niveau

- **Un parcours se teste une fois, en scénario Gherkin** : tout ce qu'une personne ou un client de l'API déclenche (règles, états, refus, messages). Pas de test unitaire qui rejoue un scénario.
- **Vitest couvre ce que les scénarios n'atteignent pas** : invariants du domaine, temps exact, cas rares, migrations, configuration. Chaque fichier dit en tête, en commentaire, ce qu'il couvre que les scénarios ne voient pas.
- **Storybook** : une histoire par état de chaque composant sans état, accessibilité bloquante (`test:stories`).

## Nommage et traçabilité

- Titres en anglais. Un test qui vérifie un critère le cite en tête de son nom : `it('CA-SESS-04 · …')` ; un scénario le porte en tag (`@CA-SESS-04`, `@RF-SESS-02`, `@NF-13` sur la fonctionnalité). `trace.mjs` mesure la couverture (NF-19).
- Les données reprennent le fil rouge des maquettes (`labo-ia`, `api-voix`, T-12, session `c41e9a07`…).

## Scénarios Gherkin (playwright-bdd)

- Deux suites séparées, lancées l'une sans l'autre : `e2e/api` (anglais, langue par défaut, sans en-tête) et `e2e/web` (français, chaque fichier commence par `# language: fr`, que lisent Prettier et l'éditeur). Chacune a sa configuration, ses phrases, ses enregistrements et son rapport.
- API : scénarios techniques, écrits avec les phrases génériques (`I send GET request to "/api/health"`, `the response code should be 200`, `the response should match snapshot`). Une phrase nouvelle s'ajoute dans `steps/` en réutilisant d'abord celles qui existent.
- Web : parcours écrits comme les dirait la personne, éléments visés par leur rôle accessible (`je clique sur le bouton « Autoriser »`), jamais par une classe ni un `data-*`. Chaque écran a un scénario qui finit par `la page est accessible` (axe, WCAG 2.2 AA). `@mobile` joue le scénario sur téléphone et l'exclut du poste.
- Une phrase ne se déclare qu'une fois (playwright-bdd ne distingue pas « Étant donné », « Quand » et « Alors »).
- Le contrôle des `.feature` (`e2e/shared/lint-features.ts`, dans `lint`) vérifie : tag de critère, une action et un résultat par scénario, contexte seul en `Contexte`, 15 scénarios au plus, noms uniques, description, langue.
- Une instance de Bosco par processus de test, remise à zéro entre deux scénarios par `POST /__test/reset` (présent seulement avec `BOSCO_TEST=1`).

## Enregistrements des appels sortants

- Le code de l'application garde `fetch` ; le module `e2e/replay` est chargé par `node --import` dans le service testé seulement.
- Modes (`BOSCO_REPLAY`) : `replay` (par défaut et en CI, une requête inconnue échoue), `record` (`pnpm e2e:api:record`, sur le poste avec les vrais accès), `update`, `clean` (`pnpm e2e:clean`, supprime ce qu'aucun scénario n'a utilisé). Les modes qui écrivent passent `--force` à Turborepo.
- Un fichier JSON lisible par réponse, rangé par hôte ; en-têtes en liste blanche, secrets masqués à l'enregistrement.
