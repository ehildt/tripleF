import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { HarnessQueueService } from '../../harness/services/harness-queue.service.js';

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
          socket.emit('cancel_result', {
            requestId,
            success: result,
          });
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

  async emitToRoom(
    roomId: string,
    event: string,
    data: unknown,
  ): Promise<void> {
    const socketIO = this.socketIOService.io;
    if (!socketIO) {
      this.logger.warn('Socket.IO instance not available for emit');
      return;
    }
    this.logger.debug(`[emitToRoom] Emitting event=${event} to room=${roomId}`);
    try {
      socketIO.to(roomId).emit(event, data);
    } catch (err) {
      this.logger.error(`[emitToRoom] Failed to emit to room ${roomId}:`, err);
    }
  }

  async emitToAll(event: string, data: unknown): Promise<void> {
    const socketIO = this.socketIOService.io;
    if (!socketIO) {
      this.logger.warn('Socket.IO instance not available for emit');
      return;
    }
    this.logger.debug(`[emitToAll] Broadcasting event=${event}`);
    try {
      socketIO.emit(event, data);
    } catch (err) {
      this.logger.error(`[emitToAll] Failed to broadcast event ${event}:`, err);
    }
  }
}
