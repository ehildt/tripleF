import { merge, omit } from '@triplef/helpers/object-io';

import type { MemoryCognitionProfile } from './memory-cognition.model.js';

/**
 * Lean-up pass for model-authored profiles: drops nullish fields, empty
 * strings, empty arrays and empty objects so the stored document stays a
 * dense routing map. Returns undefined when nothing survives — an all-empty
 * verdict is a no-change answer.
 */
function normalizeCognitionProfile(
  profile: MemoryCognitionProfile | null | undefined,
): MemoryCognitionProfile | undefined {
  if (!profile) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profile)) {
    const kept = cleanProfileValue(value);
    if (kept !== undefined) cleaned[key] = kept;
  }
  return Object.keys(cleaned).length > 0 ? (cleaned as MemoryCognitionProfile) : undefined;
}

/**
 * Clean one profile field value; undefined means "drop this field". Recurses
 * into nested objects so sub-documents (communication, preferences,
 * persona.voice) are cleaned at every depth, not just their top level.
 */
function cleanProfileValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    const items = value.map((entry) => (typeof entry === 'string' ? entry.trim() : entry)).filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value !== 'object') return undefined;
  const inner = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, cleanProfileValue(v)])
      .filter(([, v]) => v !== undefined),
  );
  return Object.keys(inner).length > 0 ? inner : undefined;
}

/** Outcome of resolving a model-authored patch over the stored profile document. */
export interface MergedCognitionProfile {
  /** The document to persist; undefined when the patch yields no effective change (skip the write). */
  profile?: MemoryCognitionProfile;
  /** Top-level fields the patch deleted (null-valued keys) — surfaced for logging. */
  removals: string[];
}

/**
 * Resolve one memoryProfile verdict patch over the stored document — the
 * model emits deltas, never the whole JSON:
 * - fields the patch omits → kept as stored;
 * - fields set to null → removed (the patch's deletion list);
 * - everything else → replaces the stored value (deep-merged for the nested
 *   communication/preferences/persona documents; arrays are replaced
 *   wholesale, so the patch re-emits a COMPLETE array when it touches one).
 *
 * The stored document arrives as the PARSED object (the Postgres row) — a
 * previously-unparseable stored text could silently empty the merge base;
 * the object form removes that failure mode entirely. Returns no profile
 * when the patch produces no effective change (boring turn) — the caller
 * keeps the existing document. `removals` is surfaced for observability,
 * and an all-removals patch that empties the document honestly yields {} —
 * explicit deletions are never swallowed by a "nothing survived" verdict
 * (callers protect against accidental all-null wipes via
 * isAllFieldsNullWipe from the cognition model).
 */
export function mergeCognitionProfiles(
  current: MemoryCognitionProfile | undefined,
  patch: MemoryCognitionProfile,
): MergedCognitionProfile {
  const patchRecord = patch as Record<string, unknown>;
  const removals = Object.keys(patchRecord).filter(
    (key) => patchRecord[key] === null || patchRecord[key] === undefined,
  ) as Array<keyof MemoryCognitionProfile>;
  const base = current ?? {};
  const merged = merge(
    omit(base, removals) as MemoryCognitionProfile,
    omit(patch, removals) as MemoryCognitionProfile,
    true,
  );
  const profile = normalizeCognitionProfile(merged) ?? {};
  const before = normalizeCognitionProfile(base) ?? {};
  const changed = JSON.stringify(profile) !== JSON.stringify(before);
  return { profile: changed ? profile : undefined, removals };
}
