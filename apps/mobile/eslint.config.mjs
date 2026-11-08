import { base } from '@bosco/configs/eslint/base';

// Coquille React Native : les règles communes du dépôt ; le code natif (modules/*/android) n'est pas du TypeScript
export default base({ tsconfigRootDir: import.meta.dirname, ignores: ['android/**', '.expo/**'] });
