import { Inject, Injectable } from '@nestjs/common';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { ToolSelectionService } from '../../ai-sdk/services/tool-selection.service.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { type FilterVariant } from '../../sharp/types/image-variant.types.js';
import { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';
import { applySearchRecency } from '../helpers/apply-search-recency.helper.js';
import { buildContextSummarySection } from '../helpers/build-context-summary-section.helper.js';
import {
  buildFallbackInput,
  buildImageExecutePrompt,
  buildToolExecutePrompt,
} from '../helpers/build-execute-prompt.helper.js';
import { buildFilenames } from '../helpers/build-filenames.helper.js';
import {
  resolveToolCategory,
  type ToolCategory,
} from '../helpers/resolve-tool-category.helper.js';
import { selectStepHistory } from '../helpers/select-step-history.helper.js';
import { type VariantName } from '../helpers/tool-registry.constants.js';
import type { HarnessContext } from '../services/harness-context.type.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';

export type ExecuteResult = {
  buffers: Buffer[];
  processedMeta: FastifyMultipartMeta[];
  toolResults: Array<{ toolName: string; result: unknown }>;
  inputTokens?: number;
  outputTokens?: number;
};

export type ToolExecutionEvent = {
  name: string;
  category: ToolCategory;
  query?: string;
  input?: unknown;
  status: 'start' | 'done' | 'error';
};

export type ToolExecutionEventHandler = (event: ToolExecutionEvent) => void;

@Injectable()
export class ExecuteActionService {
  constructor(
    @Inject(AiSdkService)
    private readonly aiSdkService: AiSdkService,
    @Inject(ToolSelectionService)
    private readonly toolSelectionService: ToolSelectionService,
    @Inject(SharpService)
    private readonly sharpService: SharpService,
    @Inject(OllamaConfigService)
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  /**
   * Phase 2 — Execute.
   *
   * Carries out the plan from the interpret step:
   * - resizes images
   * - generates requested preprocessing variants
   * - invokes external tools and variant-request tools
   *
   * Returns processed images and raw tool results. URL verification and final
   * message assembly are handled by the separate sanitize step.
   */
  async execute(
    ctx: HarnessContext,
    abortSignal?: AbortSignal,
    onToolEvent?: ToolExecutionEventHandler,
  ): Promise<ExecuteResult> {
    const intent = ctx.outputs.intent;
    if (!intent) throw new Error('Missing intent — execute cannot run');

    const hasImages = ctx.buffers.length > 0;
    const imagePlan = intent.plan?.images;
    const preprocessing = ctx.filters.preprocessing;

    let buffers = ctx.buffers;
    let processedMeta = ctx.processedMeta;

    // 1. Resize images (default true when images are present)
    if (hasImages && imagePlan?.resize !== false) {
      const resized = await this.sharpService.resizeImages(
        buffers,
        processedMeta,
        preprocessing,
      );
      buffers = resized.map((r) => r.buffer);
      processedMeta = resized.map((r) => r.meta);
    }

    // 2. Determine which variant tools are available and which were requested
    const availableVariants = this.getAvailableVariants(preprocessing);
    const requestedVariants = (imagePlan?.variants ?? []).filter((v) =>
      availableVariants.includes(v as VariantName),
    ) as FilterVariant[];

    // 3. Build the tool set: external tools + variant request tools
    const allToolNames = this.resolveAllToolNames(intent, requestedVariants);
    const selectedTools =
      allToolNames.length > 0
        ? this.toolSelectionService.selectToolsByName(
            allToolNames as any[],
            undefined,
            undefined,
            availableVariants,
          )
        : {};
    const chosenTools = this.wrapToolsWithSearchRecency(
      this.wrapToolsWithExecutionEvents(selectedTools, onToolEvent),
      intent.getDate !== false,
    );

    // 4. Run the tool model call with resized images
    let toolResults: Array<{ toolName: string; result: unknown }> = [];
    let inputTokens = 0;
    let outputTokens = 0;

    if (Object.keys(chosenTools).length > 0) {
      const executeMessages = this.buildExecuteMessages(
        ctx,
        buffers,
        processedMeta,
        availableVariants,
      );

      const result = await this.aiSdkService.generateWithTools({
        model: ctx.model,
        messages: executeMessages,
        keepAlive: this.ollamaConfigService.config.keepAlive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        tools: chosenTools as any,
        abortSignal,
      });

      toolResults = result.toolResults;
      inputTokens = result.totalUsage?.inputTokens ?? 0;
      outputTokens = result.totalUsage?.outputTokens ?? 0;

      if (toolResults.length === 0) {
        this.stepLogger.warn(ctx, 'execute', 'no tool calls', {
          model: ctx.model,
          textPreview: result.text?.slice(0, 300),
        });
      }

      const missingResults = await this.invokeMissingMandatoryTools(
        chosenTools,
        ctx,
        toolResults,
      );
      if (missingResults.length > 0) {
        toolResults.push(...missingResults);
        this.stepLogger.log(ctx, 'execute', 'missing tools invoked', {
          tools: missingResults.map((r) => r.toolName),
        });
      }

      // Identify variant requests from tool results and merge into requestedVariants
      const requestedFromTools = toolResults
        .filter((tr) => tr.toolName.startsWith('request'))
        .map((tr) => (tr.result as { variant?: string }).variant)
        .filter((v): v is string => !!v) as FilterVariant[];

      requestedVariants.push(
        ...requestedFromTools.filter((v) => !requestedVariants.includes(v)),
      );
    }

    // 5. Generate the requested variant images
    if (requestedVariants.length > 0 && hasImages) {
      const variantImages = await this.sharpService.generateVariants(
        buffers,
        processedMeta,
        requestedVariants,
        preprocessing,
      );
      buffers = [...buffers, ...variantImages.map((v) => v.buffer)];
      processedMeta = [...processedMeta, ...variantImages.map((v) => v.meta)];
    }

    // 6. Return raw results for the sanitize step.
    return {
      buffers,
      processedMeta,
      toolResults,
      inputTokens: inputTokens || undefined,
      outputTokens: outputTokens || undefined,
    };
  }

  private resolveAllToolNames(
    intent: HarnessContext['outputs']['intent'],
    requestedVariants: FilterVariant[],
  ): string[] {
    const allToolNames = [];
    const externalTools = (intent?.tools ?? []).filter(
      (t) => !t.startsWith('request'),
    ) as string[];
    allToolNames.push(...externalTools);

    if (requestedVariants.length > 0) {
      allToolNames.push(
        ...requestedVariants.map((v) => `request${this.capitalize(v)}`),
      );
    }
    return allToolNames;
  }

  private getAvailableVariants(preprocessing?: {
    enabled?: boolean;
    variants?: Record<string, boolean>;
  }): VariantName[] {
    if (!preprocessing?.enabled) return [];

    return Object.entries(preprocessing.variants ?? {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name as VariantName);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /**
   * Wrap each tool's execute so start/done/error events fire exactly around
   * execution — covers both model-invoked tools and tools invoked directly
   * through invokeMissingMandatoryTools.
   */
  private wrapToolsWithExecutionEvents(
    tools: Record<string, unknown>,
    onToolEvent?: ToolExecutionEventHandler,
  ): Record<string, unknown> {
    if (!onToolEvent) return tools;

    const wrapped: Record<string, unknown> = {};
    for (const [name, toolDef] of Object.entries(tools)) {
      const execute = (toolDef as { execute?: (...args: any[]) => unknown })
        ?.execute;
      if (typeof execute !== 'function') {
        wrapped[name] = toolDef;
        continue;
      }
      const category = resolveToolCategory(name);
      wrapped[name] = {
        ...(toolDef as object),
        execute: async (...args: any[]) => {
          const query = this.extractToolQuery(args[0]);
          onToolEvent({
            name,
            category,
            query,
            input: args[0],
            status: 'start',
          });
          try {
            const result = await execute(...args);
            onToolEvent({
              name,
              category,
              query,
              input: args[0],
              status: 'done',
            });
            return result;
          } catch (error) {
            onToolEvent({
              name,
              category,
              query,
              input: args[0],
              status: 'error',
            });
            throw error;
          }
        },
      };
    }
    return wrapped;
  }

  /**
   * Freshness outer-wrap: appends the current date to search queries when
   * the intent requires recency. Runs outside the execution-event wrapper so
   * clients display the dated query the tool actually received.
   */
  private wrapToolsWithSearchRecency(
    tools: Record<string, unknown>,
    enabled: boolean,
  ): Record<string, unknown> {
    if (!enabled) return tools;

    const wrapped: Record<string, unknown> = {};
    for (const [name, toolDef] of Object.entries(tools)) {
      const execute = (toolDef as { execute?: (...args: any[]) => unknown })
        ?.execute;
      if (typeof execute !== 'function') {
        wrapped[name] = toolDef;
        continue;
      }
      wrapped[name] = {
        ...(toolDef as object),
        execute: (...args: any[]) =>
          execute(applySearchRecency(name, args[0]), ...args.slice(1)),
      };
    }
    return wrapped;
  }

  /** Pull the search query out of a tool input so clients can display it. */
  private extractToolQuery(input: unknown): string | undefined {
    if (!input || typeof input !== 'object') return undefined;
    const query = (input as Record<string, unknown>).query;
    return typeof query === 'string' && query.trim() ? query.trim() : undefined;
  }

  /**
   * Build the messages for execute mode — system prompt at index 0, followed by conversation.
   */
  private buildExecuteMessages(
    ctx: HarnessContext,
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    availableVariants: VariantName[],
  ): InputMessage[] {
    const baseSystem = ctx.request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const executePrompt =
      buffers.length > 0
        ? buildImageExecutePrompt(
            availableVariants,
            ctx.outputs.intent?.language ?? undefined,
          )
        : buildToolExecutePrompt(ctx.outputs.intent);

    const imageInventory = this.buildImageInventory(buffers, meta);

    // Downstream steps see the query-focused context the interpret step
    // derived, not the full transcript.
    const contextSummary = ctx.outputs.intent?.contextSummary?.trim();
    const contextSection = contextSummary
      ? buildContextSummarySection(contextSummary)
      : '';

    const systemContent = [
      baseSystem,
      executePrompt,
      imageInventory,
      contextSection,
    ]
      .filter(Boolean)
      .join('\n\n');

    return [
      { role: 'system' as const, content: systemContent },
      ...this.buildConversationMessages(ctx, buffers),
    ];
  }

  private buildImageInventory(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
  ): string {
    if (buffers.length === 0) return '';
    const filenames = buildFilenames(
      meta as Parameters<typeof buildFilenames>[0],
    );
    return `Image attachment(s): ${filenames || '(attached)'}`;
  }

  private buildConversationMessages(
    ctx: HarnessContext,
    buffers: Buffer[],
  ): InputMessage[] {
    const fullConversation = ctx.request.messages.filter(
      (m) => m.role !== 'system',
    );
    const selection = selectStepHistory({
      messages: fullConversation,
      template: ctx.outputs.intent?.template,
    });

    this.stepLogger.log(ctx, 'execute', 'history selected', {
      mode: selection.mode,
      keptCount: selection.messages.length,
      droppedCount: fullConversation.length - selection.messages.length,
    });

    const conversation = selection.messages;

    if (buffers.length === 0) return conversation;

    const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');

    if (lastUserIndex >= 0) {
      const original = conversation[lastUserIndex];
      conversation[lastUserIndex] = {
        ...original,
        images: buffers,
      };
    } else {
      conversation.push({
        role: 'user',
        content: '',
        images: buffers,
      });
    }

    return conversation;
  }

  /**
   * Extract a search query from the context — prefers user messages first, falls back to intent contextSummary.
   */
  private extractQuery(
    ctx: HarnessContext,
    intent: NonNullable<HarnessContext['outputs']['intent']>,
  ): string {
    const lastUser = [...ctx.request.messages]
      .reverse()
      .find((m) => m.role === 'user');
    const rawQuery = (lastUser?.content ?? ctx.lastUserPrompt)?.trim() ?? '';

    const contextSummary = intent.contextSummary?.trim() ?? '';
    const words = rawQuery.split(/\s+/).filter(Boolean);
    const isVagueFollowUp =
      words.length < 5 ||
      /\b(these|those|this|that|sie|dies|das|den|dem|search\s+online|online\s+search)\b/i.test(
        rawQuery,
      );
    const hasConcreteSubject =
      /\b(?:Stellar|Blade|Gothic|Nioh|game|movie|film|book|product|company|person|artist|album)\b/i.test(
        rawQuery,
      );

    if (contextSummary && isVagueFollowUp && !hasConcreteSubject)
      return contextSummary.slice(0, 250).replace(/\s+/g, ' ').trim();

    return rawQuery.slice(0, 300);
  }

  private async invokeMissingMandatoryTools(
    chosenTools: Record<string, unknown>,
    ctx: HarnessContext,
    existingResults: Array<{ toolName: string; result: unknown }>,
  ): Promise<Array<{ toolName: string; result: unknown }>> {
    const intent = ctx.outputs.intent ?? null;
    if (!intent) return [];

    const invoked = new Set<string>(existingResults.map((tr) => tr.toolName));
    const mandatory = (intent.tools ?? []).filter(
      (t) => !t.startsWith('request') && !invoked.has(t),
    );
    if (mandatory.length === 0) return [];

    const query = this.extractQuery(ctx, intent);
    const results: Array<{ toolName: string; result: unknown }> = [];

    for (const toolName of mandatory) {
      const toolDef = chosenTools[toolName];
      if (!toolDef || typeof (toolDef as any).execute !== 'function') continue;

      const input = buildFallbackInput(
        toolName,
        query,
        intent.imageCount ?? undefined,
        intent.videoCount ?? undefined,
        intent.language ?? undefined,
      );
      if (!input) continue;

      try {
        const result = await (toolDef as any).execute(input);
        results.push({ toolName, result });
      } catch (err) {
        this.stepLogger.warn(ctx, 'execute', 'missing tool error', {
          toolName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }
}
