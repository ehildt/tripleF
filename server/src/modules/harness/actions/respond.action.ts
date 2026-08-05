import { Injectable } from '@nestjs/common';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { buildCorrectionPrompt } from '../helpers/build-correction-prompt.helper.js';
import { buildExecutionMessages } from '../helpers/respond/build-execution-messages.helper.js';
import { consumeResponseStream } from '../helpers/respond/consume-response-stream.helper.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { ResponseValidatorService } from '../services/response-validator.service.js';
import type { IntentResult } from '../templates/intent.schema.js';

type RespondResult = {
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
    private readonly providerOverrides: ProviderOverridesService,
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
    const executionMessages = buildExecutionMessages({
      requestId: params.requestId,
      intent: params.intent,
      messages: params.messages,
      availableImages: params.availableImages,
      sources: this.providerOverrides.getConfig().sources,
      stepLogger: this.stepLogger,
    });

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

      if (attempt < MAX_JSON_RETRIES) {
        messages.push({
          role: 'system',
          content: buildCorrectionPrompt(
            validation.error,
            params.intent.template,
            { finalAttempt: attempt + 1 === MAX_JSON_RETRIES },
          ),
        });

        params.onJsonRetry?.(attempt + 1);
      }
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

    const { content, inputTokens, outputTokens } = await consumeResponseStream(
      result.fullStream,
      {
        onTextDelta: params.onTextDelta,
        onReasoningDelta: params.onReasoningDelta,
      },
    );

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
