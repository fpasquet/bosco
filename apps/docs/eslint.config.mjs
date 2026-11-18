import { next } from '@bosco/configs/eslint/next';

// .source est généré par fumadocs-mdx, out/ par l'export statique
export default [...next({ tsconfigRootDir: import.meta.dirname, ignores: ['.source/**', 'out/**'] })];
