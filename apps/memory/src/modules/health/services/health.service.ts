import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { AppConfigService } from '../../../configs/app-config.service.js';
import { OllamaOverridesService } from '../../ai-sdk/services/ollama-overrides.service.js';
import { QdrantHealthIndicator } from '../../qdrant/services/qdrant-health-indicator.service.js';

/**
 * Memory-app readiness: storage, heap, the Ollama endpoint the vectorize
 * pipeline embeds/extracts through, and Qdrant itself. Postgres is not
 * probed here — the shared database is owned by the main server and its
 * health endpoint reports on it.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly ocfg: OllamaOverridesService,
    private readonly acfg: AppConfigService,
    private readonly qdrantIndicator: QdrantHealthIndicator,
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
      () =>
        this.memory.checkHeap(
          'memory_heap',
          this.acfg.config.health!.memoryHeap!,
        ),
      () =>
        this.memory.checkRSS('memory_rss', this.acfg.config.health!.memoryRSS!),
      () => this.http.pingCheck('ollama', this.buildOllamaPingUrl()),
      () => this.qdrantIndicator.check('qdrant'),
    ]);
  }

  @HealthCheck()
  checkLive() {
    return this.health.check([]);
  }

  private buildOllamaPingUrl(): string {
    const host = this.ocfg.getConfig().host;
    return host.startsWith('http') ? `${host}/tags` : `http://${host}/api/tags`;
  }
}
