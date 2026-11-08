import type { AttachedFileEntry } from '@/stores/chat/attached-files/attached-files.model';

import type { AttachmentItem } from '../use-attachment-list.types';

/** Normalize a pending attached file into an attachment item. */
export function mapPendingAttachment(entry: AttachedFileEntry): AttachmentItem {
  return {
    id: entry.id,
    name: entry.file.name,
    hash: entry.hash,
    previewUrl: entry.objectUrl,
    isUploaded: false,
    isSelected: entry.isSelected,
    source: 'local',
    size: entry.file.size,
    kind: entry.kind,
  };
}
