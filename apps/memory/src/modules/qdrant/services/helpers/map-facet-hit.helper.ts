/** Project a Qdrant facet hit into the value/count shape. */
export function mapFacetHit(hit: { value: unknown; count: number }) {
  return {
    value: String(hit.value),
    count: hit.count,
  };
}
