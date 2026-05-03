import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExecuteActionService } from '../../actions/execute.action.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

@Injectable()
export class ExecuteStepService implements StepHandler {
  private readonly logger = new Logger(ExecuteStepService.name);

  constructor(
    @Inject(ExecuteActionService)
    private readonly executeAction: ExecuteActionService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent) {
      throw new Error('Missing interpret output — execute cannot run');
    }

    const result = await this.executeAction.execute(ctx, ctx.abortSignal);

    ctx.buffers = result.buffers;
    ctx.processedMeta = result.processedMeta;
    ctx.request.messages = result.messages;
    ctx.outputs.toolResults = result.toolResults;

    if (result.inputTokens || result.outputTokens) {
      ctx.outputs.inputTokens = result.inputTokens;
      ctx.outputs.outputTokens = result.outputTokens;
    }

    this.logger.log('[HARNESS]', {
      step: 'execute',
      requestId: ctx.requestId,
      model: ctx.model,
      imageCount: ctx.buffers.length,
      imageHashes: ctx.processedMeta.map((m) => m.hash),
      toolCount: result.toolResults.length,
      availableImageCount: result.availableImageCount,
      availableVideoCount: result.availableVideoCount,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
  }
}
