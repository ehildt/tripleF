/** Content type used for rendered document pages. */
const PAGE_IMAGE_CONTENT_TYPE = 'image/jpeg';

/** Build the upload meta for one rendered document page. */
export function mapPageMeta(
  page: { buffer: Buffer; hash: string; page: number },
  entryName: string,
) {
  return {
    name: `${entryName} · page ${page.page}`,
    type: PAGE_IMAGE_CONTENT_TYPE,
    hash: page.hash,
    size: page.buffer.length,
  };
}
