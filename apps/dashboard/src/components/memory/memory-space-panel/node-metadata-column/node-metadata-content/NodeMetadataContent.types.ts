import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../../memory-constellation/MemoryConstellation.types';

export interface NodeMetadataContentProps {
  /** The selected dot whose metadata the content renders (always present —
   * the column gates rendering on it). */
  node: ConstellationNode;
  /** The selected dot's open frictions (the contested warning rows). */
  frictions?: ConstellationFriction[];
  /** The selected dot's deduplicated meta rows — tag chips, max 3 per row. */
  tags?: Array<{ label: string; value: string }>;
}
