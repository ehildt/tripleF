import { Injectable, Logger } from '@nestjs/common';
import type { InputMessage } from '@triplef/ai-sdk';
import { AiSdkService } from '@triplef/ai-sdk';

import { buildProviderOptions } from '../../ai-sdk/helpers/provider-options.helper.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { buildCorrectionPrompt } from '../helpers/respond/build-correction-prompt.helper.js';
import { buildExecutionMessages } from '../helpers/respond/build-execution-messages.helper.js';
import { consumeResponseStream } from '../helpers/stream/consume-response-stream.helper.js';
import { ResponseValidatorService } from '../services/response-validator.service.js';

import type { RespondParams, RespondResult } from './respond.action.types.js';
const MAX_JSON_RETRIES = 3;

@Injectable()
export class RespondActionService {
  private readonly logger = new Logger(RespondActionService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly responseValidator: ResponseValidatorService,
    private readonly providerOverrides: ProviderOverridesService,
  ) {}

  /**
   * Main entry point for the respond step.
   */
  execute(params: RespondParams): Promise<RespondResult> {
    const { messages: executionMessages, historySelection } =
      buildExecutionMessages({
        requestId: params.requestId,
        intent: params.intent,
        messages: params.messages,
        availableImages: params.availableImages,
        cloudReferenceImages: params.cloudReferenceImages,
        sources: this.providerOverrides.getConfig().sources,
        language: params.language,
      });

    if (historySelection) {
      this.logger.log(
        { requestId: params.requestId, step: 'respond', ...historySelection },
        'history selected',
      );
    }

    const totalImageCount = executionMessages.reduce(
      (sum, m) => sum + (m.images?.length ?? 0),
      0,
    );

    this.logger.log(
      {
        requestId: params.requestId,
        step: 'respond',
        model: params.model,
        template: params.intent.template,
        messageCount: executionMessages.length,
        totalImageCount,
      },
      'messages prepared',
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
    params: RespondParams,
    baseMessages: InputMessage[],
  ): Promise<RespondResult> {
    const messages: InputMessage[] = [...baseMessages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let attempt = 1; attempt <= MAX_JSON_RETRIES; attempt++) {
      const result = await this.aiSdkService.generateChat({
        model: params.model,
        messages,
        providerOptions: buildProviderOptions({
          keepAlive: params.keepAlive,
          numCtx: params.numCtx,
          think: params.think,
        }),
        tools: {},
        abortSignal: params.abortSignal,
      });

      totalInputTokens += result.usage?.inputTokens ?? 0;
      totalOutputTokens += result.usage?.outputTokens ?? 0;

      const validation = this.responseValidator.validateValidatedResponse(
        result.text,
        params.intent.template,
      );

      if (validation.valid) {
        const content = await this.responseValidator.verifyOutputImageUrls(
          validation.content,
        );
        this.logger.log(
          {
            requestId: params.requestId,
            step: 'respond',
            attempt,
            template: params.intent.template,
          },
          'JSON response validated',
        );
        return {
          content,
          data: this.parseValidatedData(content),
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
        };
      }

      this.logger.warn(
        {
          requestId: params.requestId,
          step: 'respond',
          attempt,
          template: params.intent.template,
          error: validation.error,
          preview: result.text.slice(0, 500),
          rawOutput: result.text,
        },
        'json validation failed',
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
    params: RespondParams,
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.streamChat({
      model: params.model,
      messages,
      providerOptions: buildProviderOptions({
        keepAlive: params.keepAlive,
        numCtx: params.numCtx,
        think: params.think,
      }),
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
      this.logger.warn(
        { requestId: params.requestId, step: 'respond' },
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
        this.logger.warn(
          {
            requestId: params.requestId,
            step: 'respond',
            template: params.intent.template,
            error: validation.error,
            preview: content.slice(0, 500),
            rawOutput: content,
          },
          'stream json validation failed',
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
    params: RespondParams,
    messages: InputMessage[],
  ): Promise<RespondResult> {
    const result = await this.aiSdkService.generateChat({
      model: params.model,
      messages,
      providerOptions: buildProviderOptions({
        keepAlive: params.keepAlive,
        numCtx: params.numCtx,
        think: params.think,
      }),
      tools: {},
      abortSignal: params.abortSignal,
    });

    return {
      content: result.text,
      inputTokens: result.usage?.inputTokens || undefined,
      outputTokens: result.usage?.outputTokens || undefined,
    };
  }
}
