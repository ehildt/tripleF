import { hashPayload } from '@triplef/helpers/hash-payload';
import type { PdfPage } from '@triplef/pdf';

const JPEG_QUALITY = 85;

export interface EncodedPdfPage {
  buffer: Buffer;
  hash: string;
  page: number;
}

/**
 * Re-encode rendered pdf page PNGs to JPEG (quality 85) and content-hash each
 * one. Rendering itself is owned by @triplef/pdf (single pdfjs); this is the
 * app-level post-processing the image pipeline expects.
 */
export async function reencodePdfPageImages(
  pages: PdfPage[],
): Promise<EncodedPdfPage[]> {
  const { default: sharp } = await import('sharp');

  const encoded: EncodedPdfPage[] = [];
  for (const page of pages) {
    const buffer = await sharp(page.buffer)
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    encoded.push({
      buffer,
      hash: hashPayload(buffer, 'sha256'),
      page: page.pageNumber,
    });
  }
  return encoded;
}
