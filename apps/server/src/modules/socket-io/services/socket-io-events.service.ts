import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import { HARNESS_EVENT_TYPES } from '../../harness/helpers/emit-harness-event.helper.js';
import { HarnessQueueService } from '../../harness/services/harness-queue.service.js';
import { buildSocketEvent } from '../helpers/build-socket-event.helper.js';

@Injectable()
export class SocketIOEventsService implements OnModuleInit {
  private readonly logger = new Logger(SocketIOEventsService.name);

  constructor(
    private readonly socketIOService: SocketIOService,
    private readonly harnessQueueService: HarnessQueueService,
  ) {}

  onModuleInit() {
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    const socketIO = this.socketIOService.io;
    if (!socketIO) {
      this.logger.warn('Socket.IO instance not available');
      return;
    }

    socketIO.on('connection', (socket) => {
      this.logger.debug(`Client connected: ${socket.id}`);

      socket.on('join', async (roomId: string) => {
        try {
          await socket.join(roomId);
          this.logger.debug(
            `Socket ${socket.id} joined room: ${roomId} (${
              socketIO.sockets.adapter.rooms.get(roomId)?.size || 0
            } clients)`,
          );
        } catch (err) {
          this.logger.error(`Socket join failed for room ${roomId}:`, err);
        }
      });

      socket.on('leave', async (roomId: string) => {
        try {
          await socket.leave(roomId);
          this.logger.debug(`Socket ${socket.id} left room: ${roomId}`);
        } catch (err) {
          this.logger.error(`Socket leave failed for room ${roomId}:`, err);
        }
      });

      socket.on('cancel', async (requestId: string) => {
        this.logger.log(
          `Socket ${socket.id} requested cancel for: ${requestId}`,
        );
        try {
          const result = await this.harnessQueueService.cancel(requestId);
          // The ack goes back on the original 'cancel_result' channel, now
          // carrying a v1 reply envelope whose type is 'harness:cancelled'.
          socket.emit(
            'cancel_result',
            buildSocketEvent(
              HARNESS_EVENT_TYPES.cancelled,
              { success: result },
              { kind: 'reply', meta: { requestId } },
            ),
          );
        } catch (err) {
          this.logger.error(`Socket cancel failed for ${requestId}:`, err);
        }
      });

      socket.on('disconnect', (reason) => {
        this.logger.debug(
          `Client disconnected: ${socket.id}, reason: ${reason}`,
        );
      });
    });
  }
}
