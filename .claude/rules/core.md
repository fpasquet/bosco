---
paths:
  - 'packages/core/**'
---

# Domaine et cas d'usage (packages/core)

L'architecture hexagonale n'a de sens que si le domaine porte les règles. Conception complète : cahier des charges, §6.7 et §6.8 (`docs/requirements/60-architecture.md`).

## Contextes

- Un dossier par contexte dans `src/<contexte>/` : `sessions`, `devices`, `tasks`, `policies`, `knowledge` (ils arrivent lot par lot). Chacun a deux couches :
  - `domain/` : agrégats, objets valeur, événements, erreurs ; **aucun** import de NestJS, MikroORM, Next.js, rxjs, undici ni de `node:fs`, `node:child_process`, `node:http(s)` ;
  - `application/` : un service par agrégat (`session.service.ts`) et `ports.ts` ; mêmes interdits.
- `src/shared/` est le noyau partagé (erreur de base, identifiants, `APP_NAME`).
- Un contexte n'importe jamais les classes d'un autre : il déclare un port, que l'assemblage (`apps/api`, `apps/worker`) branche sur le service de l'autre contexte.
- Ces frontières sont vérifiées par le lint (`@bosco/configs/eslint/core`, eslint-plugin-boundaries) : une violation se corrige, jamais ne se désactive.

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

## Tests

Vitest, sans base ni réseau, horloge fixe : les invariants, le temps, les cas rares. Un parcours déjà couvert par un scénario Gherkin ne se rejoue pas en test unitaire (`tests.md`).
