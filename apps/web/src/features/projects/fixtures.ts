import type { FolderListingDto, GroupDto, ProjectsDto } from '@bosco/domain';

// Données du fil rouge des maquettes, communes aux histoires des projets.
export const NOW = new Date('2026-11-17T15:13:00Z');
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString();
const DAY = 86_400;
const HOME = '/home/camille';

export const projectsOverview: ProjectsDto = {
  home: HOME,
  outside: 4,
  projects: [
    {
      git: true,
      id: 2,
      lastSessionAt: ago(3),
      name: 'sejours',
      path: `${HOME}/www/sejours`,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 6,
    },
    {
      git: true,
      id: 4,
      lastSessionAt: ago(5),
      name: 'api-tarifs',
      path: `${HOME}/www/api-tarifs`,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 4,
    },
    {
      git: true,
      id: 1,
      lastSessionAt: ago(12),
      name: 'creneaux',
      path: `${HOME}/www/creneaux`,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 9,
    },
    {
      git: true,
      id: 5,
      lastSessionAt: ago(2 * DAY),
      name: 'site-clubs',
      path: `${HOME}/www/site-clubs`,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 2,
    },
    {
      git: false,
      id: 6,
      lastSessionAt: ago(5 * DAY),
      name: 'notes-clubs',
      path: `${HOME}/Documents/notes-clubs`,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 1,
    },
  ],
  suggestions: [
    {
      git: true,
      lastSessionAt: ago(9 * DAY),
      name: 'essais-css',
      path: `${HOME}/www/essais-css`,
      preselected: false,
      sessions: 2,
    },
  ],
  ignored: [
    {
      git: false,
      lastSessionAt: ago(20 * DAY),
      name: 'tmp-export',
      path: `${HOME}/tmp-export`,
      preselected: false,
      sessions: 1,
    },
  ],
};

export const firstSuggestions: ProjectsDto['suggestions'] = [
  { git: true, lastSessionAt: ago(12), name: 'creneaux', path: `${HOME}/www/creneaux`, preselected: true, sessions: 9 },
  { git: true, lastSessionAt: ago(3), name: 'sejours', path: `${HOME}/www/sejours`, preselected: true, sessions: 6 },
  { git: true, lastSessionAt: ago(40), name: 'maison', path: `${HOME}/www/maison`, preselected: true, sessions: 5 },
  {
    git: true,
    lastSessionAt: ago(5),
    name: 'api-tarifs',
    path: `${HOME}/www/api-tarifs`,
    preselected: true,
    sessions: 4,
  },
  {
    git: true,
    lastSessionAt: ago(12 * DAY),
    name: 'site-clubs',
    path: `${HOME}/www/site-clubs`,
    preselected: false,
    sessions: 2,
  },
  {
    git: false,
    lastSessionAt: ago(5 * DAY),
    name: 'notes-clubs',
    path: `${HOME}/Documents/notes-clubs`,
    preselected: false,
    sessions: 1,
  },
];

const folder = (name: string, git: boolean, added = false, suggestion = false) => ({
  added,
  git,
  name,
  path: `${HOME}/www/${name}`,
  suggestion,
});

export const wwwListing: FolderListingDto = {
  crumbs: [
    { name: '~', path: HOME },
    { name: 'www', path: `${HOME}/www` },
  ],
  folders: [
    folder('api-avis', true, true),
    folder('api-tarifs', true, true),
    folder('archives', false),
    folder('creneaux', true, true),
    folder('essais-css', true, false, true),
    folder('scripts-export', false),
    folder('sejours', true, true),
    folder('site-tournois', true),
  ],
  home: HOME,
  parent: HOME,
  path: `${HOME}/www`,
};

const member = (id: number, name: string) => ({ id, name });

export const clubsGroup: GroupDto = {
  description: 'Client : le Club des Trois Lacs',
  id: 2,
  instructions:
    'Les textes lus par les joueurs sont en français.\nLes tickets du club se citent par leur clé (LAC-123).',
  name: 'Club des Trois Lacs',
  profile: '/home/camille/.claude',
  projects: [member(4, 'api-tarifs'), member(1, 'creneaux'), member(5, 'site-clubs')],
  sidebar: true,
  system: false,
};

export const allProjectsGroup: GroupDto = {
  description: null,
  id: 1,
  instructions: 'Messages de commit en anglais, au format Conventional Commits.\nNode 22 au minimum.',
  name: 'Tous les projets',
  profile: null,
  projects: projectsOverview.projects.map(({ id, name }) => member(id, name)),
  sidebar: false,
  system: true,
};

/** Groupes du fil rouge : un groupe client, un groupe sans instructions, un groupe masqué, puis « Tous les projets ». */
export const storyGroups: GroupDto[] = [
  clubsGroup,
  {
    description: 'Client',
    id: 3,
    instructions: '',
    name: 'Gîtes du Haut-Vallon',
    profile: null,
    projects: [member(2, 'sejours')],
    sidebar: true,
    system: false,
  },
  {
    description: null,
    id: 4,
    instructions: 'Tests avec Vitest.\nJournaux au format JSON.',
    name: 'Node.js',
    profile: null,
    projects: [member(4, 'api-tarifs'), member(2, 'sejours')],
    sidebar: false,
    system: false,
  },
  allProjectsGroup,
];

export const storyProfiles = [
  { label: 'pro', path: '/home/camille/.claude' },
  { label: 'perso', path: '/home/camille/.claude-perso' },
];
