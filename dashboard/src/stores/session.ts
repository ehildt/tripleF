// Backward-compatibility shim: the chat domain store now lives in
// ./conversation.ts. This file re-exports the same API so existing imports keep
// working while the codebase is migrated.
export {
  type Conversation,
  type Conversation as Session,
  useConversationStore,
  useConversationStore as useSessionStore,
} from './conversation';
