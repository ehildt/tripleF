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

export function addSubscription(event: string, roomId: string) {
  const e = event.trim();
  const r = roomId.trim();
  if (!e) return;
  if (!subscriptions.value.some((s) => s.event === e && s.roomId === r)) {
    subscriptions.value.push({
      event: e,
      roomId: r,
      active: true,
      stream: true,
    });
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
