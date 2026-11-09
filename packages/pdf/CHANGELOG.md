# @triplef/pdf

## 2.0.0

### Major Changes

- 7133a53: Switch all first-party code to the PolyForm Strict License 1.0.0. Noncommercial use remains permitted for individuals, companies, and other organizations, but modification, redistribution, and commercial use require separate permission from the copyright holder.

  Update package license metadata, license badges, project descriptions, and contribution guidance to match. Third-party dependencies remain subject to their original licenses. Versions previously released under MIT or AGPL terms remain available under those terms.

## 1.0.0

### Major Changes

- 3fc42b2: Initial release of the PDF-domain library — the single pdfjs owner for the apps (`pdfjs-dist` ~5.7 + `@napi-rs/canvas` runtime), with two subpath exports:

  - `@triplef/pdf` / `@triplef/pdf/pdf` — `PdfModule.registerAsync({ global })` and `PdfService`:
    - `extractText(buffer)` — per-page text layer (`string[]`, aligned with page order; `''` for pages without one, e.g. scanned pages).
    - `renderPages(buffer, scale?)` — per-page PNG buffers (`{ buffer, mimeType: 'image/png', pageNumber }`) via pdfjs' built-in `NodeCanvasFactory` (white background; post-processing such as JPEG re-encode stays in the consuming app).

  Replaces the apps' direct `pdf-to-img` + `pdfjs-dist` usage, collapsing the duplicated pdfjs copies (5.6 via pdf-to-img and 5.7 direct) into one.
