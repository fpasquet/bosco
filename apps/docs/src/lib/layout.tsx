import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Logo } from '@/components/logo';
import { DOCS_BASE_PATH, GITHUB_URL } from '@/lib/constants';

// Barre de navigation commune à l'accueil et aux pages de documentation
export const baseOptions: BaseLayoutProps = {
  githubUrl: GITHUB_URL,
  links: [{ active: 'nested-url', text: 'Documentation', url: DOCS_BASE_PATH }],
  nav: { title: <Logo />, url: '/' },
};
