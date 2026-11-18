import { redirect } from 'next/navigation';

/** Réglages : les projets, premier onglet. */
export default function SettingsPage() {
  redirect('/settings/projects');
}
