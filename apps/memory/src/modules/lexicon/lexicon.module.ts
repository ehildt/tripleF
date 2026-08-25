import { Module } from '@nestjs/common';

import { LexiconConfigService } from './configs/lexicon-config.service.js';
import { LEXICON_CONFIG } from './constants/lexicon.constants.js';
import { LexiconController } from './controllers/lexicon.controller.js';
import { LexiconSelectService } from './services/lexicon-select.service.js';
import { LexiconStoreService } from './services/lexicon-store.service.js';

@Module({
  controllers: [LexiconController],
  providers: [
    LexiconSelectService,
    LexiconStoreService,
    {
      provide: LEXICON_CONFIG,
      inject: [LexiconConfigService],
      useFactory: ({ config }: LexiconConfigService) => config,
    },
  ],
})
export class LexiconModule {}
