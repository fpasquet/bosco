import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { BASE_PATH, DOCS_CONTENT_DIR } from './src/lib/paths';

interface MdastNode {
  children?: MdastNode[];
  type?: string;
  url?: string;
}

// next/image ne préfixe pas le sous-chemin de publication des images statiques : on l'ajoute aux images du contenu
function remarkBasePathImages() {
  return (tree: MdastNode): void => {
    const visit = (node: MdastNode): void => {
      if (node.type === 'image' && node.url?.startsWith('/')) node.url = `${BASE_PATH}${node.url}`;
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export const docs = defineDocs({
  dir: DOCS_CONTENT_DIR,
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkBasePathImages],
    rehypeCodeOptions: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
