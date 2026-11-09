import { type Ref, ref } from 'vue';

const activeConversationId = ref<string | null>(null);

interface ConversationSession {
  activeConversationId: Ref<string | null>;
  setActiveConversationId: (id: string | null) => void;
}

/**
 * Controls the singleton active-conversation selection shared by Chat and its
 * related widgets. Module scope preserves the selection across route mounts.
 */
export function useConversationSession(): ConversationSession {
  function setActiveConversationId(id: string | null): void {
    activeConversationId.value = id;
  }

  return { activeConversationId, setActiveConversationId };
}
