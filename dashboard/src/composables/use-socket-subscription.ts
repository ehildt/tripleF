import pWaitFor from 'p-wait-for';
import { computed, type Ref } from 'vue';

import { i18n } from '@/i18n/i18n';

import type { ConnectionState } from '../stores/socket';
import type { SocketProvider } from '../types/socket-provider.model';
import { useBlink } from './use-blink';
import { useToast } from './use-toast';

/**
 * Unified socket subscription composable.
 * Combines connection logic (connect, blinking, helpers) with subscription
 * button state (disabled, blinking) needed by SocketSubscriber.vue.
 */
export function useSocketSubscription(
  socketProvider: SocketProvider,
  options?: {
    event?: Ref<string>;
    roomId?: Ref<string>;
    connectButtonBlinking?: Ref<boolean>;
    eventFieldBlinking?: Ref<boolean>;
    connectionState?: Ref<ConnectionState>;
  },
) {
  const toast = useToast();
  const connectButton = useBlink(1500);
  const eventField = useBlink(1500);

  function isEventConnected(eventName: string): boolean {
    return socketProvider.connectedEvents.has(eventName);
  }

  function isRoomConnected(eventName: string, roomName: string): boolean {
    const rooms = socketProvider.connectedRooms.get(eventName);
    return rooms ? rooms.has(roomName) : false;
  }

  async function connect(eventName: string, room?: string) {
    eventName = eventName.trim();
    const roomName = room?.trim();
    if (!eventName) return;

    const socket = socketProvider.getSocket();
    if (!socket?.connected) {
      try {
        await pWaitFor(() => socket?.connected === true, { timeout: 500 });
      } catch {
        toast.error(i18n.global.t('toast.socketNotConnected'));
        return;
      }
    }

    if (!isEventConnected(eventName)) {
      socketProvider.listenToEvent?.(eventName);
      toast.debug(`Subscribed to event: ${eventName}`);
    }

    if (roomName && !isRoomConnected(eventName, roomName)) {
      socketProvider.joinRoom?.(roomName, eventName);
      toast.debug(`Joined room: ${roomName}`);
    }
  }

  // --- Computed subscription button state (for SocketSubscriber.vue) ---
  const isSubscribeDisabled = computed(() => {
    if (!options) return true;

    // Don't disable while blinking (visual feedback)
    if (options.connectButtonBlinking?.value) return false;

    if (!options.event?.value.trim()) return true;

    const eventConnected = isEventConnected(options.event.value.trim());
    if (!eventConnected) return false;

    const roomTrimmed = options.roomId?.value.trim() ?? '';
    if (roomTrimmed) {
      return isRoomConnected(options.event.value.trim(), roomTrimmed);
    }

    return true;
  });

  const buttonBlinking = computed(() => {
    if (!options) return false;
    return (
      options.connectButtonBlinking?.value ||
      (isSubscribeDisabled.value &&
        (options.eventFieldBlinking?.value ?? false))
    );
  });

  return {
    // Connection & blinking
    connectButtonBlinking: connectButton.isBlinking,
    eventFieldBlinking: eventField.isBlinking,
    triggerConnectButtonBlink: connectButton.blink,
    triggerEventFieldBlink: eventField.blink,
    startConnectButtonBlink: connectButton.start,
    stopConnectButtonBlink: connectButton.stop,
    startEventFieldBlink: eventField.start,
    stopEventFieldBlink: eventField.stop,
    connect,
    isEventConnected,
    isRoomConnected,

    // Subscription button state
    isSubscribeDisabled,
    buttonBlinking,
  };
}
