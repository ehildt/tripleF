import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProviderOverridesService } from '../services/provider-overrides.service.js';

@ApiTags('Provider Overrides')
@Controller('provider-overrides')
export class ProviderOverridesController {
  constructor(private readonly providerOverrides: ProviderOverridesService) {}

  @Get()
  @ApiOperation({ summary: 'Current provider configuration (API keys masked)' })
  getConfig() {
    return this.providerOverrides.getMaskedConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update provider configuration overrides' })
  updateConfig(@Body() body: Record<string, Record<string, any>>) {
    this.providerOverrides.updateConfig(body);
    return { success: true };
  }
}
