import { redirect } from 'next/navigation';

/** La page d'un groupe s'ouvre sur ses sessions : l'onglet est dans l'adresse. */
export default async function GroupRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/groups/${id}/sessions`);
}
