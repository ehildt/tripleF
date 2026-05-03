import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

/**
 * Manages stream mode (word-by-word vs full-text) and the
 * new subscription form inputs. Syncs with conversation store.
 */
export function useStreamSettings() {
  const conversationStore = useConversationStore();

  const conversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const conversation = computed(
    () => conversationStore.getConversation(conversationId.value) ?? null,
  );

  // ── Stream mode ─────────────────────────────────────────
  const isStreamEnabled = ref(true);

  watch(
    () => conversation.value?.stream,
    (v) => {
      if (v !== undefined) isStreamEnabled.value = v;
    },
    { immediate: true },
  );

  watch(isStreamEnabled, (v) => {
    if (conversation.value) {
      conversationStore.setStream(conversationId.value, v);
    }
  });

  // ── New subscription form fields ─────────────────────────
  const newSubscriptionEvent = ref('');
  const newSubscriptionRoomId = ref('');

  watch(
    () => conversation.value?.event,
    (v) => {
      if (v !== undefined) newSubscriptionEvent.value = v;
    },
    { immediate: true },
  );

  watch(
    () => conversation.value?.roomId,
    (v) => {
      if (v !== undefined) newSubscriptionRoomId.value = v;
    },
    { immediate: true },
  );

  return {
    isStreamEnabled,
    newSubscriptionEvent,
    newSubscriptionRoomId,
  };
}
