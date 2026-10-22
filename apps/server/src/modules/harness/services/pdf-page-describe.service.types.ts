/**
 * Boundary of the pdf-page description lane: the input built by document
 * conversion and consumed by `PdfPageDescribeService.describePages` to
 * describe one encoded page image per call.
 */

/** One describe-pass over a document's selected pages. */
export interface DescribePdfPagesInput {
  /** Chat model to describe with (callers gate on vision capability). */
  model: string;
  /** Original filename — the prompt references the document it belongs to. */
  documentName: string;
  /** Total page count of the document (prompt context). */
  pageCount: number;
  /** Pages to describe: encoded page images with their 1-based page number. */
  pages: Array<{ buffer: Buffer; pageNumber: number }>;
  /** Cancellation hook of the originating turn. */
  abortSignal?: AbortSignal;
}
