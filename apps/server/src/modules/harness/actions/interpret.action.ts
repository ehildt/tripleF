import { Inject, Injectable, Logger } from '@nestjs/common';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { MemoryClientConfig } from '../../memory-client/configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../../memory-client/constants/memory-client.constants.js';
import { PlaywrightMcpConfigService } from '../../playwright-mcp/configs/playwright-mcp-config.service.js';
import { EodhdDiscoveryService } from '../../provider-overrides/services/eodhd-discovery.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import {
  buildIntentCorrectionPrompt,
  languageCorrectionPrompt,
} from '../constants/structured-json-prompt.constant.js';
import { buildClassifyMessages } from '../helpers/interpret/build-classify-messages.helper.js';
import { parseIntent } from '../helpers/interpret/parse-intent.helper.js';
import { filterEodhdToolsByCapabilities } from '../helpers/tools/filter-eodhd-tools-by-capabilities.helper.js';
import { getEnabledToolNames } from '../helpers/tools/get-enabled-tool-names.helper.js';
import { type IntentResult } from '../templates/intent.schema.js';

import type {
  InterpretParams,
  InterpretResult,
} from './interpret.action.types.js';

const MAX_INTERPRET_RETRIES = 3;

@Injectable()
export class InterpretActionService {
  private readonly logger = new Logger(InterpretActionService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly playwrightMcpConfig: PlaywrightMcpConfigService,
    private readonly eodhdDiscovery: EodhdDiscoveryService,
    @Inject(MEMORY_CLIENT_CONFIG)
    private readonly memoryConfig: MemoryClientConfig,
  ) {}

  /**
   * Phase 1 — Interpret.
   *
   * Classifies the user intent and produces an execution plan:
   * - selected template + prompt variant
   * - external tools to invoke
   * - image processing plan (resize + optional preprocessing variants)
   *
   * No tools are executed and no response is produced here.
   */
  async execute(params: InterpretParams): Promise<InterpretResult> {
    const enabledToolNames = filterEodhdToolsByCapabilities(
      getEnabledToolNames(
        {
          ...this.providerOverrides.getConfig(),
          playwright: this.playwrightMcpConfig.config,
        },
        // Memory tools (remember/recall) are classifier-visible only when the
        // memory feature is on — they are gated by QDRANT_CONFIG, not the
        // provider overrides, so they are merged here.
        this.memoryConfig.enabled,
      ),
      this.eodhdDiscovery.getCached(),
    );
    const classifyMessages: InputMessage[] = buildClassifyMessages(
      params.messages,
      enabledToolNames,
      params.language,
      params.memoryProbe,
      params.personaName,
    );

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let lastIntent: IntentResult | undefined;

    for (let attempt = 1; attempt <= MAX_INTERPRET_RETRIES; attempt++) {
      const result = await this.aiSdkService.generateChat({
        model: params.model,
        messages: classifyMessages,
        keepAlive: params.keepAlive,
        numCtx: params.numCtx,
        think: false,
        tools: {},
        abortSignal: params.abortSignal,
      });

      totalInputTokens += result.totalUsage?.inputTokens ?? 0;
      totalOutputTokens += result.totalUsage?.outputTokens ?? 0;

      let intent: IntentResult;
      try {
        intent = parseIntent(params.requestId, result.text, enabledToolNames);
      } catch (error) {
        this.logger.warn(
          {
            requestId: params.requestId,
            step: 'interpret',
            rawOutput: result.text,
            err: error instanceof Error ? error : new Error(String(error)),
          },
          'intent parse failed',
        );
        // Structurally invalid JSON (incl. empty output) — retry with a
        // correction prompt, mirroring the response step's validateWithRetries.
        if (attempt === MAX_INTERPRET_RETRIES) throw error;
        classifyMessages.push(this.buildJsonCorrectionMessage(error));
        continue;
      }
      lastIntent = intent;
      params.onIntent?.(intent);

      this.logger.log(
        {
          requestId: params.requestId,
          step: 'interpret',
          model: params.model,
          attempt,
          language: intent.language,
          template: intent.template,
          prompt: intent.prompt,
          tools: intent.tools,
          plan: intent.plan,
          reasoning: intent.reasoning,
          contextSummary: intent.contextSummary,
          clarification: intent.needsClarification,
          inputTokens: result.totalUsage?.inputTokens,
          outputTokens: result.totalUsage?.outputTokens,
        },
        'intent classified',
      );

      if (this.isLanguageValid(intent.language)) {
        return {
          intent,
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
        };
      }

      this.logger.warn(
        {
          requestId: params.requestId,
          step: 'interpret',
          attempt,
          template: intent.template,
        },
        'language missing',
      );

      if (attempt < MAX_INTERPRET_RETRIES) {
        classifyMessages.push(this.buildLanguageCorrectionMessage());
      }
    }

    // All retries exhausted — leave the language unset and let downstream
    // steps mirror the user's latest message instead of forcing English.
    if (lastIntent) {
      params.onIntent?.(lastIntent);

      this.logger.warn(
        {
          requestId: params.requestId,
          step: 'interpret',
          model: params.model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
        'retries exhausted, language left unset',
      );
    }

    return {
      intent: lastIntent!,
      inputTokens: totalInputTokens || undefined,
      outputTokens: totalOutputTokens || undefined,
    };
  }

  private isLanguageValid(language?: string | null): boolean {
    return typeof language === 'string' && language.trim().length > 0;
  }

  private buildLanguageCorrectionMessage(): InputMessage {
    return { role: 'system', content: languageCorrectionPrompt };
  }

  private buildJsonCorrectionMessage(error: unknown): InputMessage {
    const detail =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : error instanceof Error
          ? error.message
          : String(error);
    return { role: 'system', content: buildIntentCorrectionPrompt(detail) };
  }
}
