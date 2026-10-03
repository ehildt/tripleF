/** The image identity the tile needs. */
type ImageTileSource = {
  name: string;
  hash: string;
};

/** Project an image into the prompt-tile shape. */
export function mapImageToTile(image: ImageTileSource, url: string) {
  return { url, title: image.name };
}
