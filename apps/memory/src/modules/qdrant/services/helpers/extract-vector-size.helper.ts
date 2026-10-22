/** Single-vector collections expose `{ size, distance }`; named vectors do not. */
export function extractVectorSize(vectors: unknown): number | undefined {
  if (
    vectors &&
    typeof vectors === 'object' &&
    'size' in vectors &&
    typeof (vectors as { size: unknown }).size === 'number'
  ) {
    return (vectors as { size: number }).size;
  }
  return undefined;
}
