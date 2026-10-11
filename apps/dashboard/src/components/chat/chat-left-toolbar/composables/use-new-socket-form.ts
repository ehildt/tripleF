import { ref } from 'vue';

import { useSocketSubscriptions } from './use-socket-subscriptions';

/**
 * The sockets menu's creation draft: the event, room, and stream-mode fields
 * for the socket being created. Module-scope on purpose so the draft survives
 * menu open/close and is shared across the component trees that read it (like
 * `useLeftToolbarView`).
 */
const newSubscriptionEvent = ref('');
const newSubscriptionRoomId = ref('');
const newSubscriptionStreamEnabled = ref(true);

export function useNewSocketForm() {
  const { subscribeToEvent } = useSocketSubscriptions();

  /** Subscribe from the draft values, then clear the form for the next
   *  socket instead of lingering on the one just created. */
  function submitNewSocket() {
    subscribeToEvent(
      newSubscriptionEvent.value,
      newSubscriptionRoomId.value,
      newSubscriptionStreamEnabled.value,
    );
    newSubscriptionEvent.value = '';
    newSubscriptionRoomId.value = '';
    newSubscriptionStreamEnabled.value = true;
  }

  return {
    newSubscriptionEvent,
    newSubscriptionRoomId,
    newSubscriptionStreamEnabled,
    submitNewSocket,
  };
}
