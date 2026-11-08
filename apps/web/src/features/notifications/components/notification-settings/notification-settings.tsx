'use client';
import type { ReactNode } from 'react';
import { BellRing, Flag, MessageCircleQuestion } from 'lucide-react';
import type { NotificationSettingsDto } from '../../api/settings';

const MINUTES = [1, 2, 5, 10, 15, 30];

export interface NotificationSettingsProps {
  busy: boolean;
  desktop: boolean;
  onChange: (changes: { desktop?: boolean; notifications?: Partial<NotificationSettingsDto> }) => void;
  settings: NotificationSettingsDto;
}

function Row({ children, hint, label }: { children: ReactNode; hint: string; label: string }) {
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

function Switch({
  busy,
  checked,
  label,
  onChange,
}: {
  busy: boolean;
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        className="toggle hidden toggle-primary md:inline-grid"
        disabled={busy}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="text-xs text-muted md:hidden">{checked ? 'Oui' : 'Non'}</span>
    </>
  );
}

function Card({ children, icon, title }: { children: ReactNode; icon?: ReactNode; title: string }) {
  return (
    <section aria-label={title} className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
      <h2 className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

const TURN_LABELS = { always: 'Toujours', long: 'Après un long tour', never: 'Jamais' } as const;

/** Aperçu d'une notification du bureau (E15b) : l'icône de Bosco, le type, la session et un extrait. */
function Preview({ excerpt, kind, title, tone }: { excerpt: string; kind: string; title: string; tone: string }) {
  return (
    <div className="flex gap-3 rounded-card border border-line bg-surface p-3 shadow-overlay">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-control bg-primary text-on-primary">
        <BellRing className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 text-xs text-muted">
          <span className="font-medium text-ink">Bosco</span>· maintenant
          <span className={`ml-auto font-semibold ${tone}`}>{kind}</span>
        </p>
        <p className="mt-0.5 truncate font-semibold">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{excerpt}</p>
      </div>
    </div>
  );
}

/**
 * Réglages › Notifications (E15b) : ce qui mérite une notification, type par type, et la notification du bureau.
 * Sur le téléphone, tout se lit sans se changer.
 */
export function NotificationSettings({ busy, desktop, onChange, settings }: NotificationSettingsProps) {
  const set = (notifications: Partial<NotificationSettingsDto>) => onChange({ notifications });
  const toggle = (key: keyof NotificationSettingsDto, label: string) => (
    <Switch busy={busy} label={label} checked={Boolean(settings[key])} onChange={(value) => set({ [key]: value })} />
  );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-content-wide-aside">
      <div className="flex min-w-0 flex-col gap-4">
        <Card title="Notifications du bureau">
          <Row
            label="Envoyer des notifications du bureau"
            hint="Même sans onglet Bosco ouvert, tant que le service tourne."
          >
            <Switch
              busy={busy}
              label="Envoyer des notifications du bureau"
              checked={desktop}
              onChange={(value) => onChange({ desktop: value })}
            />
          </Row>
          <Row
            label="Message bref quand Bosco est devant toi"
            hint="Si l’onglet Bosco est au premier plan, un message en bas de l’écran remplace la notification du bureau."
          >
            {toggle('inAppWhenForeground', 'Message bref quand Bosco est devant toi')}
          </Row>
        </Card>
        <Card
          title="Une question t’attend"
          icon={<MessageCircleQuestion aria-hidden className="size-4 text-warning" />}
        >
          <Row label="Autorisation demandée" hint="Une commande ou une modification attend ton accord.">
            {toggle('permission', 'Autorisation demandée')}
          </Row>
          <Row label="Question de l’agent" hint="L’agent te propose des choix et attend ta réponse.">
            {toggle('question', 'Question de l’agent')}
          </Row>
          <Row
            label="Fin de tour qui finit par une question"
            hint="L’agent rend la main en te posant une question (« Veux-tu que je lance les tests ? »)."
          >
            {toggle('turnQuestion', 'Fin de tour qui finit par une question')}
          </Row>
        </Card>
        <Card title="Un travail est fini" icon={<Flag aria-hidden className="size-4 text-primary" />}>
          <Row label="Tâche du worker à relire" hint="L’agent du worker a fini : sa branche attend ta relecture.">
            {toggle('review', 'Tâche du worker à relire')}
          </Row>
          <Row label="Tâche du worker en échec" hint="Budget atteint, erreur de l’agent ou préalable perdue.">
            {toggle('failed', 'Tâche du worker en échec')}
          </Row>
          <Row
            label="Fin de tour d’une session"
            hint="L’agent rend la main sans question. Un aller-retour rapide ne mérite pas d’être interrompu."
          >
            <select
              aria-label="Fin de tour d’une session"
              className="select hidden w-48 select-sm md:inline-block"
              disabled={busy}
              value={settings.turn}
              onChange={(event) => set({ turn: event.target.value as NotificationSettingsDto['turn'] })}
            >
              {(Object.keys(TURN_LABELS) as (keyof typeof TURN_LABELS)[]).map((value) => (
                <option key={value} value={value}>
                  {TURN_LABELS[value]}
                </option>
              ))}
            </select>
            {settings.turn === 'long' && (
              <select
                aria-label="Durée d’un long tour"
                className="select hidden w-24 select-sm md:inline-block"
                disabled={busy}
                value={settings.longTurnMinutes}
                onChange={(event) => set({ longTurnMinutes: Number(event.target.value) })}
              >
                {MINUTES.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs text-muted md:hidden">
              {settings.turn === 'long' ? `Après ${settings.longTurnMinutes} min` : TURN_LABELS[settings.turn]}
            </span>
          </Row>
          <Row label="Session terminée" hint="La session se ferme (fin dans le terminal).">
            {toggle('ended', 'Session terminée')}
          </Row>
        </Card>
      </div>
      <section
        aria-label="Aperçu"
        className="flex min-w-0 flex-col gap-3 self-start rounded-card border border-line bg-surface-alt p-4"
      >
        <h2 className="text-xs font-semibold text-muted">Aperçu · notification du bureau</h2>
        <Preview
          kind="Question"
          tone="text-warning"
          title="Digest quotidien de la veille média"
          excerpt="« Le digest est généré. Veux-tu que je lance les tests ? »"
        />
        <Preview
          kind="Autorisation"
          tone="text-warning"
          title="Specs du tableau de bord Bosco"
          excerpt="Bash · npm run db:migrate"
        />
        <Preview
          kind="À relire"
          tone="text-primary"
          title="T-12 · Ajouter la prononciation de « SNCF » au lexique"
          excerpt="2 fichiers +38 −4 · 0,41 $"
        />
        <p className="text-xs text-muted">
          Une seule notification par session : la suivante remplace la précédente. Une question passe en priorité haute
          ; « Ouvrir » mène à la session dans Bosco.
        </p>
      </section>
    </div>
  );
}
