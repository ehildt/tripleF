/**
 * One dot in the memory constellation — a fact record, a cognition insight,
 * or a encyclopedia chunk. The layout is deterministic (topic centroid + disk),
 * so `topicKey` is what groups dots into a blob; `keys` drive the
 * co-occurrence (entity) links and `timestamp` drives the temporal chain.
 */
export interface ConstellationNode {
  id: string;
  /** Short label shown near the dot (truncated by the renderer). */
  label: string;
  /** Group key — nodes sharing a key form one topic blob. */
  topicKey: string;
  /** Full text shown in the hover tooltip. */
  text: string;
  /** Short capture shown in the hover tooltip (falls back to `text`). */
  summary?: string;
  /** ISO timestamp for the temporal link chain (optional). */
  timestamp?: string;
  /** Co-occurrence keys (tags / domains / paths) for entity links. */
  keys: string[];
  /** Extra tooltip rows (label + value). */
  meta?: Array<{ label: string; value: string }>;
  /**
   * Source provenance (e.g. encyclopedia: web domain, `reddit.com`) —
   * aggregated into the hub dots' leaf rollup (how many sources …).
   */
  domain?: string;
  /** Source provenance (e.g. encyclopedia: full source url) — hub rollup. */
  url?: string;
  /**
   * Download href for uploaded documents (encyclopedia chunks of a stored
   * file) — drives the metadata column's download action. Absent for web
   * sources and memory points.
   */
  downloadUrl?: string;
  /** Position this node at the 3D origin (the scene center) — e.g. the cognition profile hub. */
  anchorToOrigin?: boolean;
  /** Synthetic collapsed-topic dot (click to expand) — not a real point. */
  isTopic?: boolean;
  /** Number of members folded into a collapsed category dot (drives the
   *  multi-leaf ring indicator). */
  memberCount?: number;
  /**
   * Broad category the record belongs to (e.g. `games`, `pets`) — nodes
   * sharing a clusterKey across different topics form a second-level
   * cluster around one synthetic hub dot.
   */
  clusterKey?: string;
  /** Synthetic cluster hub dot (click to toggle its member topics). */
  isCluster?: boolean;
  /** Synthetic ZERO root dot at the scene origin (0,0,0). */
  isRoot?: boolean;
  /** True once the consolidation sweep adjudicated this point. */
  isConsolidated?: boolean;
  /** True once the reflection pass reviewed this point. */
  isReflected?: boolean;
  /** True while the point is involved in an open friction. */
  isFriction?: boolean;
  /** True when a friction resolution marked this point stale. */
  superseded?: boolean;
  /** True for a synthesized bridge (a derived gap-closer, not a user fact). */
  isBridge?: boolean;
  /** True for a synthesized conviction (the AI's derived conclusion about the user/self model). */
  isConviction?: boolean;
  /** Resolved evidence texts backing a bridge/conviction (shown in the metadata column). */
  evidenceTexts?: string[];
}

/** A colored edge between two dots. */
export interface ConstellationLink {
  source: string;
  target: string;
  type: 'temporal' | 'entity' | 'semantic';
  /** Cosine similarity (semantic links) — drives edge opacity. */
  score?: number;
  /**
   * Topical (suggested) semantic link written by the relink job — rendered
   * faintly, never enforced.
   */
  suggested?: boolean;
}

/**
 * A friction (conflict) between two points — the reflection pass's open
 * contradiction/adjudication pair. Rendered as a warning edge, distinct from
 * the semantic link graph.
 */
export interface ConstellationFriction {
  source: string;
  target: string;
  /** LLM-written description of the conflict (surfaced in the metadata column). */
  reason?: string;
}

/**
 * A rendered edge: intra-topic (leaf → its main dot), inter-topic
 * (main dot → main dot, aggregated from cross-topic links), or cluster
 * (topic hub → its cluster hub).
 */
export interface ConstellationEdge {
  source: string;
  target: string;
  /** 'community' — topic hub → community hub, and community hub → cluster hub. */
  kind: 'intra' | 'inter' | 'sibling' | 'cluster' | 'community' | 'root';
  /** Cosine similarity (inter edges) — drives opacity. */
  score?: number;
  /** Aggregated from suggested (topical) links — rendered faintly. */
  suggested?: boolean;
}

/** A topic blob: a group of nodes sharing one `topicKey`. */
export interface ConstellationTopic {
  key: string;
  label: string;
  color: string;
  memberIds: string[];
}

/**
 * A second-level group: topics whose members share one `clusterKey`
 * (a broad category like `games` or `pets`). Only exists when at least two
 * distinct topics share the key — a lone topic needs no hub.
 */
export interface ConstellationCluster {
  key: string;
  label: string;
  color: string;
  /** Cluster keys grouped under this cluster. */
  memberTopicKeys: string[];
  /** Communities grouped under this cluster (topics without a community stay direct members). */
  memberCommunityKeys: string[];
  /** Every real node id across the member topics. */
  memberIds: string[];
  /** LLM-written short label (server cluster) — overrides `label` when present. */
  title?: string;
  /** LLM-written one/two-sentence summary (server cluster) — shown in the hub tooltip/meta. */
  summary?: string;
}

/** A server-detected cluster summary (the memory graph's topic report). */
export interface ConstellationClusterSummary {
  id: string;
  title: string;
  summary: string;
  memberIds: string[];
}

/** Taxonomy registry metadata for one synthetic macro-node dot. */
export interface ConstellationLabelMeta {
  /** Curated Lucide icon name (rendered in place of the opaque dot). */
  icon?: string;
  /** Concise summary of what belongs under the label. */
  summary?: string;
  /** Extra tooltip/meta rows (counts, maintenance stamps, aliases). */
  meta?: Array<{ label: string; value: string }>;
}

/** A node's world position in the 3D constellation space. */
export interface ConstellationPosition {
  x: number;
  y: number;
  z: number;
}

/** A leaf's orbit: the hub it circles plus a per-leaf phase offset. */
export interface OrbitCenter {
  center: ConstellationPosition;
  phase: number;
}

/** A link edge resolved to visible-node indices, with precomputed opacity. */
export interface PreparedLink {
  a: number;
  b: number;
  kind:
    | 'intra'
    | 'inter'
    | 'sibling'
    | 'cluster'
    | 'community'
    | 'root'
    | 'friction';
  /** Cosine similarity (inter edges) — drives edge opacity. */
  score?: number;
  /** Edge opacity. */
  alpha: number;
  /** Aggregated from suggested (topical) links — rendered faintly. */
  suggested?: boolean;
  /**
   * A weak link: an inter edge below the strong-relation tier (norm < 0.8).
   * Rendered as traveling droplets without a line, and hidden by the
   * weak-links toggle.
   */
  weak?: boolean;
}

/** A soft "dimensional" glow: topic key + centroid + extent radius + color. */
export interface TopicFog {
  key: string;
  center: ConstellationPosition;
  radius: number;
  color: string;
}

/** The render-ready constellation: visible nodes + positions + edges. */
export interface PreparedConstellation {
  nodeList: ConstellationNode[];
  positions: Map<string, ConstellationPosition>;
  linkIndices: PreparedLink[];
  linkCounts: Map<string, number>;
  nodeColor: Map<string, string>;
  hubIds: Set<string>;
  topicFog: TopicFog[];
}

/**
 * The nodes/links-only layout: topics, clusters, plus the relaxed
 * world position of every node (cluster hubs included). Computed once per
 * data fetch (independent of expand/collapse) so the force pass never
 * re-runs on a topic toggle.
 */
export interface RelaxedLayout {
  topics: ConstellationTopic[];
  clusters: ConstellationCluster[];
  /** Mid-tier groups sitting between clusters and topics. */
  communities: ConstellationCommunity[];
  positions: Map<string, ConstellationPosition>;
}

/** Accumulator for the visible-node pass (build-visible-nodes helper). */
export interface VisibleAccumulator {
  visibleNodes: ConstellationNode[];
  positions: Map<string, ConstellationPosition>;
  nodeIndex: Map<string, number>;
}

/** A projected 2D point with its depth scale (1 = nearest, <1 = farther). */
export interface ProjectedPoint {
  x: number;
  y: number;
  /** Depth scale: 1 = nearest, <1 = farther (perspective). */
  scale: number;
}

/** A dot's expand/collapse animation: start/end positions + timing. */
export interface DotTransition {
  start: ConstellationPosition;
  end: ConstellationPosition;
  startTime: number;
  duration: number;
  kind: 'expand' | 'collapse';
}

export interface MemoryConstellationProps {
  /** The layer's dots (facts / insights / chunks). */
  nodes: ConstellationNode[];
  /** The layer's edges (temporal + entity). */
  links: ConstellationLink[];
  /** The layer's open frictions (contested point pairs) — warning edges. */
  frictions?: ConstellationFriction[];
  /** Server-detected cluster summaries (the memory graph's topic reports)
   *  — attached to the matching cluster hubs by member overlap. */
  clusters?: ConstellationClusterSummary[];
  /**
   * Taxonomy metadata per synthetic macro-node id (`cluster:<key>`,
   * `community:<key>`, `topic:<key>`): the registry's icon, summary and
   * extra meta rows, attached onto the hub dots post-layout.
   */
  labelMeta?: ReadonlyMap<string, ConstellationLabelMeta>;
  /** Show the hub/category labels (default true). */
  showLabels?: boolean;
  /** Show the weak (suggested/topical) edges — the electricity arcs (default true). */
  showSuggested?: boolean;
  /** Idle auto-rotation on/off (default true). */
  rotationEnabled?: boolean;
  /** Increment to reset the view (collapse topics + refit camera). */
  resetSignal?: number;
  /** Inter-topic (hub → hub) edges below this cosine score are not drawn
   * at all (default 0.7 — see inter-link-min-score.constant). Configurable
   * per memory space. */
  interLinkMinScore?: number;
  /** localStorage namespace for the expanded-topic set (per space). */
  storageKey?: string;
  /** All-topics-expanded state shown by the toolbar toggle (default false). */
  isAllExpanded?: boolean;
  /** Increment to expand/collapse every topic (per `isAllExpanded`). */
  toggleAllSignal?: number;
}

export interface MemoryConstellationEmits {
  (e: 'nodeClick', node: ConstellationNode): void;
  /** The canvas's user-expanded set changed — the parent mirrors the
   *  expand-all toggle state (true = every topic expanded). */
  (e: 'expandedStateChange', isAllExpanded: boolean): void;
}
