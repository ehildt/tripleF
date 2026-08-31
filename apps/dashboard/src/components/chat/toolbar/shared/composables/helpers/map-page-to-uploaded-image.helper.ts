/** Project a converted page image into an uploaded image. */
export function mapPageToUploadedImage(
  page: { name: string; hash: string },
  conversationId: string,
) {
  return {
    name: page.name,
    hash: page.hash,
    uploadedAt: Date.now(),
    size: 0,
    selected: true,
    conversationId,
  };
}
