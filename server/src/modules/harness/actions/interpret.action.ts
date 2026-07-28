import { Injectable } from '@nestjs/common';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import {
  buildStructuredJsonPrompt,
  languageCorrectionPrompt,
} from '../constants/structured-json-prompt.constant.js';
import { buildClassifyTranscript } from '../helpers/build-classify-transcript.helper.js';
import { enforceRequiredTools } from '../helpers/enforce-media-tools.helper.js';
import { expandToolAliases } from '../helpers/expand-tool-aliases.helper.js';
import { getEnabledToolNames } from '../helpers/get-enabled-tool-names.helper.js';
import { parseLlmJson } from '../helpers/parse-llm-json.helper.js';
import { buildIntentSelectionPrompt } from '../prompts/intent-selection.prompt.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { type IntentResult, IntentSchema } from '../templates/intent.schema.js';

const MAX_INTERPRET_RETRIES = 3;

export type InterpretResult = {
  intent: IntentResult;
  inputTokens?: number;
  outputTokens?: number;
};

@Injectable()
export class InterpretActionService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly stepLogger: HarnessStepLogger,
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
  async execute(params: {
    requestId: string;
    model: string;
    messages: InputMessage[];
    keepAlive?: string;
    think?: ThinkMode;
    numCtx?: number;
    abortSignal?: AbortSignal;
    onIntent?: (intent: IntentResult) => void;
  }): Promise<InterpretResult> {
    const classifyMessages: InputMessage[] = this.buildClassifyMessages(
      params.messages,
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

      const enabledToolNames = getEnabledToolNames(
        this.providerOverrides.getConfig(),
      );
      const intent = this.parseIntent(
        params.requestId,
        result.text,
        enabledToolNames,
      );
      lastIntent = intent;
      params.onIntent?.(intent);

      this.stepLogger.log(
        { requestId: params.requestId },
        'interpret',
        'intent classified',
        {
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
      );

      if (this.isLanguageValid(intent.language)) {
        return {
          intent,
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
        };
      }

      this.stepLogger.warn(
        { requestId: params.requestId },
        'interpret',
        'language missing',
        {
          attempt,
          template: intent.template,
        },
      );

      if (attempt < MAX_INTERPRET_RETRIES) {
        classifyMessages.push(this.buildLanguageCorrectionMessage());
      }
    }

    // All retries exhausted — leave the language unset and let downstream
    // steps mirror the user's latest message instead of forcing English.
    if (lastIntent) {
      params.onIntent?.(lastIntent);

      this.stepLogger.warn(
        { requestId: params.requestId },
        'interpret',
        'retries exhausted, language left unset',
        {
          model: params.model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
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

  private parseIntent(
    requestId: string,
    text: string,
    enabledToolNames: string[],
  ): IntentResult {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    if (!cleaned) {
      throw new Error('Intent classification returned empty output');
    }

    try {
      const parsed = parseLlmJson(cleaned) as Record<string, unknown>;

      if (typeof parsed.imageCount === 'number' && parsed.imageCount < 0) {
        parsed.imageCount = 0;
      }
      if (typeof parsed.videoCount === 'number' && parsed.videoCount < 0) {
        parsed.videoCount = 0;
      }

      if (Array.isArray(parsed.tools)) {
        parsed.tools = expandToolAliases(parsed.tools, enabledToolNames);
      }

      const validated = IntentSchema.parse(parsed);
      if (validated.tools) {
        validated.tools = [
          ...new Set(validated.tools),
        ] as IntentResult['tools'];
      }
      validated.tools = enforceRequiredTools(validated, enabledToolNames);
      return validated;
    } catch (error) {
      this.stepLogger.warn({ requestId }, 'interpret', 'intent parse failed', {
        rawOutput: text,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Intent classification produced invalid JSON', {
        cause: error,
      });
    }
  }

  private buildClassifyMessages(messages: InputMessage[]): InputMessage[] {
    const enabledToolNames = getEnabledToolNames(
      this.providerOverrides.getConfig(),
    );

    const prompt = [
      buildIntentSelectionPrompt(enabledToolNames),
      buildStructuredJsonPrompt(),
    ]
      .filter(Boolean)
      .join('\n\n');

    const systemContent = this.buildSystemPrompt(prompt);

    const hasImages = messages.some(
      (m) => m.role === 'user' && m.images && m.images.length > 0,
    );

    const nonSystem = messages.filter((m) => m.role !== 'system');

    // The interpret step is the context gatekeeper: it derives the
    // query-focused contextSummary that downstream steps rely on, so it must
    // see the full conversation. Earlier turns move into a delimited
    // transcript inside the system message — reference-only data that the
    // classifier cannot confuse with the current request, which stays as
    // the final user message.
    const latestUserIndex = nonSystem.findLastIndex((m) => m.role === 'user');
    const latestUser =
      latestUserIndex >= 0 ? nonSystem[latestUserIndex] : undefined;

    const transcriptSource = hasImages
      ? nonSystem.filter((m) => m.role === 'assistant')
      : nonSystem.slice(
          0,
          latestUserIndex < 0 ? nonSystem.length : latestUserIndex,
        );
    const transcript = buildClassifyTranscript(transcriptSource);

    const latestUserContent = hasImages
      ? this.buildImageUserContent(nonSystem)
      : (latestUser?.content ?? '');

    return [
      {
        role: 'system' as const,
        content: [systemContent, transcript].filter(Boolean).join('\n\n'),
      },
      ...(latestUserContent
        ? [{ role: 'user' as const, content: latestUserContent }]
        : []),
    ];
  }

  private buildSystemPrompt(basePrompt: string): string {
    const now = new Date()
      .toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      .replace(' at ', ', '); // "Friday, January 3, 2025, 10:30 AM GMT"
    return [
      basePrompt,
      '',
      `Current date and time: ${now}`,
      'Use this temporal context when classifying time-sensitive requests.',
    ].join('\n');
  }

  /**
   * Latest user text plus the attachment marker, so the classifier knows
   * the current request carries images without sending the images.
   */
  private buildImageUserContent(messages: InputMessage[]): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    const latestText = userMessages.at(-1)?.content ?? '';

    const imageCount =
      userMessages.findLast((m) => m.images && m.images.length > 0)?.images
        ?.length ?? 0;

    const marker =
      imageCount > 0
        ? imageCount === 1
          ? ' [1 image attached]'
          : ` [${imageCount} images attached]`
        : '';

    return [latestText, marker].filter(Boolean).join(' ');
  }
}
