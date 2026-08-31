import { Global, Module } from '@nestjs/common';

import { EncyclopediaConfigService } from './configs/encyclopedia-config.service.js';
import { ENCYCLOPEDIA_CONFIG } from './constants/encyclopedia.constants.js';
import { EncyclopediaController } from './controllers/encyclopedia.controller.js';
import { EncyclopediaMaintenanceController } from './controllers/encyclopedia-maintenance.controller.js';
import { EncyclopediaSelectService } from './services/encyclopedia-select.service.js';
import { EncyclopediaStoreService } from './services/encyclopedia-store.service.js';

@Global()
@Module({
  controllers: [EncyclopediaController, EncyclopediaMaintenanceController],
  providers: [
    EncyclopediaSelectService,
    EncyclopediaStoreService,
    {
      provide: ENCYCLOPEDIA_CONFIG,
      inject: [EncyclopediaConfigService],
      useFactory: ({ config }: EncyclopediaConfigService) => config,
    },
  ],
  exports: [ENCYCLOPEDIA_CONFIG],
})
export class EncyclopediaModule {}
