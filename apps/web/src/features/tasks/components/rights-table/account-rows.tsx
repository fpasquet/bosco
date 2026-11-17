'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { ClaudeProfileDto, RepositoryAccountsDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';

export type AccountField = 'claudeProfile' | 'githubAccount';

const LABELS: Record<AccountField, string> = { claudeProfile: 'Abonnement Claude', githubAccount: 'Compte GitHub' };

/** « profil perso · camille.perso@exemple.dev » */
export function profileLabel(profile: ClaudeProfileDto | null): string {
  if (!profile) return 'aucun accès';
  return [`profil ${profile.label}`, profile.account].filter(Boolean).join(' · ');
}

export interface AccountRowsProps {
  accounts: RepositoryAccountsDto;
  busy: boolean;
  error: null | string;
  /** null : revenir au défaut ; la promesse échoue quand l'API refuse */
  onSave: (field: AccountField, value: null | string) => Promise<unknown>;
  repository: null | string;
}

/**
 * Abonnement Claude et compte GitHub d'un dépôt (E8a, lignes 8 et 9), dans le tableau des droits. Le défaut se règle
 * dans l'isolation du worker (E11b) : en réglages généraux, « Modifier » y mène.
 */
export function AccountRows({ accounts, busy, error, onSave, repository }: AccountRowsProps) {
  const [editing, setEditing] = useState<AccountField | null>(null);
  const [draft, setDraft] = useState('');
  const rows: {
    choices: { label: string; value: string }[];
    effective: string;
    field: AccountField;
    general: string;
    origin: string;
    own: null | string;
    ownValue: null | string;
  }[] = [
    {
      field: 'claudeProfile',
      general: profileLabel(accounts.claude.general),
      own: accounts.claude.repository ? profileLabel(accounts.claude.repository) : null,
      ownValue: accounts.claude.repository?.path ?? null,
      effective: profileLabel(accounts.claude.effective),
      origin: accounts.claude.origin,
      choices: accounts.claude.choices.map((choice) => ({ label: profileLabel(choice), value: choice.path })),
    },
    {
      field: 'githubAccount',
      general: accounts.github.general ?? 'aucun compte',
      own: accounts.github.repository,
      ownValue: accounts.github.repository,
      effective: accounts.github.effective ?? 'aucun compte',
      origin: accounts.github.origin,
      choices: accounts.github.choices.map((login) => ({ label: login, value: login })),
    },
  ];
  const save = (field: AccountField, value: null | string) =>
    onSave(field, value).then(
      () => setEditing(null),
      () => undefined,
    );
  return rows.map(({ choices, effective, field, general, origin, own, ownValue }) => (
    <tr key={field} className="align-top">
      <th scope="row" className="font-medium">
        {LABELS[field]}
      </th>
      <td className={cn(repository && 'text-muted', field === 'githubAccount' && 'font-mono text-xs')}>{general}</td>
      {repository && (
        <td>
          {editing === field ? (
            <form
              className="flex flex-col gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                void save(field, draft);
              }}
            >
              <label htmlFor={`account-${field}`} className="sr-only">
                {LABELS[field]}
              </label>
              <select
                id={`account-${field}`}
                className="select select-sm"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              >
                {choices.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="xs" disabled={busy || !draft}>
                  Enregistrer
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            (own ?? <span className="text-muted">hérité</span>)
          )}
        </td>
      )}
      {repository && (
        <td>
          <span className="flex flex-col gap-0.5">
            <span className={cn(field === 'githubAccount' && 'font-mono text-xs')}>{effective}</span>
            <span className="text-xs text-muted">{origin}</span>
          </span>
        </td>
      )}
      <td>
        {editing !== field && (
          <span className="flex flex-wrap justify-end gap-1">
            {repository ? (
              <Button
                size="xs"
                variant="ghost"
                aria-label={`Modifier : ${LABELS[field]}`}
                disabled={busy || choices.length === 0}
                onClick={() => {
                  setDraft(ownValue ?? choices[0]?.value ?? '');
                  setEditing(field);
                }}
              >
                Modifier
              </Button>
            ) : (
              <Button asChild size="xs" variant="ghost">
                <Link href="/settings/isolation/egress" aria-label={`Modifier : ${LABELS[field]}`}>
                  Modifier
                </Link>
              </Button>
            )}
            {own && (
              <Button
                size="xs"
                variant="ghost"
                aria-label={`Revenir au général : ${LABELS[field]}`}
                disabled={busy}
                onClick={() => void save(field, null)}
              >
                Revenir au général
              </Button>
            )}
          </span>
        )}
      </td>
    </tr>
  ));
}

/** Les mêmes lignes sur le téléphone, en lecture seule. */
export function AccountItems({ accounts, repository }: Pick<AccountRowsProps, 'accounts' | 'repository'>) {
  const items = [
    {
      field: 'claudeProfile' as const,
      value: profileLabel(accounts.claude.effective),
      origin: accounts.claude.origin,
      general: accounts.claude.repository ? profileLabel(accounts.claude.general) : null,
    },
    {
      field: 'githubAccount' as const,
      value: accounts.github.effective ?? 'aucun compte',
      origin: accounts.github.origin,
      general: accounts.github.repository ? (accounts.github.general ?? 'aucun compte') : null,
    },
  ];
  return items.map(({ field, general, origin, value }) => (
    <li key={field} className="flex flex-col gap-0.5 px-4 py-3">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{LABELS[field]}</span>
        <span className="text-xs text-muted">{origin}</span>
      </span>
      <span>{value}</span>
      {repository && general && <span className="text-xs text-muted">Général : {general}</span>}
    </li>
  ));
}
