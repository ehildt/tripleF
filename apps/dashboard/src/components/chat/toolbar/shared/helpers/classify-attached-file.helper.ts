export type ClassifiedFileKind = 'image' | 'pdf' | 'document' | null;

const PDF_EXTENSIONS = new Set(['pdf']);
const DOCUMENT_EXTENSIONS = new Set([
  'docx',
  'pptx',
  'txt',
  'md',
  'csv',
  'json',
  'log',
  'xml',
  'yaml',
  'yml',
]);

/**
 * Classify a selected file by MIME type first, then by extension (browsers
 * often report an empty type for common document extensions). Returns null
 * for unsupported types so the caller can surface a toast.
 */
export function classifyAttachedFile(file: File): ClassifiedFileKind {
  if (file.type.startsWith('image/')) return 'image';

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (PDF_EXTENSIONS.has(extension)) return 'pdf';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document';
  return null;
}
