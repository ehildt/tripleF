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

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { OLLAMA_CLOUD_HOST } from '../constants/ollama-cloud.constants.js';
import { toAiSdkMessages } from '../helpers/ai-sdk-message.helper.js';
import { buildOllamaHeaders } from '../helpers/build-ollama-headers.helper.js';
import { buildProviderOptions } from '../helpers/provider-options.helper.js';
import type { InputMessage } from '../types/ai-sdk-messages.types.js';
import { ThinkMode } from '../types/think-mode.type.js';

import { OllamaModelsService } from './ollama-models.service.js';
import { OllamaOverridesService } from './ollama-overrides.service.js';

@Injectable()
export class AiSdkService {
  private readonly clients = new Map<string, ReturnType<typeof createOllama>>();
  private readonly logger = new Logger(AiSdkService.name);

  constructor(
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly ollamaOverrides: OllamaOverridesService,
    private readonly ollamaModels: OllamaModelsService,
  ) {}

  /**
   * Clients are built lazily and cached per effective connection
   * (baseURL + API key fingerprint), so a SysCtl connection override takes
   * effect on the very next request without a restart. Cloud models route
   * to ollama.com; everything else goes to the configured host.
   */
  private resolveClient(modelName: string) {
    const { host, apiKey } = this.ollamaOverrides.getConfig();
    const useCloud = this.ollamaModels.getModelOrigin(modelName) === 'cloud';
    const baseURL = useCloud ? OLLAMA_CLOUD_HOST : host;
    const fingerprint = `${baseURL}|${apiKey ?? ''}`;
    let client = this.clients.get(fingerprint);
    if (!client) {
      client = createOllama({ baseURL, headers: buildOllamaHeaders(apiKey) });
      this.clients.set(fingerprint, client);
    }
    return client;
  }

  async streamChat(params: {
    model: string;
    messages: InputMessage[];
    numCtx?: number;
    keepAlive?: string;
    think?: ThinkMode;
    tools?: ToolSet;
    timeout?: TimeoutConfiguration<any>;
    abortSignal?: AbortSignal;
    smoothStream?: boolean;
  }) {
    const model = this.resolveClient(params.model)(params.model);
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
    timeout?: TimeoutConfiguration<any>;
    abortSignal?: AbortSignal;
  }) {
    const model = this.resolveClient(params.model)(params.model);
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
      timeout?: TimeoutConfiguration<any>;
      abortSignal?: AbortSignal;
    },
  ): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
    this.logger.log(
      `Compacting ${content.length} chars with model "${options.model}"`,
    );
    options.notify?.('compaction-start');
    const model = this.resolveClient(options.model)(options.model);

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
    /**
     * Max generate⇄tool round-trips. Browsing intents navigate, snapshot and
     * interact step by step, so they pass a higher budget than the single
     * round-trip searches use.
     */
    maxSteps?: number;
    timeout?: TimeoutConfiguration<any>;
    abortSignal?: AbortSignal;
    onToolResult?: (toolResult: { toolName: string; result: unknown }) => void;
  }): Promise<{
    text: string;
    toolResults: Array<{ toolName: string; result: unknown }>;
    totalUsage?: { inputTokens?: number; outputTokens?: number };
  }> {
    const model = this.resolveClient(params.model)(params.model);
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
      stopWhen: stepCountIs(params.maxSteps ?? 1),
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
