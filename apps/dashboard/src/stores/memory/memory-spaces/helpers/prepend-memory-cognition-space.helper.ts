import { MEMORY_COGNITION_SPACES_MAX } from '../memory-spaces.constant';

/** Return cognition-space history with the trimmed id first, deduped and
 * capped. Empty ids retain the original array so no reactive write is needed. */
export function prependMemoryCognitionSpace(
  spaces: string[],
  space: string,
): string[] {
  const trimmed = space.trim();
  if (!trimmed) return spaces;
  return [trimmed, ...spaces.filter((entry) => entry !== trimmed)].slice(
    0,
    MEMORY_COGNITION_SPACES_MAX,
  );
}
