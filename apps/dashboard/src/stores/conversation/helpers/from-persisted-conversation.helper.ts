import type {
  Conversation,
  Exchange,
  PersistedConversation,
} from '../conversation.model';
import { mapUploadedDocument } from './map-uploaded-document.helper';
import { mapUploadedImage } from './map-uploaded-image.helper';

/**
 * A persisted exchange carrying the server-owned wire keys for the assistant
 * response payload. The server persists them under the legacy names
 * `harnessData` / `harnessTemplate`; the client model calls them
 * `responseData` / `responseTemplate`. Data written by a named client wins
 * when both spellings are present.
 */
type PersistedExchange = Exchange & {
  harnessData?: Exchange['responseData'];
  harnessTemplate?: string;
};

/** Rename the server-owned wire keys onto the client model field names. */
function fromPersistedExchange(exchange: PersistedExchange): Exchange {
  const { harnessData, harnessTemplate, ...rest } = exchange;
  return {
    ...rest,
    responseData: exchange.responseData ?? harnessData,
    responseTemplate: exchange.responseTemplate ?? harnessTemplate,
  };
}

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
    exchanges: (persisted.exchanges ?? []).map(fromPersistedExchange),
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
