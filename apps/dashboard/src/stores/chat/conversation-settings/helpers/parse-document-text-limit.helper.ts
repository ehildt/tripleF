import { DEFAULT_DOCUMENT_TEXT_LIMIT } from '../conversation-settings.constant';

/** Parse the positive extracted-document character limit, falling back to
 * the existing default for missing, invalid, or non-positive values. */
export function parseDocumentTextLimit(raw: string | null): number {
  if (raw === null) return DEFAULT_DOCUMENT_TEXT_LIMIT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DOCUMENT_TEXT_LIMIT;
}
