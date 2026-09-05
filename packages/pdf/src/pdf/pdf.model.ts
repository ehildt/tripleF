/** Module registration options (static module, no injectable config). */
export interface PdfOptions {
  /** Register the module globally so every module can inject PdfService. */
  global?: boolean;
}

/** One rendered pdf page (PNG bytes, 1-based page number). */
export interface PdfPage {
  /** PNG bytes of the rendered page. */
  buffer: Buffer;
  /** Always 'image/png' — post-processing (e.g. JPEG re-encode) is the app's job. */
  mimeType: 'image/png';
  /** 1-based page number; aligns with the page order of extractText(). */
  pageNumber: number;
}
