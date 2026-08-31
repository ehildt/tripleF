/** Project a file meta entry into the embedding-payload file shape. */
export function mapFileEntry(
  entry: { name: string; hash: string },
  url: string,
) {
  return { name: entry.name, url };
}
