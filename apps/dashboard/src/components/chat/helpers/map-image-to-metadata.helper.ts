/** The image identity the conversation-metadata entry needs. */
type ImageMetadataSource = {
  name: string;
  hash: string;
};

/** Project an image into the conversation-metadata shape. */
export function mapImageToMetadata({ name, hash }: ImageMetadataSource) {
  return { name, hash };
}
