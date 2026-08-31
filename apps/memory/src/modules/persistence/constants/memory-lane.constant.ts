/**
 * The three memory lanes — one per memory layer: `partition` (the user's
 * fact space), `cognition` (the AI's understanding-of-the-user space),
 * `encyclopedia` (the shared global knowledge collection). Single source of
 * truth — the persistence layer derives its lane aliases from it.
 */
const MEMORY_LANES = ['partition', 'cognition', 'encyclopedia'] as const;

/** One memory lane (the space family a point/edge/friction belongs to). */
export type MemoryLane = (typeof MEMORY_LANES)[number];
