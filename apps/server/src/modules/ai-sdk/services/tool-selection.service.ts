import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ToolSet } from 'ai';

import { type ToolName } from '../../harness/helpers/tools/tool-registry.constants.js';
import type { MemoryClientConfig } from '../../memory-client/configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../../memory-client/constants/memory-client.constants.js';
import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { PlaywrightMcpClientService } from '../../playwright-mcp/services/playwright-mcp-client.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { StockHistoryService } from '../../stock-data/services/stock-history.service.js';
import { createEnabledTools } from '../tools/sources/create-enabled-tools.js';
import { createMemoryDeleteTool } from '../tools/sources/memory/memory-delete.tool.js';
import { createMemoryRecallTool } from '../tools/sources/memory/memory-recall.tool.js';
import {
  createMemoryRememberTool,
  type MemoryToolScope,
} from '../tools/sources/memory/memory-remember.tool.js';
import { type ToolWithSummary } from '../tools/sources/tool-factory.js';

import { AiSdkService } from './ai-sdk.service.js';
import type { ToolEventHandler } from './tool-selection.service.types.js';

@Injectable()
export class ToolSelectionService {
  private readonly logger = new Logger(ToolSelectionService.name);

  constructor(
    private readonly providerOverrides: ProviderOverridesService,
    private readonly aiSdkService: AiSdkService,
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
        compactContent: (content, opts) =>
          this.aiSdkService.compactContent(content, {
            model: opts?.model ?? model ?? 'mistral',
            notify: opts?.notify ?? notify,
          }),
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
    // Memory tools are agentic: remember/recall/delete are offered only when
    // the memory feature is enabled AND a partition scope is threaded from
    // the turn.
    const memoryTools =
      memoryScope && this.memoryConfig.enabled
        ? {
            memoryRemember: createMemoryRememberTool({
              scope: memoryScope,
              storeRecord: (input) => this.memoryClient.storeRecord(input),
            }),
            memoryRecall: createMemoryRecallTool({
              scope: memoryScope,
              searchByText: (input) => this.memoryClient.searchByText(input),
            }),
            memoryDelete: createMemoryDeleteTool({
              scope: memoryScope,
              deleteRecords: (input) => this.memoryClient.deleteRecords(input),
              deleteCognition: (partition) =>
                this.memoryClient.deleteCognition(partition),
            }),
          }
        : {};
    return { ...tools, ...this.playwrightMcpClient.tools, ...memoryTools };
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
