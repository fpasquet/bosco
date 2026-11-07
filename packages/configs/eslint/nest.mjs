// ESLint de l'application serveur (NestJS) : socle + frontières de l'architecture hexagonale par modules
// (eslint-plugin-boundaries) + résultat d'un await nommé avant usage.
// Un dossier par contexte (src/<contexte>/domain, application, infrastructure, interface), src/shared pour le noyau
// partagé, src pour le point de composition (modules, configuration, points d'entrée).
import boundaries from 'eslint-plugin-boundaries';
import { base } from './base.mjs';

/** Frameworks et accès au système interdits au domaine et à l'application : ils vivent dans l'infrastructure. */
const FRAMEWORKS = {
  group: [
    '@nestjs/*',
    '@mikro-orm/*',
    'next',
    'next/*',
    'rxjs',
    'undici',
    'chokidar',
    'dockerode',
    'zod',
    'node:fs',
    'node:fs/*',
    'node:child_process',
    'node:http',
    'node:https',
    'node:net',
  ],
  message:
    "Le domaine et l'application restent sans framework ni accès au système : déclarer un port, l'adaptateur va dans infrastructure/.",
};

const AWAIT_FIRST = "Nommer le résultat de l'await dans une constante, puis l'utiliser.";

/** @param {import('./base.mjs').BaseOptions} options @returns {import('eslint').Linter.Config[]} */
export function nest(options) {
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
          { type: 'infrastructure', pattern: 'src/*/infrastructure', partialMatch: false, capture: ['context'] },
          { type: 'interface', pattern: 'src/*/interface', partialMatch: false, capture: ['context'] },
          { type: 'migrations', pattern: 'src/migrations', partialMatch: false },
          // Racine d'un contexte : son module NestJS et ses jetons d'injection
          { type: 'context', pattern: 'src/*', partialMatch: false, capture: ['context'] },
          // Point de composition : app.module.ts, main.ts, configuration, persistence.module.ts…
          { type: 'composition', pattern: 'src', partialMatch: false },
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
                disallow: {
                  to: [
                    { element: { types: { anyOf: ['application', 'infrastructure', 'interface', 'context'] } } },
                    { element: { types: { anyOf: ['composition', 'migrations'] } } },
                  ],
                },
                message: 'Le domaine ne dépend que de lui-même et du domaine partagé (ici : {{to.element.types}}).',
              },
              {
                from: { element: { type: 'application' } },
                disallow: {
                  to: [
                    { element: { types: { anyOf: ['infrastructure', 'interface', 'context', 'composition'] } } },
                    { element: { type: 'migrations' } },
                  ],
                },
                message: "L'application ne dépend que de son domaine et de ses ports (ici : {{to.element.types}}).",
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
                  "Un contexte n'utilise pas les classes d'un autre : il déclare un port, branché par le point de composition.",
              },
              {
                from: { element: { types: { anyOf: ['infrastructure', 'interface'] } } },
                disallow: { to: { element: { type: 'composition' } } },
                message:
                  'Les adaptateurs ne dépendent pas du point de composition : recevoir la configuration par injection.',
              },
            ],
          },
        ],
        'no-restricted-syntax': [
          'error',
          { selector: 'MemberExpression > AwaitExpression.object', message: AWAIT_FIRST },
          { selector: 'CallExpression > AwaitExpression.arguments', message: AWAIT_FIRST },
        ],
      },
    },
    {
      files: ['src/*/domain/**/*.ts', 'src/*/application/**/*.ts'],
      rules: { 'no-restricted-imports': ['error', { patterns: [FRAMEWORKS] }] },
    },
  ];
}
