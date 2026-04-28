import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

import { PostgresService } from './postgres.service.js';

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(private readonly postgresService: PostgresService) {
    super();
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.postgresService.ping();
      return super.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Postgres check failed',
        super.getStatus(key, false, { message: String(error) }),
      );
    }
  }
}
