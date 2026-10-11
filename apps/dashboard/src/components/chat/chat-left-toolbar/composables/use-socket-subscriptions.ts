import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { useSocketStore } from '@/stores/socket';
import type { SubscriptionEntry } from '@/types/subscription.model';

import { buildConversationNamesByEvent } from '../shared/helpers/build-conversation-names-by-event.helper';
import { isConversationBoundToSocket } from '../shared/helpers/is-conversation-bound-to-socket.helper';
import { isSocketEventInUse } from '../shared/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../shared/helpers/is-socket-shared.helper';
import { loadSubscriptions } from '../shared/helpers/load-subscriptions.helper';

const LOCAL_STORAGE_SUBSCRIPTIONS_KEY = 'harness-subscriptions';

/**
 * The persisted socket-subscription registry. Module-scope state on purpose:
 * the left toolbar's sockets tab renders the list while the prompt-menu's
 * sockets menu adds to it, so both trees share one registry (like
 * `useLeftToolbarView`).
 */
const subscriptions = ref<SubscriptionEntry[]>(
  loadSubscriptions(LOCAL_STORAGE_SUBSCRIPTIONS_KEY),
);

// Persist every change (including toggled active/stream flags) back to
// localStorage. Registered once at module scope — the registry is a
// singleton, so a per-call watcher would stack duplicates.
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

/** True once the conversation-driven lifecycle watchers have been registered. */
let lifecycleStarted = false;

export function useSocketSubscriptions() {
  const conversationStore = useConversationStore();
  const socketStore = useSocketStore();

  if (!lifecycleStarted) {
    lifecycleStarted = true;

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

    // Join the persisted subscriptions' rooms on mount.
    reconnectActiveSubscriptions();
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
      if (!isConversationBoundToSocket(conversation, sub.event, sub.roomId)) {
        continue;
      }
      if (conversation.stream === sub.stream) continue;
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

  /** Conversation names per socket event — for the subscribed list labels. */
  const conversationNamesByEvent = computed(() =>
    buildConversationNamesByEvent(
      subscriptions.value,
      conversationStore.conversations,
    ),
  );

  return {
    subscriptions,
    conversationNamesByEvent,
    subscribeToEvent,
    removeSubscriptionByEventRoom,
    toggleSubscriptionActive,
    toggleSubscriptionStream,
    removeSubscription,
  };
}
