import { Inject, Injectable, Logger } from '@nestjs/common';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { ThinkMode } from '../../ai-sdk/helpers/ollama.helpers.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { parseLlmJson } from '../helpers/parse-llm-json.helper.js';
import {
  categorizeTools,
  expandToolAliases,
  getEnabledToolNames,
} from '../helpers/tool-registry.helper.js';
import { buildIntentSelectionPrompt } from '../prompts/intent-selection.prompt.js';
import { type IntentResult, IntentSchema } from '../templates/intent.schema.js';

export type InterpretResult = {
  intent: IntentResult;
  inputTokens?: number;
  outputTokens?: number;
};

@Injectable()
export class InterpretActionService {
  private readonly logger = new Logger(InterpretActionService.name);

  constructor(
    @Inject(AiSdkService)
    private readonly aiSdkService: AiSdkService,
    @Inject(ProviderOverridesService)
    private readonly providerOverrides: ProviderOverridesService,
  ) {}

  /**
   * Phase 1 – Interpret.
   *
   * Classifies the user intent and produces an execution plan:
   * - selected template + prompt variant
   - external tools to invoke
   - image processing plan (resize + optional preprocessing variants)
   *
   * No tools are executed and no response is produced here.
   */
  async execute(params: {
    model: string;
    messages: InputMessage[];
    keepAlive?: string;
    think?: ThinkMode;
    numCtx?: number;
    abortSignal?: AbortSignal;
    onIntent?: (intent: IntentResult) => void;
  }): Promise<InterpretResult> {
    const classifyMessages = this.buildClassifyMessages(params.messages);

    const result = await this.aiSdkService.generateChat({
      model: params.model,
      messages: classifyMessages,
      keepAlive: params.keepAlive,
      numCtx: params.numCtx,
      think: false,
      tools: {},
      abortSignal: params.abortSignal,
    });

    const enabledToolNames = getEnabledToolNames(
      this.providerOverrides.getConfig(),
    );
    const intent = this.parseIntent(result.text, enabledToolNames);
    params.onIntent?.(intent);

    this.logger.log('[HARNESS]', {
      step: 'interpret',
      model: params.model,
      template: intent.template,
      prompt: intent.prompt,
      tools: intent.tools,
      plan: intent.plan,
      reasoning: intent.reasoning,
      inputTokens: result.totalUsage?.inputTokens,
      outputTokens: result.totalUsage?.outputTokens,
    });

    return {
      intent,
      inputTokens: result.totalUsage?.inputTokens || undefined,
      outputTokens: result.totalUsage?.outputTokens || undefined,
    };
  }

  private parseIntent(text: string, enabledToolNames: string[]): IntentResult {
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

      if (Array.isArray(parsed.tools)) {
        parsed.tools = expandToolAliases(parsed.tools, enabledToolNames);
      }

      const validated = IntentSchema.parse(parsed);
      if (validated.tools) {
        validated.tools = [
          ...new Set(validated.tools),
        ] as IntentResult['tools'];
      }
      validated.tools = this.ensureMediaSearchTools(
        validated,
        enabledToolNames,
      );
      return validated;
    } catch (error) {
      this.logger.warn({
        request: 'intent-parse-failed',
        rawOutput: text,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Intent classification produced invalid JSON', {
        cause: error,
      });
    }
  }

  private ensureMediaSearchTools(
    intent: IntentResult,
    enabledToolNames: string[],
  ): IntentResult['tools'] {
    const mediaTemplates = new Set([
      'article',
      'news',
      'summary',
      'evaluation',
    ]);
    if (!mediaTemplates.has(intent.template)) {
      return intent.tools;
    }

    const categories = categorizeTools(enabledToolNames);
    const requiredTools = new Set(intent.tools);

    for (const tool of categories.imageSearch) {
      requiredTools.add(tool as IntentResult['tools'][number]);
    }
    for (const tool of categories.videoSearch) {
      requiredTools.add(tool as IntentResult['tools'][number]);
    }

    return [...requiredTools] as IntentResult['tools'];
  }

  private buildClassifyMessages(messages: InputMessage[]): InputMessage[] {
    const enabledToolNames = getEnabledToolNames(
      this.providerOverrides.getConfig(),
    );

    const prompt = [
      buildIntentSelectionPrompt(enabledToolNames),
      this.buildStructuredJsonPrompt(),
    ]
      .filter(Boolean)
      .join('\n\n');

    const hasImages = messages.some(
      (m) => m.role === 'user' && m.images && m.images.length > 0,
    );

    const nonSystem = messages.filter((m) => m.role !== 'system');
    const contextMessages = hasImages
      ? this.buildImageContext(nonSystem)
      : nonSystem.slice(-4);

    return [{ role: 'system', content: prompt }, ...contextMessages];
  }

  /**
   * For image tasks we keep a compacted version of the conversation context
   * plus the latest user text prompt as the actual image instruction.
   */
  private buildImageContext(messages: InputMessage[]): InputMessage[] {
    // Only the latest user text prompt is treated as the image instruction.
    const latestText = messages
      .filter(
        (m) =>
          m.role === 'user' && m.content && !m.content.startsWith('Image(s):'),
      )
      .at(-1)?.content;

    // Assistant turns provide the conversation context; keep them as-is.
    const assistantMessages = messages
      .filter((m) => m.role === 'assistant')
      .map((m) => ({ ...m, images: undefined }));

    const imageCount = messages.reduce((max, m) => {
      return m.role === 'user' && m.images?.length
        ? Math.max(max, m.images.length)
        : max;
    }, 0);

    const marker = this.buildImageMarker(imageCount);
    const userContent = [latestText, marker].filter(Boolean).join('\n\n');

    return [
      ...assistantMessages,
      ...(userContent ? [{ role: 'user' as const, content: userContent }] : []),
    ];
  }

  private buildImageMarker(count: number): string {
    if (count === 0) return '';
    if (count === 1) return '[1 image attached]';
    return `[${count} images attached]`;
  }

  private buildStructuredJsonPrompt(): string {
    return [
      'OUTPUT FORMAT — you must output ONLY valid JSON matching this exact schema:',
      '{',
      '  "template": "article|news|describe|compare|ocr|text",',
      '  "prompt": "promptVariant",',
      '  "reasoning": "string (concise, 30 words or fewer)",',
      '  "tools": ["toolName"],',
      '  "imageCount": number,',
      '  "videoCount": number,',
      '  "contextSummary": "string (concise summary of prior conversation relevant to the latest user message; empty if none)",',
      '  "needsClarification": boolean,',
      '  "clarificationQuestion": "string (only when needsClarification=true)",',
      '  "plan": {',
      '    "images": {',
      '      "resize": boolean,',
      '      "variants": ["grayscale"|"denoised"|"sharpened"|"clahe"]',
      '    }',
      '  }',
      '}',
      '',
      'Rules:',
      '- No markdown code fences.',
      '- No explanations, preamble, or postscript.',
      '- Prompt must be one of the valid variants for the selected template.',
      '- Tools array must contain only exact tool names from the enabled list.',
      '- Do NOT use category names (imageSearch, newsSearch, videoSearch, webpageFetch) as tool names.',
      '- contextSummary must summarize prior conversation context needed to understand references in the latest user message. It must be written in the same language as the latest user message. It must NOT include the latest user message itself.',
      '- If the request is ambiguous set needsClarification=true and provide a concise question.',
      '- imageCount: only include when the user explicitly requests a specific number of images. If omitted, the system defaults to 6.',
      '- videoCount: only include when the user explicitly requests a specific number of videos. If omitted, the system defaults to 6.',
      '- plan.images.resize should be true when images are present, unless the user explicitly asks for full resolution.',
      '- plan.images.variants should only include variants that would materially improve the analysis. Leave empty if the original is sufficient.',
      '',
      'FINAL REMINDER:',
      '- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.',
    ].join('\n');
  }
}
