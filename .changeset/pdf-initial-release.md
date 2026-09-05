---
'@triplef/pdf': major
---

Initial release of the PDF-domain library — the single pdfjs owner for the apps (`pdfjs-dist` ~5.7 + `@napi-rs/canvas` runtime), with two subpath exports:

- `@triplef/pdf` / `@triplef/pdf/pdf` — `PdfModule.registerAsync({ global })` and `PdfService`:
  - `extractText(buffer)` — per-page text layer (`string[]`, aligned with page order; `''` for pages without one, e.g. scanned pages).
  - `renderPages(buffer, scale?)` — per-page PNG buffers (`{ buffer, mimeType: 'image/png', pageNumber }`) via pdfjs' built-in `NodeCanvasFactory` (white background; post-processing such as JPEG re-encode stays in the consuming app).

Replaces the apps' direct `pdf-to-img` + `pdfjs-dist` usage, collapsing the duplicated pdfjs copies (5.6 via pdf-to-img and 5.7 direct) into one.
