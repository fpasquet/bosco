import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { AboutDto } from '@bosco/domain';
import { AboutSettings } from './about-settings';

const ABOUT: AboutDto = {
  version: '0.2.0',
  commit: null,
  release: true,
  install: 'deb',
  updates: {
    enabled: true,
    channel: 'stable',
    checkedAt: '2026-11-20T08:12:00.000Z',
    error: null,
    available: null,
    dismissed: false,
  },
  installed: null,
};

const CHANGELOG = `# Journal des versions

## [0.2.0](https://github.com/fpasquet/bosco/compare/v0.1.0...v0.2.0) - 2026-11-20

### Nouveautés

- **usage** · Every project in the usage, by cost ([#66](https://github.com/fpasquet/bosco/pull/66))
- **sandbox** · Start the data services of the project ([#67](https://github.com/fpasquet/bosco/pull/67))

### Corrections

- **sessions** · Count the usage of the subagents ([#64](https://github.com/fpasquet/bosco/pull/64))
`;

const meta = {
  title: 'Features/About/AboutSettings',
  component: AboutSettings,
  parameters: { layout: 'padded' },
  args: {
    about: ABOUT,
    androidApp: null,
    busy: false,
    changelog: CHANGELOG,
    onCheck: fn(),
    onChoose: fn(),
    phone: false,
  },
} satisfies Meta<typeof AboutSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Une release stable, à jour, avec le journal des versions. */
export const UpToDate: Story = {};

/** Une version plus récente est publiée : ses notes et le paquet .deb à télécharger. */
export const UpdateAvailable: Story = {
  args: {
    about: {
      ...ABOUT,
      updates: {
        ...ABOUT.updates,
        available: {
          version: '0.3.0',
          publishedAt: '2026-11-24T10:00:00.000Z',
          notes: '### Nouveautés\n\n- **about** · Show the version and the changelog in the settings',
          url: 'https://github.com/fpasquet/bosco/releases/tag/v0.3.0',
          downloads: {
            apk: null,
            appImage: null,
            deb: 'https://github.com/fpasquet/bosco/releases/download/v0.3.0/x.deb',
          },
        },
      },
    },
  },
};

/** Une beta construite depuis le dépôt, la recherche coupée, la dernière ayant échoué. */
export const BetaFromTheRepository: Story = {
  args: {
    about: {
      ...ABOUT,
      version: '0.3.0-beta.1',
      commit: '3118cb5',
      release: false,
      install: 'source',
      updates: { ...ABOUT.updates, enabled: false, channel: 'beta', error: 'GitHub answered 503' },
    },
  },
};

/** Sur le téléphone, dans l'application Android : la version de l'application, sans réglage. */
export const Phone: Story = {
  args: { androidApp: '0.2.0', phone: true },
  globals: { viewport: { value: 'mobile1' } },
};
