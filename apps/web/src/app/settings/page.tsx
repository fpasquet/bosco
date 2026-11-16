import { redirect } from 'next/navigation';

/** Réglages : les dépôts, premier onglet. */
export default function SettingsPage() {
  redirect('/settings/repositories');
}
