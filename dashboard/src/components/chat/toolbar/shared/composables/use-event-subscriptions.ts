import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import { isSocketEventInUse } from '../../conversation-list/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../../conversation-list/helpers/is-socket-shared.helper';
import {
  addSubscription,
  removeSubscriptionByEventRoom,
  subscriptions,
} from './subscriptions.state';

export type { SubscriptionEntry } from './subscriptions.state';

/**
 * True when a conversation listens on the given socket — either as its own
 * binding (event + roomId) or through an extra subscription.
 */
function isConversationBoundTo(
  conversation: {
    event?: string;
    roomId?: string;
    subscriptions?: { event: string; roomId?: string }[];
  },
  event: string,
  roomId: string,
): boolean {
  return (
    (conversation.event === event && (conversation.roomId ?? '') === roomId) ||
    conversation.subscriptions?.some(
      (sub) => sub.event === event && (sub.roomId ?? '') === roomId,
    ) === true
  );
}

/**
 * Manages the list of subscribed socket events.
 * Handles persistence, toggling, unsubscribing, and merging from conversations.
 */
export function useEventSubscriptions() {
  const conversationStore = useConversationStore();
  const socketStore = useSocketStore();

  // ── Expansion state (persisted) ─────────────────────────
  const isSubscriptionListExpanded = ref(
    localStorage.getItem('harness-expanded-sockets') === 'true',
  );

  watch(isSubscriptionListExpanded, (v) =>
    localStorage.setItem('harness-expanded-sockets', String(v)),
  );

  // ── Keep list in sync when conversations are created at runtime ─
  let previousSessionCount = conversationStore.conversations.length;

  watch(
    () => conversationStore.conversations.length,
    (newLength) => {
      if (newLength > previousSessionCount) {
        mergeSubscriptionsFromSessions();
      } else if (newLength < previousSessionCount) {
        // A conversation disappeared: sweep every socket/room that no
        // remaining conversation references anymore.
        pruneUnreferencedSubscriptions();
      }
      previousSessionCount = newLength;
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
      mergeSubscriptionsFromSessions();
      pruneUnreferencedSubscriptions();
    },
  );

  // ── Available socket events (for the new-conversation combobox) ──
  const availableSocketEvents = computed(() =>
    [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event)
          .map((s) => s.event),
      ),
    ].sort(),
  );

  // ── Known roomIds per socket event ──────────────────────────────
  const availableRoomsByEvent = computed(() => {
    const roomsByEvent = new Map<string, Set<string>>();
    for (const sub of subscriptions.value) {
      if (!sub.active || !sub.event || !sub.roomId) continue;
      const rooms = roomsByEvent.get(sub.event) ?? new Set<string>();
      rooms.add(sub.roomId);
      roomsByEvent.set(sub.event, rooms);
    }
    return Object.fromEntries(
      [...roomsByEvent].map(([event, rooms]) => [event, [...rooms].sort()]),
    );
  });

  // ── Conversation names by event ───────────────────────────────
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

  // ── Actions ──────────────────────────────────────────────
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

  /**
   * Flip the stream mode of a subscribed socket and push it onto every
   * conversation bound to that socket so the next harness request honors
   * the per-socket decision. The request reads `conversation.stream`, not
   * `subscription.stream`, so the two must stay in sync.
   */
  function toggleSubscriptionStream(index: number) {
    const sub = subscriptions.value[index];
    if (!sub) return;
    sub.stream = !sub.stream;

    for (const conversation of conversationStore.conversations) {
      if (
        !isConversationBoundTo(conversation, sub.event, sub.roomId) ||
        conversation.stream === sub.stream
      ) {
        continue;
      }
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

  function mergeSubscriptionsFromSessions() {
    for (const s of conversationStore.conversations) {
      if (s.event) {
        addSubscription(s.event, s.roomId || '');
      }

      for (const sub of s.subscriptions ?? []) {
        addSubscription(sub.event, sub.roomId || '');
      }
    }
  }

  /**
   * Garbage-collect subscriptions: every socket/room that no conversation
   * references anymore (own binding or extra subscription) is closed and
   * removed. The event itself is closed once nothing else still uses it.
   */
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

  return {
    subscriptions,
    isSubscriptionListExpanded,
    availableSocketEvents,
    availableRoomsByEvent,
    conversationNamesByEvent,
    subscribeToEvent,
    toggleSubscriptionActive,
    toggleSubscriptionStream,
    removeSubscription,
    mergeSubscriptionsFromSessions,
    pruneUnreferencedSubscriptions,
    reconnectActiveSubscriptions,
  };
}
