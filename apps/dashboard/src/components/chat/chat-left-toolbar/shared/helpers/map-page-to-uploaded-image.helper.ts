/** A converted page image carried between the preview and the conversation. */
type PageImage = {
  name: string;
  hash: string;
  page: number;
};

/** The parent document the page image belongs to. */
type PageImageParent = {
  parentHash: string;
  parentName: string;
};

/** Project a converted page image into an uploaded image. */
export function mapPageToUploadedImage(
  pageImage: PageImage,
  conversationId: string,
  parent: PageImageParent,
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
