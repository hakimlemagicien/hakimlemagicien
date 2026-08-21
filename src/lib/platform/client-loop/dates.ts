/** ISO week identity for Phase 7/9 evaluation windows. Local calendar date `YYYY-MM-DD`. */
export function isoWeekKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoWeekOffset(fromKey: string, weeks: number): string {
  return isoWeekKey(addDays(`${fromKey.slice(0, 4)}-01-04`, (weeks - 1) * 7));
}

export function weeksBetweenKeys(older: string | null | undefined, current: string): number {
  if (!older) return 99;
  const parse = (key: string) => {
    const [year, week] = key.split("-W").map(Number);
    return (year ?? 0) * 52 + (week ?? 0);
  };
  const delta = parse(current) - parse(older);
  return Number.isFinite(delta) ? Math.max(0, delta) : 99;
}
