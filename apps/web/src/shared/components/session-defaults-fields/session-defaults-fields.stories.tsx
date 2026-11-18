import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SessionDefaultsFields } from './session-defaults-fields';

const PRO = '/home/camille/.claude';

const meta = {
  title: 'Shared/SessionDefaultsFields',
  component: SessionDefaultsFields,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    onChange: fn(),
    profiles: [
      { label: 'pro', path: PRO },
      { label: 'perso', path: '/home/camille/.claude-perso' },
    ],
    // Projet api-tarifs : profil et autorisations hérités, modèle et effort réglés ici
    defaults: { effort: 'high', model: 'claude-sonnet-5-5', permissionMode: null, profile: null },
    inherited: {
      effort: { value: 'high', origin: { level: 'project', name: 'api-tarifs' } },
      model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } },
      permissionMode: { value: 'ask', origin: { level: 'profile', name: 'pro' } },
      profile: { value: PRO, origin: { level: 'defaultProfile' } },
    },
  },
} satisfies Meta<typeof SessionDefaultsFields>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Réglages d'un projet (E21a). */
export const Default: Story = {};

/** Réglages d'un groupe (E22a) : profil et mode réglés ici, modèle et effort hérités du projet principal. */
export const Group: Story = {
  args: {
    principal: true,
    defaults: { effort: null, model: null, permissionMode: 'auto', profile: PRO },
    inherited: {
      effort: { value: 'high', origin: { level: 'project', name: 'api-tarifs' } },
      model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } },
      permissionMode: { value: 'auto', origin: { level: 'group', name: 'Club des Trois Lacs' } },
      profile: { value: PRO, origin: { level: 'group', name: 'Club des Trois Lacs' } },
    },
  },
};

/** Sur le téléphone, les valeurs se lisent seulement. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
