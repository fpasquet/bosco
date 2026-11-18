import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './global.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import SearchDialog from '@/components/search';
import { BASE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/constants';
import { frenchTranslations } from '@/lib/translations';

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  icons: { icon: [{ type: 'image/svg+xml', url: `${BASE_PATH}/favicon.svg` }] },
  metadataBase: new URL(SITE_URL),
  openGraph: { locale: 'fr_FR', siteName: SITE_NAME, type: 'website' },
  title: { default: `${SITE_NAME} · ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { color: '#f3f6f5', media: '(prefers-color-scheme: light)' },
    { color: '#0e1716', media: '(prefers-color-scheme: dark)' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={{ locale: 'fr', translations: frenchTranslations }} search={{ SearchDialog }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
