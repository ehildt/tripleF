/**
 * One dot in the memory constellation — a fact record, a cognition insight,
 * or a lexicon chunk. The layout is deterministic (cluster centroid + disk),
 * so `clusterKey` is what groups dots into a blob; `keys` drive the
 * co-occurrence (entity) links and `timestamp` drives the temporal chain.
 */
export interface ConstellationNode {
  id: string;
  /** Short label shown near the dot (truncated by the renderer). */
  label: string;
  /** Group key — nodes sharing a key form one cluster blob. */
  clusterKey: string;
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
  /** Position this node at the 3D origin (the scene center) — e.g. the cognition profile hub. */
  anchorToOrigin?: boolean;
  /** Synthetic collapsed-cluster dot (click to expand) — not a real point. */
  isCategory?: boolean;
  /** Number of members folded into a collapsed category dot (drives the
   *  multi-leaf ring indicator). */
  memberCount?: number;
  /**
   * Broad category the record belongs to (e.g. `games`, `pets`) — nodes
   * sharing a communityKey across different clusters form a second-level
   * community around one synthetic hub dot.
   */
  communityKey?: string;
  /** Synthetic community hub dot (click to toggle its member clusters). */
  isCommunity?: boolean;
  /** Synthetic ZERO root dot at the scene origin (0,0,0). */
  isRoot?: boolean;
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
 * A rendered edge: intra-cluster (leaf → its main dot), inter-cluster
 * (main dot → main dot, aggregated from cross-cluster links), or community
 * (cluster hub → its community hub).
 */
export interface ConstellationEdge {
  source: string;
  target: string;
  kind: 'intra' | 'inter' | 'sibling' | 'community' | 'root';
  /** Cosine similarity (inter edges) — drives opacity. */
  score?: number;
  /** Aggregated from suggested (topical) links — rendered faintly. */
  suggested?: boolean;
}

/** A cluster blob: a group of nodes sharing one `clusterKey`. */
export interface ConstellationCluster {
  key: string;
  label: string;
  color: string;
  memberIds: string[];
}

/**
 * A second-level group: clusters whose members share one `communityKey`
 * (a broad category like `games` or `pets`). Only exists when at least two
 * distinct clusters share the key — a lone cluster needs no hub.
 */
export interface ConstellationCommunity {
  key: string;
  label: string;
  color: string;
  /** Cluster keys grouped under this community. */
  memberClusterKeys: string[];
  /** Every real node id across the member clusters. */
  memberIds: string[];
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
  kind: 'intra' | 'inter' | 'sibling' | 'community' | 'root';
  /** Cosine similarity (inter edges) — drives edge opacity. */
  score?: number;
  /** Edge opacity. */
  alpha: number;
  /** Aggregated from suggested (topical) links — rendered faintly. */
  suggested?: boolean;
}

/** A soft "dimensional" glow: cluster key + centroid + extent radius + color. */
export interface ClusterFog {
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
  clusterFog: ClusterFog[];
}

/**
 * The nodes/links-only layout: clusters, communities, plus the relaxed
 * world position of every node (community hubs included). Computed once per
 * data fetch (independent of expand/collapse) so the force pass never
 * re-runs on a cluster toggle.
 */
export interface RelaxedLayout {
  clusters: ConstellationCluster[];
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
  /** Show the hub/category labels (default true). */
  showLabels?: boolean;
  /** Idle auto-rotation on/off (default true). */
  rotationEnabled?: boolean;
  /** Increment to reset the view (collapse clusters + refit camera). */
  resetSignal?: number;
  /** Inter-cluster (hub → hub) edges below this cosine score are not drawn
   * at all (default 0.7 — see inter-link-min-score.constant). Configurable
   * per memory space. */
  interLinkMinScore?: number;
  /** localStorage namespace for the expanded-cluster set (per space). */
  storageKey?: string;
  /** All-clusters-expanded state shown by the toolbar toggle (default false). */
  isAllExpanded?: boolean;
  /** Increment to expand/collapse every cluster (per `isAllExpanded`). */
  toggleAllSignal?: number;
}

export interface MemoryConstellationEmits {
  (e: 'nodeClick', node: ConstellationNode): void;
  /** The canvas's user-expanded set changed — the parent mirrors the
   *  expand-all toggle state (true = every cluster expanded). */
  (e: 'expandedStateChange', isAllExpanded: boolean): void;
}
