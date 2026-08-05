import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { ExecuteActionService } from '../../actions/execute.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import type { ToolExecutionEvent } from '../../helpers/execute/wrap-tools-with-execution-events.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

@Injectable()
export class ExecuteStepService implements StepHandler {
  constructor(
    private readonly executeAction: ExecuteActionService,
    private readonly io: SocketIOService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent) {
      throw new Error('Missing interpret output — execute cannot run');
    }

    const status = this.resolveExecuteStatus(ctx);
    if (status) await this.emitStatus(ctx, status);

    const result = await this.executeAction.execute(
      ctx,
      ctx.abortSignal,
      (event) => void this.emitToolEvent(ctx, event),
    );

    ctx.buffers = result.buffers;
    ctx.processedMeta = result.processedMeta;
    ctx.outputs.toolResults = result.toolResults;

    if (result.inputTokens || result.outputTokens) {
      ctx.outputs.inputTokens = result.inputTokens;
      ctx.outputs.outputTokens = result.outputTokens;
    }

    this.stepLogger.log(ctx, 'execute', 'tools executed', {
      model: ctx.model,
      imageCount: ctx.buffers.length,
      imageHashes: ctx.processedMeta.map((m) => m.hash),
      toolCount: result.toolResults.length,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
  }

  /**
   * Only announce what this step will actually do: searching when tools are
   * selected, image analysis when images are attached, nothing otherwise — a
   * status like "Searching the web" on a tool-less chat is misleading.
   */
  private resolveExecuteStatus(ctx: HarnessContext): string | undefined {
    const hasTools = (ctx.outputs.intent?.tools ?? []).length > 0;
    if (hasTools) return 'Searching the web and fetching media…';
    if (ctx.buffers.length > 0 || ctx.processedMeta.length > 0)
      return 'Analyzing your images…';
    return undefined;
  }

  private async emitToolEvent(
    ctx: HarnessContext,
    event: ToolExecutionEvent,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      toolCall: {
        name: event.name,
        category: event.category,
        query: event.query,
        input: event.input,
        status: event.status,
      },
      done: false,
    });
  }

  private async emitStatus(
    ctx: HarnessContext,
    message: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      status: message,
      done: false,
    });
  }
}
