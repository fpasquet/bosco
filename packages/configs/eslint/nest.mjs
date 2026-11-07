// ESLint des applications NestJS (apps/api, apps/worker) : socle + résultat d'un await nommé avant usage.
import { base } from './base.mjs';

const AWAIT_FIRST = "Nommer le résultat de l'await dans une constante, puis l'utiliser.";

/** @param {import('./base.mjs').BaseOptions} options @returns {import('eslint').Linter.Config[]} */
export function nest(options) {
  return [
    ...base(options),
    {
      rules: {
        'no-restricted-syntax': [
          'error',
          { selector: 'MemberExpression > AwaitExpression.object', message: AWAIT_FIRST },
          { selector: 'CallExpression > AwaitExpression.arguments', message: AWAIT_FIRST },
        ],
      },
    },
  ];
}
