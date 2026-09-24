import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { warmModel } from '@/api/warm-model.api';
import type { LeftToolbarView } from '@/components/chat/chat-left-toolbar/left-toolbar-view.type';
import { isSocketEventInUse } from '@/components/chat/chat-left-toolbar/shared/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '@/components/chat/chat-left-toolbar/shared/helpers/is-socket-shared.helper';
import {
  TOAST_KEY_CONTEXT_CLAMPED,
  TOAST_KEY_MODEL_NO_IMAGES,
} from '@/composables/toast-keys';
import { useBlink } from '@/composables/use-blink';
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

const VISION_CAPABILITY = 'vision';

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
 * View-model store for the chat left toolbar: exclusive menu state, model
 * selection (including vision/numCtx sync), the conversations/sockets section
 * tabs, the new-conversation form, stream mode, and the socket subscription
 * list.
 *
 * Single source of truth shared by the toolbar's group containers — they read
 * this store (plus the global conversation/models/socket/app stores) and pass
 * plain props down to presentational components.
 */
export const useLeftToolbarStore = defineStore('leftToolbar', () => {
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

  function toggleMenu(key: LeftToolbarMenuKey) {
    openMenuKey.value = openMenuKey.value === key ? null : key;
  }

  function openMenu(key: LeftToolbarMenuKey) {
    openMenuKey.value = key;
  }

  function closeAllMenus() {
    openMenuKey.value = null;
  }

  // ── Active conversation ───────────────────────────────────
  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  // ── Section tabs (conversations vs sockets) ────────────────
  const leftToolbarView = ref<LeftToolbarView>('conversations');

  const areSocketsVisible = computed(() => appStore.isTabVisible('sockets'));

  function selectLeftToolbarView(view: LeftToolbarView) {
    leftToolbarView.value = view;
  }

  // If the sockets section is turned off (Settings) while selected, fall back
  // to the conversations section so the view never points at a hidden tab.
  watch(areSocketsVisible, (visible) => {
    if (!visible && leftToolbarView.value === 'sockets') {
      leftToolbarView.value = 'conversations';
    }
  });

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

  const isModelAvailable = computed(() => {
    const model = selectedModelName.value;
    if (!model) return null;
    if (modelsStore.modelsLoading) return null;
    if (!modelsStore.models.length) return null;
    return modelsStore.models.some((m) => m.model === model);
  });

  const hasNoModelSelected = computed(() => !selectedModelName.value);

  const supportsVision = computed(() => {
    const caps = selectedModelDetails.value?.capabilities;
    if (!caps) return true; // allow until model details are loaded
    return caps.includes(VISION_CAPABILITY);
  });

  const hasConversations = computed(
    () => conversationStore.conversations.length > 0,
  );

  function syncImageSelectionsForVisionState(conversationIdValue: string) {
    if (!conversationIdValue) return;
    const s = conversationStore.getConversation(conversationIdValue);
    if (!s) return;

    const previouslyNonVision =
      Object.keys(s.imageSelectionSnapshot).length > 0;

    if (supportsVision.value) {
      if (previouslyNonVision) {
        conversationStore.restoreImageSelections(conversationIdValue);
        s.imageSelectionSnapshot = {};
      }
      return;
    }

    if (previouslyNonVision) {
      conversationStore.deselectAllImages(conversationIdValue);
      return;
    }

    conversationStore.snapshotImageSelections(conversationIdValue);
    conversationStore.deselectAllImages(conversationIdValue);
    // Name the model whose capabilities decided `supportsVision` — not
    // `conversation.model`, which is still '' when the model was picked
    // before a conversation existed (or while a stub is hydrating).
    toast.warning(
      i18n.global.t('toast.modelNoImages', {
        model: selectedModelDetails.value?.model ?? s.model,
      }),
      { key: TOAST_KEY_MODEL_NO_IMAGES },
    );
  }

  function syncNumCtxForModel(
    conversationIdValue: string,
    modelName: string | undefined,
  ) {
    if (!conversationIdValue || !modelName) return;
    const s = conversationStore.getConversation(conversationIdValue);
    if (!s || s.numCtx) return;

    const numCtx = modelsStore.maxNumCtxForModel(modelName);
    if (numCtx) conversationStore.setNumCtx(conversationIdValue, numCtx);
  }

  // Keep image selections and numCtx in sync with the active conversation's
  // model: a non-vision model snapshots + deselects meta-panel images, a
  // vision model restores them, and a fresh conversation inherits numCtx.
  watch(
    () => [
      activeConversationId.value,
      selectedModelDetails.value?.model,
      supportsVision.value,
    ],
    () => syncImageSelectionsForVisionState(activeConversationId.value),
  );

  watch(
    () => [activeConversationId.value, selectedModelDetails.value?.model],
    ([, modelName]) =>
      syncNumCtxForModel(activeConversationId.value, modelName as string),
    { immediate: true },
  );

  // ── Stream mode (word-by-word vs full-text) ───────────────
  const isStreamEnabled = ref(true);

  watch(
    () => activeConversation.value?.stream,
    (v) => {
      if (v !== undefined) isStreamEnabled.value = v;
    },
    { immediate: true },
  );

  // Sync the stream mode onto the conversation AND every socket it listens
  // on, so the subscribed list shows the same decision the request honors.
  watch(isStreamEnabled, (v) => {
    const conversation = activeConversation.value;
    if (!conversation) return;
    conversationStore.setStream(activeConversationId.value, v);
    if (conversation.event) {
      syncSubscriptionStream(conversation.event, conversation.roomId ?? '', v);
    }
    for (const sub of conversation.subscriptions ?? []) {
      syncSubscriptionStream(sub.event, sub.roomId ?? '', v);
    }
  });

  // ── New subscription fields ────────────────────────────────
  const newSubscriptionEvent = ref('');
  const newSubscriptionRoomId = ref('');

  watch(
    () => activeConversation.value?.event,
    (v) => {
      if (v !== undefined) newSubscriptionEvent.value = v;
    },
    { immediate: true },
  );

  watch(
    () => activeConversation.value?.roomId,
    (v) => {
      if (v !== undefined) newSubscriptionRoomId.value = v;
    },
    { immediate: true },
  );

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

  /** Align every subscription entry for a socket to the given stream mode. */
  function syncSubscriptionStream(
    event: string,
    roomId: string,
    stream: boolean,
  ): void {
    for (const sub of subscriptions.value) {
      if (
        sub.event === event &&
        sub.roomId === roomId &&
        sub.stream !== stream
      ) {
        sub.stream = stream;
      }
    }
  }

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
      syncImageSelectionsForVisionState(activeConversationId.value);
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

  // ── Disabled-button feedback (brain blink on the model selector) ──
  const brainBlink = useBlink();

  // Join the persisted subscriptions' rooms on boot.
  reconnectActiveSubscriptions();

  return {
    openMenuKey,
    isMenuOpen,
    toggleMenu,
    openMenu,
    closeAllMenus,
    activeConversationId,
    activeConversation,
    leftToolbarView,
    selectLeftToolbarView,
    areSocketsVisible,
    selectedModelName,
    selectedModelDetails,
    isModelAvailable,
    hasNoModelSelected,
    supportsVision,
    hasConversations,
    isStreamEnabled,
    newSubscriptionEvent,
    newSubscriptionRoomId,
    subscriptions,
    conversationNamesByEvent,
    subscribeToEvent,
    toggleSubscriptionActive,
    toggleSubscriptionStream,
    removeSubscription,
    mergeSubscriptionsFromConversations,
    pruneUnreferencedSubscriptions,
    reconnectActiveSubscriptions,
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
    brainBlinking: brainBlink.isBlinking,
    startBrainBlink: brainBlink.start,
    stopBrainBlink: brainBlink.stop,
  };
});
