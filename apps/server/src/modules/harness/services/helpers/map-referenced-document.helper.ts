/** Project a referenced document into the meta shape. */
export function mapReferencedDocument(entry: {
  name: string;
  hash: string;
  type?: string;
}) {
  return {
    name: entry.name,
    type: entry.type ?? '',
    hash: entry.hash,
    size: 0,
  };
}
