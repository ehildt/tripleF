import type { FacetValueCount } from './map-facet-hit.helper.types.js';

/** One raw facet hit as returned by the Qdrant client. */
interface QdrantFacetHitRow {
  /** The distinct payload value (untyped at the wire). */
  value: unknown;
  /** Point count for the value. */
  count: number;
}

/** Project a Qdrant facet hit into the value/count shape. */
export function mapFacetHit(hit: QdrantFacetHitRow): FacetValueCount {
  return {
    value: String(hit.value),
    count: hit.count,
  };
}
