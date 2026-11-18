import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    // Les liens de la barre de l'accueil doubleraient l'arborescence, qui a déjà sa page Télécharger
    <DocsLayout {...baseOptions} links={[]} tree={source.getPageTree()}>
      {children}
    </DocsLayout>
  );
}
