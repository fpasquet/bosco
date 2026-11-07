import { redirect } from 'next/navigation';

/** Réglages : l'isolation du worker, premier onglet. */
export default function SettingsPage() {
  redirect('/settings/isolation');
}
