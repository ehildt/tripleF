import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useSocketSubscription } from './use-socket-subscription';

const createProvider = (
  connectedEvents: Set<string> = new Set(),
  connectedRooms: Map<string, Set<string>> = new Map(),
  socketConnected = true,
) => ({
  connectedEvents,
  connectedRooms,
  getSocket: vi.fn().mockReturnValue({ connected: socketConnected }),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
});

describe('useSocketSubscription', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('connect subscribes to an event', async () => {
    const provider = createProvider();
    const { connect } = useSocketSubscription(provider as any);
    await connect('harness');
    expect(provider.listenToEvent).toHaveBeenCalledWith('harness');
  });

  it('connect joins a room', async () => {
    const provider = createProvider();
    const { connect } = useSocketSubscription(provider as any);
    await connect('harness', 'room1');
    expect(provider.joinRoom).toHaveBeenCalledWith('room1', 'harness');
  });

  it('connect does nothing for empty event', async () => {
    const provider = createProvider();
    const { connect } = useSocketSubscription(provider as any);
    await connect('  ');
    expect(provider.listenToEvent).not.toHaveBeenCalled();
  });

  it('isEventConnected reflects provider state', () => {
    const provider = createProvider(new Set(['harness']));
    const { isEventConnected } = useSocketSubscription(provider as any);
    expect(isEventConnected('harness')).toBe(true);
    expect(isEventConnected('other')).toBe(false);
  });

  it('isRoomConnected reflects provider state', () => {
    const rooms = new Map<string, Set<string>>();
    rooms.set('harness', new Set(['room1']));
    const provider = createProvider(new Set(), rooms);
    const { isRoomConnected } = useSocketSubscription(provider as any);
    expect(isRoomConnected('harness', 'room1')).toBe(true);
    expect(isRoomConnected('harness', 'room2')).toBe(false);
  });

  describe('isSubscribeDisabled', () => {
    it('returns true when no options', () => {
      const provider = createProvider();
      const { isSubscribeDisabled } = useSocketSubscription(provider as any);
      expect(isSubscribeDisabled.value).toBe(true);
    });

    it('returns false when not connected and event filled', () => {
      const provider = createProvider();
      const eventRef = ref('harness');
      const { isSubscribeDisabled } = useSocketSubscription(provider as any, {
        event: eventRef,
        roomId: ref(''),
      });
      expect(isSubscribeDisabled.value).toBe(false);
    });

    it('returns true when event connected and no room', () => {
      const provider = createProvider(new Set(['harness']));
      const eventRef = ref('harness');
      const { isSubscribeDisabled } = useSocketSubscription(provider as any, {
        event: eventRef,
        roomId: ref(''),
      });
      expect(isSubscribeDisabled.value).toBe(true);
    });

    it('returns true when event and room already connected', () => {
      const rooms = new Map<string, Set<string>>();
      rooms.set('harness', new Set(['room1']));
      const provider = createProvider(new Set(['harness']), rooms);
      const eventRef = ref('harness');
      const { isSubscribeDisabled } = useSocketSubscription(provider as any, {
        event: eventRef,
        roomId: ref('room1'),
      });
      expect(isSubscribeDisabled.value).toBe(true);
    });
  });

  describe('buttonBlinking', () => {
    it('returns false when no options', () => {
      const provider = createProvider();
      const { buttonBlinking } = useSocketSubscription(provider as any);
      expect(buttonBlinking.value).toBe(false);
    });

    it('returns true when connectButtonBlinking', () => {
      const provider = createProvider();
      const { buttonBlinking } = useSocketSubscription(provider as any, {
        connectButtonBlinking: ref(true),
      });
      expect(buttonBlinking.value).toBe(true);
    });
  });
});
