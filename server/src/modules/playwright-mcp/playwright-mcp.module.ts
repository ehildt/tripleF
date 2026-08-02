import { Global, Module } from '@nestjs/common';

import { PlaywrightMcpConfigService } from './configs/playwright-mcp-config.service.js';
import { PlaywrightMcpClientService } from './services/playwright-mcp-client.service.js';

@Global()
@Module({
  providers: [PlaywrightMcpConfigService, PlaywrightMcpClientService],
  exports: [PlaywrightMcpConfigService, PlaywrightMcpClientService],
})
export class PlaywrightMcpModule {}
