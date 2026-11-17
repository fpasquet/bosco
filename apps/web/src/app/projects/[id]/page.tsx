import { redirect } from 'next/navigation';

/** La page d'un projet s'ouvre sur ses sessions : l'onglet est dans l'adresse. */
export default async function ProjectRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/projects/${id}/sessions`);
}
