import { createRequire } from 'node:module';
import path from 'node:path';

import { Injectable } from '@nestjs/common';
import type { DocumentInitParameters, PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api.js';

import type { PdfPage } from './pdf.model.ts';

const DEFAULT_RENDER_SCALE = 2;

/**
 * Single-owner pdfjs integration for the apps: the legacy Node build of
 * pdfjs-dist extracts per-page text layers and renders pages to PNG via the
 * built-in NodeCanvasFactory (@napi-rs/canvas). Standard fonts and CMaps
 * resolve from the installed pdfjs-dist package so CJK documents extract and
 * render correctly; every parsed document tree is destroyed to release it.
 *
 * No `isEvalSupported` option — pdfjs >=5.7 removed it together with the
 * PostScript `eval` path (the CVE-2024-4367 surface), so JS evaluation is
 * structurally disabled upstream.
 */
@Injectable()
export class PdfService {
  /**
   * Extract the text layer, one entry per page and aligned with the page
   * order of renderPages(). A page without a text layer (scanned/image-only)
   * yields ''. Throws when the buffer is not a parseable pdf.
   */
  async extractText(buffer: Buffer): Promise<string[]> {
    const loadingTask = await this.loadDocument(buffer);
    try {
      const document = await loadingTask.promise;
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const { items } = await page.getTextContent();
        pages.push(toPageText(items as TextItem[]));
        page.cleanup();
      }
      return pages;
    } finally {
      await loadingTask.destroy();
    }
  }

  /**
   * Render every page to a PNG at the given scale with a white background
   * (transparent pages would re-encode poorly to JPEG downstream). Entries
   * carry 1-based page numbers aligned with extractText().
   */
  async renderPages(buffer: Buffer, scale = DEFAULT_RENDER_SCALE): Promise<PdfPage[]> {
    const loadingTask = await this.loadDocument(buffer);
    try {
      const document = await loadingTask.promise;
      const pages: PdfPage[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        pages.push(await renderPage(document, pageNumber, scale));
      }
      return pages;
    } finally {
      await loadingTask.destroy();
    }
  }

  /**
   * Open the document with the legacy Node build; pdfjs standard fonts and
   * CMaps resolve from the installed package — createRequire with the file's
   * own url keeps the resolution working from the compiled dist too.
   */
  private async loadDocument(buffer: Buffer) {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjsPath = path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
    const params: DocumentInitParameters = {
      data: new Uint8Array(buffer),
      standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
      cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
      cMapPacked: true,
    };
    return getDocument(params);
  }
}

/** Join one page's text-items honoring line breaks; empty layer → ''. */
function toPageText(items: Array<TextItem | { str?: string; hasEOL?: boolean }>): string {
  return items
    .map((item) => (!item.str ? '' : item.hasEOL ? `${item.str}\n` : `${item.str} `))
    .join('')
    .trim();
}

/**
 * Structural view of pdfjs' canvasFactory: the public type is a bare
 * `Object`, but the NodeCanvasFactory the legacy build auto-selects in Node
 * (via @napi-rs/canvas) always returns { canvas, context }. Same contract
 * pdf-to-img builds on.
 */
interface PdfNodeCanvasFactory {
  create(
    width: number,
    height: number,
  ): {
    canvas: { toBuffer(mime: 'image/png'): Buffer };
    context: unknown;
  };
}

/** Render one page: canvas via the document's NodeCanvasFactory, PNG out. */
async function renderPage(document: PDFDocumentProxy, pageNumber: number, scale: number): Promise<PdfPage> {
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const { canvas, context } = (document.canvasFactory as unknown as PdfNodeCanvasFactory).create(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  await page.render({
    // napi-rs canvas/context are structurally the DOM types the renderer
    // drives at runtime; the pdfjs params expect the DOM interfaces.
    canvasContext: context as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
    background: 'rgb(255,255,255)',
  }).promise;
  page.cleanup();
  return { buffer: canvas.toBuffer('image/png'), mimeType: 'image/png', pageNumber };
}
