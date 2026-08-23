import { SocketIOService } from '@ehildt/nestjs-socket.io';

export async function emitToSocket(
  io: SocketIOService,
  roomId: string | undefined,
  event: string | undefined,
  data: unknown,
): Promise<void> {
  const socketEvent = event ?? 'harness';
  try {
    const payload = { event: socketEvent, ...(data as object) };
    if (roomId) io.emitTo(socketEvent, roomId, payload);
    else io.emit(socketEvent, payload);
  } catch {
    // intentional
  }
}
