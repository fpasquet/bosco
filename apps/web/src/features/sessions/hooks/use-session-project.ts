'use client';
import { useQuery } from '@tanstack/react-query';
import { sessionDetailQuery } from '../api/sessions';

/** Projet principal d'une session, qui donne sa place dans la navigation ; null hors projet ou pendant le chargement. */
export function useSessionProject(id: string): null | number {
  const { data } = useQuery(sessionDetailQuery(id));
  return data?.session.project?.id ?? null;
}
