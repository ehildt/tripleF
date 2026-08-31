/** Project a gallery item into the discarded-reference shape. */
export function mapGalleryItemToRef(item: {
  imageUrl: string;
  title?: string;
}) {
  return { imageUrl: item.imageUrl, title: item.title };
}
