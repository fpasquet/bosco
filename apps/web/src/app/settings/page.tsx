import { redirect } from 'next/navigation';

/** Réglages : l'onglet Sources d'abord. */
export default function SettingsPage() {
  redirect('/settings/sources');
}
