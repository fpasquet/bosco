---
paths:
  - 'apps/web/**'
---

# Interface Next.js (apps/web)

Composants, classes et Storybook : `design-system.md`. Cette règle couvre l'organisation et les données.

## Organisation

```
src/
  app/                 routes (chemins en anglais : /history, /tasks…), métadonnées, puis le composant de la fonctionnalité
  features/<nom>/      une fonctionnalité (sessions, tasks, context…) : components/, hooks/, api/, lib/ (fonctions pures)
  shared/ui/           composants sans état du design system
  shared/layouts/      coquille et mises en page (AppShell)
  lib/                 utilitaires communs (cn)
```

- Une fonctionnalité n'importe jamais une autre fonctionnalité : ce qui sert à deux va dans `shared/`.
- Composants serveur par défaut ; `'use client'` seulement pour ce qui réagit (navigation courante, formulaires, données en direct).

## Données

- TanStack Query porte tout ce qui vient du serveur : le cache des vues en direct est rempli par le flux (instantané puis changements), celui des autres écrans par l'API REST. Pas de second état à synchroniser.
- Zustand ne garde que l'état de l'interface (regroupement, filtres, panneaux ouverts) ; le regroupement choisi est conservé d'une visite à l'autre.
- Tout formulaire passe par React Hook Form : `register` pour les champs natifs, `setValue` et `useWatch` pour les contrôles composés, jamais `useState` pour une valeur saisie. Un schéma zod (`zodResolver`) porte ce que le formulaire vérifie seul, avec les messages de l'API ; les erreurs renvoyées par l'API se posent sur leur champ avec `setError(champ, { type: 'server' })`. Les plafonds qui dépendent des droits restent vérifiés par l'API.

## Textes et accessibilité

- Textes de l'interface en français, repris des specs (libellés exacts des maquettes) ; le nom de l'application par `APP_NAME`.
- WCAG 2.2 AA (NF-18) : un état n'est jamais porté par la seule couleur ; navigation au clavier, focus visible ; `aria-current` sur la page courante ; logo décoratif à côté du nom, nommé quand il est seul.
- Desktop et mobile : point de rupture à 768 px (`md:`) ; sur téléphone, on consulte et on répond, on configure sur le poste.
