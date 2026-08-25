import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable, Logger } from '@nestjs/common';

import { ExecuteActionService } from '../../actions/execute.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import type { ToolExecutionEvent } from '../../helpers/execute/wrap-tools-with-execution-events.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

@Injectable()
export class ExecuteStepService implements StepHandler {
  private readonly logger = new Logger(ExecuteStepService.name);

  constructor(
    private readonly executeAction: ExecuteActionService,
    private readonly io: SocketIOService,
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
      (toolName, chartData) =>
        void this.emitChartData(ctx, toolName, chartData),
    );

    ctx.buffers = result.buffers;
    ctx.processedMeta = result.processedMeta;
    ctx.outputs.toolResults = result.toolResults;

    if (result.inputTokens || result.outputTokens) {
      ctx.outputs.inputTokens = result.inputTokens;
      ctx.outputs.outputTokens = result.outputTokens;
    }

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'execute',
        model: ctx.model,
        imageCount: ctx.buffers.length,
        imageHashes: ctx.processedMeta.map((m) => m.hash),
        toolCount: result.toolResults.length,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
      'tools executed',
    );
  }

  /**
   * Only announce what this step will actually do: searching when tools are
   * selected, image analysis when images are attached, nothing otherwise — a
   * status like "Searching the web" on a tool-less chat is misleading.
   */
  private resolveExecuteStatus(ctx: HarnessContext): string | undefined {
    const hasTools = (ctx.outputs.intent?.tools ?? []).length > 0;
    if (hasTools) return HARNESS_ACTIVITY_KEYS.searching;
    if (ctx.buffers.length > 0 || ctx.processedMeta.length > 0)
      return HARNESS_ACTIVITY_KEYS.analyzingImages;
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
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }

  /**
   * Stream large chart data (OHLCV, technical series) to the client right
   * after the tool runs, tagged with the same request/session/conversation
   * ids. The client buffers it and reveals it once the respond step starts
   * streaming — the model never sees the raw series.
   */
  private async emitChartData(
    ctx: HarnessContext,
    toolName: string,
    chartData: unknown,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      sessionId: ctx.filters.sessionId,
      conversationId: ctx.filters.conversationId,
      template: ctx.outputs.intent?.template,
      chartData: { toolName, data: chartData },
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }

  private async emitStatus(ctx: HarnessContext, key: string): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      activity: { key },
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }
}
