import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProviderOverridesPatchDto } from '../dtos/provider-overrides-patch.dto.js';
import { ProviderParamsDto } from '../dtos/provider-params.dto.js';
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
  updateConfig(@Body() body: ProviderOverridesPatchDto) {
    this.providerOverrides.updateConfig(body);
    return { success: true };
  }

  @Delete(':provider')
  @ApiOperation({
    summary: 'Reset one provider to its env defaults (API keys masked)',
  })
  resetConfig(@Param() params: ProviderParamsDto) {
    this.providerOverrides.resetConfig(params.provider);
    return this.providerOverrides.getMaskedConfig();
  }
}
