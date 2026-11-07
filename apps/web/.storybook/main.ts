import type { StorybookConfig } from '@storybook/nextjs-vite';

/** Documentation du design system : tokens, classes sémantiques, composants sans état et écrans. */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes', '@storybook/addon-vitest'],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    // JSX sans import de React, même quand tsconfig.json est en "jsx": "preserve" (Next.js, paquet partagé) ; Vite 8
    // transforme avec oxc (l'option esbuild est dépréciée)
    oxc: { ...(typeof viteConfig.oxc === 'object' ? viteConfig.oxc : {}), jsx: { runtime: 'automatic' } },
    // Runtime JSX optimisé d'emblée : découvert en cours de test, il recharge la page et fait échouer le premier
    // lancement des histoires (cache vide, toujours le cas en CI)
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [...(viteConfig.optimizeDeps?.include ?? []), 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    // Directives « use client » des composants Radix et de shadcn : sans effet hors de Next.js, signalées à chaque
    // fichier par le build
    build: {
      ...viteConfig.build,
      rolldownOptions: {
        ...viteConfig.build?.rolldownOptions,
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
        },
      },
    },
  }),
};

export default config;
