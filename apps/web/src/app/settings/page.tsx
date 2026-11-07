import { redirect } from 'next/navigation';

/** Réglages : les intégrations, premier onglet. */
export default function SettingsPage() {
  redirect('/settings/integrations');
}
