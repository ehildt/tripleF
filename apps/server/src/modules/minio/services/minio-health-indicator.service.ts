import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { MinioService } from './minio.service.js';

@Injectable()
export class MinioHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly minioService: MinioService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.minioService.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
