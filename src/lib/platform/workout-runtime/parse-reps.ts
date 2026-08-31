export function parseRepsLabel(label: string | null | undefined): { min: number; max: number } | null {
  if (!label) return null;
  const match = label.match(/(\d+)\s*(?:-|–|—|to)?\s*(\d+)?/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}
