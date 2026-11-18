import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { DOCS_CONTENT_DIR } from './src/lib/paths';

// Les images du contenu (/screenshots/…) sont importées depuis public/ : Next.js leur ajoute le sous-chemin de publication
export const docs = defineDocs({
  dir: DOCS_CONTENT_DIR,
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
