import { DynamicModule, Module } from '@nestjs/common';

import { DeadLetterModule } from '../dead-letter/dead-letter.module.js';

import { ConfigController } from './controllers/config.controller.js';
import { ConversationController } from './controllers/conversation.controller.js';
import { PlaylistController } from './controllers/playlist.controller.js';
import { ConfigRepository } from './services/config.repository.js';
import { ConfigService } from './services/config.service.js';
import { ConversationRepository } from './services/conversation.repository.js';
import { ConversationService } from './services/conversation.service.js';
import { PlaylistRepository } from './services/playlist.repository.js';
import { PlaylistService } from './services/playlist.service.js';
import { ProviderOverridesRepository } from './services/provider-overrides.repository.js';
import { ShownMediaRepository } from './services/shown-media.repository.js';

@Module({})
export class PersistenceModule {
  private static readonly registration: DynamicModule = {
    module: PersistenceModule,
    controllers: [ConversationController, ConfigController, PlaylistController],
    exports: [
      ConversationService,
      ConfigService,
      PlaylistService,
      ProviderOverridesRepository,
      ShownMediaRepository,
    ],
    imports: [DeadLetterModule.register()],
    providers: [
      ConversationRepository,
      ConversationService,
      ConfigRepository,
      ConfigService,
      PlaylistRepository,
      PlaylistService,
      ProviderOverridesRepository,
      ShownMediaRepository,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return PersistenceModule.registration;
  }
}
