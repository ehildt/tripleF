import type { AttachmentItem } from '../composables/use-attachment-list.types';

export interface AttachmentDocumentRowProps {
  /** The non-pdf document attachment item. */
  item: AttachmentItem & { kind: 'document' };
}
