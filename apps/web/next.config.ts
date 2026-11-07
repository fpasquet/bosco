import type { NextConfig } from 'next';

// Servi par le service NestJS (serveur personnalisé, DT-13) : pas de serveur Next.js autonome à produire.
// En développement, l'adresse de `make dev` (127.0.0.1) doit pouvoir charger les ressources de Next.js et son rechargement.
const config: NextConfig = { allowedDevOrigins: ['127.0.0.1'], poweredByHeader: false, reactStrictMode: true };

export default config;
