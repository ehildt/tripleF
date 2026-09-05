import { Global, Module } from '@nestjs/common';

import { MemoryCognitionController } from './controllers/memory-cognition.controller.js';
import { MemoryCognitionMaintenanceController } from './controllers/memory-cognition-maintenance.controller.js';
import { MemoryCognitionService } from './services/memory-cognition.service.js';
import { MemoryConvictionService } from './services/memory-conviction.service.js';
import { MemoryProfileJobService } from './services/memory-profile-job.service.js';

/**
 * The cognition lane: the profile snapshot/insight/conviction read-write
 * surface, the profile + conviction-synthesis jobs, and the cognition service.
 * Global so the partition lane's write job and the vectorize processor can
 * inject these without importing this module.
 */
@Global()
@Module({
  controllers: [
    MemoryCognitionController,
    MemoryCognitionMaintenanceController,
  ],
  providers: [
    MemoryCognitionService,
    MemoryProfileJobService,
    MemoryConvictionService,
  ],
  exports: [
    MemoryCognitionService,
    MemoryProfileJobService,
    MemoryConvictionService,
  ],
})
export class MemoryCognitionModule {}
