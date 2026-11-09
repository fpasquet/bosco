'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ContainersDto } from '@bosco/domain';
import { containersQuery } from '../api/containers';

/** Conteneurs en cours tenus à jour par leur flux en direct : la dernière mesure, puis chacune (DT-06, DT-35). */
export function useLiveContainers(): ContainersDto | undefined {
  const client = useQueryClient();
  useEffect(() => {
    const source = new EventSource('/api/containers/events');
    source.addEventListener('containers.snapshot', (event) => {
      client.setQueryData(containersQuery.queryKey, JSON.parse((event as MessageEvent<string>).data) as ContainersDto);
    });
    return () => source.close();
  }, [client]);
  return useQuery(containersQuery).data;
}
