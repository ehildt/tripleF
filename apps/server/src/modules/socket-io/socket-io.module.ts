import { DynamicModule, Module } from '@nestjs/common';
import { SocketIOModule as SocketIOCoreModule } from '@triplef/socketio';

import { HarnessModule } from '../harness/harness.module.js';

import { SocketIOConfigService } from './configs/socket-io-config.service.js';
import { SocketIOEventsService } from './services/socket-io-events.service.js';

/**
 * Realtime bus: the Socket.IO server (registered globally so every domain
 * service can emit) plus the connection/room lifecycle handlers, which
 * depend on the harness queue for client-driven room membership.
 */
@Module({})
export class SocketIOModule {
  private static readonly registration: DynamicModule = {
    module: SocketIOModule,
    exports: [SocketIOConfigService, SocketIOEventsService],
    imports: [
      HarnessModule.register(),
      SocketIOCoreModule.registerAsync({
        global: true,
        inject: [SocketIOConfigService],
        useFactory: async ({ config }: SocketIOConfigService) => config,
      }),
    ],
    providers: [SocketIOConfigService, SocketIOEventsService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return SocketIOModule.registration;
  }
}
