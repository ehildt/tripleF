/** Project an image into the prompt-tile shape. */
export function mapImageToTile(
  image: { name: string; hash: string },
  url: string,
) {
  return { url, title: image.name };
}
