import type { AttachedFileEntry } from '@/composables/attached-files.state.types';

import type { AttachmentItem } from '../use-attachment-list.types';

/** Normalize a pending attached file into an attachment item. */
export function mapPendingAttachment(
  entry: AttachedFileEntry,
  index: number,
): AttachmentItem {
  return {
    id: `pending-${entry.hash}-${index}`,
    name: entry.file.name,
    hash: entry.hash,
    previewUrl: entry.objectUrl,
    isUploaded: false,
    isSelected: entry.isSelected,
    pendingIndex: index,
    source: 'local',
    kind: entry.kind,
  };
}
