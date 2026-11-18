// Chemins du site, lus aussi par source.config.ts : ce fichier n'importe rien, pour que fumadocs-mdx le charge seul

// Préfixe des pages quand le site est publié sous un sous-chemin (GitHub Pages d'un dépôt : /bosco)
export const BASE_PATH = process.env.BOSCO_DOCS_BASE_PATH ?? '';

export const DOCS_BASE_PATH = '/docs';
export const DOCS_CONTENT_DIR = 'content/docs';
