import type { DocumentKind } from './classify-document-kind.helper.js';

/** Marker suffix appended to the original hash for the manifest object key. */
const MANIFEST_HASH_SUFFIX = '.conv';

/**
 * Persisted conversion result for one original document, stored in MinIO as
 * a JSON object next to the original buffer. Page images are separate
 * content-hashed objects; the manifest carries their hashes so the client
 * and the context builder can resolve pages without re-converting.
 */
export interface DocumentManifest {
  /** Conversion kind the manifest was built from. */
  kind: DocumentKind;
  /** Original filename (client-supplied). */
  name: string;
  /** Content hashes of the rendered PDF page images, in page order. */
  pageHashes: string[];
  /** Extracted text (docx/pptx/plain). Empty for pdf. */
  text: string;
  /** Preview HTML (docx). Undefined otherwise. */
  html?: string;
  /** PPTX per-slide text for a readable preview. Undefined otherwise. */
  slides?: string[];
}

/**
 * Deterministic manifest object key suffix: derived from the original hash
 * so every writer and reader agrees on the object without shared state.
 */
export function buildManifestHash(originalHash: string): string {
  return `${originalHash}${MANIFEST_HASH_SUFFIX}`;
}

/** Serialize the manifest for MinIO storage. */
export function buildManifestJson(manifest: DocumentManifest): Buffer {
  return Buffer.from(JSON.stringify(manifest), 'utf-8');
}

/** Parse a manifest object; returns null when the bytes are not one. */
export function parseManifestJson(buffer: Buffer): DocumentManifest | null {
  try {
    const parsed = JSON.parse(buffer.toString('utf-8')) as DocumentManifest;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.name !== 'string' ||
      !Array.isArray(parsed.pageHashes) ||
      !parsed.pageHashes.every((h) => typeof h === 'string')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
