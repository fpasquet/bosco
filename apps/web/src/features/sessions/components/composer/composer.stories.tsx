import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { PilotSettingsDto, SuggestionDto } from '@bosco/domain';
import { Composer } from './composer';

const FILES = [
  'src/lexique/lexique.ts',
  'src/lexique/sigles.ts',
  'src/lexique/lexique.test.ts',
  'data/lexique.json',
  'docs/lexique.md',
];

const COMMANDS: SuggestionDto[] = [
  { value: 'review', description: 'Relire les changements de la branche', origin: 'commande' },
  { value: 'tdd', description: 'Développer en commençant par les tests', origin: 'skill · profil perso' },
  { value: 'commit', description: 'Commiter en Conventional Commits', origin: 'dépôt api-voix' },
  { value: 'compact', description: 'Résumer la conversation pour libérer le contexte', origin: 'commande' },
];

/** Suggestions simulées : fichiers du dépôt du fil rouge, commandes et skills du profil et du dépôt. */
function suggest(kind: 'command' | 'file', query: string): Promise<SuggestionDto[]> {
  const needle = query.toLowerCase();
  const found =
    kind === 'file'
      ? FILES.filter((path) => path.toLowerCase().includes(needle)).map((value) => ({
          value,
          description: null,
          origin: null,
        }))
      : COMMANDS.filter((command) => command.value.startsWith(needle));
  return Promise.resolve(found);
}

const SETTINGS: PilotSettingsDto = { permissionMode: 'ask', model: 'claude-sonnet-5-5', effort: null };

// Capture d'écran d'un test en échec : un pixel PNG suffit pour la vignette
const CAPTURE = new File(
  [
    Uint8Array.from(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC'),
      (c) => c.charCodeAt(0),
    ),
  ],
  'capture-test.png',
  { type: 'image/png' },
);

const meta = {
  title: 'Features/Sessions/Composer',
  component: Composer,
  parameters: { layout: 'padded' },
  args: {
    label: 'Message à l’agent',
    placeholder: 'Écris à l’agent…',
    settings: SETTINGS,
    onSettingsChange: fn(),
    onSubmit: fn(() => Promise.resolve()),
    onStop: fn(),
    suggest: fn(suggest),
  },
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithTextAndImage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = await canvas.findByRole('combobox', { name: 'Message à l’agent' });
    await userEvent.click(field);
    await userEvent.keyboard('Regarde aussi le lexique avant de corriger.');
    await userEvent.upload(canvasElement.querySelector('input[type="file"]') as HTMLInputElement, CAPTURE);
    await expect(await canvas.findByRole('button', { name: 'Retirer capture-test.png' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Envoyer' })).toBeEnabled();
  },
};

/** « @lexi » ouvre les fichiers du dépôt, le premier choisi, la partie tapée en gras. */
export const FileSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const field = await canvas.findByRole('combobox', { name: 'Message à l’agent' });
    await userEvent.click(field);
    await userEvent.keyboard('Corrige aussi @lexi');
    const list = await page.findByRole('listbox', { name: 'Fichiers du dépôt' });
    const first = within(list).getByRole('option', { name: 'src/lexique/lexique.ts' });
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-activedescendant', first.id);
  },
};

/** « / » en tête de message ouvre les commandes et skills, avec leur origine et leur description. */
export const CommandSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('combobox', { name: 'Message à l’agent' }));
    await userEvent.keyboard('/');
    const list = await page.findByRole('listbox', { name: 'Commandes et skills' });
    await expect(within(list).getAllByRole('option')).toHaveLength(4);
    await expect(within(list).getByRole('option', { name: /tdd skill · profil perso/ })).toBeVisible();
  },
};

/** Le fichier choisi devient une puce, et le message part en texte simple. */
export const SendWithMention: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = await canvas.findByRole('combobox', { name: 'Message à l’agent' });
    await userEvent.click(field);
    await userEvent.keyboard('Corrige aussi @lexi');
    await within(canvasElement.ownerDocument.body).findByRole('listbox', { name: 'Fichiers du dépôt' });
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}avant de corriger.{Enter}');
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({
        images: [],
        text: 'Corrige aussi @src/lexique/sigles.ts \navant de corriger.',
      }),
    );
    await waitFor(() => expect(field.textContent).toBe(''));
  },
};

export const Running: Story = { args: { running: true } };

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Réponds d’abord à la question' },
};

/** Session du terminal lancée avec le canal de Bosco (E2i) : texte seulement, sans images ni réglages */
export const TextOnly: Story = {
  args: {
    placeholder: 'Écris à la session…',
    textOnly: 'Ouverte dans un terminal · ton message y arrive par le canal de Bosco',
  },
};

export const NewSession: Story = {
  args: {
    submitLabel: 'Démarrer',
    minRows: 4,
    autoFocus: true,
    settings: { permissionMode: 'ask', model: null, effort: null },
  },
};

/** Téléphone : collée en bas de l'écran, réglages en puces au-dessus de l'éditeur, suggestions en feuille. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-screen flex-col justify-end bg-canvas p-3">
        <Story />
      </div>
    ),
  ],
};
