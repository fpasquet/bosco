import type { DataDto, HistoryPeriodDto } from '@bosco/domain';

/** Réglages › Données : l'historique importé, la base de Bosco et ce que la réinitialisation effacerait. */
export const dataQuery = {
  queryKey: ['data'],
  queryFn: async (): Promise<DataDto> => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`GET /api/data answered ${response.status}`);
    return (await response.json()) as DataDto;
  },
};

/** Période importée : tout l'historique lit les sessions plus anciennes en arrière-plan. */
export async function chooseHistory(period: HistoryPeriodDto): Promise<DataDto> {
  const response = await fetch('/api/data/history', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ period }),
  });
  if (!response.ok) throw new Error(`PUT /api/data/history answered ${response.status}`);
  return (await response.json()) as DataDto;
}

/** « Tout effacer » : Bosco revient au premier lancement, sans rien toucher dans les dossiers de Claude Code. */
export async function resetBosco(confirm: string): Promise<void> {
  const response = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirm }),
  });
  if (!response.ok) throw new Error(`POST /api/reset answered ${response.status}`);
}
