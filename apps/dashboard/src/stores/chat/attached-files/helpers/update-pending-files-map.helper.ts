import type { AttachedFileEntry } from '../attached-files.model';

/** Clone a pending-files map, upserting a non-empty scope or deleting an empty one. */
export function updatePendingFilesMap(
  current: ReadonlyMap<string, AttachedFileEntry[]>,
  key: string,
  files: AttachedFileEntry[],
): Map<string, AttachedFileEntry[]> {
  const updated = new Map(current);
  if (files.length === 0) updated.delete(key);
  else updated.set(key, files);
  return updated;
}
