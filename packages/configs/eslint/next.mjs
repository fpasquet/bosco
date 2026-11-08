// ESLint de l'interface Next.js : socle + règles Next (Core Web Vitals), hooks React, accessibilité stricte.
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { base } from './base.mjs';

/** @param {import('./base.mjs').BaseOptions} options @returns {import('eslint').Linter.Config[]} */
export function next(options) {
  return [
    ...base(options),
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: { globals: { ...globals.browser } },
      plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
      settings: { next: { rootDir: options.tsconfigRootDir } },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
        ...reactHooks.configs.recommended.rules,
        ...jsxA11y.flatConfigs.strict.rules,
        // Les props React ne sont jamais modifiées : Readonly<> partout n'ajouterait que du bruit.
        'sonarjs/prefer-read-only-props': 'off',
        // Une zone qui défile doit se parcourir au clavier (axe : scrollable-region-focusable) : un journal (role="log"),
        // comme le fil d'une session, peut donc prendre le focus
        'jsx-a11y/no-noninteractive-tabindex': [
          'error',
          { tags: [], roles: ['tabpanel', 'log'], allowExpressionValues: true },
        ],
        // Les segments de route de Next.js ([id], (groupe)) gardent leur syntaxe ; le reste du code est en kebab-case
        'check-file/folder-naming-convention': [
          'error',
          { 'src/app/**/': 'NEXT_JS_APP_ROUTER_CASE', 'src/!(app)/**/': 'KEBAB_CASE' },
        ],
      },
    },
  ];
}
