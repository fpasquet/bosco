export interface ProfileCandidate {
  lastSessionAt: null | string;
  path: string;
  repositoryCount: number;
}

export interface Source {
  id: string;
  label: string;
  liveTracking: boolean;
  path: string;
  watched: boolean;
}

export interface SourcesView {
  candidates: ProfileCandidate[];
  home: string;
  sources: Source[];
}

export const sourcesQuery = {
  queryKey: ['sources'],
  queryFn: async (): Promise<SourcesView> => {
    const response = await fetch('/api/sources');
    if (!response.ok) throw new Error(`GET /api/sources answered ${response.status}`);
    return (await response.json()) as SourcesView;
  },
};

export async function watchProfiles(paths: string[]): Promise<void> {
  const response = await fetch('/api/sources', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!response.ok) throw new Error(`POST /api/sources answered ${response.status}`);
}
