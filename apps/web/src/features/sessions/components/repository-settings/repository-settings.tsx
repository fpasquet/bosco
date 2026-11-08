'use client';
import { Eye, EyeOff, FolderOpen } from 'lucide-react';
import type { DiscoverySettingsDto, RepositorySettingsDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { displayPath, sessions, sinceNow } from '../../lib/format';
import { FolderList } from './folder-list';

/** Dossier exclu par défaut : les copies jetables et les essais (CA-SESS-79). */
const DEFAULT_EXCLUDED = ['/tmp'];

export interface RepositorySettingsProps {
  busy: boolean;
  data: RepositorySettingsDto;
  error: null | string;
  now: Date;
  onChange: (changes: Partial<DiscoverySettingsDto>) => void;
}

function Switch({
  checked,
  disabled,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  hint: React.ReactNode;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        className="toggle hidden toggle-primary md:inline-grid"
        disabled={disabled}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="font-medium md:hidden">{checked ? 'Oui' : 'Non'}</span>
    </div>
  );
}

/** Dépôts trouvés sous un dossier écrit comme dans le terminal. */
function countsUnder(folders: string[], roots: string[], home: string): Record<string, number> {
  const expand = (folder: string) => (folder === '~' || folder.startsWith('~/') ? `${home}${folder.slice(1)}` : folder);
  return Object.fromEntries(
    folders.map((folder) => {
      const path = expand(folder);
      return [folder, roots.filter((root) => root === path || root.startsWith(`${path}/`)).length];
    }),
  );
}

/**
 * Réglages › Dépôts (E4d) : comment Bosco range les sessions par dépôt, et les dépôts trouvés, les plus récents
 * d'abord. Sur le téléphone, tout se lit sans se changer.
 */
export function RepositorySettings({ busy, data, error, now, onChange }: RepositorySettingsProps) {
  const { home, outside, repositories, settings } = data;
  const toggleHidden = (root: string) =>
    onChange({
      hidden: settings.hidden.includes(root)
        ? settings.hidden.filter((candidate) => candidate !== root)
        : [...settings.hidden, root],
    });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-content-wide-aside">
      <div className="flex min-w-0 flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <section
          aria-labelledby="discovery-title"
          className="divide-y divide-line rounded-card border border-line bg-surface shadow-card"
        >
          <h2 id="discovery-title" className="px-4 py-2.5 text-xs font-semibold text-muted">
            Découverte
          </h2>
          <Switch
            label="Dépôts git seulement"
            hint="Une session hors d’un dépôt git se range sous « Hors dépôt git » : ton dossier personnel ou un dossier temporaire ne deviennent pas des dépôts."
            checked={settings.gitOnly}
            disabled={busy}
            onChange={(gitOnly) => onChange({ gitOnly })}
          />
          <Switch
            label="Worktrees rattachés à leur dépôt"
            hint={
              <>
                Un worktree git (<span className="font-mono">.claude/worktrees/…</span>) se range avec son dépôt
                d’origine, sous sa branche.
              </>
            }
            checked={settings.attachWorktrees}
            disabled={busy}
            onChange={(attachWorktrees) => onChange({ attachWorktrees })}
          />
        </section>
        <FolderList
          title="Dossiers de dépôts"
          hint="Seuls les dépôts sous ces dossiers sont retenus. Sans dossier : partout sur le poste."
          placeholder="~/projets"
          folders={settings.roots}
          counts={countsUnder(
            settings.roots,
            repositories.map(({ root }) => root),
            home,
          )}
          disabled={busy}
          onChange={(roots) => onChange({ roots })}
        />
        <FolderList
          excluded
          title="Dossiers exclus"
          hint="Jamais de dépôt ici ; leurs sessions restent visibles, sous « Hors dépôt git »."
          placeholder="Chemin d’un dossier"
          folders={settings.excluded}
          defaults={DEFAULT_EXCLUDED}
          disabled={busy}
          onChange={(excluded) => onChange({ excluded })}
        />
      </div>
      <section
        aria-labelledby="found-title"
        className="min-w-0 self-start rounded-card border border-line bg-surface shadow-card"
      >
        <div className="flex items-center gap-2 px-4 py-2.5">
          <h2 id="found-title" className="text-xs font-semibold text-muted">
            Dépôts trouvés
          </h2>
          <span className="badge badge-ghost font-mono badge-sm">{repositories.length}</span>
        </div>
        <ul aria-labelledby="found-title" className="divide-y divide-line border-t border-line">
          {repositories.map(({ hidden, lastActivityAt, name, root }) => (
            <li key={root} className={cn('flex items-center gap-3 px-4 py-2', hidden && 'bg-surface-alt')}>
              <div className="min-w-0 flex-1">
                <p className={cn('font-medium', hidden && 'text-muted')}>{name}</p>
                <p className="flex gap-1 font-mono text-xs text-muted">
                  <span className="min-w-0 truncate">{displayPath(root, home)}</span>
                  <span className="shrink-0">· {sinceNow(new Date(lastActivityAt), now)}</span>
                </p>
              </div>
              <Button
                variant={hidden ? 'outline' : 'ghost'}
                size="sm"
                className={cn('hidden md:inline-flex', !hidden && 'text-muted')}
                disabled={busy}
                onClick={() => toggleHidden(root)}
              >
                {hidden ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                {hidden ? 'Masqué' : 'Affiché'}
                <span className="sr-only"> : {name}</span>
              </Button>
              {hidden && <span className="badge badge-ghost badge-sm md:hidden">Masqué</span>}
            </li>
          ))}
          {repositories.length === 0 && <li className="px-4 py-3 text-muted">Aucun dépôt trouvé pour l’instant.</li>}
          <li className="flex items-center gap-3 px-4 py-2 text-muted">
            <FolderOpen aria-hidden className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">Hors dépôt git</p>
            <span className="font-mono text-xs">{sessions(outside)}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
