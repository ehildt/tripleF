import type { LucideIcon } from '@lucide/vue';

import type {
  ConstellationClusterSummary,
  ConstellationFriction,
  ConstellationLabelMeta,
  ConstellationLink,
  ConstellationNode,
} from '../memory-constellation/MemoryConstellation.types';

export interface MemorySpacePanelProps {
  /** Header icon tile glyph. */
  icon: LucideIcon;
  /** Header label (the layer name). */
  label: string;
  /** Header description (what this layer stores). */
  description: string;
  /** The layer's dots. */
  nodes: ConstellationNode[];
  /** The layer's edges. */
  links: ConstellationLink[];
  /** The layer's open frictions (contested point pairs) — warning edges. */
  frictions?: ConstellationFriction[];
  /** Server-detected cluster summaries (the memory graph's topic reports). */
  clusters?: ConstellationClusterSummary[];
  /** Taxonomy metadata per macro-node dot id (icons + operational rows). */
  labelMeta?: ReadonlyMap<string, ConstellationLabelMeta>;
  /** Read round-trip in flight — blocks the refresh action. */
  isLoading: boolean;
  /** Memory off or unreachable — shows the unavailable note. */
  isUnavailable: boolean;
  /** Unavailable-state text. */
  unavailableText: string;
  /** Show the hub/category labels (default true). */
  showLabels?: boolean;
  /** Show the weak (suggested/topical) edges — the electricity arcs (default true). */
  showSuggested?: boolean;
  /** Idle auto-rotation on/off (default true). */
  rotationEnabled?: boolean;
  /** Increment to reset the view (collapse topics + refit camera). */
  resetSignal?: number;
  /** Inter-topic (hub → hub) edges below this cosine score are not drawn
   * (default 0.7) — configurable per memory space. */
  interLinkMinScore?: number;
  /** localStorage namespace for the expanded-topic set (per space). */
  storageKey?: string;
  /** All topics expanded (the expand/collapse-all toggle state). */
  isAllExpanded?: boolean;
  /** Increment to expand/collapse every topic (per `isAllExpanded`). */
  toggleAllSignal?: number;
}

export interface MemorySpacePanelEmits {
  /** The canvas's user-expanded set changed — mirror the expand-all toggle. */
  (e: 'expandedStateChange', isAllExpanded: boolean): void;
}
