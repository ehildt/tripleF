import type {
  Conversation,
  PersistedConversation,
} from '../conversation.model';

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
    uploadedImages: (persisted.uploadedImages ?? []).map((img) => ({
      ...img,
      selected: img.selected ?? true,
    })),
    imageSelectionSnapshot: persisted.imageSelectionSnapshot ?? {},
    subscriptions: persisted.subscriptions ?? [],
    type: persisted.type ?? 'temporary',
  } as Conversation;
}
