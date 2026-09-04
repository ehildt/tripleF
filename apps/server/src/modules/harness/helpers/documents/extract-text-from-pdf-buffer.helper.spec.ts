import { describe, expect, it } from 'vitest';

import { extractTextFromPdfBuffer } from './extract-text-from-pdf-buffer.helper.js';

/**
 * Minimal single-page PDF with a Helvetica text layer. Hand-built (no xref
 * table) — pdfjs reconstructs the object index by scanning, which is exactly
 * the tolerance real-world PDFs exercise too.
 */
function buildTextPdf(text: string): Buffer {
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET\n`;
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

describe('extractTextFromPdfBuffer', () => {
  it('extracts the text layer of a pdf', async () => {
    const text = await extractTextFromPdfBuffer(
      buildTextPdf('Hello Encyclopedia smoke test!'),
    );

    expect(text).toContain('Hello Encyclopedia smoke test!');
  });

  it('returns an empty string for a pdf with no text layer', async () => {
    const stream = '';
    const pdf = [
      '%PDF-1.4\n',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
      `4 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj\n`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
      'trailer << /Root 1 0 R >>\n%%EOF\n',
    ].join('');

    const text = await extractTextFromPdfBuffer(Buffer.from(pdf, 'latin1'));

    expect(text).toBe('');
  });
});
