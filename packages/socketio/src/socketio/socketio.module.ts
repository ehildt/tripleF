import { DynamicModule, Module } from '@nestjs/common';

import { SOCKET_IO_CONFIG } from './socketio.constants.ts';
import { INestApplicationExtended, SocketIOModuleProps } from './socketio.model.ts';
import { SocketIOService } from './socketio.service.ts';

@Module({})
export class SocketIOModule {
  /**
   * Attaches Socket.IO to the NestJS application.
   * Auto-detects Fastify or Express adapter.
   * @see https://github.com/ehildt/tripleF/wiki/socket-io.module
   * @param app - NestJS application instance
   * @param fsio - Optional explicit fastify-socket.io adapter for fallback
   */
  static async attach(app: INestApplicationExtended, fsio?: unknown) {
    const service = app.get(SocketIOService);
    const adapter = app.getHttpAdapter();
    const instance = adapter.getInstance();

    const isFastify = instance && typeof instance.register === 'function';

    if (isFastify) {
      const FSIO = (await import('fastify-socket.io')).default;
      await app.register(FSIO, service.config.opts);
      service.io = instance.io;
      return;
    }

    const isExpress = instance && typeof instance.listen === 'function';

    if (isExpress) {
      const httpServer = app.getHttpServer();
      const { Server } = await import('socket.io');
      service.io = new Server(httpServer, service.config.opts);
      return;
    }

    if (fsio) {
      await app.register(fsio, service.config.opts);
      const fastifyInstance = adapter.getInstance();
      service.io = fastifyInstance.io;
      return;
    }

    throw new Error(
      'Could not detect Fastify or Express adapter. ' + 'Please open an issue at https://github.com/ehildt/tripleF',
    );
  }

  /**
   * Creates a dynamic SocketIOModule with async configuration.
   * @see https://github.com/ehildt/tripleF/wiki/socket-io.module
   * @param options - Module configuration options
   */
  static registerAsync(options: SocketIOModuleProps): DynamicModule {
    return {
      module: SocketIOModule,
      global: options.global,
      exports: [SocketIOService],
      providers: [
        SocketIOService,
        {
          inject: options.inject,
          provide: SOCKET_IO_CONFIG,
          useFactory: options.useFactory,
        },
      ],
    };
  }
}
