import type { MemoryCognitionProfile } from './memory-cognition.model.js';

/** Tolerant read of a stored document — anything unparseable starts from scratch. */
export function parseStoredProfile(text: string | undefined): MemoryCognitionProfile {
  if (!text?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as MemoryCognitionProfile) : {};
  } catch {
    return {};
  }
}
