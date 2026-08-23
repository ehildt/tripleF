import { Injectable, Logger } from '@nestjs/common';
import { generateText, stepCountIs } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { OLLAMA_CLOUD_HOST } from '../constants/ollama-cloud.constants.js';
import { toAiSdkMessages } from '../helpers/ai-sdk-message.helper.js';
import { buildOllamaHeaders } from '../helpers/build-ollama-headers.helper.js';
import { buildProviderOptions } from '../helpers/provider-options.helper.js';
import {
  type GenerateChatParams,
  type GenerateWithToolsParams,
  type GenerateWithToolsResult,
  type ToolResult,
} from '../types/ai-sdk-params.types.js';

import { OllamaModelsService } from './ollama-models.service.js';
import { OllamaOverridesService } from './ollama-overrides.service.js';

/**
 * Slim text/tool generation client for the memory app. Only the paths the
 * vectorize pipeline uses (generateChat, generateWithTools) are kept; the
 * chat-facing streaming/compaction methods live in the main server.
 */
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

  async generateChat(params: GenerateChatParams) {
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

  async generateWithTools(
    params: GenerateWithToolsParams,
  ): Promise<GenerateWithToolsResult> {
    const model = this.resolveClient(params.model)(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);

    const capturedResults: ToolResult[] = [];

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
      ...(hasTools
        ? { toolChoice: params.toolChoice ?? ('required' as const) }
        : {}),
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
