'use client';
import { useEffect, useState } from 'react';

/** Heure courante, rafraîchie chaque seconde : les durées d'activité (« 40 s ») avancent sans attendre le serveur. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
