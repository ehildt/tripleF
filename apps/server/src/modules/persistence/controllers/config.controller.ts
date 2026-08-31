import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpsertConfigDto } from '../dtos/config.dto.js';
import { ConfigParamsDto } from '../dtos/config-params.dto.js';
import { ConfigService } from '../services/config.service.js';

@ApiTags('Configs')
@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get(':sessionId')
  @ApiOperation({
    summary:
      'Get persisted config for a session (empty body when none persisted yet)',
  })
  get(@Param() params: ConfigParamsDto) {
    return this.configService.getConfig(params.sessionId);
  }

  @Put(':sessionId')
  @ApiOperation({ summary: 'Upsert persisted config for a session' })
  async upsert(
    @Param() params: ConfigParamsDto,
    @Body() body: UpsertConfigDto,
  ) {
    return this.configService.updateConfig(params.sessionId, {
      selectedModel: body.selectedModel,
      preprocessing: body.preprocessing,
      providerOverrides: body.providerOverrides,
      memoryPartition: body.memoryPartition,
      memoryCognition: body.memoryCognition,
    });
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete persisted config for a session' })
  async delete(@Param() params: ConfigParamsDto) {
    return this.configService.deleteConfig(params.sessionId);
  }
}
