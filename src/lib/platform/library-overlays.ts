/**
 * Client catalog overlays. Database rows win over seed by stable id/slug.
 * Hidden keys come from client_list_hidden_library_keys (archive/unpublish).
 */

export function overlayByKey<T>(
  seed: T[],
  dbRows: T[],
  keyOf: (item: T) => string,
  hiddenKeys: string[],
): T[] {
  const hidden = new Set(hiddenKeys.filter(Boolean));
  const map = new Map<string, T>();
  for (const item of seed) {
    const key = keyOf(item);
    if (!hidden.has(key)) map.set(key, item);
  }
  for (const item of dbRows) {
    const key = keyOf(item);
    if (!hidden.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

export function overlayMealCatalog<T extends { external_id: string }>(
  seed: T[],
  dbMeals: T[],
  hiddenExternalIds: string[],
): T[] {
  return overlayByKey(seed, dbMeals, (meal) => meal.external_id, hiddenExternalIds).sort((a, b) =>
    a.external_id.localeCompare(b.external_id),
  );
}

export function overlayDiscoverCatalog<T extends { slug: string }>(
  seed: T[],
  dbItems: T[],
  hiddenSlugs: string[],
  merge = (seedItem: T | undefined, dbItem: T): T => (seedItem ? { ...seedItem, ...dbItem } : dbItem),
): T[] {
  const hidden = new Set(hiddenSlugs.filter(Boolean));
  const map = new Map<string, T>();
  for (const item of seed) {
    if (!hidden.has(item.slug)) map.set(item.slug, item);
  }
  for (const item of dbItems) {
    if (hidden.has(item.slug)) continue;
    map.set(item.slug, merge(map.get(item.slug), item));
  }
  return [...map.values()];
}
