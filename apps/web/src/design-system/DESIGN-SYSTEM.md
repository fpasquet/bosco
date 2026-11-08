# Design system : mémoire

Mémoire courte du skill `design-system` pour cette application : à lire en premier en reprise, à tenir à jour à la fin
de chaque étape, sous 120 lignes. Les conventions sont dans `.claude/rules/design-system.md`, pas ici.

## Emplacements

| Rôle             | Chemin                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Application      | `apps/web`                                                                                  |
| Feuille d'entrée | `apps/web/src/app/globals.css`                                                              |
| Tokens           | `apps/web/src/styles/tokens.css`                                                            |
| Tokens des specs | fpasquet/specs · bosco/ui/tokens.css, clone local `../specs/bosco/ui` (`tokens.mjs --from`) |
| Thème, classes   | `apps/web/src/styles/theme.css`, `apps/web/src/styles/components.css`                       |
| Composants       | `apps/web/src/shared/ui`, `apps/web/src/shared/components`                                  |
| Documentation    | `apps/web/src/design-system` (Storybook)                                                    |
| Conventions      | `.claude/rules/design-system.md`                                                            |

## Mode et état

- Mode : create, à partir des specs (lot 0, 07/11/2026).
- Classes : daisyUI 5.7.50, réglé par les tokens (thème daisyUI de theme.css).
- Dernier audit (2026-11-07) : à remplir avec les compteurs d'`audit.mjs` (erreurs, avertissements).

## Décisions

- 2026-11-07 · Échelles non restreintes (`--spacing-*`, `--text-*`) : les tokens sont une copie des specs, dont les maquettes emploient l'échelle de Tailwind ; une restriction se décide dans les specs.
- 2026-11-07 · `--color-overlay` ajouté aux specs (voile des fenêtres), puis recopié.
- 2026-11-07 · Un composant par fichier : `react/no-multi-comp` non branché (eslint-plugin-react ne déclare pas ESLint 10) ; convention gardée en relecture.
- 2026-11-07 · Commentaire de `theme.css` reformulé : il citait `--spacing-*: initial`, que l'audit prenait pour une restriction réelle de l'échelle.

- 2026-11-08 · Fil des sessions sur les patterns d'AI Elements (Reasoning, Tool, Terminal, Test Results, Stack Trace, Task) : composants shadcn `trace`, `code-block`, `message`, `bubble` et `collapsible` (style `radix-nova`, `components.json`), rangés par `rehome.mjs` sous des classes du projet. États par classes de modificateur (`trace-line-error`, `message-end`, `code-block-sm`) au lieu des `data-*` de shadcn ; `shimmer`, `scroll-fade` et `scrollbar-thin` de shadcn remplacés par `animate-pulse` et du CSS standard.
- 2026-11-08 · Markdown des agents par Streamdown (`shared/components/markdown`), mis en forme par la classe `markdown` : ses éléments sont rendus sans les classes de Streamdown, dont certaines (`text-3xl`) seraient compilées par ailleurs et l'emporteraient ; blocs de code par `HighlightedCode` (CodeBlock + Shiki). Thèmes Shiki `github-light-high-contrast` et `github-dark-high-contrast` : `github-light` échoue au contraste AA sur les lignes ajoutées ou retirées.

## Migration

Aucune : création. Lint en `error`.

## Versions

shadcn CLI 4.23.0 · Streamdown 2.7.1 · Shiki 4.5.0 · Storybook 10.6.5 · Tailwind 4.3.3 · eslint-plugin-better-tailwindcss 4.9.1 · daisyUI 5.7.50 · radix-ui 1.8.1 · Vitest 5.1.0 et Playwright 1.65.0 (au lieu de 5.0.5 et 1.64.1 testés par le skill : versions du monorepo).
