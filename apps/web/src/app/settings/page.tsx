import { redirect } from 'next/navigation';

/** Réglages : les notifications, premier onglet. */
export default function SettingsPage() {
  redirect('/settings/notifications');
}
