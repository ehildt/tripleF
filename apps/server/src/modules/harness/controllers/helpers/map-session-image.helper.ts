/** Project a session image into the log shape (drops the source field). */
export function mapSessionImage({
  name,
  hash,
}: {
  name: string;
  hash: string;
  source?: string;
}) {
  return { name, hash };
}
