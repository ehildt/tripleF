import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OllamaOverridesPatchDto } from '../dtos/ollama-overrides-patch.dto.js';
import { OllamaOverridesService } from '../services/ollama-overrides.service.js';

@ApiTags('Ollama Overrides')
@Controller('ollama-overrides')
export class OllamaOverridesController {
  constructor(private readonly ollamaOverrides: OllamaOverridesService) {}

  @Get()
  @ApiOperation({ summary: 'Current Ollama connection (API keys masked)' })
  getConfig() {
    return this.ollamaOverrides.getMaskedConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update Ollama connection overrides' })
  updateConfig(@Body() body: OllamaOverridesPatchDto) {
    this.ollamaOverrides.updateConfig(body ?? {});
    return { success: true };
  }

  @Delete()
  @ApiOperation({
    summary: 'Reset Ollama connection to its env defaults (API keys masked)',
  })
  resetConfig() {
    return this.ollamaOverrides.resetConfig();
  }
}
