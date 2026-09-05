import type { ThinkMode } from '../../ollama/types/think-mode.type.js';
import type { MemoryLane } from '../../persistence/constants/memory-lane.constant.js';
import type { MemoryClusterLane } from '../constants/cluster.constant.js';

export type MemoryRole = 'user' | 'assistant';

/**
 * One memory point = one record: an extracted fact from a turn, an explicitly
 * remembered statement, or the AI's cognition document. The text IS the
 * record — the conversation transcript already lives in the harness history,
 * so memory stores only the semantic layer worth recalling later.
 *
 * Every point belongs to exactly one space, identified by its key:
 * - `memoryPartition` — the user's fact space (statements they made or asked
 *   to remember; written by the turn pipeline and the remember tool).
 * - `memoryCognition` — the AI's cognition space: one living document per key
 *   holding the assistant's accumulated, derived understanding of the user
 *   (traits, likes/dislikes, communication style), rewritten over time.
 */
export interface MemoryPoint {
  id: string;
  /**
   * Partition key the record belongs to. Defaults to the caller's session id;
   * a user-set partition id (settings) survives browser-session rotation, so
   * memory follows the human, not the tab.
   */
  memoryPartition?: string;
  /**
   * Cognition key the record belongs to — the AI's own memory space of its
   * understanding of this user. Set instead of `memoryPartition`, never both.
   */
  memoryCognition?: string;
  role: MemoryRole;
  /** Browser/session the record originated in — provenance + optional tightening. */
  sessionId?: string;
  /** Conversation/room the record originated in — provenance + optional tightening. */
  conversationId?: string;
  /** Harness turn id — traces the record back to the request that created it. */
  requestId?: string;
  /** The record text (extracted fact, verbatim remember, or cognition document). */
  text: string;
  /** Topic labels written by the extraction pass or the remember tool — keyword bag for payload-filtered recall. */
  tags: string[];
  /**
   * Broad category written by the remember tool (e.g. `games`, `pets`) —
   * groups narrow tag topics into one family for the constellation's
   * second-level cluster hubs. Optional: records without a category stay
   * flat (their tags still cluster them).
   */
  category?: string;
  /**
   * Plural sub-family one tier below the category (e.g. `survival-games`
   * under `games`) — the constellation's COMMUNITY tier. Optional: records
   * without a community sit directly under their cluster.
   */
  community?: string;
  /**
   * The lowercase entity the fact is about — extraction-classified. The
   * consolidate/reflect passes only ever compare records of the SAME
   * subject.
   */
  subject?: string;
  /**
   * What kind of durable thing this is — extraction-classified
   * (preference | decision | state | contact | project | possession |
   * relationship | fact). The maintenance prompts interpret it (polarity
   * flips are the norm for preferences, newer states supersede older, …).
   */
  kind?: string;
  /**
   * Whether a newer statement is expected to replace this one —
   * extraction-classified: `durable` claims hold until contradicted,
   * `volatile` states get superseded by newer ones.
   */
  stability?: string;
  /**
   * Cognition insight routing path (e.g. `likes.cars`) — the profile facet
   * this insight deepens. Set on insight records only; the respond-time
   * probe token-matches profile values against the prompt to shape the
   * query for the matching paths. Normalized at write time to the canonical
   * probe format (lowercase, dash-joined segments — see normalizeInsightPath).
   * Observability + future hard filtering.
   */
  path?: string;
  createdAt: string;
  /** Cosine similarity to the query vector — search results only. */
  score?: number;
  /** True once the consolidation sweep adjudicated this point (kept/merged). */
  isConsolidated?: boolean;
  /** True once the point has at least one constellation link edge. */
  isLinked?: boolean;
  /** True once the reflection pass reviewed this point (Phase 2). */
  isReflected?: boolean;
  /** True once the conviction-synthesis pass offered this point as evidence. */
  isSynthesized?: boolean;
  /** True while the point is involved in an open friction (Phase 1c). */
  isFriction?: boolean;
  /** True when a friction resolution or supersede marked this point stale. */
  superseded?: boolean;
  /** Point id that superseded this one (audit trail, never deleted). */
  supersededBy?: string;
  /** Point ids this statement cites as its supporting evidence (conviction/bridge records only). */
  evidenceIds?: string[];
  /** Detected cluster id this point belongs to (written by the cluster job). */
  clusterId?: string;
}

/** Optional tightening filters on a memory read (search + list share them). */
export interface MemoryScopeFilters {
  /** Narrow to one user's fact space; the agentic tools always pass the turn's partition. */
  memoryPartition?: string;
  /** Narrow to the AI's cognition space for a user (the living cognition document). */
  memoryCognition?: string;
  sessionId?: string;
  role?: MemoryRole;
  conversationId?: string;
  requestId?: string;
  /** Points whose `tags` include ANY of these labels. */
  tags?: string[];
  /** Points whose broad `category` equals this family label. */
  category?: string;
  /** Points whose `community` equals this sub-family label. */
  community?: string;
  /** Full-text containment on the text payload (Qdrant `match: text`). */
  contains?: string;
  /** Exact full-string equality on the record text — the record's identity for deletion. */
  text?: string;
}

export interface UpsertBatchInput {
  /** User fact-space key — set for fact records. */
  memoryPartition?: string;
  /** Cognition-space key — set for the living cognition document. */
  memoryCognition?: string;
  role: MemoryRole;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — lands on every point's payload as `request_id`. */
  /** Context size of the originating turn — derives the extract-step valve. */
  requestId?: string;
  /** Storage urls of the turn's attached files, landed on every point. */
  files?: Array<{ name: string; url: string }>;
  /**
   * Skip the constellation link-graph sync for this batch. Set for points
   * that are not constellation nodes (episodes) — they must not accrue
   * semantic edges.
   */
  skipLinks?: boolean;
  points: Array<{
    id: string;
    vector: number[];
    text: string;
    tags?: string[];
    /** Broad category (e.g. `games`, `pets`) — the category tier key (cluster fallback). */
    category?: string;
    /** Plural sub-family under the category (e.g. `survival-games`) — the community tier key. */
    community?: string;
    /** The entity the fact is about — extraction-classified (maintenance same-subject rule). */
    subject?: string;
    /** What kind of durable thing this is — extraction-classified (see MemoryPoint.kind). */
    kind?: string;
    /** `durable` claims vs `volatile` states — extraction-classified (see MemoryPoint.stability). */
    stability?: string;
    /** Cognition insight routing path (`likes.cars`) — insight records only. */
    path?: string;
    /** Lifecycle flags — written by the maintenance jobs, read by recall/display. */
    isConsolidated?: boolean;
    isLinked?: boolean;
    isReflected?: boolean;
    isSynthesized?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
    /** Point ids this statement cites as its supporting evidence (conviction/bridge records only). */
    evidenceIds?: string[];
  }>;
}

export interface SearchMemoryInput extends MemoryScopeFilters {
  vector: number[];
  limit?: number;
  /**
   * Blend recency into the ranking (formula query with exp_decay on
   * `created_at`): recent points rank higher, older points still surface on
   * a strong topical match. Used by the episode probe.
   */
  recency?: boolean;
}

export interface ListMemoryInput extends MemoryScopeFilters {
  /** Scroll page size, capped at 10000 (defaults to the node-limit override). */
  limit?: number;
}

/** BullMQ job payload for the vectorize queue (one job per turn-side). */
export interface VectorizeJobData {
  memoryPartition: string;
  role: MemoryRole;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — the request this text came from (traced to the point). */
  requestId?: string;
  text: string;
  /**
   * Harness model that produced the turn — reused for fact extraction.
   * Omitted for manual ingestion: the text is stored verbatim.
   */
  model?: string;
  /** Context size of the originating turn — derives the extract-step valve. */
  numCtx?: number;
  /** Storage urls of the turn's attached files, remembered on every point. */
  files?: Array<{ name: string; url: string }>;
}

/**
 * Cognition-write job: the harness memoryWrite step enqueues it after an
 * answered turn whose intent included a remember tool. The LLM tool loop
 * runs in the vectorize worker — off the harness hot path, with BullMQ
 * retries.
 */
export interface MemoryWriteJobData {
  /** The user's fact partition. */
  memoryPartition: string;
  /** The AI's cognition space key — the cognition-remember lane target. */
  memoryCognition?: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  /** The user prompt of the answered turn. */
  userRequest: string;
  /** Summarized tool results of the turn (pre-capped by the harness step). */
  gathered?: string;
  /**
   * The turn's memory-partition-recall hits (provenance-labeled, pre-capped)
   * — what the probe already surfaced this turn. Treated as ALREADY KNOWN:
   * extend or update, never re-store.
   */
  probedMemory?: string;
  /** Harness model that produced the turn — reused for the write judgment. */
  model: string;
  /** Thinking preference of the originating turn. */
  think?: ThinkMode;
  /** Context size of the originating turn. */
  numCtx?: number;
}

/**
 * Cognition-profile job: the harness memoryProfile step enqueues it after
 * every answered turn (subconscious formation — never classifier-gated). The
 * worker maintains the structured profile plus derived insight records.
 */
export interface MemoryProfileJobData {
  /** The AI's cognition space key (resolution: memoryCognition override → memoryPartition → sessionId). */
  memoryCognition: string;
  /**
   * The user's fact partition — probed for PRIOR FACTS so the job can
   * connect this turn's detail to statements the user made in past
   * conversations (derived, hedged insights only — never collapsed into
   * claims the user never made).
   */
  memoryPartition?: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  userRequest: string;
  assistantResponse?: string;
  model: string;
  think?: ThinkMode;
  numCtx?: number;
}

/**
 * Consolidate sweep job payload: adjudicate pending ledger inserts of one
 * partition against their near-duplicates (LLM verdicts keep/redundant/merge).
 */
export interface MemoryConsolidateJobData {
  /** The user's fact partition to sweep. */
  memoryPartition: string;
  /** Chat model for the merge verdicts (resolved at enqueue: body model or MEMORY_CONSOLIDATE_MODEL). */
  model: string;
  /** Max pending inserts processed per run (default 100, capped 500). */
  limit?: number;
  /** Compute and log verdicts without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Relink job payload: the category-aware consolidation + soft-link sweep of
 * one partition. Collapses identical category variants, dedupes each
 * category's points (LLM verdicts keep/redundant/merge, converging passes),
 * then writes topical (suggested, never enforced) link edges. The optional
 * `enrich` flag additionally refines each point's tags via LLM — off by
 * default because tags are the recall filter vocabulary.
 */ export interface MemoryRelinkJobData {
  /** The user's fact partition to relink. */
  memoryPartition: string;
  /** Chat model for dedupe verdicts + enrichment (resolved at enqueue: body model or MEMORY_CONSOLIDATE_MODEL). */
  model: string;
  /** Max points processed per category per pass (default 100, capped 500). */
  limit?: number;
  /** Max full passes over the categories before stopping (default 3, capped 10). */
  maxPasses?: number;
  /** Also refine tags per point via LLM (off by default — tags are recall vocabulary). */
  enrich?: boolean;
  /** Compute and log verdicts/edges without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Taxonomy reconciliation job payload: the label-merge sweep over one
 * scope's registry (all four tiers for partitions, the three labeled tiers
 * for the encyclopedia). Candidate pairs from trigram × label-embedding
 * scoring auto-merge above the snap band (token-overlap required) and go to
 * the LLM adjudicator in the ambiguous band below it; merges rewrite point
 * payloads, record `llm`/`fuzzy`/`semantic` aliases, and fold the losing
 * node into the winner.
 */
export interface MemoryTaxonomyReconcileJobData {
  /** Which lane's taxonomy to reconcile (partition labels or the global encyclopedia). */
  lane: 'partition' | 'encyclopedia';
  /** Space key: partition key / 'global' (encyclopedia). */
  scopeKey: string;
  /** Chat model for the ambiguous-band verdicts (resolved at enqueue). */
  model: string;
  /** Max candidate pairs adjudicated per run (default 100, capped 500). */
  limit?: number;
  /** Compute and log merge decisions without applying anything. */
  dryRun?: boolean;
}

/**
 * Encyclopedia supersede sweep job payload: heal orphaned old-hash chunks left by
 * a crashed supersede. Deterministic — no model, no adjudication.
 */
export interface EncyclopediaSweepJobData {
  /** Max pending documents processed per run (default 100, capped 500). */
  limit?: number;
  /** Log what would be healed without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Encyclopedia classification job payload: label stored documents with their
 * source-agnostic category + topic (the constellation's category + topic
 * tiers). One LLM call per document; chunks are labeled by url fan-out.
 */
export interface EncyclopediaClassifyJobData {
  /** Chat model for the classification calls (resolved at enqueue). */
  model: string;
  /** Max pending documents processed per run (default 100, capped 500). */
  limit?: number;
  /** Compute and log labels without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Gap-filling research job payload: close encyclopedia gaps the user's own
 * searches left behind (snippets never fetched), then follow the topics the
 * closed pages reference — one deep-dive per depth, capped at maxDepth.
 */
export interface EncyclopediaResearchJobData {
  /** Chat model for the triage verdicts (resolved at enqueue). */
  model: string;
  /** Max gaps triaged this run (default from overrides, capped 50). */
  limit?: number;
  /** Current deep-dive depth (0 = root sweep over unfetched snippets). */
  depth?: number;
  /** Chain id — groups the follow-up jobs of one research chain. */
  chainId?: string;
  /** Urls already visited in this chain (loop guard). */
  visitedUrls?: string[];
  /** Follow-up search queries from the parent depth (the Z candidates). */
  searchQueries?: string[];
  /** Partition provenance for persisted content (defaults to 'global'). */
  partitionScope?: string;
  /** Compute and log verdicts without fetching or persisting. */
  dryRun?: boolean;
}

/**
 * Reflection job payload: the per-scope friction screen over unreflected
 * points. Screens each point's near-neighbor candidates for contradictions,
 * writes friction records, and marks the loser superseded when the model
 * names a clear winner. Covers all three lanes.
 */
export interface MemoryReflectJobData {
  /** Which lane to reflect (partition / cognition / encyclopedia). */
  lane: MemoryLane;
  /** Space key: partition key / cognition key / 'global' (encyclopedia). */
  scopeKey: string;
  /** Chat model for the friction verdicts (resolved at enqueue). */
  model: string;
  /** Max unreflected points screened per run (default 100, capped 500). */
  limit?: number;
  /** Max near-neighbor candidates per point (default 5, capped 20). */
  maxCandidates?: number;
  /** Minimum cosine score for a candidate (default 0.3 — the recall floor). */
  scoreThreshold?: number;
  /** Compute and log verdicts without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Conviction-synthesis job payload: synthesize higher-level statements from
 * the user's curated facts (is_reflected, not yet synthesized), each
 * carrying evidence_ids back-references to its supporting facts. Every
 * statement picks its lane: convictions store into the cognition space (the
 * user/self model), bridges into the fact partition (gap-closing connective
 * tissue).
 */
export interface MemoryConvictionJobData {
  /** The user's fact partition to synthesize over (also the evidence scope). */
  memoryPartition: string;
  /**
   * The cognition scope convictions store into — defaults to the partition
   * key (the harness's own cognition-key default).
   */
  memoryCognition?: string;
  /** Chat model for the synthesis call (resolved at enqueue). */
  model: string;
  /** Max evidence points offered per run (default 100, capped 500). */
  limit?: number;
  /** Max statements emitted per run (default 5, capped 20). */
  maxConvictionsPerCluster?: number;
  /** Compute and log statements without applying or marking anything. */
  dryRun?: boolean;
}

/**
 * Cluster-detection + summarization job payload: cluster one scope's link
 * graph (semantic + topical + evidence edges) into clusters, absorb
 * singletons so no fact is left unclustered, and summarize each cluster
 * whose membership changed (unchanged fingerprints keep their stored
 * title/summary).
 */
export interface MemoryClusterJobData {
  /** Which lane to cluster (partition / encyclopedia). */
  lane: MemoryClusterLane;
  /** Space key: partition key / 'global' (encyclopedia). */
  scopeKey: string;
  /** Chat model for the summary calls (resolved at enqueue). */
  model: string;
  /** Minimum members for a structural cluster (default 2, clamped 1–100). */
  minMembers?: number;
  /** Compute and log clusters without applying or marking anything. */
  dryRun?: boolean;
}
