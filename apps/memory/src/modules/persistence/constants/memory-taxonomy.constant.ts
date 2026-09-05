import type { MemoryLane } from './memory-lane.constant.js';

/**
 * The taxonomy lanes — the memory lanes minus `cognition` (the cognition
 * lane is path-routed into the profile document and stays taxonomy-free).
 * Partition labels live per partition key; encyclopedia labels under
 * 'global'.
 */
export type MemoryTaxonomyLane = Exclude<MemoryLane, 'cognition'>;

/**
 * The taxonomy tiers: `cluster` (plural macro family, e.g. `games`),
 * `community` (plural sub-family, e.g. `survival`), `hub` (singular entity,
 * e.g. `project zomboid`), `tag` (flat recall vocabulary — no tree parent,
 * no icon). The AI picks existing labels read-only or mints new ones via
 * the probe contract; only the user renames/merges them afterwards.
 */
export type MemoryTaxonomyKind = 'cluster' | 'community' | 'hub' | 'tag';

/**
 * Provenance of a label snap: `normalize` (exact canonical form), `fuzzy`
 * (trigram snap), `semantic` (label embedding), `llm` (ambiguous-band
 * adjudication), `user` (rename/merge by the user).
 */
export type MemoryTaxonomyAliasSource =
  'normalize' | 'fuzzy' | 'semantic' | 'llm' | 'user';

/** Root sentinel for `parentId` — cluster roots and flat tags have no parent. */
export const TAXONOMY_ROOT_PARENT = '';
