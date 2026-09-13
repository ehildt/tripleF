import { computed, ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';
import { useSocketStore } from '@/stores/socket';
import { createId } from '@/utils/id.helper';

import { subscriptions } from '../../shared/composables/subscriptions.state';

/**
 * Owns the data and actions for the new-conversation menu: the draft form
 * refs, socket/room options, context-size options, and conversation creation.
 * Reads the conversation, models, and socket stores directly so the menu
 * component does not receive these values as props.
 */
export function useConversationMenu() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const socketStore = useSocketStore();

  // ── Draft form state ─────────────────────────────────────────
  const newConversationName = ref('');
  const newConversationEvent = ref('');
  const newConversationRoomId = ref('');

  // ── Selected model (for disabled state and context filtering) ─
  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );
  const selectedModelName = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel,
  );
  const selectedModelDetails = computed(() =>
    selectedModelName.value
      ? (modelsStore.getModel(selectedModelName.value) ?? null)
      : null,
  );
  const hasNoModelSelected = computed(() => !selectedModelName.value);

  // ── Socket options ───────────────────────────────────────────
  const availableSocketEvents = computed(() =>
    [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event)
          .map((s) => s.event),
      ),
    ].sort(),
  );

  /** Rooms known for the currently entered socket event. */
  const availableRooms = computed(() => {
    const event = newConversationEvent.value;
    return [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event === event && s.roomId)
          .map((s) => s.roomId),
      ),
    ].sort();
  });

  // ── Context size options ─────────────────────────────────────
  const allNumCtxOptions = computed(() =>
    modelsStore.numCtxOptions.map(String),
  );
  const contextOptions = computed(() => {
    if (modelsStore.modelsLoading) return [];
    const contextLength = selectedModelDetails.value?.context_length;
    if (!contextLength) return allNumCtxOptions.value;
    return allNumCtxOptions.value.filter(
      (option) => Number(option) <= contextLength,
    );
  });
  const currentNumCtx = computed(
    () =>
      conversationStore.getConversation(activeConversationId.value)?.numCtx ||
      '',
  );
  const defaultNumCtx = computed(
    () => contextOptions.value.at(-1) || modelsStore.defaultNumCtx || '',
  );

  function selectNumCtx(ctx: string) {
    let sid = activeConversationId.value;
    if (!sid) {
      const conversation = conversationStore.ensureConversation();
      sid = conversation.id;
    }
    const maxCtx = selectedModelDetails.value?.context_length;
    if (maxCtx && Number(ctx) > maxCtx) ctx = String(maxCtx);
    conversationStore.setNumCtx(sid, ctx);
  }

  // ── Conversation creation ────────────────────────────────────
  /**
   * Create a new conversation from the current form values, wiring up the
   * socket connection and subscriptions. A blank event generates a fresh id;
   * a blank roomId joins no room. Clears the form on success.
   */
  function createConversation(type: 'temporary' | 'persistent') {
    const name = newConversationName.value.trim();
    const enteredEvent = newConversationEvent.value.trim();

    const event = enteredEvent || createId();
    const roomId = newConversationRoomId.value.trim() || undefined;

    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(event);
    if (roomId) socketStore.joinRoom(roomId, event);

    conversationStore.createNewConversation(type, event, roomId);
    if (name) {
      conversationStore.renameConversation(
        conversationStore.activeConversationId!,
        name,
      );
    }

    const newId = conversationStore.activeConversationId;
    if (newId) {
      conversationStore.setSubscriptions(newId, [
        { event, roomId: roomId || '' },
      ]);
    }

    // A conversation bound to a socket inherits that socket's stream mode,
    // so a socket created (or re-decided) as "full response at once" is
    // honored by the very first request sent on the conversation.
    const matchedSubscription = subscriptions.value.find(
      (s) => s.event === event && (s.roomId ?? '') === (roomId ?? ''),
    );
    if (matchedSubscription && newId) {
      conversationStore.setStream(newId, matchedSubscription.stream);
    }

    newConversationName.value = '';
    newConversationEvent.value = '';
    newConversationRoomId.value = '';
  }

  return {
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    hasNoModelSelected,
    availableSocketEvents,
    availableRooms,
    contextOptions,
    currentNumCtx,
    defaultNumCtx,
    formatCtx: modelsStore.formatCtx,
    selectNumCtx,
    createConversation,
  };
}
