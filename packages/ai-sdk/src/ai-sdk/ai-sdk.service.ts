import { Inject, Injectable, Logger } from '@nestjs/common';
import { generateText, smoothStream, stepCountIs, streamText } from 'ai';

import { toAiSdkMessages } from './helpers/ai-sdk-message.helper.ts';
import {
  type GenerateChatParams,
  type GenerateWithToolsParams,
  type GenerateWithToolsResult,
  type StreamChatParams,
  type ToolResult,
} from './types/ai-sdk-params.types.ts';
import { AI_SDK_CONFIG } from './ai-sdk.constants.ts';
import { AiSdkConfig } from './ai-sdk.model.ts';

@Injectable()
export class AiSdkService {
  private readonly logger = new Logger(AiSdkService.name);

  constructor(@Inject(AI_SDK_CONFIG) private readonly config: AiSdkConfig) {}

  async streamChat(params: StreamChatParams) {
    const model = this.config.createModel(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);
    const timeout = params.timeout ?? {
      totalMs: this.config.streamTotalTimeoutMs,
      chunkMs: this.config.streamChunkTimeoutMs,
    };

    const experimentalTransform =
      (params.smoothStream ?? this.config.enableSmoothStream)
        ? smoothStream({ delayInMs: 10, chunking: 'word' })
        : undefined;

    return streamText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(5),
      ...(experimentalTransform ? { experimental_transform: experimentalTransform } : {}),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: params.providerOptions,
    });
  }

  async generateChat(params: GenerateChatParams) {
    const model = this.config.createModel(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);
    const timeout = params.timeout ?? this.config.generateTotalTimeoutMs;

    return generateText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(5),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: params.providerOptions,
    });
  }

  async generateWithTools(params: GenerateWithToolsParams): Promise<GenerateWithToolsResult> {
    const model = this.config.createModel(params.model);
    const { system, messages } = toAiSdkMessages(params.messages);
    const capturedResults: ToolResult[] = [];
    const hasTools = Object.keys(params.tools).length > 0;
    const timeout = params.timeout ?? this.config.generateTotalTimeoutMs;

    const result = await generateText({
      model,
      system,
      messages: messages as any,
      tools: params.tools,
      allowSystemInMessages: false,
      stopWhen: stepCountIs(params.maxSteps ?? 1),
      ...(hasTools ? { toolChoice: params.toolChoice ?? ('required' as const) } : {}),
      abortSignal: params.abortSignal,
      timeout,
      providerOptions: params.providerOptions,
      onStepEnd: (step) => {
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
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
          }
        : undefined,
    };
  }
}
