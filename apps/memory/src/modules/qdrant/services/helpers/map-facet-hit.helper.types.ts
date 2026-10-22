/** Boundary of the Qdrant facet projection: distinct value with its point count. */

/** One projected facet entry: distinct value with its exact point count. */
export interface FacetValueCount {
  /** The distinct payload value as string. */
  value: string;
  /** Exact point count for the value. */
  count: number;
}
