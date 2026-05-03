import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import {
  addSubscription,
  removeSubscriptionByEventRoom,
  subscriptions,
} from './subscriptions.state';

export type { SubscriptionEntry } from './subscriptions.state';

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
      }
      previousSessionCount = newLength;
    },
  );

  // ── Available socket bindings ────────────────────────────
  const availableSocketBindings = computed(() => {
    const pairs = subscriptions.value
      .filter((s) => s.active && s.event)
      .map((s) => (s.roomId ? `${s.event}::${s.roomId}` : s.event));
    if (!pairs.length) {
      // Include current value if any
      return [] as string[];
    }
    return [...new Set(pairs)].sort();
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
  function subscribeToEvent(event: string, roomId: string) {
    const e = event.trim();
    const r = roomId.trim();
    if (!e) return;
    addSubscription(e, r);
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

  function toggleSubscriptionStream(index: number) {
    const sub = subscriptions.value[index];
    if (sub) {
      sub.stream = !sub.stream;
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
    availableSocketBindings,
    conversationNamesByEvent,
    subscribeToEvent,
    toggleSubscriptionActive,
    toggleSubscriptionStream,
    removeSubscription,
    mergeSubscriptionsFromSessions,
    reconnectActiveSubscriptions,
  };
}
