import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { AppConfigService } from '../configs/app-config.service.js';
import { OllamaConfigService } from '../configs/ollama-config.service.js';

import { PostgresHealthIndicator } from './postgres-health-indicator.service.js';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly ocfg: OllamaConfigService,
    private readonly acfg: AppConfigService,
    private readonly pgIndicator: PostgresHealthIndicator,
  ) {}

  @HealthCheck()
  checkReady() {
    return this.health.check([
      () =>
        this.disk.checkStorage('disk', {
          path: this.acfg.config.health!.diskPath ?? '/',
          thresholdPercent:
            this.acfg.config.health!.diskThresholdPercent ?? 0.8,
        }),
      () => this.http.pingCheck('ollama', this.ocfg.config.host),
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 256 * 1024 * 1024),
      () => this.pgIndicator.check('postgres'),
    ]);
  }

  @HealthCheck()
  checkLive() {
    return this.health.check([]);
  }
}
