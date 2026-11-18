import { next } from '@bosco/configs/eslint/next';

// .source est généré par fumadocs-mdx, .wrangler par wrangler pages dev, out/ par l'export statique
export default [...next({ tsconfigRootDir: import.meta.dirname, ignores: ['.source/**', '.wrangler/**', 'out/**'] })];
