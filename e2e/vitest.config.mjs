import { defineConfig, mergeConfig } from 'vitest/config';
import { base } from '@bosco/configs/vitest';

// Tests du module d'enregistrement ; les scénarios Gherkin passent par Playwright (e2e:api, e2e:web).
export default mergeConfig(base, defineConfig({ test: { include: ['replay/**/*.test.ts'] } }));
