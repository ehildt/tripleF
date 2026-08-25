import type { LucideIcon } from '@lucide/vue';

import type {
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
  /** Read round-trip in flight — blocks the refresh action. */
  isLoading: boolean;
  /** Memory off or unreachable — shows the unavailable note. */
  isUnavailable: boolean;
  /** Unavailable-state text. */
  unavailableText: string;
  /** Show the hub/category labels (default true). */
  showLabels?: boolean;
  /** Idle auto-rotation on/off (default true). */
  rotationEnabled?: boolean;
  /** Increment to reset the view (collapse clusters + refit camera). */
  resetSignal?: number;
  /** Inter-cluster (hub → hub) edges below this cosine score are not drawn
   * (default 0.7) — configurable per memory space. */
  interLinkMinScore?: number;
  /** localStorage namespace for the expanded-cluster set (per space). */
  storageKey?: string;
  /** All clusters expanded (the expand/collapse-all toggle state). */
  isAllExpanded?: boolean;
  /** Increment to expand/collapse every cluster (per `isAllExpanded`). */
  toggleAllSignal?: number;
}

export interface MemorySpacePanelEmits {
  /** The canvas's user-expanded set changed — mirror the expand-all toggle. */
  (e: 'expandedStateChange', isAllExpanded: boolean): void;
}
