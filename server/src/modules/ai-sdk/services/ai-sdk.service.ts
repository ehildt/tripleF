import { Injectable, Logger } from '@nestjs/common';
import {
  generateText,
  smoothStream,
  stepCountIs,
  streamText,
  type TimeoutConfiguration,
  type ToolSet,
} from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import { toAiSdkMessages } from '../helpers/ai-sdk-message.helper.js';
import type { InputMessage } from '../helpers/ai-sdk-message.models.js';
import { ThinkMode } from '../helpers/ollama.helpers.js';
import { buildProviderOptions } from '../helpers/provider-options.helper.js';

export type { InputMessage } from '../helpers/ai-sdk-message.models.js';

@Injectable()
export class AiSdkService {
  private readonly client: ReturnType<typeof createOllama>;
  private readonly logger = new Logger(AiSdkService.name);

  constructor(private readonly ollamaConfigService: OllamaConfigService) {
    this.client = createOllama({
      baseURL: this.ollamaConfigService.config.host,
      headers: this.ollamaConfigService.config.headers,
    });
  }

  createModel(model: string) {
    return this.client(model);
  }

  async streamChat(params: {
    model: string;
    messages: InputMessage[];
    numCtx?: number;
    keepAlive?: string;
    think?: ThinkMode;
    tools?: ToolSet;
    timeout?: TimeoutConfiguration;
    abortSignal?: AbortSignal;
    smoothStream?: boolean;
  }) {
    const model = this.client(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);

    const timeout = params.timeout ?? {
      totalMs: this.ollamaConfigService.config.streamTotalTimeoutMs,
      chunkMs: this.ollamaConfigService.config.streamChunkTimeoutMs,
    };

    const experimentalTransform =
      (params.smoothStream ??
      this.ollamaConfigService.config.enableSmoothStream)
        ? smoothStream({ delayInMs: 10, chunking: 'word' })
        : undefined;

    return streamText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(5),
      ...(experimentalTransform
        ? { experimental_transform: experimentalTransform }
        : {}),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: buildProviderOptions({
        numCtx: params.numCtx,
        keepAlive: params.keepAlive,
        think: params.think,
      }),
    });
  }

  async generateChat(params: {
    model: string;
    messages: InputMessage[];
    numCtx?: number;
    keepAlive?: string;
    think?: ThinkMode;
    tools?: ToolSet;
    timeout?: TimeoutConfiguration;
    abortSignal?: AbortSignal;
  }) {
    const model = this.client(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);

    const timeout =
      params.timeout ?? this.ollamaConfigService.config.generateTotalTimeoutMs;

    return generateText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(5),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: buildProviderOptions({
        numCtx: params.numCtx,
        keepAlive: params.keepAlive,
        think: params.think,
      }),
    });
  }

  async compactContent(
    content: string,
    options: {
      model: string;
      notify?: (event: string, data?: unknown) => void;
      timeout?: TimeoutConfiguration;
      abortSignal?: AbortSignal;
    },
  ): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
    this.logger.log(
      `Compacting ${content.length} chars with model "${options.model}"`,
    );
    options.notify?.('compaction-start');
    const model = this.client(options.model);

    const timeout =
      options.timeout ?? this.ollamaConfigService.config.generateTotalTimeoutMs;

    const { text, totalUsage } = await generateText({
      model,
      system:
        'Summarize the following web content in 2–3 paragraphs. Preserve key facts, dates, names, numbers, and statistics. Remove navigation, ads, boilerplate, and repetitive text.',
      messages: [{ role: 'user', content: content.slice(0, 8000) }],
      abortSignal: options.abortSignal,
      timeout,
    });
    options.notify?.('compaction-end');
    return {
      text,
      inputTokens: totalUsage?.inputTokens,
      outputTokens: totalUsage?.outputTokens,
    };
  }

  async generateWithTools(params: {
    model: string;
    messages: InputMessage[];
    numCtx?: number;
    keepAlive?: string;
    think?: ThinkMode;
    tools: ToolSet;
    timeout?: TimeoutConfiguration;
    abortSignal?: AbortSignal;
    onToolResult?: (toolResult: { toolName: string; result: unknown }) => void;
  }): Promise<{
    text: string;
    toolResults: Array<{ toolName: string; result: unknown }>;
    totalUsage?: { inputTokens?: number; outputTokens?: number };
  }> {
    const model = this.client(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);

    const capturedResults: Array<{ toolName: string; result: unknown }> = [];

    const hasTools = Object.keys(params.tools).length > 0;

    const timeout =
      params.timeout ?? this.ollamaConfigService.config.generateTotalTimeoutMs;

    const result = await generateText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(1),
      ...(hasTools ? { toolChoice: 'required' as const } : {}),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: buildProviderOptions({
        numCtx: params.numCtx,
        keepAlive: params.keepAlive,
        think: params.think,
      }),
      onStepFinish: (step) => {
        if ('toolResults' in step) {
          for (const tr of (step as any).toolResults ?? []) {
            if (!tr.output) continue;
            capturedResults.push({
              toolName: tr.toolName,
              result: tr.output,
            });
            params.onToolResult?.({
              toolName: tr.toolName,
              result: tr.output,
            });
          }
        }
      },
    });

    return {
      text: result.text,
      toolResults: capturedResults,
      totalUsage: result.totalUsage
        ? {
            inputTokens: result.totalUsage.inputTokens,
            outputTokens: result.totalUsage.outputTokens,
          }
        : undefined,
    };
  }
}
