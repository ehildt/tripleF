import { Global, Module } from '@nestjs/common';

import { ConfigController } from './controllers/config.controller.js';
import { ConversationController } from './controllers/conversation.controller.js';
import { PlaylistController } from './controllers/playlist.controller.js';
import { ConfigRepository } from './services/config.repository.js';
import { ConfigService } from './services/config.service.js';
import { ConversationRepository } from './services/conversation.repository.js';
import { ConversationService } from './services/conversation.service.js';
import { MemoryCognitionProfileRepository } from './services/memory-cognition-profile.repository.js';
import { PlaylistRepository } from './services/playlist.repository.js';
import { PlaylistService } from './services/playlist.service.js';
import { ProviderOverridesRepository } from './services/provider-overrides.repository.js';
import { ShownMediaRepository } from './services/shown-media.repository.js';

@Global()
@Module({
  controllers: [ConversationController, ConfigController, PlaylistController],
  providers: [
    ConversationRepository,
    ConversationService,
    ConfigRepository,
    ConfigService,
    MemoryCognitionProfileRepository,
    PlaylistRepository,
    PlaylistService,
    ProviderOverridesRepository,
    ShownMediaRepository,
  ],
  exports: [
    ConversationService,
    ConfigService,
    MemoryCognitionProfileRepository,
    PlaylistService,
    ProviderOverridesRepository,
    ShownMediaRepository,
  ],
})
export class PersistenceModule {}
