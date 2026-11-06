export interface MemoryConstellationDiagramConfigProps {
  /** Maximum number of fact nodes rendered by a constellation canvas. */
  constellationNodeLimit?: number;
  /** Persists a new constellation-node limit. */
  onSaveConstellationNodeLimit: (value: number) => void;
}
