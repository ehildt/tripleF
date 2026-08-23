import { Controller, Get } from '@nestjs/common';

import {
  ApeGetHealthLive,
  ApeGetHealthReady,
  ApeTagsHealth,
} from '../decorators/openapi/swagger.js';
import { HealthService } from '../services/health.service.js';

@ApeTagsHealth()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('ready')
  @ApeGetHealthReady()
  async ready() {
    return this.healthService.checkReady();
  }

  @Get('live')
  @ApeGetHealthLive()
  live() {
    return this.healthService.checkLive();
  }
}
