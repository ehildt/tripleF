import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

export interface NodeMetadataColumnProps {
  /** The selected dot, or null when nothing is selected. */
  node: ConstellationNode | null;
}
