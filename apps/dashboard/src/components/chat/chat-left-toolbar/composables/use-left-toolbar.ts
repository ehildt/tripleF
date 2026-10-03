import { computed, ref, watch } from 'vue';

import { warmModel } from '@/api/warm-model.api';
import { isSocketEventInUse } from '@/components/chat/chat-left-toolbar/shared/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '@/components/chat/chat-left-toolbar/shared/helpers/is-socket-shared.helper';
import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';
import { useSocketStore } from '@/stores/socket';
import type { SubscriptionEntry } from '@/types/subscription.model';
import { createId } from '@/utils/id.helper';

/** Exclusive toolbar menus: opening one closes any other. */
export type LeftToolbarMenuKey = 'model' | 'conversation' | 'stream';

const LOCAL_STORAGE_SUBSCRIPTIONS_KEY = 'harness-subscriptions';

function loadSubscriptions(): SubscriptionEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBSCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * State and actions for the chat view's left toolbar: exclusive menu state,
 * model selection, socket-section availability, the new-conversation form,
 * stream mode, and the socket subscription list.
 *
 * A deliberate lazy singleton (created once on first call, like the playback
 * session): the prompt-menu in the chat prompt action bar drives the same
 * conversation/stream menus the left toolbar's model menu must stay
 * exclusive with, so both component trees share one instance. Lives in a
 * composable, not a store, because no component outside the chat view reads
 * it.
 */
export function createLeftToolbarState() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const socketStore = useSocketStore();
  const appStore = useAppStore();
  const toast = useToast();

  // ── Menu coordination ─────────────────────────────────────
  const openMenuKey = ref<LeftToolbarMenuKey | null>(null);

  function isMenuOpen(key: LeftToolbarMenuKey): boolean {
    return openMenuKey.value === key;
  }

  function openMenu(key: LeftToolbarMenuKey) {
    openMenuKey.value = key;
  }

  function closeAllMenus() {
    openMenuKey.value = null;
  }

  const isModelMenuOpen = computed(() => isMenuOpen('model'));
  const isConversationMenuOpen = computed(() => isMenuOpen('conversation'));
  const isStreamMenuOpen = computed(() => isMenuOpen('stream'));

  // ── Active conversation ───────────────────────────────────
  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  // ── Model selection ───────────────────────────────────────
  /** The model shown/applied: the active conversation's own model wins, then
   *  the globally persisted selection for a fresh (model-less) conversation. */
  const selectedModelName = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel,
  );

  const selectedModelDetails = computed(() =>
    selectedModelName.value
      ? (modelsStore.getModel(selectedModelName.value) ?? null)
      : null,
  );

  const selectedModelCapabilities = computed(() => {
    const caps = selectedModelDetails.value?.capabilities;
    return caps ?? [];
  });

  const isModelAvailable = computed(() => {
    const model = selectedModelName.value;
    if (!model) return null;
    if (modelsStore.modelsLoading) return null;
    if (!modelsStore.models.length) return null;
    return modelsStore.models.some((m) => m.model === model);
  });

  const isModelMissing = computed(() => isModelAvailable.value === false);

  const hasNoModelSelected = computed(() => !selectedModelName.value);

  const hasConversations = computed(
    () => conversationStore.conversations.length > 0,
  );

  const localModels = computed(() => modelsStore.localModels);
  const cloudModels = computed(() => modelsStore.cloudModels);
  const modelsLoading = computed(() => modelsStore.modelsLoading);

  // ── New socket draft (event, channel, stream mode) ─────────
  // The sockets menu drafts the socket that is being created: the fields
  // start empty and the stream toggle only applies to that draft — it never
  // rewrites the active conversation's stream mode or the subscriptions it
  // listens on. Subscribing clears the draft, so the next socket starts from
  // a clean form instead of lingering on the one just created.
  const newSubscriptionEvent = ref('');
  const newSubscriptionRoomId = ref('');
  const newSubscriptionStreamEnabled = ref(true);

  // ── Socket subscriptions (persisted) ──────────────────────
  const subscriptions = ref<SubscriptionEntry[]>(loadSubscriptions());

  watch(
    subscriptions,
    () => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_SUBSCRIPTIONS_KEY,
          JSON.stringify(subscriptions.value),
        );
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  function addSubscription(event: string, roomId: string, stream = true) {
    const e = event.trim();
    const r = roomId.trim();
    if (!e) return;
    if (!subscriptions.value.some((s) => s.event === e && s.roomId === r)) {
      subscriptions.value.push({ event: e, roomId: r, active: true, stream });
    }
  }

  function removeSubscriptionByEventRoom(event: string, roomId: string) {
    const index = subscriptions.value.findIndex(
      (s) => s.event === event && s.roomId === roomId,
    );
    if (index !== -1) subscriptions.value.splice(index, 1);
  }

  // Keep the list in sync when conversations are created/deleted at runtime.
  let previousConversationCount = conversationStore.conversations.length;

  watch(
    () => conversationStore.conversations.length,
    (newLength) => {
      if (newLength > previousConversationCount) {
        mergeSubscriptionsFromConversations();
      } else if (newLength < previousConversationCount) {
        // A conversation disappeared: sweep every socket/room that no
        // remaining conversation references anymore.
        pruneUnreferencedSubscriptions();
      }
      previousConversationCount = newLength;
    },
  );

  // Once conversations have hydrated from the server, merge their bindings
  // into the list and prune stale localStorage entries that no conversation
  // references anymore. Runs only on the hydration transition — a later
  // remount must not wipe freshly added manual subscriptions.
  watch(
    () => conversationStore.hydrated,
    (isHydrated) => {
      if (!isHydrated) return;
      mergeSubscriptionsFromConversations();
      pruneUnreferencedSubscriptions();
    },
  );

  /** Conversation names per socket event — for the subscribed list labels. */
  const conversationNamesByEvent = computed(() => {
    const map: Record<string, string[]> = {};
    for (const sub of subscriptions.value) {
      const key = `${sub.event}::${sub.roomId}`;
      const names = conversationStore.conversations
        .filter(
          (s) =>
            (s.event === sub.event && s.roomId === sub.roomId) ||
            s.subscriptions?.some(
              (sSub) => sSub.event === sub.event && sSub.roomId === sub.roomId,
            ),
        )
        .map((s) => s.title || '(untitled)');
      map[key] = names;
    }
    return map;
  });

  function subscribeToEvent(event: string, roomId: string, stream = true) {
    const e = event.trim();
    const r = roomId.trim();
    if (!e) return;
    addSubscription(e, r, stream);
    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(e);
    if (r) socketStore.joinRoom(r, e);

    // Clear the creation draft — the menu starts empty for the next socket
    // instead of keeping the one just created.
    newSubscriptionEvent.value = '';
    newSubscriptionRoomId.value = '';
    newSubscriptionStreamEnabled.value = true;
  }

  function toggleSubscriptionActive(index: number) {
    const sub = subscriptions.value[index];
    if (!sub) return;
    if (sub.active) {
      socketStore.closeRoom(sub.event, sub.roomId);
      sub.active = false;
    } else {
      socketStore.listenToEvent(sub.event);
      if (sub.roomId) socketStore.joinRoom(sub.roomId, sub.event);
      sub.active = true;
    }
  }

  /** Flip a subscribed socket's stream mode and push it onto every
   *  conversation bound to that socket. */
  function toggleSubscriptionStream(index: number) {
    const sub = subscriptions.value[index];
    if (!sub) return;
    sub.stream = !sub.stream;

    for (const conversation of conversationStore.conversations) {
      const bound =
        (conversation.event === sub.event &&
          (conversation.roomId ?? '') === (sub.roomId ?? '')) ||
        conversation.subscriptions?.some(
          (s) =>
            s.event === sub.event && (s.roomId ?? '') === (sub.roomId ?? ''),
        );
      if (!bound || conversation.stream === sub.stream) continue;
      conversationStore.setStream(conversation.id, sub.stream);
    }
  }

  function removeSubscription(index: number) {
    const sub = subscriptions.value[index];
    if (sub && sub.active) {
      socketStore.closeRoom(sub.event, sub.roomId);
    }
    removeSubscriptionByEventRoom(sub?.event ?? '', sub?.roomId ?? '');
  }

  function mergeSubscriptionsFromConversations() {
    for (const s of conversationStore.conversations) {
      if (s.event) addSubscription(s.event, s.roomId || '');
      for (const sub of s.subscriptions ?? []) {
        addSubscription(sub.event, sub.roomId || '');
      }
    }
  }

  /** Garbage-collect subscriptions: every socket/room no conversation
   *  references anymore (own binding or extra subscription) is closed and
   *  removed. The event itself is closed once nothing else uses it. */
  function pruneUnreferencedSubscriptions() {
    for (const sub of [...subscriptions.value]) {
      if (
        isSocketShared(
          conversationStore.conversations,
          '',
          sub.event,
          sub.roomId,
        )
      ) {
        continue;
      }
      if (sub.active && sub.roomId) {
        socketStore.closeRoom(sub.event, sub.roomId);
      }
      removeSubscriptionByEventRoom(sub.event, sub.roomId);
      if (
        !isSocketEventInUse(
          conversationStore.conversations,
          subscriptions.value,
          '',
          sub.event,
        )
      ) {
        socketStore.closeEvent(sub.event);
      }
    }
  }

  function reconnectActiveSubscriptions() {
    for (const sub of subscriptions.value) {
      if (!sub.active) continue;
      socketStore.listenToEvent(sub.event);
      if (sub.roomId) socketStore.joinRoom(sub.roomId, sub.event);
    }
  }

  // ── Conversation actions ──────────────────────────────────
  /**
   * Delete a conversation after leaving every socket it listens on (unless
   * another conversation shares the socket). The event listener itself is
   * detached once nothing uses the event on any room.
   */
  async function deleteConversation(id: string) {
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;

    const socketBindings = [
      ...(conversation.event
        ? [{ event: conversation.event, roomId: conversation.roomId ?? '' }]
        : []),
      ...(conversation.subscriptions ?? []),
    ];

    for (const { event, roomId } of socketBindings) {
      if (!event) continue;
      if (isSocketShared(conversationStore.conversations, id, event, roomId)) {
        continue;
      }

      if (roomId) socketStore.closeRoom(event, roomId);
      removeSubscriptionByEventRoom(event, roomId);

      if (
        !isSocketEventInUse(
          conversationStore.conversations,
          subscriptions.value,
          id,
          event,
        )
      ) {
        socketStore.closeEvent(event);
      }
    }
    conversation.subscriptions = [];

    await conversationStore.deleteCurrentConversation(id);
  }

  // ── Menu toggles (coordinated with the catalog fetch) ─────
  function toggleModelMenu() {
    const wasOpen = isMenuOpen('model');
    closeAllMenus();
    if (!wasOpen) {
      openMenu('model');
      void modelsStore.fetchModels({ refresh: true });
    }
  }

  function toggleConversationMenu() {
    if (hasNoModelSelected.value) return;
    const wasOpen = isMenuOpen('conversation');
    closeAllMenus();
    if (wasOpen) return;
    openMenu('conversation');
    if (!modelsStore.models.length)
      void modelsStore.fetchModels({ refresh: true });
  }

  function toggleStreamMenu() {
    if (hasNoModelSelected.value) return;
    const wasOpen = isMenuOpen('stream');
    closeAllMenus();
    if (!wasOpen) openMenu('stream');
  }

  // ── Model change ──────────────────────────────────────────
  function changeModel(modelName: string) {
    modelsStore.setSelectedModel(modelName);

    // Opt-in warm-up: pre-load local model weights so the first prompt does
    // not stall on a cold load. Cloud models are served remotely — skip.
    if (appStore.warmModelOnSelect) {
      const origin = modelsStore.getModel(modelName)?.origin;
      if (origin !== 'cloud') void warmModel(modelName);
    }

    if (activeConversationId.value) {
      conversationStore.setModel(activeConversationId.value, modelName);
      const m = modelsStore.getModel(modelName);
      if (m?.context_length) {
        const maxOpt = modelsStore.maxNumCtxForModel(modelName);
        const current = Number(
          conversationStore.getConversation(activeConversationId.value)
            ?.numCtx ?? 0,
        );
        if (current > m.context_length) {
          conversationStore.setNumCtx(activeConversationId.value, maxOpt);
          toast.warning(
            i18n.global.t('toast.contextClamped', {
              model: modelName,
              max: modelsStore.formatCtx(m.context_length),
              value: modelsStore.formatCtx(Number(maxOpt)),
            }),
            { key: TOAST_KEY_CONTEXT_CLAMPED },
          );
        } else if (maxOpt) {
          conversationStore.setNumCtx(activeConversationId.value, maxOpt);
        }
      }
    }
  }

  // ── New-conversation menu (draft + creation + context size) ─
  const newConversationName = ref('');
  const newConversationEvent = ref('');
  const newConversationRoomId = ref('');

  const availableSocketEvents = computed(() =>
    [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event)
          .map((s) => s.event),
      ),
    ].sort(),
  );

  /** Rooms known for the event currently entered in the new-conversation menu. */
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
  const currentNumCtx = computed(() => activeConversation.value?.numCtx || '');
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

  // Join the persisted subscriptions' rooms on mount.
  reconnectActiveSubscriptions();

  return {
    isModelMenuOpen,
    isConversationMenuOpen,
    isStreamMenuOpen,
    closeAllMenus,
    toggleModelMenu,
    toggleConversationMenu,
    toggleStreamMenu,
    selectedModelName,
    selectedModelCapabilities,
    isModelAvailable,
    isModelMissing,
    hasNoModelSelected,
    hasConversations,
    localModels,
    cloudModels,
    modelsLoading,
    conversations: computed(() => conversationStore.conversations),
    activeConversationId: computed(
      () => conversationStore.activeConversationId,
    ),
    temporaryRetentionMinutes: computed(
      () => appStore.temporaryRetentionMinutes,
    ),
    setActiveConversation: conversationStore.setActiveConversation,
    toggleConversationType: conversationStore.toggleConversationType,
    newSubscriptionStreamEnabled,
    newSubscriptionEvent,
    newSubscriptionRoomId,
    subscriptions,
    conversationNamesByEvent,
    subscribeToEvent,
    toggleSubscriptionActive,
    toggleSubscriptionStream,
    removeSubscription,
    deleteConversation,
    changeModel,
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    availableSocketEvents,
    availableRooms,
    contextOptions,
    currentNumCtx,
    defaultNumCtx,
    selectNumCtx,
    createConversation,
    formatContextValue: (value: string) => modelsStore.formatCtx(Number(value)),
  };
}

export type LeftToolbarState = ReturnType<typeof createLeftToolbarState>;

let leftToolbarState: LeftToolbarState | null = null;

/**
 * Read the chat view's left-toolbar singleton (see `createLeftToolbarState`
 * for what it owns and why it is shared). Created lazily on first use so the
 * stores it touches are initialized inside a component setup context.
 */
export function useLeftToolbar(): LeftToolbarState {
  leftToolbarState ??= createLeftToolbarState();
  return leftToolbarState;
}
