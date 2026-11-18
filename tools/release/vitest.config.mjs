import { defineConfig, mergeConfig } from 'vitest/config';
import { base } from '@bosco/configs/vitest';

// Calcul des versions de release ; le workflow lui-même se vérifie par un essai à blanc (dry_run).
export default mergeConfig(base, defineConfig({ test: { include: ['src/**/*.test.ts'] } }));
