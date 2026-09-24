import type { UploadedImageGroup } from '../helpers/group-uploaded-images.helper';
import type { AttachmentItem } from '../use-attachment-list.types';

/** Normalize a pdf page group into a gallery attachment item. */
export function mapUploadedImageGallery(
  group: UploadedImageGroup,
): AttachmentItem {
  return {
    id: `gallery-${group.parentHash}`,
    name: group.parentName,
    hash: group.parentHash,
    previewUrl: '',
    isUploaded: true,
    isSelected: group.isSelected,
    pendingIndex: null,
    source: 'local',
    kind: 'gallery',
    pages: group.pages.map((p) => ({ name: p.name, hash: p.hash })),
  };
}
