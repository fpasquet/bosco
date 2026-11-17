import type { TestEnvironmentDto, TestServicesModeDto } from '@bosco/domain';

/** Réglage refusé par l'API (400) : son message s'affiche sous le champ. */
export class EnvironmentRefused extends Error {}

export const testEnvironmentQuery = (repository: string) => ({
  queryKey: ['test-environment', repository],
  queryFn: async () => {
    const response = await fetch(`/api/repositories/${encodeURIComponent(repository)}/test-environment`);
    if (!response.ok) throw new Error(`GET test-environment answered ${response.status}`);
    return (await response.json()) as TestEnvironmentDto;
  },
  refetchInterval: 10_000,
});

export interface EnvironmentChanges {
  image?: null | string;
  mode?: TestServicesModeDto;
  selected?: string[];
}

export async function updateTestEnvironment(
  repository: string,
  changes: EnvironmentChanges,
): Promise<TestEnvironmentDto> {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repository)}/test-environment`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new EnvironmentRefused(message ?? 'Réglage refusé.');
  }
  if (!response.ok) throw new Error(`PUT test-environment answered ${response.status}`);
  return (await response.json()) as TestEnvironmentDto;
}
