import { redirect } from 'next/navigation';

/** Ancienne page Sources : l'onglet Sources des Réglages, avec le canal demandé (« ?canal=pro »). */
export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ canal?: string }> }) {
  const { canal } = await searchParams;
  redirect(canal ? `/settings/sources?canal=${encodeURIComponent(canal)}` : '/settings/sources');
}
