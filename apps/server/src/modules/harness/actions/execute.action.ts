import { Injectable, Logger } from '@nestjs/common';
import { type VariantName } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';
import type { ToolResult } from '@triplef/ai-sdk';
import { AiSdkService } from '@triplef/ai-sdk';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../ai-sdk/helpers/provider-options.helper.js';
import { ToolSelectionService } from '../../ai-sdk/services/tool-selection.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { type FilterVariant } from '../../sharp/types/image-variant.types.js';
import { buildEodhdFallbackInput } from '../helpers/execute/build-eodhd-fallback-input.helper.js';
import { buildExecuteMessages } from '../helpers/execute/build-execute-messages.helper.js';
import { buildMissingToolsPrompt } from '../helpers/execute/build-missing-tools-prompt.helper.js';
import { collectAutoFetchUrls } from '../helpers/execute/collect-auto-fetch-urls.helper.js';
import { extractEodhdTickerFromResults } from '../helpers/execute/extract-eodhd-ticker.helper.js';
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
import type { HarnessContext } from '../services/harness-context.type.js';

import { fetchUrlOutcome } from './helpers/fetch-url-outcome.helper.js';
import type { ExecuteResult } from './execute.action.types.js';
/**
 * Browsing needs a step budget: navigate → snapshot → interact, unlike the
 * single round-trip the search tools use.
 */
const BROWSER_MAX_STEPS = 8;

/**
 * memory-partition-delete needs recall → delete chaining: the model recalls
 * the verbatim statement, then deletes it. One blind round can never express
 * that, so delete intents get a small step budget like the browser tools.
 */
const MEMORY_DELETE_MAX_STEPS = 3;

/**
 * Max search-result pages the auto-fetch fallback fetches when the model
 * searched but selected no fetch tool (deterministic, not model-authored).
 */
const AUTO_FETCH_MAX_URLS = 3;

/** Concurrent webFetch calls per auto-fetch batch — bounds the fallback's latency. */
const AUTO_FETCH_CONCURRENCY = 4;

@Injectable()
export class ExecuteActionService {
  private readonly logger = new Logger(ExecuteActionService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly toolSelectionService: ToolSelectionService,
    private readonly sharpService: SharpService,
    private readonly ollamaConfigService: OllamaConfigService,
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
    // Browser intents chain several browser_* calls within one execute step;
    // a delete intent chains memory-partition-recall → memory-partition-delete
    // for the verbatim text.
    const maxSteps = allToolNames.some((name) => name.startsWith('browser_'))
      ? BROWSER_MAX_STEPS
      : allToolNames.includes('memory-partition-delete')
        ? MEMORY_DELETE_MAX_STEPS
        : undefined;
    const selectedTools =
      allToolNames.length > 0
        ? this.toolSelectionService.selectToolsByName(
            allToolNames as any[],
            undefined,
            undefined,
            availableVariants,
            intent.language ?? undefined,
            // Memory tools are partition-scoped: bind them to this turn's
            // partition so remember/recall/delete can never cross space
            // boundaries. The request id traces remembers back to the turn
            // that stored them.
            {
              memoryPartition:
                ctx.memoryPartition ?? ctx.sessionId ?? ctx.requestId,
              memoryCognition:
                ctx.memoryCognition ??
                ctx.memoryPartition ??
                ctx.sessionId ??
                ctx.requestId,
              sessionId: ctx.sessionId,
              conversationId: ctx.filters.conversationId,
              requestId: ctx.requestId,
            },
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
      const { messages: executeMessages, historySelection } =
        buildExecuteMessages(ctx, buffers, processedMeta, availableVariants);

      this.logger.log(
        { requestId: ctx.requestId, step: 'execute', ...historySelection },
        'history selected',
      );

      const result = await this.aiSdkService.generateWithTools({
        model: ctx.model,
        messages: executeMessages,
        providerOptions: buildProviderOptions({
          keepAlive: this.ollamaConfigService.config.keepAlive,
          numCtx: ctx.request.options?.num_ctx,
          think: ctx.request.think,
        }),
        tools: chosenTools as any,
        abortSignal,
        maxSteps,
      });

      toolResults = result.toolResults;
      inputTokens = result.usage?.inputTokens ?? 0;
      outputTokens = result.usage?.outputTokens ?? 0;

      if (toolResults.length === 0) {
        this.logger.warn(
          {
            requestId: ctx.requestId,
            step: 'execute',
            model: ctx.model,
            textPreview: result.text?.slice(0, 300),
          },
          'no tool calls',
        );
      }

      const missing = await this.invokeMissingMandatoryTools(
        chosenTools,
        ctx,
        toolResults,
        executeMessages,
        abortSignal,
      );
      inputTokens += missing.inputTokens;
      outputTokens += missing.outputTokens;
      if (missing.results.length > 0) {
        toolResults.push(...missing.results);
        this.logger.log(
          {
            requestId: ctx.requestId,
            step: 'execute',
            tools: missing.results.map((r) => r.toolName),
          },
          'missing tools invoked',
        );
      }

      // Auto-fetch fallback: when the model searched but selected no fetch
      // tool, deterministically fetch the top result pages so the answer is
      // grounded in full content and the lexicon cache is populated.
      const autoFetched = await this.autoFetchSearchResults(
        ctx,
        intent,
        toolResults,
      );
      toolResults.push(...autoFetched);

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

  /**
   * Deterministically fetch the given URLs with the webFetch tool (the model
   * already opted out of fetching, so the harness fills the gap with the
   * search results' own URLs — no fabricated queries). Failures are
   * warn-and-continue: a failed fetch degrades to the snippets already held.
   */
  private async autoFetchSearchResults(
    ctx: HarnessContext,
    intent: HarnessContext['outputs']['intent'],
    toolResults: ToolResult[],
  ): Promise<ToolResult[]> {
    const urls = collectAutoFetchUrls(
      intent?.tools ?? [],
      toolResults,
      AUTO_FETCH_MAX_URLS,
    );
    if (urls.length === 0) return [];
    const fetched = await this.autoFetchPages(urls);
    this.logger.log(
      { requestId: ctx.requestId, step: 'execute', urls },
      'auto-fetched search result pages',
    );
    return fetched;
  }

  /**
   * Fetch each URL with the webFetch tool, warn-and-continue on failure — a
   * failed fetch degrades to the snippets already held, never a failed turn.
   * Batches run concurrently (bounded) so N pages land in ~N/concurrency
   * round-trips instead of N serial ones.
   */
  private async autoFetchPages(urls: string[]): Promise<ToolResult[]> {
    const webFetch = this.toolSelectionService.selectToolsByName([
      'webFetch',
    ]).webFetch;
    if (!webFetch?.execute) return [];
    const results: ToolResult[] = [];
    for (let i = 0; i < urls.length; i += AUTO_FETCH_CONCURRENCY) {
      const batch = urls.slice(i, i + AUTO_FETCH_CONCURRENCY);
      const outcomes = await Promise.all(
        batch.map((url) =>
          fetchUrlOutcome(
            url,
            webFetch.execute as (args: { url: string }) => Promise<unknown>,
          ),
        ),
      );
      for (const outcome of outcomes) {
        if (outcome.error) {
          this.logger.warn(
            { step: 'execute', url: outcome.url, err: outcome.error },
            'auto-fetch failed',
          );
        } else {
          results.push({ toolName: 'webFetch', result: outcome.result });
        }
      }
    }
    return results;
  }

  private resolveAllToolNames(
    intent: HarnessContext['outputs']['intent'],
    requestedVariants: FilterVariant[],
  ): string[] {
    const allToolNames = [];
    const externalTools = (intent?.tools ?? []).filter(
      // Both remember tools are deferred to the dedicated memory-write step:
      // the execute wave is a single blind round, so a remember call here
      // could never include the data this wave is about to gather.
      (t) =>
        !t.startsWith('request') &&
        t !== 'memory-partition-remember' &&
        t !== 'memory-cognition-remember',
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
   * Invoke mandatory tools the model skipped. Only the model writes tool
   * inputs — the harness has no understanding of the request, so a
   * harness-built query can only fabricate garbage. Skipped tools are sent
   * back to the model once with the same messages and just the missing
   * tools, so it calls them with purpose-built queries from the images and
   * context it already has. Search tools that are still skipped afterwards
   * are logged and dropped; EODHD data tools take no query text, so a ticker
   * parsed from existing search results may still invoke them directly.
   */
  private async invokeMissingMandatoryTools(
    chosenTools: Record<string, unknown>,
    ctx: HarnessContext,
    existingResults: ToolResult[],
    executeMessages: InputMessage[],
    abortSignal?: AbortSignal,
  ): Promise<{
    results: ToolResult[];
    inputTokens: number;
    outputTokens: number;
  }> {
    const intent = ctx.outputs.intent ?? null;
    if (!intent) return { results: [], inputTokens: 0, outputTokens: 0 };

    const invoked = new Set<string>(existingResults.map((tr) => tr.toolName));
    const missing = (intent.tools ?? []).filter(
      (t) =>
        !t.startsWith('request') &&
        t !== 'memory-partition-remember' &&
        t !== 'memory-cognition-remember' &&
        !invoked.has(t),
    );
    if (missing.length === 0)
      return { results: [], inputTokens: 0, outputTokens: 0 };

    const completion = await this.completeMissingToolsWithModel(
      ctx,
      missing,
      chosenTools,
      executeMessages,
      abortSignal,
    );
    const {
      results,
      inputTokens: completionInputTokens,
      outputTokens: completionOutputTokens,
    } = completion;

    const stillMissing = missing.filter(
      (t) => !results.some((r) => r.toolName === t),
    );
    const eodhdResults = await this.invokeMissingEodhdDataTools(
      chosenTools,
      ctx,
      [...existingResults, ...results],
      stillMissing,
    );
    results.push(...eodhdResults);

    const dropped = stillMissing.filter(
      (t) => !results.some((r) => r.toolName === t),
    );
    if (dropped.length > 0) {
      this.logger.warn(
        { requestId: ctx.requestId, step: 'execute', tools: dropped },
        'skipped missing tools',
      );
    }

    return {
      results,
      inputTokens: completionInputTokens,
      outputTokens: completionOutputTokens,
    };
  }

  /**
   * Re-invoke the model once with only the skipped tools, so it authors
   * purpose-built inputs for them instead of the harness guessing.
   */
  private async completeMissingToolsWithModel(
    ctx: HarnessContext,
    missing: string[],
    chosenTools: Record<string, unknown>,
    executeMessages: InputMessage[],
    abortSignal?: AbortSignal,
  ): Promise<{
    results: ToolResult[];
    inputTokens: number;
    outputTokens: number;
  }> {
    const missingTools = Object.fromEntries(
      missing
        .filter((name) => name in chosenTools)
        .map((name) => [name, chosenTools[name]]),
    );
    if (Object.keys(missingTools).length === 0)
      return { results: [], inputTokens: 0, outputTokens: 0 };

    try {
      const completion = await this.aiSdkService.generateWithTools({
        model: ctx.model,
        messages: [
          ...executeMessages,
          { role: 'system', content: buildMissingToolsPrompt(missing) },
        ],
        providerOptions: buildProviderOptions({
          keepAlive: this.ollamaConfigService.config.keepAlive,
          numCtx: ctx.request.options?.num_ctx,
          think: ctx.request.think,
        }),
        tools: missingTools as any,
        abortSignal,
      });
      return {
        results: completion.toolResults,
        inputTokens: completion.usage?.inputTokens ?? 0,
        outputTokens: completion.usage?.outputTokens ?? 0,
      };
    } catch (err) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'execute',
          err: err instanceof Error ? err : new Error(String(err)),
        },
        'missing tools completion failed',
      );
      return { results: [], inputTokens: 0, outputTokens: 0 };
    }
  }

  /**
   * Invoke EODHD data tools that are still missing when a ticker can be
   * parsed from the search results already produced — a deterministic input,
   * not a fabricated query.
   */
  private async invokeMissingEodhdDataTools(
    chosenTools: Record<string, unknown>,
    ctx: HarnessContext,
    results: ToolResult[],
    stillMissing: string[],
  ): Promise<ToolResult[]> {
    const dataTools = stillMissing.filter(isEodhdDataTool);
    if (dataTools.length === 0) return [];

    const ticker = extractEodhdTickerFromResults(results);
    if (!ticker) return [];

    const invocations: ToolResult[] = [];
    for (const toolName of dataTools) {
      const toolDef = chosenTools[toolName];
      if (!toolDef || typeof (toolDef as any).execute !== 'function') continue;
      try {
        const result = await (toolDef as any).execute(
          buildEodhdFallbackInput(toolName, ticker),
        );
        invocations.push({ toolName, result });
      } catch (err) {
        this.logger.warn(
          {
            requestId: ctx.requestId,
            step: 'execute',
            toolName,
            err: err instanceof Error ? err : new Error(String(err)),
          },
          'missing tool error',
        );
      }
    }
    return invocations;
  }
}
