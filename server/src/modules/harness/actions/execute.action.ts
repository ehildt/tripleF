import { Injectable } from '@nestjs/common';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { ToolSelectionService } from '../../ai-sdk/services/tool-selection.service.js';
import type { ToolResult } from '../../ai-sdk/types/ai-sdk-params.types.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { type FilterVariant } from '../../sharp/types/image-variant.types.js';
import { buildEodhdFallbackInput } from '../helpers/execute/build-eodhd-fallback-input.helper.js';
import { buildExecuteMessages } from '../helpers/execute/build-execute-messages.helper.js';
import { buildFallbackInput } from '../helpers/execute/build-execute-prompt.helper.js';
import { extractEodhdTickerFromResults } from '../helpers/execute/extract-eodhd-ticker.helper.js';
import { extractQuery } from '../helpers/execute/extract-query.helper.js';
import { isEodhdDataTool } from '../helpers/execute/is-eodhd-data-tool.helper.js';
import {
  type ChartDataHandler,
  wrapToolsWithChartStreaming,
} from '../helpers/execute/wrap-tools-with-chart-streaming.helper.js';
import {
  type ToolExecutionEventHandler,
  wrapToolsWithExecutionEvents,
} from '../helpers/execute/wrap-tools-with-execution-events.helper.js';
import { wrapToolsWithSearchRecency } from '../helpers/execute/wrap-tools-with-search-recency.helper.js';
import { type VariantName } from '../helpers/tools/tool-registry.constants.js';
import type { HarnessContext } from '../services/harness-context.type.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';

import type { ExecuteResult } from './execute.action.types.js';

/**
 * Browsing needs a step budget: navigate → snapshot → interact, unlike the
 * single round-trip the search tools use.
 */
const BROWSER_MAX_STEPS = 8;

@Injectable()
export class ExecuteActionService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly toolSelectionService: ToolSelectionService,
    private readonly sharpService: SharpService,
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
    onChartData?: ChartDataHandler,
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
    // Browser intents chain several browser_* calls within one execute step.
    const maxSteps = allToolNames.some((name) => name.startsWith('browser_'))
      ? BROWSER_MAX_STEPS
      : undefined;
    const selectedTools =
      allToolNames.length > 0
        ? this.toolSelectionService.selectToolsByName(
            allToolNames as any[],
            undefined,
            undefined,
            availableVariants,
            intent.language ?? undefined,
          )
        : {};
    const chosenTools = wrapToolsWithChartStreaming(
      wrapToolsWithSearchRecency(
        wrapToolsWithExecutionEvents(selectedTools, onToolEvent),
        intent.getDate !== false,
      ),
      onChartData,
    );

    // 4. Run the tool model call with resized images
    let toolResults: ToolResult[] = [];
    let inputTokens = 0;
    let outputTokens = 0;

    if (Object.keys(chosenTools).length > 0) {
      const executeMessages = buildExecuteMessages(
        ctx,
        buffers,
        processedMeta,
        availableVariants,
        this.stepLogger,
      );

      const result = await this.aiSdkService.generateWithTools({
        model: ctx.model,
        messages: executeMessages,
        keepAlive: this.ollamaConfigService.config.keepAlive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        tools: chosenTools as any,
        abortSignal,
        maxSteps,
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

  private async invokeMissingMandatoryTools(
    chosenTools: Record<string, unknown>,
    ctx: HarnessContext,
    existingResults: ToolResult[],
  ): Promise<ToolResult[]> {
    const intent = ctx.outputs.intent ?? null;
    if (!intent) return [];

    const invoked = new Set<string>(existingResults.map((tr) => tr.toolName));
    const mandatory = (intent.tools ?? []).filter(
      (t) => !t.startsWith('request') && !invoked.has(t),
    );
    if (mandatory.length === 0) return [];

    const query = extractQuery(ctx, intent);
    const results: ToolResult[] = [];
    const ticker = await this.resolveMissingEodhdTicker(
      chosenTools,
      existingResults,
      query,
      mandatory,
    );

    for (const toolName of mandatory) {
      const toolDef = chosenTools[toolName];
      if (!toolDef || typeof (toolDef as any).execute !== 'function') continue;

      const input = this.buildMissingToolInput(toolName, query, ticker, intent);
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

  /**
   * Resolve a ticker for any missing EODHD data tools, from the search results
   * the model already produced or by running eodhdSearch ourselves, so the
   * chart/quote tools can still be invoked when the model skips them.
   */
  private async resolveMissingEodhdTicker(
    chosenTools: Record<string, unknown>,
    existingResults: ToolResult[],
    query: string,
    mandatory: string[],
  ): Promise<string | undefined> {
    if (!mandatory.some(isEodhdDataTool)) return undefined;
    const ticker = extractEodhdTickerFromResults(existingResults);
    if (ticker) return ticker;
    return this.resolveEodhdTicker(chosenTools, query);
  }

  /** Build the fallback input for a missing mandatory tool. */
  private buildMissingToolInput(
    toolName: string,
    query: string,
    ticker: string | undefined,
    intent: HarnessContext['outputs']['intent'],
  ): unknown | undefined {
    if (isEodhdDataTool(toolName)) {
      return ticker ? buildEodhdFallbackInput(toolName, ticker) : undefined;
    }
    return buildFallbackInput(
      toolName,
      query,
      intent.imageCount ?? undefined,
      intent.videoCount ?? undefined,
      intent.language ?? undefined,
    );
  }

  /** Resolve a ticker by running eodhdSearch with the extracted query. */
  private async resolveEodhdTicker(
    chosenTools: Record<string, unknown>,
    query: string,
  ): Promise<string | undefined> {
    const searchTool = chosenTools['eodhdSearch'] as
      { execute?: (input: unknown) => Promise<unknown> } | undefined;
    if (!searchTool?.execute) return undefined;
    try {
      const result = await searchTool.execute({ query });
      const results = (result as { results?: Array<{ code?: string }> })
        ?.results;
      return results?.find((r) => r.code)?.code;
    } catch {
      return undefined;
    }
  }
}
