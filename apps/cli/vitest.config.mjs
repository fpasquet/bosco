import { defineConfig, mergeConfig } from 'vitest/config';
import { base } from '@bosco/configs/vitest';

export default mergeConfig(base, defineConfig({}));
