/** « 4 Go » */
export function gigabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 ** 3)} Go`;
}
