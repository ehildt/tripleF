import type { MemoryCognitionProfile } from './memory-cognition.model.js';

/**
 * True when a patch would null out EVERY stored top-level field with no
 * replacement values — the accidental "forget everything" wipe. Explicit
 * forget turns run through the memory-cognition-forget tool, which empties
 * the document first, so a full null-wipe that still reaches the merge
 * means the model mis-read "omit unchanged fields" as "reset the document"
 * — the caller keeps the stored document and logs instead of storing {}.
 */
export function isAllFieldsNullWipe(
  current: MemoryCognitionProfile | undefined,
  patch: MemoryCognitionProfile,
): boolean {
  if (!current) return false;
  const currentKeys = Object.keys(current);
  if (currentKeys.length === 0) return false;
  const patchRecord = patch as Record<string, unknown>;
  const presentKeys = Object.keys(patchRecord);
  if (presentKeys.length === 0) return false;
  const nullKeys = presentKeys.filter((key) => patchRecord[key] === null || patchRecord[key] === undefined);
  // The patch carries only deletions, and they cover every stored field.
  return nullKeys.length === presentKeys.length && currentKeys.every((key) => nullKeys.includes(key));
}
