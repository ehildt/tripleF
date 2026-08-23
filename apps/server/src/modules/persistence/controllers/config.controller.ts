import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpsertConfigDto } from '../dtos/config.dto.js';
import { ConfigService } from '../services/config.service.js';

@ApiTags('Configs')
@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get persisted config for a session' })
  async get(@Param('sessionId') sessionId: string) {
    const config = await this.configService.getConfig(sessionId);
    if (!config) throw new NotFoundException();
    return config;
  }

  @Put(':sessionId')
  @ApiOperation({ summary: 'Upsert persisted config for a session' })
  async upsert(
    @Param('sessionId') sessionId: string,
    @Body() body: UpsertConfigDto,
  ) {
    return this.configService.updateConfig(sessionId, {
      selectedModel: body.selectedModel,
      preprocessing: body.preprocessing,
      providerOverrides: body.providerOverrides,
      memoryPartition: body.memoryPartition,
      memoryCognition: body.memoryCognition,
    });
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete persisted config for a session' })
  async delete(@Param('sessionId') sessionId: string) {
    return this.configService.deleteConfig(sessionId);
  }
}
