'use client';
import { KeyRound, Lock, Package } from 'lucide-react';
import { useState } from 'react';
import type { WorkerSecretsDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

export interface WorkerSecretsProps {
  busy: boolean;
  /** Refus de l'API : profil sans accès, chemin relatif */
  error?: null | string;
  onChange: (changes: { npmrc?: string; profile?: string }) => void;
  secrets: WorkerSecretsDto;
}

/** Profil de l'abonnement : son nom et son compte (« pro · camille@exemple.dev »). */
function profileName({ account, label }: { account: null | string; label: null | string }): string {
  return [label ? `profil ${label}` : null, account].filter(Boolean).join(' · ');
}

/**
 * Secrets transmis à chaque tâche du worker (E11b) : une copie de l'accès à l'abonnement Claude du profil choisi, et
 * une copie du .npmrc choisi, supprimées à la fin de la tâche. Sur le téléphone, tout se lit sans se changer.
 */
export function WorkerSecrets({ busy, error = null, onChange, secrets }: WorkerSecretsProps) {
  const [editing, setEditing] = useState<'npmrc' | 'profile' | null>(null);
  const [profile, setProfile] = useState(secrets.claude.profile ?? secrets.claude.choices[0]?.path ?? '');
  const [npmrc, setNpmrc] = useState(secrets.npmrc.path);
  const { claude } = secrets;
  return (
    <>
      {error && (
        <p role="alert" className="border-b border-line bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="divide-y divide-line">
        <li className="flex items-start gap-3 px-4 py-3">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Abonnement Claude{claude.label || claude.account ? ` · ${profileName(claude)}` : ''}
            </p>
            <p className="text-muted">
              {claude.available
                ? 'Copie temporaire de l’accès, supprimée à la fin de la tâche.'
                : 'Aucun accès à l’abonnement : connecte-toi dans un profil, puis choisis-le ici.'}
            </p>
            {editing === 'profile' && (
              <form
                className="mt-2 flex flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onChange({ profile });
                  setEditing(null);
                }}
              >
                <select
                  aria-label="Profil de l’abonnement Claude"
                  className="select min-w-0 flex-1 select-sm"
                  value={profile}
                  onChange={(event) => setProfile(event.target.value)}
                >
                  {claude.choices.map((choice) => (
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
          {editing !== 'profile' && claude.choices.length > 0 && (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => setEditing('profile')}>
              Modifier<span className="sr-only"> le profil de l’abonnement</span>
            </Button>
          )}
        </li>
        <li className="flex items-start gap-3 px-4 py-3">
          <Package aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Accès npm · <span className="font-mono text-xs">{secrets.npmrc.path}</span>
            </p>
            <p className="text-muted">
              {secrets.npmrc.exists
                ? 'Copie du fichier du poste, jetons compris, en lecture seule ; supprimée à la fin de la tâche.'
                : 'Aucun fichier à cet endroit : les installations passent par les registres publics autorisés.'}
            </p>
            {secrets.npmrc.registries.length > 0 && (
              <ul aria-label="Registres privés" className="mt-2 flex flex-col gap-1 text-xs">
                {secrets.npmrc.registries.map(({ host, scope }) => (
                  <li key={`${scope ?? ''}${host}`} className="font-mono">
                    {scope ?? 'par défaut'} → {host}
                  </li>
                ))}
              </ul>
            )}
            {editing === 'npmrc' && (
              <form
                className="mt-2 flex flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onChange({ npmrc });
                  setEditing(null);
                }}
              >
                <input
                  aria-label="Fichier .npmrc"
                  className="input min-w-0 flex-1 font-mono input-sm"
                  value={npmrc}
                  onChange={(event) => setNpmrc(event.target.value)}
                />
                <Button type="submit" size="sm" disabled={busy || !npmrc.trim()}>
                  Enregistrer
                </Button>
              </form>
            )}
          </div>
          {editing !== 'npmrc' && (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => setEditing('npmrc')}>
              Modifier<span className="sr-only"> le fichier .npmrc</span>
            </Button>
          )}
        </li>
        <li className="flex items-start gap-3 px-4 py-3">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="font-medium">Jamais transmis</p>
            <p className="text-muted">Les accès des intégrations, tes autres accès, les réglages du poste.</p>
          </div>
        </li>
      </ul>
    </>
  );
}
