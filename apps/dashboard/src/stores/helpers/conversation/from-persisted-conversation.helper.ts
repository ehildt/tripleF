import type {
  Conversation,
  PersistedConversation,
} from '../../conversation.model';
import { mapUploadedDocument } from './map-uploaded-document.helper';
import { mapUploadedImage } from './map-uploaded-image.helper';

/**
 * Rehydrate a conversation from its server snapshot: transient `files`
 * start empty, uploaded images default to selected, and optional fields
 * receive their in-memory defaults.
 */
export function fromPersistedConversation(
  persisted: PersistedConversation,
): Conversation {
  return {
    ...persisted,
    files: [],
    uploadedImages: (persisted.uploadedImages ?? []).map(mapUploadedImage),
    uploadedDocuments: (persisted.uploadedDocuments ?? []).map(
      mapUploadedDocument,
    ),
    imageSelectionSnapshot: persisted.imageSelectionSnapshot ?? {},
    subscriptions: persisted.subscriptions ?? [],
    type: persisted.type ?? 'temporary',
    contextUsagePercent: persisted.contextUsagePercent ?? null,
    loaded: true,
  } as Conversation;
}
