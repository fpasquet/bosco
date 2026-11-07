import type { Preview } from '@storybook/nextjs-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/app/fonts';
import '../src/app/globals.css';

const preview: Preview = {
  // Onglet Docs pour toutes les histoires, sans le répéter dans chaque fichier.
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Une violation d'accessibilité fait échouer le test de l'histoire (vitest, CI).
    a11y: { test: 'error' },
    options: {
      // Sections dans l'ordre des rôles, UI par catégories, puis titres par ordre alphabétique ; les histoires d'un
      // fichier gardent leur ordre.
      storySort: {
        method: 'alphabetical',
        order: [
          'Design system',
          ['Introduction', 'Tokens', 'Classes'],
          'UI',
          ['Actions', 'Forms', ['Field', '*'], 'Overlays', 'Navigation', 'Display', 'Feedback'],
          'Shared',
          'Layouts',
          'Features',
          'Pages',
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({ themes: { Clair: '', Sombre: 'dark' }, defaultTheme: 'Clair' }),
    // Données du serveur : un cache TanStack Query neuf par histoire, sans nouvelle tentative
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default preview;
