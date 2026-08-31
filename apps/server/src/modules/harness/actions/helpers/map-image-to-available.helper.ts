/** Project a verified image into the available-media shape. */
export function mapImageToAvailable(item: {
  imageUrl: string;
  title?: string;
}) {
  return { url: item.imageUrl, title: item.title };
}
