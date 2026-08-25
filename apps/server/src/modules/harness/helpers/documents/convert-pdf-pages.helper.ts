import { hashPayload } from '@triplef/helpers/hash-payload';

const JPEG_QUALITY = 85;

interface PdfPageImage {
  buffer: Buffer;
  hash: string;
  page: number;
}

/**
 * Render every page of a PDF buffer to a JPEG image: pdf-to-img (pdfjs +
 * napi canvas) renders at scale 2 into PNG, sharp re-encodes to JPEG so the
 * page images ride the regular image attachment pipeline. One entry per
 * page, content-hashed.
 */
export async function convertPdfToPageImages(
  buffer: Buffer,
): Promise<PdfPageImage[]> {
  const [{ pdf }, { default: sharp }] = await Promise.all([
    import('pdf-to-img'),
    import('sharp'),
  ]);
  const document = await pdf(buffer, { scale: 2 });

  const pages: PdfPageImage[] = [];
  for await (const png of document) {
    const image = await sharp(png).jpeg({ quality: JPEG_QUALITY }).toBuffer();
    pages.push({
      buffer: image,
      hash: hashPayload(image, 'sha256'),
      page: pages.length + 1,
    });
  }
  void document.destroy();
  return pages;
}
