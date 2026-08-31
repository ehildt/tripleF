/** Project an image into the conversation-metadata shape. */
export function mapImageToMetadata({
  name,
  hash,
}: {
  name: string;
  hash: string;
}) {
  return { name, hash };
}
