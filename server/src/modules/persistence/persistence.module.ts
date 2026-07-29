import { Global, Module } from '@nestjs/common';

import { ConfigController } from './controllers/config.controller.js';
import { ConversationController } from './controllers/conversation.controller.js';
import { ConfigRepository } from './services/config.repository.js';
import { ConfigService } from './services/config.service.js';
import { ConversationRepository } from './services/conversation.repository.js';
import { ConversationService } from './services/conversation.service.js';
import { ProviderOverridesRepository } from './services/provider-overrides.repository.js';

@Global()
@Module({
  controllers: [ConversationController, ConfigController],
  providers: [
    ConversationRepository,
    ConversationService,
    ConfigRepository,
    ConfigService,
    ProviderOverridesRepository,
  ],
  exports: [ConversationService, ConfigService, ProviderOverridesRepository],
})
export class PersistenceModule {}
