import type { NotificationDto } from '@bosco/domain';
import type { NotificationSettingsDto } from './api/settings';

/** Le fil rouge à 15:13 (E15a). */
export const STORY_NOW = new Date('2026-11-06T15:13:30');

const at = (time: string, day = '2026-11-06') => new Date(`${day}T${time}:00`).toISOString();
const base = { readAt: null, settled: null, taskId: null, turnMinutes: null } as const;

export const STORY_NOTIFICATIONS: NotificationDto[] = [
  {
    ...base,
    id: 6,
    kind: 'permission',
    at: at('15:13'),
    sessionId: 'c41e9a07',
    place: 'bosco',
    title: 'Specs du tableau de bord Bosco',
    excerpt: 'Bash · npm run db:migrate',
  },
  {
    ...base,
    id: 5,
    kind: 'turn-question',
    at: at('15:07'),
    sessionId: '7b2c9d10',
    place: 'labo-ia',
    title: 'Digest quotidien de la veille média',
    excerpt: '« Le digest est généré. Veux-tu que je lance les tests ? »',
  },
  {
    ...base,
    id: 4,
    kind: 'review',
    at: at('14:56'),
    sessionId: null,
    taskId: 12,
    place: 'api-voix',
    title: 'T-12 · Ajouter la prononciation de « SNCF » au lexique',
    excerpt: '2 fichiers +38 −4 · 0,41 $',
    readAt: at('15:00'),
  },
  {
    ...base,
    id: 3,
    kind: 'question',
    at: at('14:31'),
    sessionId: '3e8f0a21',
    place: 'outils-node',
    title: 'Migrer le logger vers OpenTelemetry',
    excerpt: 'Quel exportateur pour les traces ?',
    readAt: at('14:40'),
    settled: 'Répondu',
  },
  {
    ...base,
    id: 2,
    kind: 'long-turn',
    at: at('14:20'),
    sessionId: '5e0a91c3',
    place: 'labo-ia',
    title: 'Corriger l’indexation des PDF dans Elasticsearch',
    excerpt: 'Les PDF scannés sont indexés, 3 tests ajoutés.',
    readAt: at('14:25'),
    turnMinutes: 12,
  },
  {
    ...base,
    id: 1,
    kind: 'failed',
    at: at('11:52', '2026-11-05'),
    sessionId: null,
    taskId: 9,
    place: 'api-voix',
    title: 'T-9 · Monter la version de Fastify',
    excerpt: 'Budget atteint : 0,35 $ sur 0,35 $',
    readAt: at('12:00', '2026-11-05'),
  },
];

export const STORY_NOTIFICATION_SETTINGS: NotificationSettingsDto = {
  ended: false,
  failed: true,
  inAppWhenForeground: true,
  longTurnMinutes: 2,
  permission: true,
  question: true,
  review: true,
  turn: 'long',
  turnQuestion: true,
};
