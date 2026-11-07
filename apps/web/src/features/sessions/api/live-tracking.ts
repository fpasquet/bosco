/** État du suivi en direct d'un profil (E4b) : réglages écrits, dernier signal reçu d'une session. */
export interface LiveTrackingDto {
  backupPath?: null | string;
  installed: boolean;
  lastSignalAt: null | string;
  settingsPath: string;
}

const path = (sourceId: string) => `/api/sources/${encodeURIComponent(sourceId)}/live-tracking`;

async function read(response: Response, label: string): Promise<LiveTrackingDto> {
  if (!response.ok) throw new Error(`${label} answered ${response.status}`);
  return (await response.json()) as LiveTrackingDto;
}

export const liveTrackingQuery = (sourceId: string) => ({
  queryKey: ['live-tracking', sourceId],
  queryFn: async (): Promise<LiveTrackingDto> => read(await fetch(path(sourceId)), `GET ${path(sourceId)}`),
});

export async function installLiveTracking(sourceId: string, backup: boolean): Promise<LiveTrackingDto> {
  const response = await fetch(path(sourceId), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ backup }),
  });
  return read(response, `PUT ${path(sourceId)}`);
}

export async function uninstallLiveTracking(sourceId: string): Promise<LiveTrackingDto> {
  return read(await fetch(path(sourceId), { method: 'DELETE' }), `DELETE ${path(sourceId)}`);
}
