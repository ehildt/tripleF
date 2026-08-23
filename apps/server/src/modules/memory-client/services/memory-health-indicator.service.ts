import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { MemoryClientService } from './memory-client.service.js';

/**
 * Readiness view of the outsourced memory app: pings its Qdrant status
 * endpoint so the server health endpoint reports when the memory service
 * is unreachable.
 */
@Injectable()
export class MemoryHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly memoryClient: MemoryClientService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.memoryClient.status();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
