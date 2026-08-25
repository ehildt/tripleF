export type DocumentKind = 'pdf' | 'docx' | 'pptx' | 'text';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const KIND_BY_MIME: Record<string, DocumentKind> = {
  [PDF_MIME]: 'pdf',
  [DOCX_MIME]: 'docx',
  [PPTX_MIME]: 'pptx',
  // Office-format fallbacks that arrive with slightly different mimes.
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
    'pptx',
  'application/vnd.ms-powerpoint': 'pptx',
  'application/vnd.ms-word.document.macroenabled.12': 'docx',
  'application/vnd.ms-powerpoint.presentation.macroenabled.12': 'pptx',
};

const KIND_BY_EXTENSION: Array<[suffix: string, kind: DocumentKind]> = [
  ['.pdf', 'pdf'],
  ['.docx', 'docx'],
  ['.pptx', 'pptx'],
];

/**
 * Map an original document to its conversion kind from the stored MIME type
 * (falling back to the filename extension): pdf → page images, docx → html +
 * text, pptx → slide text, everything else → the file content itself.
 */
export function classifyDocumentKind(
  contentType: string | undefined,
  name: string,
): DocumentKind {
  const mime = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (mime) return KIND_BY_MIME[mime] ?? 'text';
  const lower = name.toLowerCase();
  return (
    KIND_BY_EXTENSION.find(([suffix]) => lower.endsWith(suffix))?.[1] ?? 'text'
  );
}
