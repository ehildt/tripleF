import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

import { AiSdkModule } from '../ai-sdk/ai-sdk.module.js';
import { ToolSelectionService } from '../ai-sdk/services/tool-selection.service.js';
import { LifecycleService } from '../dead-letter/services/lifecycle.service.js';
import { SharpModule } from '../sharp/sharp.module.js';

import { ExecuteActionService } from './actions/execute.action.js';
import { InterpretActionService } from './actions/interpret.action.js';
import { RespondActionService } from './actions/respond.action.js';
import { HarnessCancellationService } from './services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from './services/harness-chat-streaming.service.js';
import { HarnessCompactService } from './services/harness-compact.service.js';
import { HarnessContextService } from './services/harness-context.service.js';
import { HarnessQueueService } from './services/harness-queue.service.js';
import { HarnessStepEngineService } from './services/harness-step-engine.service.js';
import { MediaUrlValidatorService } from './services/media-url-validator.service.js';
import { StepRegistryService } from './services/step-registry.service.js';
import { ExecuteStepService } from './services/steps/execute-step.service.js';
import { InterpretStepService } from './services/steps/interpret-step.service.js';
import { RespondStepService } from './services/steps/respond-step.service.js';

@Global()
@Module({
  imports: [AiSdkModule, SharpModule, HttpModule],
  providers: [
    HarnessCancellationService,
    HarnessChatStreamingService,
    HarnessCompactService,
    HarnessContextService,
    HarnessQueueService,
    HarnessStepEngineService,
    StepRegistryService,
    InterpretStepService,
    InterpretActionService,
    ExecuteStepService,
    ExecuteActionService,
    RespondStepService,
    RespondActionService,
    MediaUrlValidatorService,
    ToolSelectionService,
    LifecycleService,
  ],
  exports: [
    HarnessCancellationService,
    HarnessChatStreamingService,
    HarnessCompactService,
    HarnessContextService,
    HarnessQueueService,
    HarnessStepEngineService,
    StepRegistryService,
    InterpretStepService,
    InterpretActionService,
    ExecuteStepService,
    ExecuteActionService,
    RespondStepService,
    RespondActionService,
    MediaUrlValidatorService,
    ToolSelectionService,
    LifecycleService,
  ],
})
export class HarnessModule {}
