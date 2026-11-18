import { redirect } from 'next/navigation';

/** La page d'un groupe s'ouvre sur ses instructions, en attendant l'onglet de ses sessions. */
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/groups/${id}/instructions`);
}
