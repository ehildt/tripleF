import { describe, expect, it } from 'vitest';

import { PdfService } from './pdf.service.ts';

/**
 * Minimal single-page PDF with a Helvetica text layer. Hand-built (no xref
 * table) — pdfjs reconstructs the object index by scanning, which is exactly
 * the tolerance real-world PDFs exercise too.
 */
function buildPdf(stream: string): Buffer {
  const pdf = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    'trailer << /Root 1 0 R >>\n%%EOF\n',
  ].join('');
  return Buffer.from(pdf, 'latin1');
}

const TEXT_PDF = buildPdf('BT /F1 18 Tf 72 720 Td (Hello Encyclopedia smoke test!) Tj ET\n');
const EMPTY_PDF = buildPdf('');

describe('PdfService', () => {
  const service = new PdfService();

  describe('extractText', () => {
    it('returns the text layer per page', async () => {
      const pages = await service.extractText(TEXT_PDF);

      expect(pages).toHaveLength(1);
      expect(pages[0]).toContain('Hello Encyclopedia smoke test!');
    });

    it('returns an empty entry for a page without a text layer', async () => {
      expect(await service.extractText(EMPTY_PDF)).toEqual(['']);
    });
  });

  describe('renderPages', () => {
    it('renders one PNG per page with a 1-based page number', async () => {
      const pages = await service.renderPages(TEXT_PDF);

      expect(pages).toHaveLength(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].mimeType).toBe('image/png');
      // PNG magic bytes.
      expect(pages[0].buffer.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      expect(pages[0].buffer.length).toBeGreaterThan(100);
    });
  });
});
