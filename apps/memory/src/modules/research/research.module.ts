import { Global, Module } from '@nestjs/common';

import { ResearchConfigService } from './configs/research-config.service.js';
import { RESEARCH_CONFIG } from './constants/research.constants.js';
import { ResearchJobService } from './services/research-job.service.js';
import { ResearchProviderService } from './services/research-provider.service.js';

/**
 * The gap-filling maintenance researcher: env-backed provider config (its own
 * Serper/Bright Data keys, independent of the server) + the job service the
 * vectorize worker dispatches. Global so the qdrant processor can inject the
 * job service without an explicit import chain.
 */
@Global()
@Module({
  providers: [
    ResearchProviderService,
    ResearchJobService,
    {
      provide: RESEARCH_CONFIG,
      inject: [ResearchConfigService],
      useFactory: ({ config }: ResearchConfigService) => config,
    },
  ],
  exports: [RESEARCH_CONFIG, ResearchJobService],
})
export class ResearchModule {}
