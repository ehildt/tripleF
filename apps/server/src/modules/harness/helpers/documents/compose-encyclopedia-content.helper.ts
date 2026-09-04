import type { DocumentManifest } from './document-manifest.helper.js';

/**
 * Compose the encyclopedia node content for one converted document. The
 * content depends only on manifest state — never on a per-turn page
 * selection — so repeated indexing is idempotent (same content, same
 * contentHash, memory reuses the stored chunks).
 *
 * Pdf: for every page the extracted text layer plus its vision description
 * (when described), in page order. A scanned page contributes its description
 * alone; a never-described page contributes its text alone. Legacy manifests
 * without per-page texts fall back to the blob text.
 * Everything else: the extracted blob text.
 */
export function composeEncyclopediaContent(manifest: DocumentManifest): string {
  if (manifest.kind !== 'pdf') return manifest.text.trim();

  const parts: string[] = [];
  for (let index = 0; index < manifest.pageHashes.length; index++) {
    const text = manifest.pageTexts?.[index]?.trim();
    const description = manifest.pageDescriptions?.[index]?.trim();
    if (text) parts.push(text);
    if (description) parts.push(description);
  }
  return parts.length ? parts.join('\n\n') : manifest.text.trim();
}
