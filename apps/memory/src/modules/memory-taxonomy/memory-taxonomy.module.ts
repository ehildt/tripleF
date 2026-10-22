import { DynamicModule, Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module.js';

import { MemoryTaxonomyController } from './controllers/memory-taxonomy.controller.js';
import { TaxonomyService } from './services/taxonomy.service.js';
import { TaxonomyAdjudicatorService } from './services/taxonomy-adjudicator.service.js';
import { TaxonomyMergeService } from './services/taxonomy-merge.service.js';
import { TaxonomyProbeService } from './services/taxonomy-probe.service.js';
import { TaxonomyReconcileJobService } from './services/taxonomy-reconcile-job.service.js';
import { TaxonomyResolutionService } from './services/taxonomy-resolution.service.js';

/**
 * The taxonomy lane: the label management surface, the probe/merge/resolution
 * services, and the reconciliation sweep job. Exports serve the partition
 * write path, the encyclopedia classify job, and the vectorize processor.
 */
@Module({})
export class MemoryTaxonomyModule {
  private static readonly registration: DynamicModule = {
    module: MemoryTaxonomyModule,
    controllers: [MemoryTaxonomyController],
    exports: [
      TaxonomyService,
      TaxonomyProbeService,
      TaxonomyMergeService,
      TaxonomyResolutionService,
      TaxonomyAdjudicatorService,
      TaxonomyReconcileJobService,
    ],
    imports: [PersistenceModule.register()],
    providers: [
      TaxonomyService,
      TaxonomyProbeService,
      TaxonomyMergeService,
      TaxonomyResolutionService,
      TaxonomyAdjudicatorService,
      TaxonomyReconcileJobService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return MemoryTaxonomyModule.registration;
  }
}
