import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { AnalyzeImageService } from './analyze-image.service.js';

@Injectable()
export class SocketService implements OnModuleInit {
  private readonly logger = new Logger(SocketService.name);

  constructor(
    private readonly socketIOService: SocketIOService,
    private readonly analyzeImageService: AnalyzeImageService,
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
      this.logger.log(`Client connected: ${socket.id}`);

      socket.on('join', async (roomId: string) => {
        try {
          await socket.join(roomId);
          this.logger.log(`Socket ${socket.id} joined room: ${roomId}`);
          this.logger.log(
            `[join] Room ${roomId} now has ${
              socketIO.sockets.adapter.rooms.get(roomId)?.size || 0
            } clients`,
          );
        } catch (err) {
          this.logger.error(`Socket join failed for room ${roomId}:`, err);
        }
      });

      socket.on('leave', async (roomId: string) => {
        try {
          await socket.leave(roomId);
          this.logger.log(`Socket ${socket.id} left room: ${roomId}`);
        } catch (err) {
          this.logger.error(`Socket leave failed for room ${roomId}:`, err);
        }
      });

      socket.on('cancel', async (requestId: string) => {
        this.logger.log(
          `Socket ${socket.id} requested cancel for: ${requestId}`,
        );
        try {
          const result = await this.analyzeImageService.cancel(requestId);
          socket.emit('cancel_result', {
            requestId,
            success: result,
          });
        } catch (err) {
          this.logger.error(`Socket cancel failed for ${requestId}:`, err);
        }
      });

      socket.on('disconnect', (reason) => {
        this.logger.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
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
    this.logger.log(`[emitToRoom] Emitting event=${event} to room=${roomId}`);
    try {
      socketIO.to(roomId).emit(event, data);
      this.logger.log(`[emitToRoom] Emitted successfully`);
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
    this.logger.log(`[emitToAll] Broadcasting event=${event}`);
    try {
      socketIO.emit(event, data);
      this.logger.log(`[emitToAll] Broadcasted successfully`);
    } catch (err) {
      this.logger.error(`[emitToAll] Failed to broadcast event ${event}:`, err);
    }
  }
}
