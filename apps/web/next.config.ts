import type { NextConfig } from 'next';

// Servi par le service NestJS (serveur personnalisé, DT-13) : pas de serveur Next.js autonome à produire.
const config: NextConfig = { reactStrictMode: true, poweredByHeader: false };

export default config;
