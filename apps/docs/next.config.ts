import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Sous-chemin de publication (GitHub Pages d'un dépôt : /bosco), vide en local
const basePath = process.env.BOSCO_DOCS_BASE_PATH ?? '';

const config: NextConfig = {
  // Site entièrement statique (out/), publiable sur GitHub Pages sans serveur
  output: 'export',
  basePath,
  // Le client a besoin du préfixe pour télécharger l'index de recherche et les images
  env: { BOSCO_DOCS_BASE_PATH: basePath },
  // Pas de serveur d'optimisation d'images sur un hébergement statique : next/image sert les originaux
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withMDX(config);
