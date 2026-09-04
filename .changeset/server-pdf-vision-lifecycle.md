---
'@triplef/server': minor
---

PDF documents now have a full encyclopedia lifecycle, mirroring how the client treats pdf attachments (a pdf turn is a vision turn by construction):

- **Upload time** (`POST /harness/documents`): the original is stored, pages are rendered via `@triplef/pdf` (single pdfjs) and re-encoded to JPEG, the text layer is extracted **per page** into the conversion manifest (`pageTexts`), and the extracted text is delegated to the memory encyclopedia immediately — the node exists before the first question.
- **Ask time**: the pages the user kept in the gallery (selection is authoritative) get a one-time vision description per page (`PdfPageDescribeService`, sequential, thinking off), persisted into the manifest (`pageDescriptions`, `null` = pending, `''` = described-empty, nothing persisted on model failure). The encyclopedia node is then re-indexed — enriched in place with text layers + descriptions under the original's MinIO url (idempotent content-hash reuse on the memory side).
- A pdf no longer injects its text into the prompt; the model sees the selected page images and probes the encyclopedia for the text via the existing encyclopedia tools. Non-pdf documents (docx/pptx/txt) are unchanged.
- Legacy manifests heal their missing `pageTexts` on next reference; scanned/exotic PDFs end up as description-only encyclopedia nodes.
- Dropped the `pdf-to-img` and direct `pdfjs-dist` dependencies in favor of `@triplef/pdf`.
