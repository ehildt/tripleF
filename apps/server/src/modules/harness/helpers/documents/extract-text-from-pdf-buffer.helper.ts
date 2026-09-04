import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Extract a PDF's text layer, one block per page (pdfjs legacy Node build).
 * Standard fonts and CMaps resolve from the installed pdfjs-dist package so
 * CJK documents extract correctly; the parsed document tree is always
 * destroyed to release it. A scanned PDF has no text layer and returns ''.
 *
 * No `isEvalSupported: false` — pdfjs >=5.7 removed the option together with
 * the PostScript `eval` path (the CVE-2024-4367 surface), so JS evaluation
 * is structurally disabled upstream.
 */
export async function extractTextFromPdfBuffer(
  buffer: Buffer,
): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfjsPath = path.dirname(
    createRequire(import.meta.url).resolve('pdfjs-dist/package.json'),
  );
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
    cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
    cMapPacked: true,
  });
  try {
    const document = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const { items } = await page.getTextContent();
      pages.push(
        items
          .map((item) =>
            !('str' in item)
              ? ''
              : item.hasEOL
                ? `${item.str}\n`
                : `${item.str} `,
          )
          .join('')
          .trim(),
      );
    }
    return pages.filter(Boolean).join('\n\n');
  } finally {
    await loadingTask.destroy();
  }
}
