import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';

// Servi par le service NestJS (serveur personnalisé, DT-13) : pas de serveur Next.js autonome à produire.
// En développement, Next.js ne sert ses ressources qu'aux adresses permises : celle de `make dev` (127.0.0.1), et
// celles du poste sur le réseau local, que le téléphone ouvre (E4c). Sans elles, la page du téléphone ne s'anime pas.
const localAddresses = Object.values(networkInterfaces())
  .flat()
  .flatMap((address) => (address && address.family === 'IPv4' && !address.internal ? [address.address] : []));

const config: NextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    ...localAddresses,
    ...(process.env.BOSCO_PHONE_HOST ? [process.env.BOSCO_PHONE_HOST] : []),
  ],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
