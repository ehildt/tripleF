import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type SharpOverridesPatch,
  SharpOverridesService,
} from '../services/sharp-overrides.service.js';

@ApiTags('Sharp Overrides')
@Controller('sharp-overrides')
export class SharpOverridesController {
  constructor(private readonly sharpOverrides: SharpOverridesService) {}

  @Get()
  @ApiOperation({ summary: 'Current preprocessing configuration' })
  getConfig() {
    return this.sharpOverrides.getConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update preprocessing configuration overrides' })
  updateConfig(@Body() body: SharpOverridesPatch) {
    this.sharpOverrides.updateConfig(body);
    return { success: true };
  }
}
