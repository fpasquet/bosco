'use client';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { PhoneAccess } from './phone-access';

/** Réglages › Téléphone : l'accès depuis le téléphone et ses appairages, réservés au poste. */
export function PhoneSettingsScreen() {
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="phone" />
      <section
        aria-label="Accès depuis le téléphone"
        className="rounded-card border border-line bg-surface shadow-card"
      >
        <PhoneAccess />
        <p className="px-4 py-3 text-muted md:hidden">
          Modifiable depuis le poste. L’appairage d’un téléphone se déclenche depuis le poste.
        </p>
      </section>
    </div>
  );
}
