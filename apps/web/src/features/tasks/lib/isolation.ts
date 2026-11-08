/** « 4 Go » */
export function gigabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 ** 3)} Go`;
}

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** Heure d'un refus : « 15:02 » aujourd'hui, « hier 11:41 », puis « 6 nov. 11:41 ». */
export function refusalTime(at: string, now: Date): string {
  const date = new Date(at);
  const days = Math.round(
    (new Date(now).setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000),
  );
  if (days === 0) return TIME.format(date);
  if (days === 1) return `hier ${TIME.format(date)}`;
  return `${DAY.format(date)} ${TIME.format(date)}`;
}
