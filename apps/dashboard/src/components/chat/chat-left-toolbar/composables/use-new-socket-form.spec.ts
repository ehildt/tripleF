import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNewSocketForm } from './use-new-socket-form';

const subscribeToEvent = vi.hoisted(() => vi.fn());

vi.mock('./use-socket-subscriptions', () => ({
  useSocketSubscriptions: () => ({ subscribeToEvent }),
}));

describe('useNewSocketForm', () => {
  beforeEach(() => {
    subscribeToEvent.mockClear();
  });

  it('subscribes from the draft values and clears the form', () => {
    const {
      newSubscriptionEvent,
      newSubscriptionRoomId,
      newSubscriptionStreamEnabled,
      submitNewSocket,
    } = useNewSocketForm();

    newSubscriptionEvent.value = 'e';
    newSubscriptionRoomId.value = 'r';
    newSubscriptionStreamEnabled.value = false;

    submitNewSocket();

    expect(subscribeToEvent).toHaveBeenCalledWith('e', 'r', false);
    expect(newSubscriptionEvent.value).toBe('');
    expect(newSubscriptionRoomId.value).toBe('');
    expect(newSubscriptionStreamEnabled.value).toBe(true);
  });

  it('resets the stream toggle to enabled after submitting', () => {
    const { newSubscriptionStreamEnabled, submitNewSocket } =
      useNewSocketForm();
    newSubscriptionStreamEnabled.value = false;
    submitNewSocket();
    expect(newSubscriptionStreamEnabled.value).toBe(true);
  });
});
