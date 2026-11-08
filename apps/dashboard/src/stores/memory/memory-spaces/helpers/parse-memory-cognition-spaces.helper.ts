import { MEMORY_COGNITION_SPACES_MAX } from '../memory-spaces.constant';

/** Parse persisted cognition-space history, retaining string entries in their
 * existing order after trimming, removing empty values, and applying the cap. */
export function parseMemoryCognitionSpaces(raw: string | null): string[] {
  if (!raw) return ['default'];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return ['default'];
  const list = parsed
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, MEMORY_COGNITION_SPACES_MAX);
  return list.length ? list : ['default'];
}
