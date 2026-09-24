/** Project a converted page image into an uploaded image. */
export function mapPageToUploadedImage(
  pageImage: { name: string; hash: string; page: number },
  conversationId: string,
  parent: { parentHash: string; parentName: string },
) {
  return {
    name: pageImage.name,
    hash: pageImage.hash,
    page: pageImage.page,
    parentHash: parent.parentHash,
    parentName: parent.parentName,
    uploadedAt: Date.now(),
    size: 0,
    selected: true,
    conversationId,
  };
}
