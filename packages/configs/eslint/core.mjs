// ESLint de packages/core : socle + frontières de l'architecture hexagonale (eslint-plugin-boundaries).
// Un dossier par contexte métier (src/<contexte>/domain et application) ; src/shared porte le noyau partagé.
import boundaries from 'eslint-plugin-boundaries';
import { base } from './base.mjs';

/** Frameworks et bibliothèques techniques interdits au domaine et à l'application : ils vivent dans les adaptateurs. */
const FRAMEWORKS = {
  group: [
    '@nestjs/*',
    '@mikro-orm/*',
    'next',
    'next/*',
    'react',
    'rxjs',
    'undici',
    'dockerode',
    'node:fs',
    'node:child_process',
    'node:http',
    'node:https',
  ],
  message:
    "Le domaine et l'application restent sans framework ni accès au système : déclarer un port, l'adaptateur vit dans apps/.",
};

/** @param {import('./base.mjs').BaseOptions} options @returns {import('eslint').Linter.Config[]} */
export function core(options) {
  return [
    ...base(options),
    {
      files: ['src/**/*.ts'],
      plugins: { boundaries },
      settings: {
        'import/resolver': {
          typescript: { alwaysTryTypes: true, project: `${options.tsconfigRootDir}/tsconfig.json` },
        },
        'boundaries/root-path': options.tsconfigRootDir,
        'boundaries/elements': [
          { type: 'domain', pattern: 'src/*/domain', partialMatch: false, capture: ['context'] },
          { type: 'application', pattern: 'src/*/application', partialMatch: false, capture: ['context'] },
          { type: 'entry', pattern: 'src', partialMatch: false },
        ],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'allow',
            policies: [
              {
                from: { element: { type: 'domain' } },
                disallow: { to: { element: { types: { anyOf: ['application', 'entry'] } } } },
                message: 'Le domaine ne dépend que de lui-même et du noyau partagé (ici : {{to.element.types}}).',
              },
              {
                from: { element: { type: 'application' } },
                disallow: { to: { element: { type: 'entry' } } },
                message: "L'application ne dépend que de son domaine, de ses ports et du noyau partagé.",
              },
              {
                from: { element: { types: { anyOf: ['domain', 'application'] }, captured: { context: '!shared' } } },
                disallow: {
                  to: {
                    element: {
                      types: { anyOf: ['domain', 'application'] },
                      captured: { context: '!{{from.element.captured.context}}' },
                    },
                  },
                },
                message:
                  "Un contexte n'utilise pas les classes d'un autre : il déclare un port, branché à l'assemblage.",
              },
              {
                // Noyau partagé (src/shared) : son domaine sert à tous les contextes, son application à toutes les applications.
                from: { element: { types: { anyOf: ['domain', 'application'] } } },
                allow: { to: { element: { type: 'domain', captured: { context: 'shared' } } } },
              },
              {
                from: { element: { type: 'application' } },
                allow: { to: { element: { type: 'application', captured: { context: 'shared' } } } },
              },
            ],
          },
        ],
        'no-restricted-imports': ['error', { patterns: [FRAMEWORKS] }],
      },
    },
  ];
}
