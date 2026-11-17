'use client';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import type { SubscriptionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

export interface SubscriptionPanelProps {
  busy: boolean;
  /** Refus de l'API : profil sans accès */
  error: null | string;
  onChange: (profile: string) => void;
  subscription: SubscriptionDto;
}

/** Profil de l'abonnement : son nom et son compte (« profil ~/.claude · camille@exemple.dev »). */
function profileName({ account, label }: { account: null | string; label: null | string }): string {
  return [label ? `profil ${label}` : null, account].filter(Boolean).join(' · ');
}

/**
 * Abonnement Claude par défaut (E11) : celui que propose une nouvelle session, choisi parmi les profils surveillés qui
 * ont un accès. Un bac à sable en reçoit une copie de l'accès. Sur le téléphone, il se lit sans se changer.
 */
export function SubscriptionPanel({ busy, error, onChange, subscription }: SubscriptionPanelProps) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(subscription.profile ?? subscription.choices[0]?.path ?? '');
  return (
    <section aria-labelledby="subscription-title" className="rounded-card border border-line bg-surface shadow-card">
      {error && (
        <p role="alert" className="border-b border-line bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-start gap-3 px-4 py-3">
        <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 id="subscription-title" className="font-medium">
            Abonnement par défaut
            {subscription.label || subscription.account ? ` · ${profileName(subscription)}` : ''}
          </h2>
          <p className="text-muted">
            {subscription.available
              ? 'Proposé à chaque nouvelle session ; tu peux en choisir un autre au démarrage. Un bac à sable en reçoit une copie de l’accès.'
              : 'Aucun accès à l’abonnement : connecte-toi dans un profil surveillé, puis choisis-le ici.'}
          </p>
          {editing && (
            <form
              className="mt-2 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onChange(profile);
                setEditing(false);
              }}
            >
              <select
                aria-label="Profil de l’abonnement Claude"
                className="select min-w-0 flex-1 select-sm"
                value={profile}
                onChange={(event) => setProfile(event.target.value)}
              >
                {subscription.choices.map((choice) => (
                  <option key={choice.path} value={choice.path}>
                    {profileName(choice)}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" disabled={busy || !profile}>
                Enregistrer
              </Button>
            </form>
          )}
        </div>
        {!editing && subscription.choices.length > 0 && (
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => setEditing(true)}>
            Modifier<span className="sr-only"> l’abonnement par défaut</span>
          </Button>
        )}
      </div>
    </section>
  );
}
