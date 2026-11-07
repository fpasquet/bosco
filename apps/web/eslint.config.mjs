import { next } from '@bosco/configs/eslint/next';
import { designSystem } from './eslint.design-system.mjs';

// Un composant par fichier : la règle react/no-multi-comp demande eslint-plugin-react, qui ne déclare pas encore
// ESLint 10 ; la convention reste dans .claude/rules/design-system.md et la relecture.
export default [
  ...next({ tsconfigRootDir: import.meta.dirname, ignores: ['storybook-static/**'] }),
  ...designSystem({ entryPoint: 'src/app/globals.css', oneComponentPerFile: false }),
];
