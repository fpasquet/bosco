'use client';
import type { SettingsDto } from '../../api/settings';

/** Pas proposés pour le seuil d'inactivité : de 5 à 60 minutes (CA-SESS-59). */
const THRESHOLDS = [5, 10, 15, 20, 30, 45, 60];

export interface SettingsPanelProps {
  busy: boolean;
  onChange: (changes: Partial<SettingsDto>) => void;
  /** Sur le téléphone, les réglages se lisent seulement : ils se modifient depuis le poste */
  readOnly?: boolean;
  settings: SettingsDto;
}

function Row({ children, hint, label }: { children: React.ReactNode; hint: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Réglages des sources : seuil d'inactivité et conservation de l'historique. L'accès du téléphone et les
 * notifications ont leur onglet.
 */
export function SettingsPanel({ busy, onChange, readOnly = false, settings }: SettingsPanelProps) {
  return (
    <section aria-labelledby="settings-title" className="rounded-card border border-line bg-surface shadow-card">
      <h2 id="settings-title" className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
        Réglages
      </h2>
      <div className="divide-y divide-line">
        <Row label="Seuil d’inactivité" hint="Une session sans événement depuis ce délai passe à « Inactive ».">
          {readOnly ? (
            <span className="text-muted">{settings.inactivityMinutes} min</span>
          ) : (
            <select
              aria-label="Seuil d’inactivité"
              className="select w-32"
              disabled={busy}
              value={settings.inactivityMinutes}
              onChange={(event) => onChange({ inactivityMinutes: Number(event.target.value) })}
            >
              {THRESHOLDS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          )}
        </Row>
        <Row
          label="Historique conservé"
          hint="Bosco garde sa propre copie des sessions, même quand Claude Code efface les siennes après 30 jours."
        >
          <span className="text-muted">Tout</span>
        </Row>
      </div>
    </section>
  );
}
