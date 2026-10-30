const DAY_MS = 86_400_000;

export function todayWita(): string {
  return new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
}

export function previousDay(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}
