import type { FolderListingDto, ProjectsDto } from '@bosco/domain';

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
      sessions: 6,
    },
    {
      git: true,
      id: 4,
      lastSessionAt: ago(5),
      name: 'api-tarifs',
      path: `${HOME}/www/api-tarifs`,
      pinned: false,
      sessions: 4,
    },
    {
      git: true,
      id: 1,
      lastSessionAt: ago(12),
      name: 'creneaux',
      path: `${HOME}/www/creneaux`,
      pinned: false,
      sessions: 9,
    },
    {
      git: true,
      id: 5,
      lastSessionAt: ago(2 * DAY),
      name: 'site-clubs',
      path: `${HOME}/www/site-clubs`,
      pinned: false,
      sessions: 2,
    },
    {
      git: false,
      id: 6,
      lastSessionAt: ago(5 * DAY),
      name: 'notes-clubs',
      path: `${HOME}/Documents/notes-clubs`,
      pinned: false,
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
