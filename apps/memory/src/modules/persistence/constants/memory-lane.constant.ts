/**
 * The three memory lanes — one per memory layer: `partition` (the user's
 * fact space), `cognition` (the AI's understanding-of-the-user space),
 * `encyclopedia` (the shared global knowledge collection). Single source of
 * truth for lane-typed fields across the persistence and qdrant layers.
 */
export type MemoryLane = 'partition' | 'cognition' | 'encyclopedia';
