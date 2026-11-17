import { redirect } from 'next/navigation';

/** Ancienne adresse de l'isolation du bac à sable : l'onglet Bac à sable des Réglages. */
export default function IsolationPage() {
  redirect('/settings/sandbox');
}
