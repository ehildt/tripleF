import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

import { AiSdkModule } from '../ai-sdk/ai-sdk.module.js';
import { ToolSelectionService } from '../ai-sdk/services/tool-selection.service.js';
import { LifecycleService } from '../dead-letter/services/lifecycle.service.js';
import { SharpModule } from '../sharp/sharp.module.js';
import { StockDataModule } from '../stock-data/stock-data.module.js';

import { ExecuteActionService } from './actions/execute.action.js';
import { InterpretActionService } from './actions/interpret.action.js';
import { RespondActionService } from './actions/respond.action.js';
import { SanitizeActionService } from './actions/sanitize.action.js';
import { NumCtxConfigService } from './configs/numctx-config.service.js';
import { CloudImageIngestionService } from './services/cloud-image-ingestion.service.js';
import { HarnessCancellationService } from './services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from './services/harness-chat-streaming.service.js';
import { HarnessContextService } from './services/harness-context.service.js';
import { HarnessQueueService } from './services/harness-queue.service.js';
import { HarnessStepEngineService } from './services/harness-step-engine.service.js';
import { MediaUrlValidatorService } from './services/media-url-validator.service.js';
import { ResponseValidatorService } from './services/response-validator.service.js';
import { ShownMediaService } from './services/shown-media.service.js';
import { StepRegistryService } from './services/step-registry.service.js';
import { ExecuteStepService } from './services/steps/execute-step.service.js';
import { InterpretStepService } from './services/steps/interpret-step.service.js';
import { MemoryProfileStepService } from './services/steps/memory-profile-step.service.js';
import { MemoryWriteStepService } from './services/steps/memory-write-step.service.js';
import { RespondStepService } from './services/steps/respond-step.service.js';
import { SanitizeStepService } from './services/steps/sanitize-step.service.js';
import { VectorizeStepService } from './services/steps/vectorize-step.service.js';

@Global()
@Module({
  imports: [AiSdkModule, SharpModule, HttpModule, StockDataModule],
  providers: [
    NumCtxConfigService,
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
    MemoryWriteStepService,
    MemoryProfileStepService,
    VectorizeStepService,
    ResponseValidatorService,
    MediaUrlValidatorService,
    CloudImageIngestionService,
    ShownMediaService,
    ToolSelectionService,
    LifecycleService,
  ],
  exports: [
    NumCtxConfigService,
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
    MemoryWriteStepService,
    MemoryProfileStepService,
    VectorizeStepService,
    ResponseValidatorService,
    MediaUrlValidatorService,
    CloudImageIngestionService,
    ShownMediaService,
    ToolSelectionService,
    LifecycleService,
  ],
})
export class HarnessModule {}
