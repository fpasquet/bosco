import { defineConfig, mergeConfig } from 'vitest/config';
import { nest } from '@bosco/configs/vitest';

export default mergeConfig(nest, defineConfig({}));
