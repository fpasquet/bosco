// Socle ESLint commun (configuration plate) : TypeScript typé, imports de types stricts, tri, noms de fichiers,
// qualité (sonarjs) ; eslint-config-prettier en dernier, la mise en forme est l'affaire de Prettier.
// Usage : export default base({ tsconfigRootDir: import.meta.dirname })
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import perfectionist from 'eslint-plugin-perfectionist';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Paquets du monorepo, triés à part des dépendances externes. */
export const INTERNAL_PATTERN = ['^@/.+', '^@bosco/.+'];

/**
 * @typedef {object} BaseOptions
 * @property {string} tsconfigRootDir dossier du tsconfig.json du paquet (import.meta.dirname)
 * @property {string[]} [ignores] chemins à ne pas analyser, en plus des sorties de build
 */

/** @param {BaseOptions} options @returns {import('eslint').Linter.Config[]} */
export function base({ tsconfigRootDir, ignores = [] }) {
  return [
    {
      ignores: [
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/.features-gen/**',
        '**/test-results/**',
        '**/reports/**',
        '**/next-env.d.ts',
        ...ignores,
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    sonarjs.configs.recommended,
    {
      languageOptions: { globals: { ...globals.node }, parserOptions: { projectService: true, tsconfigRootDir } },
      plugins: { 'check-file': checkFile, perfectionist },
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        // `void promesse` est la forme qu'exige no-floating-promises pour une promesse volontairement non attendue.
        'sonarjs/void-use': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: true },
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: true }],
        'perfectionist/sort-imports': [
          'error',
          { type: 'natural', internalPattern: INTERNAL_PATTERN, newlinesBetween: 0 },
        ],
        'perfectionist/sort-named-imports': ['error', { type: 'natural' }],
        'perfectionist/sort-named-exports': ['error', { type: 'natural' }],
        'check-file/filename-naming-convention': [
          'error',
          { '**/*.{ts,tsx,mjs}': 'KEBAB_CASE' },
          { ignoreMiddleExtensions: true },
        ],
        'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
      },
    },
    {
      files: ['**/*.test.ts', 'test/**', 'e2e/**', '**/steps/**', '**/shared/**', '**/support/**'],
      rules: {
        'sonarjs/no-hardcoded-secrets': 'off',
        'sonarjs/no-duplicate-string': 'off',
        // Une fixture Playwright sans dépendance s'écrit `async ({}, use)` : la forme est imposée par Playwright.
        'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
      },
    },
    { files: ['**/*.js', '**/*.mjs'], ...tseslint.configs.disableTypeChecked },
    prettier,
  ];
}
