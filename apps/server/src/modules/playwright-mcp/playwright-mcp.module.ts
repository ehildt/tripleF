import { DynamicModule, Module } from '@nestjs/common';

import { PlaywrightMcpConfigService } from './configs/playwright-mcp-config.service.js';

/**
 * Playwright MCP sidecar configuration. Consumed by the harness's
 * browser-automation client; the sidecar itself runs outside the server
 * process.
 */
@Module({})
export class PlaywrightMcpModule {
  private static readonly registration: DynamicModule = {
    module: PlaywrightMcpModule,
    exports: [PlaywrightMcpConfigService],
    providers: [PlaywrightMcpConfigService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return PlaywrightMcpModule.registration;
  }
}
