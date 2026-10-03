import type { Ref } from 'vue';

import type { SocketProvider } from '@/types/socket-provider.model';

export interface UseSubmitOptions {
  socketProvider: SocketProvider;
  isEventConnected: (eventName: string) => boolean;
  isRoomConnected: (eventName: string, roomName: string) => boolean;
  /** The prompt text to submit; consumed and cleared during a submit. */
  promptDraft: Ref<string>;
  /** Clears the prompt draft and persists the empty value. */
  resetPromptDraft: () => void;
}
