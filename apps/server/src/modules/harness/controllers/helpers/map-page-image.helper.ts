/** Build a rendered page image entry for a pdf document. */
export function mapPageImage(hash: string, index: number, metaName: string) {
  return {
    name: `${metaName} · page ${index + 1}`,
    hash,
  };
}
