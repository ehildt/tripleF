import { Global, Module } from '@nestjs/common';

import { MemoryTaxonomyController } from './controllers/memory-taxonomy.controller.js';
import { TaxonomyService } from './services/taxonomy.service.js';
import { TaxonomyAdjudicatorService } from './services/taxonomy-adjudicator.service.js';
import { TaxonomyMergeService } from './services/taxonomy-merge.service.js';
import { TaxonomyProbeService } from './services/taxonomy-probe.service.js';
import { TaxonomyReconcileJobService } from './services/taxonomy-reconcile-job.service.js';
import { TaxonomyResolutionService } from './services/taxonomy-resolution.service.js';

/**
 * The taxonomy lane: the label management surface, the probe/merge/resolution
 * services, and the reconciliation sweep job. Global so the partition write
 * job, the encyclopedia classify job, and the vectorize processor can inject
 * these without importing this module.
 */
@Global()
@Module({
  controllers: [MemoryTaxonomyController],
  providers: [
    TaxonomyService,
    TaxonomyProbeService,
    TaxonomyMergeService,
    TaxonomyResolutionService,
    TaxonomyAdjudicatorService,
    TaxonomyReconcileJobService,
  ],
  exports: [
    TaxonomyService,
    TaxonomyProbeService,
    TaxonomyMergeService,
    TaxonomyResolutionService,
    TaxonomyAdjudicatorService,
    TaxonomyReconcileJobService,
  ],
})
export class MemoryTaxonomyModule {}
