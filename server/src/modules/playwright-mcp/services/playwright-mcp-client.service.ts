import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { ToolSet } from 'ai';

import { BROWSER_TOOL_NAMES } from '../../harness/helpers/tools/tool-registry.constants.js';
import { PlaywrightMcpConfigService } from '../configs/playwright-mcp-config.service.js';

/**
 * Browser tools that must never reach the model, regardless of allow-lists:
 * arbitrary code execution is RCE-equivalent and file upload reads absolute
 * paths off the sidecar's filesystem.
 */
const DENIED_BROWSER_TOOLS = [
  'browser_run_code',
  'browser_run_code_unsafe',
  'browser_evaluate',
  'browser_file_upload',
] as const;

/** One warn per minute is enough when the sidecar is down. */
const FAILURE_WARN_THROTTLE_MS = 60_000;

@Injectable()
export class PlaywrightMcpClientService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PlaywrightMcpClientService.name);
  private client?: MCPClient;
  private cachedTools: ToolSet = {};
  private connecting?: Promise<void>;
  private lastFailureWarnAt = 0;

  constructor(
    private readonly playwrightMcpConfig: PlaywrightMcpConfigService,
  ) {}

  get enabled(): boolean {
    return this.playwrightMcpConfig.config.enabled;
  }

  /**
   * Cached MCP tools converted to AI SDK tools. Empty while the sidecar is
   * unreachable — tool selection degrades to "no browser tools" instead of
   * failing the chat. Access also triggers a lazy reconnect.
   */
  get tools(): ToolSet {
    if (Object.keys(this.cachedTools).length === 0) void this.refresh();
    return this.cachedTools;
  }

  onApplicationBootstrap() {
    void this.refresh();
  }

  /** Connect once and cache the filtered tool set; failures are logged and swallowed. */
  async refresh(): Promise<void> {
    if (!this.enabled || this.client || this.connecting) return;
    this.connecting = this.connect()
      .catch((error) => this.warnThrottled(error))
      .finally(() => {
        this.connecting = undefined;
      });
    return this.connecting;
  }

  async onApplicationShutdown() {
    await this.client?.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    const { url, tools } = this.playwrightMcpConfig.config;
    const allowed = new Set(tools ?? BROWSER_TOOL_NAMES);

    const client = await createMCPClient({ transport: { type: 'http', url } });
    const available = (await client.tools()) as ToolSet;

    const filtered: ToolSet = {};
    for (const [name, tool] of Object.entries(available)) {
      if (!allowed.has(name)) continue;
      if ((DENIED_BROWSER_TOOLS as readonly string[]).includes(name)) continue;
      filtered[name] = tool;
    }

    this.client = client;
    this.cachedTools = filtered;
    this.logger.log(
      `Connected to ${url} — ${Object.keys(filtered).length} browser tools exposed`,
    );
  }

  private warnThrottled(error: unknown): void {
    const now = Date.now();
    if (now - this.lastFailureWarnAt < FAILURE_WARN_THROTTLE_MS) return;
    this.lastFailureWarnAt = now;
    this.logger.warn(
      `Playwright MCP unreachable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
