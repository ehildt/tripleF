import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MemoryOverridesDto } from '../dtos/memory-overrides.dto.js';
import { MemoryOverridesService } from '../services/memory-overrides.service.js';

@ApiTags('Memory Overrides')
@Controller('memory-overrides')
export class MemoryOverridesController {
  constructor(private readonly memoryOverrides: MemoryOverridesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Current memory system variables (sysctl → system): effective value, env baseline, override flag',
  })
  getConfig() {
    return this.memoryOverrides.getConfig();
  }

  @Put()
  @ApiOperation({
    summary:
      'Update memory system variables — takes effect on the very next request',
  })
  updateConfig(@Body() body: MemoryOverridesDto) {
    this.memoryOverrides.updateConfig(body ?? {});
    return this.memoryOverrides.getConfig();
  }

  @Delete()
  @ApiOperation({ summary: 'Reset memory system variables to env defaults' })
  resetConfig() {
    return this.memoryOverrides.resetConfig();
  }
}
