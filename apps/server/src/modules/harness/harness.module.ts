import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { PdfModule } from '@triplef/pdf';

import { MemoryClientModule } from '../memory-client/memory-client.module.js';
import { MinioModule } from '../minio/minio.module.js';
import { OllamaModule } from '../ollama/ollama.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ProviderOverridesModule } from '../provider-overrides/provider-overrides.module.js';
import { SharpModule } from '../sharp/sharp.module.js';
import { StockDataModule } from '../stock-data/stock-data.module.js';

import { ExecuteActionService } from './actions/execute.action.js';
import { InterpretActionService } from './actions/interpret.action.js';
import { RespondActionService } from './actions/respond.action.js';
import { SanitizeActionService } from './actions/sanitize.action.js';
import { NumCtxConfigService } from './configs/numctx-config.service.js';
import { SourceBudgetConfigService } from './configs/source-budget-config.service.js';
import { HarnessController } from './controllers/harness.controller.js';
import { CloudImageIngestionService } from './services/cloud-image-ingestion.service.js';
import { DocumentConversionService } from './services/document-conversion.service.js';
import { HarnessCancellationService } from './services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from './services/harness-chat-streaming.service.js';
import { HarnessContextService } from './services/harness-context.service.js';
import { HarnessQueueService } from './services/harness-queue.service.js';
import { HarnessStepEngineService } from './services/harness-step-engine.service.js';
import { MediaUrlValidatorService } from './services/media-url-validator.service.js';
import { PdfPageDescribeService } from './services/pdf-page-describe.service.js';
import { ResponseValidatorService } from './services/response-validator.service.js';
import { ShownMediaService } from './services/shown-media.service.js';
import { StepRegistryService } from './services/step-registry.service.js';
import { ExecuteStepService } from './services/steps/execute-step.service.js';
import { InterpretStepService } from './services/steps/interpret-step.service.js';
import { MemoryProfileStepService } from './services/steps/memory-profile-step.service.js';
import { RespondStepService } from './services/steps/respond-step.service.js';
import { SanitizeStepService } from './services/steps/sanitize-step.service.js';
import { VectorizeStepService } from './services/steps/vectorize-step.service.js';
import { ToolSelectionService } from './services/tool-selection.service.js';

@Module({})
export class HarnessModule {
  private static readonly registration: DynamicModule = {
    module: HarnessModule,
    controllers: [HarnessController],
    exports: [
      NumCtxConfigService,
      SourceBudgetConfigService,
      DocumentConversionService,
      PdfPageDescribeService,
      HarnessCancellationService,
      HarnessChatStreamingService,
      HarnessContextService,
      HarnessQueueService,
      HarnessStepEngineService,
      StepRegistryService,
      InterpretStepService,
      InterpretActionService,
      ExecuteStepService,
      ExecuteActionService,
      SanitizeStepService,
      SanitizeActionService,
      RespondStepService,
      RespondActionService,
      MemoryProfileStepService,
      VectorizeStepService,
      ResponseValidatorService,
      MediaUrlValidatorService,
      CloudImageIngestionService,
      ShownMediaService,
      ToolSelectionService,
    ],
    imports: [
      HttpModule,
      PdfModule.registerAsync({ global: true }),
      MemoryClientModule.register(),
      MinioModule.register(),
      OllamaModule.register(),
      PersistenceModule.register(),
      ProviderOverridesModule.register(),
      SharpModule.register(),
      StockDataModule.register(),
    ],
    providers: [
      NumCtxConfigService,
      SourceBudgetConfigService,
      DocumentConversionService,
      PdfPageDescribeService,
      HarnessCancellationService,
      HarnessChatStreamingService,
      HarnessContextService,
      HarnessQueueService,
      HarnessStepEngineService,
      StepRegistryService,
      InterpretStepService,
      InterpretActionService,
      ExecuteStepService,
      ExecuteActionService,
      SanitizeStepService,
      SanitizeActionService,
      RespondStepService,
      RespondActionService,
      MemoryProfileStepService,
      VectorizeStepService,
      ResponseValidatorService,
      MediaUrlValidatorService,
      CloudImageIngestionService,
      ShownMediaService,
      ToolSelectionService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return HarnessModule.registration;
  }
}
