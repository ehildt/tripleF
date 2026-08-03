import { ref, watch } from 'vue';

export interface SubscriptionEntry {
  event: string;
  roomId: string;
  active: boolean;
  stream: boolean;
}

const LOCAL_STORAGE_SUBSCRIPTIONS_KEY = 'harness-subscriptions';

function loadSubscriptions(): SubscriptionEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBSCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const subscriptions = ref<SubscriptionEntry[]>(loadSubscriptions());

watch(
  subscriptions,
  () => {
    localStorage.setItem(
      LOCAL_STORAGE_SUBSCRIPTIONS_KEY,
      JSON.stringify(subscriptions.value),
    );
  },
  { deep: true },
);

export function addSubscription(
  event: string,
  roomId: string,
  stream: boolean = true,
) {
  const e = event.trim();
  const r = roomId.trim();
  if (!e) return;
  if (!subscriptions.value.some((s) => s.event === e && s.roomId === r)) {
    subscriptions.value.push({
      event: e,
      roomId: r,
      active: true,
      stream,
    });
  }
}

/**
 * Align every subscription entry for a socket to the given stream mode.
 * `subscription.stream` is the per-socket copy of the setting that the
 * harness request actually honors (via the bound conversation's `stream`),
 * so each entry point must keep the two in sync.
 */
export function syncSubscriptionStream(
  event: string,
  roomId: string,
  stream: boolean,
): void {
  for (const sub of subscriptions.value) {
    if (sub.event === event && sub.roomId === roomId && sub.stream !== stream) {
      sub.stream = stream;
    }
  }
}

export function removeSubscriptionByEventRoom(event: string, roomId: string) {
  const index = subscriptions.value.findIndex(
    (s) => s.event === event && s.roomId === roomId,
  );
  if (index !== -1) {
    subscriptions.value.splice(index, 1);
  }
}
