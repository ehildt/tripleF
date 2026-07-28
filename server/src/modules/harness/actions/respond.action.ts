import { Injectable } from '@nestjs/common';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';
import { buildCorrectionPrompt } from '../helpers/build-correction-prompt.helper.js';
import { selectStepHistory } from '../helpers/select-step-history.helper.js';
import { getTemplatePlaceholders } from '../helpers/template-placeholders.constant.js';
import { buildContentSystemPrompt } from '../prompts/content-system.prompt.js';
import { resolveVariantInstructions } from '../prompts/variant-instructions.registry.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { ResponseValidatorService } from '../services/response-validator.service.js';
import type { IntentResult } from '../templates/intent.schema.js';

export type RespondResult = {
  content: string;
  data?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
};

const MAX_JSON_RETRIES = 3;

@Injectable()
export class RespondActionService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly responseValidator: ResponseValidatorService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  /**
   * Main entry point for the respond step.
   */
  execute(params: {
    requestId: string;
    intent: IntentResult;
    messages: InputMessage[];
    availableImages?: Array<Record<string, unknown>>;
    model: string;
    keepAlive?: string;
    numCtx?: number;
    think?: ThinkMode;
    stream?: boolean;
    abortSignal?: AbortSignal;
    onTextDelta?: (delta: string) => void;
    onReasoningDelta?: (delta: string) => void;
    onJsonRetry?: (attempt: number) => void;
  }): Promise<RespondResult> {
    const executionMessages = this.buildExecutionMessages(params);

    const totalImageCount = executionMessages.reduce(
      (sum, m) => sum + (m.images?.length ?? 0),
      0,
    );

    this.stepLogger.log(
      { requestId: params.requestId },
      'respond',
      'messages prepared',
      {
        model: params.model,
        template: params.intent.template,
        messageCount: executionMessages.length,
        totalImageCount,
        messages: executionMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    );

    if (params.stream) return this.streamResponse(params, executionMessages);
    if (params.intent.template === 'text') {
      return this.generateResponse(params, executionMessages);
    }

    // Structured templates must produce valid JSON. Force non-streaming so we
    // can validate the output and retry when it is malformed.
    return this.validateWithRetries(params, executionMessages);
  }

  private buildExecutionMessages(params: {
    requestId: string;
    intent: IntentResult;
    messages: InputMessage[];
    availableImages?: Array<Record<string, unknown>>;
  }): InputMessage[] {
    const isImageTask = ['describe', 'compare', 'ocr'].includes(
      params.intent.template,
    );
    const placeholders = getTemplatePlaceholders(params.intent.template);
    const instructions = resolveVariantInstructions(
      params.intent.template,
      params.intent.prompt,
    );

    const executionSystem = buildContentSystemPrompt({
      template: params.intent.template,
      instructions,
      tools: params.intent.tools,
      placeholders,
      isImageTask,
      contextSummary: params.intent.contextSummary,
      language: params.intent.language ?? undefined,
    });

    const systemMessages = params.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = params.messages.filter(
      (m) => m.role !== 'system',
    );

    if (!isImageTask) {
      // Downstream steps consume the query-focused contextSummary (already
      // injected into the execution system prompt) instead of the raw
      // transcript — except when the history is short, the template recaps
      // it, or free-form chat needs the last exchange for tone.
      const selection = selectStepHistory({
        messages: nonSystemMessages,
        template: params.intent.template,
      });

      this.stepLogger.log(
        { requestId: params.requestId },
        'respond',
        'history selected',
        {
          mode: selection.mode,
          keptCount: selection.messages.length,
          droppedCount: nonSystemMessages.length - selection.messages.length,
        },
      );

      return [
        { role: 'system', content: executionSystem },
        ...systemMessages,
        ...selection.messages,
      ];
    }

    const contextMessages = this.buildImageContextMessages(
      params.messages,
      params.availableImages,
    );

    return [
      { role: 'system', content: executionSystem },
      ...systemMessages,
      ...contextMessages,
    ];
  }

  private buildImageContextMessages(
    allMessages: InputMessage[],
    availableImages?: Array<Record<string, unknown>>,
  ): InputMessage[] {
    const isToolContextMessage = (m: InputMessage) =>
      m.role === 'system' &&
      (m.content.startsWith('[TOOL CONTEXT') ||
        m.content.startsWith('[AVAILABLE IMAGES'));

    const nonSystemMessages = allMessages.filter((m) => m.role !== 'system');

    const imageMessage = nonSystemMessages.findLast(
      (m) => m.role === 'user' && m.images && m.images.length > 0,
    );
    const toolContextMessage = allMessages.findLast(isToolContextMessage);

    const contextMessages: InputMessage[] = [];

    if (imageMessage) {
      contextMessages.push(imageMessage);
    } else {
      const lastUser = nonSystemMessages
        .filter((m) => m.role === 'user')
        .at(-1);
      if (lastUser) contextMessages.push(lastUser);
    }

    if (toolContextMessage) {
      contextMessages.push(toolContextMessage);
    }

    if (availableImages && availableImages.length > 0) {
      contextMessages.push({
        role: 'system',
        content: `[AVAILABLE IMAGES — DO NOT OUTPUT]\n${JSON.stringify(
          availableImages,
          null,
          2,
        )}`,
      });
    }

    return contextMessages;
  }

  /**
   * Retry loop: validate JSON output and retry with correction prompt on failure.
   */
  private async validateWithRetries(
    params: {
      requestId: string;
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
      onJsonRetry?: (attempt: number) => void;
    },
    baseMessages: InputMessage[],
  ): Promise<RespondResult> {
    const messages: InputMessage[] = [...baseMessages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let attempt = 1; attempt <= MAX_JSON_RETRIES; attempt++) {
      const result = await this.aiSdkService.generateChat({
        model: params.model,
        messages,
        keepAlive: params.keepAlive,
        numCtx: params.numCtx,
        think: params.think,
        tools: {},
        abortSignal: params.abortSignal,
      });

      totalInputTokens += result.totalUsage?.inputTokens ?? 0;
      totalOutputTokens += result.totalUsage?.outputTokens ?? 0;

      const validation = this.responseValidator.validateValidatedResponse(
        result.text,
        params.intent.template,
      );

      if (validation.valid) {
        const content = await this.responseValidator.verifyOutputImageUrls(
          validation.content,
        );
        this.stepLogger.log(
          { requestId: params.requestId },
          'respond',
          'JSON response validated',
          {
            attempt,
            template: params.intent.template,
          },
        );
        return {
          content,
          data: this.parseValidatedData(content),
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
        };
      }

      this.stepLogger.warn(
        { requestId: params.requestId },
        'respond',
        'json validation failed',
        {
          attempt,
          template: params.intent.template,
          error: validation.error,
          preview: result.text.slice(0, 500),
        },
      );

      messages.push({
        role: 'system',
        content: buildCorrectionPrompt(
          validation.error,
          params.intent.template,
        ),
      });

      if (attempt < MAX_JSON_RETRIES) params.onJsonRetry?.(attempt + 1);
    }

    throw new Error(
      `Failed to produce valid JSON for template "${params.intent.template}" after ${MAX_JSON_RETRIES} attempts`,
    );
  }

  /**
   * For streaming: forward text deltas to client and run post-stream validation once the stream completes.
   */
  private async streamResponse(
    params: {
      requestId: string;
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
      onTextDelta?: (delta: string) => void;
      onReasoningDelta?: (delta: string) => void;
      onJsonRetry?: (attempt: number) => void;
    },
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.streamChat({
      model: params.model,
      messages,
      keepAlive: params.keepAlive,
      numCtx: params.numCtx,
      think: params.think,
      tools: {},
      abortSignal: params.abortSignal,
    });

    const { content, inputTokens, outputTokens } =
      await this.consumeResponseStream(result.fullStream, params);

    if (!content) {
      this.stepLogger.warn(
        { requestId: params.requestId },
        'respond',
        'stream returned empty content; retrying non-stream',
      );
      return params.intent.template === 'text'
        ? this.generateResponse(params, messages)
        : this.validateWithRetries(params, messages);
    }

    if (params.intent.template !== 'text') {
      const validation = this.responseValidator.validateValidatedResponse(
        content,
        params.intent.template,
      );

      if (!validation.valid) {
        this.stepLogger.warn(
          { requestId: params.requestId },
          'respond',
          'stream json validation failed',
          {
            template: params.intent.template,
            error: validation.error,
            preview: content.slice(0, 500),
          },
        );
        params.onJsonRetry?.(1);
        return this.validateWithRetries(params, messages);
      }

      const verifiedContent =
        await this.responseValidator.verifyOutputImageUrls(validation.content);

      return {
        content: verifiedContent,
        data: this.parseValidatedData(verifiedContent),
        inputTokens: inputTokens || undefined,
        outputTokens: outputTokens || undefined,
      };
    }

    return {
      content,
      inputTokens: inputTokens || undefined,
      outputTokens: outputTokens || undefined,
    };
  }

  private async consumeResponseStream(
    fullStream: Awaited<ReturnType<AiSdkService['streamChat']>>['fullStream'],
    params: {
      onTextDelta?: (delta: string) => void;
      onReasoningDelta?: (delta: string) => void;
    },
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const part of fullStream) {
      if (part.type === 'text-delta' && part.text) {
        content += part.text;
        params.onTextDelta?.(part.text);
      } else if (part.type === 'reasoning-delta' && part.text) {
        params.onReasoningDelta?.(part.text);
      } else if (part.type === 'finish') {
        const usage = (part as any).totalUsage ?? (part as any).usage;
        if (usage) {
          inputTokens = usage.inputTokens ?? 0;
          outputTokens = usage.outputTokens ?? 0;
        }
      }
    }

    return { content, inputTokens, outputTokens };
  }

  private parseValidatedData(
    content: string,
  ): Record<string, unknown> | undefined {
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      return parsed;
    } catch {
      return undefined;
    }
  }

  /**
   * Plain text response (no JSON validation needed).
   */
  private async generateResponse(
    params: {
      requestId: string;
      intent: IntentResult;
      model: string;
      keepAlive?: string;
      numCtx?: number;
      think?: ThinkMode;
      abortSignal?: AbortSignal;
    },
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.generateChat({
      model: params.model,
      messages,
      keepAlive: params.keepAlive,
      numCtx: params.numCtx,
      think: params.think,
      tools: {},
      abortSignal: params.abortSignal,
    });

    return {
      content: result.text,
      inputTokens: result.totalUsage?.inputTokens || undefined,
      outputTokens: result.totalUsage?.outputTokens || undefined,
    };
  }
}
