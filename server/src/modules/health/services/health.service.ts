import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { AppConfigService } from '../../../configs/app-config.service.js';
import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import { SearXNGConfigService } from '../../../configs/searxng-config.service.js';
import { MinioHealthIndicator } from '../../minio/services/minio-health-indicator.service.js';

import { PostgresHealthIndicator } from './postgres-health-indicator.service.js';
import { SearXNGHealthIndicator } from './searxng-health-indicator.service.js';

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
    private readonly minioIndicator: MinioHealthIndicator,
    private readonly searxngIndicator: SearXNGHealthIndicator,
    private readonly scfg: SearXNGConfigService,
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
      () => this.http.pingCheck('ollama', this.buildOllamaPingUrl()),
      () =>
        this.memory.checkHeap(
          'memory_heap',
          this.acfg.config.health!.memoryHeap,
        ),
      () =>
        this.memory.checkRSS('memory_rss', this.acfg.config.health!.memoryRSS),
      () => this.pgIndicator.check('postgres'),
      () => this.minioIndicator.check('minio'),
      ...(this.scfg.config.url
        ? [() => this.searxngIndicator.check('searxng')]
        : []),
    ]);
  }

  @HealthCheck()
  checkLive() {
    return this.health.check([]);
  }

  private buildOllamaPingUrl(): string {
    const host = this.ocfg.config.host ?? 'http://127.0.0.1:11434/api';
    return host.startsWith('http') ? `${host}/tags` : `http://${host}/api/tags`;
  }
}
