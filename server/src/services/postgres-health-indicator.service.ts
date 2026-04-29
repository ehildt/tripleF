import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { PostgresService } from './postgres.service.js';

@Injectable()
export class PostgresHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly postgresService: PostgresService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.postgresService.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
