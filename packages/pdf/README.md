# @triplef/pdf

Single-owner pdfjs integration for the tripleF (3F) apps — the one and only place that depends on `pdfjs-dist`.

- `PdfService.extractText(buffer)` → per-page text layer (`string[]`, aligned 1:1 with pages; `''` for pages without a text layer, e.g. scanned pages).
- `PdfService.renderPages(buffer, scale?)` → per-page PNG buffers (`{ buffer, mimeType: 'image/png', pageNumber }`), white background, rendered via pdfjs' built-in `NodeCanvasFactory` on top of `@napi-rs/canvas` (a runtime dependency of this package).

## Usage

```ts
import { PdfModule } from '@triplef/pdf';

@Module({
  imports: [PdfModule.registerAsync({ global: true })],
})
export class AppModule {}
```

Then inject `PdfService` wherever it is needed.

## Notes

- Uses the pdfjs **legacy Node build** (`pdfjs-dist/legacy/build/pdf.mjs`) with standard fonts and CMaps resolved from the installed `pdfjs-dist` package, so CJK documents extract and render correctly.
- No `isEvalSupported` option: pdfjs ≥5.7 removed it together with the PostScript `eval` path (CVE-2024-4367 surface).
- Post-processing (e.g. JPEG re-encode for token efficiency) is intentionally left to the consuming app.
