import './fonts';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { APP_NAME } from '@bosco/core/shared';
import { Providers } from './providers';

export const metadata: Metadata = { title: APP_NAME, icons: { icon: '/favicon.svg' } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
