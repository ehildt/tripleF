import type { UploadedImage } from '@/stores/conversation';
import type { SocketProvider } from '@/types/socket-provider.model';

export interface UseSubmitOptions {
  socketProvider: SocketProvider;
  isEventConnected: (eventName: string) => boolean;
  isRoomConnected: (eventName: string, roomName: string) => boolean;
}

export type SendRequestOptions = {
  model: string;
  requestId: string;
  sid: string;
  room: string;
  event: string;
  params: URLSearchParams;
  formData: FormData;
  socket: ReturnType<SocketProvider['getSocket']>;
  referencedImages: UploadedImage[];
  conversationId: string;
};
