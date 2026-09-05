import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';

export interface NodeMetadataColumnProps {
  /** The selected dot, or null when nothing is selected. */
  node: ConstellationNode | null;
  /** The selected dot's open frictions (the contested warning rows). */
  frictions?: ConstellationFriction[];
}
