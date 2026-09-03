import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENCYCLOPEDIA_TOOL_NAMES, type ToolName } from '@triplef/agent/schemas';
import { createEncyclopediaReadTool } from '@triplef/agent/tools';
import { createEncyclopediaSearchTool } from '@triplef/agent/tools';
import { createMemoryCognitionForgetTool } from '@triplef/agent/tools';
import { createMemoryCognitionRememberTool } from '@triplef/agent/tools';
import { createMemoryPartitionDeleteTool } from '@triplef/agent/tools';
import { createMemoryPartitionRecallTool } from '@triplef/agent/tools';
import {
  createMemoryPartitionRememberTool,
  type MemoryToolScope,
} from '@triplef/agent/tools';
import { type ToolWithSummary } from '@triplef/agent/tools';
import type { ToolSet } from 'ai';

import type { MemoryClientConfig } from '../../memory-client/configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../../memory-client/constants/memory-client.constants.js';
import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { StockHistoryService } from '../../stock-data/services/stock-history.service.js';
import { createEnabledTools } from '../tools/sources/create-enabled-tools.js';

import { PlaywrightMcpClientService } from './playwright-mcp-client.service.js';
import type { ToolEventHandler } from './tool-selection.service.types.js';

@Injectable()
export class ToolSelectionService {
  private readonly logger = new Logger(ToolSelectionService.name);

  constructor(
    private readonly providerOverrides: ProviderOverridesService,
    private readonly playwrightMcpClient: PlaywrightMcpClientService,
    private readonly stockHistory: StockHistoryService,
    private readonly memoryClient: MemoryClientService,
    @Inject(MEMORY_CLIENT_CONFIG)
    private readonly memoryConfig: MemoryClientConfig,
  ) {}

  private get liveConfig() {
    return this.providerOverrides.getConfig();
  }

  getDefaultTools(
    model?: string,
    notify?: (event: string, data?: unknown) => void,
    enabledVariants?: string[],
    defaultLang?: string,
    memoryScope?: MemoryToolScope,
  ): ToolSet {
    const tools = createEnabledTools(
      {
        getLiveConfig: () => this.liveConfig,
        logger: this.logger,
        model,
        notify,
        defaultLang,
        getOrFetchHistory: (ticker, from, to) =>
          this.stockHistory.getHistory(ticker, from, to),
      },
      enabledVariants,
    );
    // Browser tools come from the Playwright MCP sidecar (empty when disabled
    // or unreachable) and are merged under their canonical browser_* names.
    // Memory tools are agentic: the partition remember/recall/delete trio and
    // the cognition remember/forget pair are offered only when the memory
    // feature is enabled AND a partition scope is threaded from the turn.
    const memoryTools =
      memoryScope && this.memoryConfig.enabled
        ? {
            'memory-partition-remember': createMemoryPartitionRememberTool({
              scope: memoryScope,
              storeRecord: (input) => this.memoryClient.storeRecord(input),
            }),
            'memory-partition-recall': createMemoryPartitionRecallTool({
              scope: memoryScope,
              searchByText: (input) => this.memoryClient.searchByText(input),
            }),
            'memory-partition-delete': createMemoryPartitionDeleteTool({
              scope: memoryScope,
              deleteRecords: (input) => this.memoryClient.deleteRecords(input),
            }),
            'memory-cognition-remember': createMemoryCognitionRememberTool({
              scope: memoryScope,
              storeInsight: (input) => this.memoryClient.storeInsight(input),
            }),
            'memory-cognition-forget': createMemoryCognitionForgetTool({
              scope: memoryScope,
              deleteCognition: (partition) =>
                this.memoryClient.deleteCognition(partition),
            }),
          }
        : {};
    // The encyclopedia pair is ALWAYS offered when memory is enabled — never
    // classifier-picked: the model itself decides when to consult the
    // knowledge base (chained after the memory probe) and when a document
    // deep-dive beats a live fetch. Global knowledge — no partition scope.
    const encyclopediaTools = this.memoryConfig.enabled
      ? {
          'encyclopedia-search': createEncyclopediaSearchTool({
            search: ({ text, url, domain, limit }) =>
              this.memoryClient.searchEncyclopedia({
                query: text,
                url,
                domain,
                limit,
              }),
          }),
          'encyclopedia-read': createEncyclopediaReadTool({
            readDocument: (input) =>
              this.memoryClient.readEncyclopediaDocument(input),
          }),
        }
      : {};
    return {
      ...tools,
      ...this.playwrightMcpClient.tools,
      ...memoryTools,
      ...encyclopediaTools,
    };
  }

  /**
   * Tool names force-included in every execute wave when memory is enabled —
   * the model's own knowledge-base probe, offered regardless of the picked
   * intent so it can consult the encyclopedia on any turn.
   */
  getAlwaysOnToolNames(): string[] {
    return this.memoryConfig.enabled ? [...ENCYCLOPEDIA_TOOL_NAMES] : [];
  }

  selectToolsByName(
    names: ToolName[],
    notify?: (event: string, data?: unknown) => void,
    onToolEvent?: ToolEventHandler,
    enabledVariants?: string[],
    defaultLang?: string,
    memoryScope?: MemoryToolScope,
  ): ToolSet {
    const all = this.getDefaultTools(
      undefined,
      notify,
      enabledVariants,
      defaultLang,
      memoryScope,
    );
    const picked: ToolSet = {};

    for (const name of names) {
      const tool = this.resolveTool(all, name, onToolEvent);
      if (tool) picked[name] = tool;
    }

    return picked;
  }

  private resolveTool(
    all: ToolSet,
    name: ToolName,
    onToolEvent?: ToolEventHandler,
  ): ToolWithSummary | undefined {
    const original = all[name];
    if (!original) {
      this.logMissingTool(name);
      return undefined;
    }

    if (!original.execute || !onToolEvent) return original;

    return this.wrapToolWithEvents(original, name, onToolEvent);
  }

  private logMissingTool(name: ToolName): void {
    if (name) this.logger.warn(`Tool "${name}" not found — skipping`);
  }

  private wrapToolWithEvents(
    tool: ToolWithSummary,
    name: string,
    onToolEvent: ToolEventHandler,
  ): ToolWithSummary {
    const originalExecute = tool.execute;

    return {
      ...tool,
      execute: async (args: unknown) => {
        onToolEvent({ name, input: args, status: 'start' });

        try {
          const result = await (originalExecute as any)(args);
          onToolEvent({
            name,
            status: 'done',
            result: this.summarizeToolResult(tool, result),
          });
          return result;
        } catch (err) {
          onToolEvent({ name, status: 'error' });
          throw err;
        }
      },
    };
  }

  private summarizeToolResult(
    tool: ToolWithSummary,
    result: unknown,
  ): Record<string, unknown> {
    const data = result as Record<string, unknown> | undefined;
    if (!data || data.error) return { error: data?.error ?? 'unknown' };
    return tool.summarize?.(data) ?? {};
  }
}
