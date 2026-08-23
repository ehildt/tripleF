import { Body, Controller, Delete, Get, Put } from '@nestjs/common';

import {
  ApeDeleteMemoryOverrides,
  ApeGetMemoryOverrides,
  ApePutMemoryOverrides,
  ApeTagsMemoryOverrides,
} from '../decorators/openapi/swagger.js';
import { MemoryOverridesDto } from '../dtos/memory-overrides.dto.js';
import { MemoryOverridesService } from '../services/memory-overrides.service.js';

@ApeTagsMemoryOverrides()
@Controller('memory-overrides')
export class MemoryOverridesController {
  constructor(private readonly memoryOverrides: MemoryOverridesService) {}

  @Get()
  @ApeGetMemoryOverrides()
  getConfig() {
    return this.memoryOverrides.getConfig();
  }

  @Put()
  @ApePutMemoryOverrides()
  updateConfig(@Body() body: MemoryOverridesDto) {
    this.memoryOverrides.updateConfig(body ?? {});
    return this.memoryOverrides.getConfig();
  }

  @Delete()
  @ApeDeleteMemoryOverrides()
  resetConfig() {
    return this.memoryOverrides.resetConfig();
  }
}
