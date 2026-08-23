import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { DeadLetterRepository } from '../../dead-letter/services/repository.service.js';

@Injectable()
export class PostgresHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly dlqRepository: DeadLetterRepository,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.dlqRepository.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
